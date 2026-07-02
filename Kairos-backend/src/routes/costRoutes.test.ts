/**
 * Tests d'intégration GATE-A-REM-07 (#57) — validation variant_id sur POST /costs/.
 * Vraie chaîne : costWriteRateLimiter → validateCostBody → requireBusinessAccess
 * (entity product, S0-FIX-02) → handleCreateCost → costService.createCost.
 * Seul Prisma est mocké — aucune DB touchée.
 *
 * Règle testée : variant_id fourni ⇒ doit appartenir au produit ciblé
 * (check combiné id + product_id ; le business est garanti transitivement
 * par l'ownership du product_id déjà vérifiée). Erreur combinée VARIANT_INVALID
 * → pas d'oracle d'énumération.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "node:http";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    product: { findUnique: vi.fn() },
    business: { findFirst: vi.fn() },
    productVariant: { findFirst: vi.fn() },
    productCost: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock("../prisma/prisma", () => ({ default: mockPrisma }));
vi.mock("../services/csvCostImporter", () => ({ importCostsFromCsv: vi.fn() }));

import costRoutes from "./costRoutes";

let currentUser: { user_id: number; role: string; email: string } | null = null;
let server: Server;
let baseUrl: string;

const PRODUCT_ID = "0a1b2c3d-0000-4000-8000-000000000001";
const VARIANT_ID = "0a1b2c3d-0000-4000-8000-000000000002";

async function postCost(body: Record<string, unknown>, userId = 42): Promise<{ status: number; body: any }> {
  currentUser = { user_id: userId, role: "owner", email: `u${userId}@test.com` };
  const res = await fetch(`${baseUrl}/costs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json: any = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (currentUser) (req as any).user = currentUser;
    next();
  });
  app.use("/costs", costRoutes);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no ephemeral port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(() => {
  server?.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  // Le produit existe et appartient au business 7, possédé par le user courant.
  mockPrisma.product.findUnique.mockResolvedValue({ business_id: 7 });
  mockPrisma.business.findFirst.mockResolvedValue({ id_business: 7 });
  // Par défaut : le variant appartient bien au produit.
  mockPrisma.productVariant.findFirst.mockResolvedValue({ id: VARIANT_ID });
  mockPrisma.productCost.create.mockResolvedValue({
    id: "cost-1",
    product_id: PRODUCT_ID,
    variant_id: null,
    cost_per_unit: 9.99,
  });
});

describe("POST /costs/ — variant_id ownership (GATE-A-REM-07)", () => {
  it("sans variant_id : comportement existant conservé (201, aucun lookup variant)", async () => {
    const { status } = await postCost({ product_id: PRODUCT_ID, cost_per_unit: 9.99 }, 201);

    expect(status).toBe(201);
    expect(mockPrisma.productVariant.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.productCost.create).toHaveBeenCalledTimes(1);
  });

  it("variant_id appartenant au bon produit : 201, check combiné id + product_id", async () => {
    const { status } = await postCost(
      { product_id: PRODUCT_ID, variant_id: VARIANT_ID, cost_per_unit: 9.99 },
      202
    );

    expect(status).toBe(201);
    expect(mockPrisma.productVariant.findFirst).toHaveBeenCalledWith({
      where: { id: VARIANT_ID, product_id: PRODUCT_ID },
      select: { id: true },
    });
    expect(mockPrisma.productCost.create).toHaveBeenCalledTimes(1);
  });

  it("variant_id inexistant : 400 VARIANT_INVALID, aucun cost écrit", async () => {
    mockPrisma.productVariant.findFirst.mockResolvedValue(null);

    const { status, body } = await postCost(
      { product_id: PRODUCT_ID, variant_id: "0a1b2c3d-dead-4000-8000-000000000099", cost_per_unit: 9.99 },
      203
    );

    expect(status).toBe(400);
    expect(body).toEqual({
      error: "VARIANT_INVALID",
      message: "variant invalid or not associated with product",
    });
    expect(mockPrisma.productCost.create).not.toHaveBeenCalled();
  });

  it("variant_id d'un autre produit : 400 combiné (même réponse — pas d'oracle), aucun cost écrit", async () => {
    // Le variant existe en DB mais sous un autre product_id → le findFirst
    // combiné {id, product_id} ne le trouve pas.
    mockPrisma.productVariant.findFirst.mockResolvedValue(null);

    const { status, body } = await postCost(
      { product_id: PRODUCT_ID, variant_id: VARIANT_ID, cost_per_unit: 9.99 },
      204
    );

    expect(status).toBe(400);
    expect(body.error).toBe("VARIANT_INVALID");
    expect(mockPrisma.productCost.create).not.toHaveBeenCalled();
  });

  it("variant_id d'un autre business : 400 combiné, aucun cost écrit", async () => {
    // Un variant d'un autre business a nécessairement un autre product_id :
    // même chemin de rejet que ci-dessus, transitivement sûr car l'ownership
    // du product_id est déjà vérifiée par requireBusinessAccess.
    mockPrisma.productVariant.findFirst.mockResolvedValue(null);

    const { status, body } = await postCost(
      { product_id: PRODUCT_ID, variant_id: "0a1b2c3d-beef-4000-8000-000000000042", cost_per_unit: 9.99 },
      205
    );

    expect(status).toBe(400);
    expect(body.error).toBe("VARIANT_INVALID");
    expect(mockPrisma.productCost.create).not.toHaveBeenCalled();
  });

  it("réponse d'erreur safe : uniquement error + message, pas de stack ni détail interne", async () => {
    mockPrisma.productVariant.findFirst.mockResolvedValue(null);

    const { body } = await postCost(
      { product_id: PRODUCT_ID, variant_id: VARIANT_ID, cost_per_unit: 9.99 },
      206
    );

    expect(Object.keys(body).sort()).toEqual(["error", "message"]);
    expect(JSON.stringify(body)).not.toMatch(/stack|prisma|at /);
  });
});

describe("POST /costs/ — protections #42 intactes", () => {
  it("non-owner du produit : 403 FORBIDDEN, ni lookup variant ni cost", async () => {
    mockPrisma.business.findFirst.mockResolvedValue(null);

    const { status, body } = await postCost(
      { product_id: PRODUCT_ID, variant_id: VARIANT_ID, cost_per_unit: 9.99 },
      210
    );

    expect(status).toBe(403);
    expect(body.error).toBe("FORBIDDEN");
    expect(mockPrisma.productVariant.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.productCost.create).not.toHaveBeenCalled();
  });

  it("produit inexistant : 404 PRODUCT_NOT_FOUND avant tout check variant", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);

    const { status, body } = await postCost(
      { product_id: PRODUCT_ID, variant_id: VARIANT_ID, cost_per_unit: 9.99 },
      211
    );

    expect(status).toBe(404);
    expect(body.error).toBe("PRODUCT_NOT_FOUND");
    expect(mockPrisma.productCost.create).not.toHaveBeenCalled();
  });

  it("body invalide (cost_per_unit négatif) : 400 avant tout accès DB", async () => {
    const { status, body } = await postCost(
      { product_id: PRODUCT_ID, cost_per_unit: -5 },
      212
    );

    expect(status).toBe(400);
    expect(body.error).toBe("INVALID_INPUT");
    expect(mockPrisma.product.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.productCost.create).not.toHaveBeenCalled();
  });
});
