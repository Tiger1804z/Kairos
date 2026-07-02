/**
 * Tests d'intégration GATE-A-REM-05 (#55) — chaîne complète des routes privacy :
 * vraies routes + vrais middlewares (validateBusinessIdParam, requireBusinessAccess)
 * + vrai controller + vrai service. Seul Prisma est mocké — aucune DB touchée.
 *
 * Prouve notamment qu'une deletion request N'EFFECTUE AUCUNE suppression réelle :
 * toutes les méthodes delete/deleteMany du client Prisma sont espionnées et
 * doivent rester non appelées.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { PrivacyEventType } from "../../generated/prisma/client";

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    business: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    privacyConsentEvent: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: { delete: vi.fn(), deleteMany: vi.fn() },
    shopifyStore: { delete: vi.fn(), deleteMany: vi.fn() },
    chatConversation: { delete: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  };
  return { mockPrisma };
});

vi.mock("../prisma/prisma", () => ({ default: mockPrisma }));

import privacyRoutes from "./privacyRoutes";

/** User injecté par le stub d'auth (simule requireAuth global) ; null = non authentifié. */
let currentUser: { user_id: number; role: string; email: string } | null = null;

let server: Server;
let baseUrl: string;

function assertNoDeleteCalled() {
  const deleteSpies = [
    mockPrisma.business.delete,
    mockPrisma.business.deleteMany,
    mockPrisma.business.update,
    mockPrisma.privacyConsentEvent.delete,
    mockPrisma.privacyConsentEvent.deleteMany,
    mockPrisma.user.delete,
    mockPrisma.user.deleteMany,
    mockPrisma.shopifyStore.delete,
    mockPrisma.shopifyStore.deleteMany,
    mockPrisma.chatConversation.delete,
    mockPrisma.chatConversation.deleteMany,
    mockPrisma.$transaction,
  ];
  for (const spy of deleteSpies) {
    expect(spy).not.toHaveBeenCalled();
  }
}

async function post(path: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${baseUrl}${path}`, { method: "POST" });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  // Stub de requireAuth : mêmes effets que le middleware global de index.ts
  app.use((req, _res, next) => {
    if (currentUser) (req as any).user = currentUser;
    next();
  });
  app.use("/privacy", privacyRoutes);

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
  currentUser = { user_id: 42, role: "owner", email: "owner@test.com" };
  // Ownership OK par défaut (le user 42 possède le business demandé)
  mockPrisma.business.findFirst.mockResolvedValue({ id_business: 7 });
  mockPrisma.privacyConsentEvent.create.mockResolvedValue({ id: "uuid-evt" });
});

describe("POST /privacy/:businessId/data-export-request", () => {
  it("owner: 202 + event data_export_requested exact (source api, status pending)", async () => {
    const { status, body } = await post("/privacy/7/data-export-request");

    expect(status).toBe(202);
    expect(body.message).toMatch(/admin will process it manually/i);
    expect(mockPrisma.privacyConsentEvent.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.privacyConsentEvent.create).toHaveBeenCalledWith({
      data: {
        business_id: 7,
        user_id: 42,
        event_type: PrivacyEventType.data_export_requested,
        source: "api",
        metadata: { status: "pending" },
      },
    });
  });

  it("non-owner: 403 FORBIDDEN, aucun event créé", async () => {
    mockPrisma.business.findFirst.mockResolvedValue(null);

    const { status, body } = await post("/privacy/7/data-export-request");

    expect(status).toBe(403);
    expect(body.error).toBe("FORBIDDEN");
    expect(mockPrisma.privacyConsentEvent.create).not.toHaveBeenCalled();
  });

  it("sans auth: 401 AUTH_REQUIRED, aucun event ni requête ownership", async () => {
    currentUser = null;

    const { status, body } = await post("/privacy/7/data-export-request");

    expect(status).toBe(401);
    expect(body.error).toBe("AUTH_REQUIRED");
    expect(mockPrisma.business.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.privacyConsentEvent.create).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-1", "1.5"])(
    "businessId invalide '%s': 400 sans aucun appel DB",
    async (bad) => {
      const { status, body } = await post(`/privacy/${bad}/data-export-request`);

      expect(status).toBe(400);
      expect(body.error).toBe("INVALID_BUSINESS_ID");
      expect(mockPrisma.business.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.privacyConsentEvent.create).not.toHaveBeenCalled();
    }
  );

  it("admin: 202 sans vérification d'ownership", async () => {
    currentUser = { user_id: 1, role: "admin", email: "admin@test.com" };
    mockPrisma.business.findFirst.mockResolvedValue(null); // ne possède rien

    const { status } = await post("/privacy/7/data-export-request");

    expect(status).toBe(202);
    expect(mockPrisma.business.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.privacyConsentEvent.create).toHaveBeenCalledTimes(1);
  });
});

describe("POST /privacy/:businessId/deletion-request", () => {
  it("owner: 202 + event data_deletion_requested exact, réponse explicite 'No data has been deleted'", async () => {
    const { status, body } = await post("/privacy/7/deletion-request");

    expect(status).toBe(202);
    expect(body.message).toMatch(/No data has been deleted/i);
    expect(mockPrisma.privacyConsentEvent.create).toHaveBeenCalledWith({
      data: {
        business_id: 7,
        user_id: 42,
        event_type: PrivacyEventType.data_deletion_requested,
        source: "api",
        metadata: { status: "pending" },
      },
    });
  });

  it("deletion request N'EFFECTUE AUCUNE suppression réelle (zéro delete/deleteMany/update/$transaction)", async () => {
    const { status } = await post("/privacy/7/deletion-request");

    expect(status).toBe(202);
    assertNoDeleteCalled();
    // Seules opérations DB : ownership (findFirst) + création de l'event
    expect(mockPrisma.business.findFirst).toHaveBeenCalledTimes(1);
    expect(mockPrisma.privacyConsentEvent.create).toHaveBeenCalledTimes(1);
  });

  it("non-owner: 403, aucun event, aucune suppression", async () => {
    mockPrisma.business.findFirst.mockResolvedValue(null);

    const { status } = await post("/privacy/7/deletion-request");

    expect(status).toBe(403);
    expect(mockPrisma.privacyConsentEvent.create).not.toHaveBeenCalled();
    assertNoDeleteCalled();
  });

  it("businessId invalide: 400, aucune suppression", async () => {
    const { status } = await post("/privacy/999999999999abc/deletion-request");

    expect(status).toBe(400);
    expect(mockPrisma.privacyConsentEvent.create).not.toHaveBeenCalled();
    assertNoDeleteCalled();
  });

  it("l'event ne contient aucune donnée superflue (payload strict)", async () => {
    await post("/privacy/7/deletion-request");

    const callArg = mockPrisma.privacyConsentEvent.create.mock.calls[0]?.[0];
    expect(Object.keys(callArg.data).sort()).toEqual(
      ["business_id", "event_type", "metadata", "source", "user_id"].sort()
    );
    expect(callArg.data.metadata).toEqual({ status: "pending" });
  });
});
