/**
 * Tests d'intégration GATE-A-REM-06 (#56) — hardening des endpoints d'import :
 * rate limiting (preview → OpenAI, write) + limits.fileSize multer (413).
 * Vraies routes + vrais middlewares (limiters, upload, ownership) sur serveur
 * éphémère ; Prisma et services (parse/mapping/import/OpenAI) mockés.
 *
 * NOTE clés de rate limit : les limiters sont des singletons module-level.
 * Chaque bloc de test utilise un user_id distinct pour isoler les compteurs.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { CSV_MAX_FILE_SIZE_BYTES } from "../middleware/csvUpload";

const { mockPrisma, mockParse, mockPreview, mockAutoMap, mockUnmapped, mockAiMap, mockImportTx, mockImportCosts } =
  vi.hoisted(() => ({
    mockPrisma: {
      business: { findFirst: vi.fn() },
      importJob: { findMany: vi.fn(), findUnique: vi.fn() },
      product: { findUnique: vi.fn() },
    },
    mockParse: vi.fn(),
    mockPreview: vi.fn(),
    mockAutoMap: vi.fn(),
    mockUnmapped: vi.fn(),
    mockAiMap: vi.fn(),
    mockImportTx: vi.fn(),
    mockImportCosts: vi.fn(),
  }));

vi.mock("../prisma/prisma", () => ({ default: mockPrisma }));
vi.mock("../services/csvParserService", () => ({
  parseCsvBuffer: mockParse,
  getPreview: mockPreview,
}));
vi.mock("../services/columnMappingService", () => ({
  autoMapColumns: mockAutoMap,
  getUnmappedColumns: mockUnmapped,
  aiMapColumns: mockAiMap,
}));
vi.mock("../services/importService", () => ({ importTransactions: mockImportTx }));
vi.mock("../services/csvCostImporter", () => ({ importCostsFromCsv: mockImportCosts }));
vi.mock("../services/costService", () => ({ createCost: vi.fn(), getCostByProduct: vi.fn() }));

import importRoutes from "./importRoutes";
import costRoutes from "./costRoutes";

let currentUser: { user_id: number; role: string; email: string } | null = null;
let server: Server;
let baseUrl: string;

function smallCsvForm(extra?: Record<string, string>): FormData {
  const form = new FormData();
  form.append("file", new Blob(["date,amount\n2026-01-01,10\n"], { type: "text/csv" }), "test.csv");
  for (const [k, v] of Object.entries(extra ?? {})) form.append(k, v);
  return form;
}

function oversizedForm(): FormData {
  const form = new FormData();
  // 1 MB au-dessus de la limite — multer coupe le stream dès le dépassement.
  const big = new Uint8Array(CSV_MAX_FILE_SIZE_BYTES + 1024 * 1024);
  form.append("file", new Blob([big], { type: "text/csv" }), "huge.csv");
  return form;
}

async function post(path: string, body?: FormData): Promise<{ status: number; body: any }> {
  const res = await fetch(`${baseUrl}${path}`, { method: "POST", body: body ?? null });
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
  app.use("/import", importRoutes);
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
  mockPrisma.business.findFirst.mockResolvedValue({ id_business: 7 });
  mockParse.mockReturnValue({ headers: ["date", "amount"], rows: [{ date: "2026-01-01", amount: "10" }], totalRows: 1 });
  mockPreview.mockReturnValue({ rows: [{ date: "2026-01-01", amount: "10" }] });
  mockAutoMap.mockReturnValue([{ csvColumn: "date", kairosField: "date" }]);
  mockUnmapped.mockReturnValue([]);
  mockImportTx.mockResolvedValue({ jobId: "job-1", imported: 1, errors: [] });
  mockImportCosts.mockResolvedValue({ imported: 1, errors: [] });
});

describe("rate limiting /import (GATE-A-REM-06)", () => {
  it("preview: 429 RATE_LIMITED après 10 requêtes / user, JSON safe", async () => {
    currentUser = { user_id: 101, role: "owner", email: "u101@test.com" };

    for (let i = 0; i < 10; i++) {
      const { status } = await post("/import/transactions/preview");
      expect(status).toBe(400); // NO_FILE — sous la limite, la route répond normalement
    }
    const { status, body } = await post("/import/transactions/preview");

    expect(status).toBe(429);
    expect(body).toEqual({
      error: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
    });
  });

  it("transactions (write): 429 après 10 requêtes / user", async () => {
    currentUser = { user_id: 102, role: "owner", email: "u102@test.com" };

    // multipart minimal sans fichier : business_id invalide → 400 sous la limite
    const emptyForm = () => {
      const form = new FormData();
      form.append("business_id", "0");
      return form;
    };
    for (let i = 0; i < 10; i++) {
      const { status } = await post("/import/transactions", emptyForm());
      expect(status).toBe(400);
    }
    const { status, body } = await post("/import/transactions", emptyForm());

    expect(status).toBe(429);
    expect(body.error).toBe("RATE_LIMITED");
  });

  it("les compteurs sont par user : un autre user n'est pas bloqué", async () => {
    currentUser = { user_id: 103, role: "owner", email: "u103@test.com" };
    const { status } = await post("/import/transactions/preview", smallCsvForm());
    expect(status).toBe(200);
  });
});

describe("limits.fileSize multer (GATE-A-REM-06)", () => {
  it("preview: fichier > 5 MB → 413 FILE_TOO_LARGE sans stacktrace ni détail interne", async () => {
    currentUser = { user_id: 110, role: "owner", email: "u110@test.com" };

    const { status, body } = await post("/import/transactions/preview", oversizedForm());

    expect(status).toBe(413);
    expect(body.error).toBe("FILE_TOO_LARGE");
    expect(Object.keys(body).sort()).toEqual(["error", "message"]);
    expect(JSON.stringify(body)).not.toMatch(/stack|at |multer|Error:/);
    // le parse n'a jamais lieu : le fichier n'est pas traité
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("preview: fichier valide sous la limite → 200 avec preview + mappings", async () => {
    currentUser = { user_id: 111, role: "owner", email: "u111@test.com" };

    const { status, body } = await post("/import/transactions/preview", smallCsvForm());

    expect(status).toBe(200);
    expect(body.totalRows).toBe(1);
    expect(body.mappings).toHaveLength(1);
    // toutes les colonnes mappées par heuristique → OpenAI jamais appelé
    expect(mockAiMap).not.toHaveBeenCalled();
  });

  it("cost CSV import: fichier > 5 MB → 413 (multer partagé)", async () => {
    currentUser = { user_id: 112, role: "owner", email: "u112@test.com" };

    const { status, body } = await post("/costs/7/import-csv", oversizedForm());

    expect(status).toBe(413);
    expect(body.error).toBe("FILE_TOO_LARGE");
    expect(mockImportCosts).not.toHaveBeenCalled();
  });

  it("cost CSV import: fichier valide sous la limite → 200", async () => {
    currentUser = { user_id: 113, role: "owner", email: "u113@test.com" };

    const { status, body } = await post("/costs/7/import-csv", smallCsvForm());

    expect(status).toBe(200);
    expect(body.imported).toBe(1);
    expect(mockImportCosts).toHaveBeenCalledTimes(1);
  });
});

describe("ownership intact après hardening", () => {
  it("executeImport: non-owner → 403, aucun import lancé", async () => {
    currentUser = { user_id: 120, role: "owner", email: "u120@test.com" };
    mockPrisma.business.findFirst.mockResolvedValue(null);

    const { status, body } = await post(
      "/import/transactions",
      smallCsvForm({ business_id: "7", mappings: JSON.stringify([{ csvColumn: "date", kairosField: "date" }]) })
    );

    expect(status).toBe(403);
    expect(body.error).toBe("FORBIDDEN");
    expect(mockImportTx).not.toHaveBeenCalled();
  });

  it("executeImport: owner → 200, import lancé avec le bon business", async () => {
    currentUser = { user_id: 121, role: "owner", email: "u121@test.com" };

    const { status, body } = await post(
      "/import/transactions",
      smallCsvForm({ business_id: "7", mappings: JSON.stringify([{ csvColumn: "date", kairosField: "date" }]) })
    );

    expect(status).toBe(200);
    expect(body.jobId).toBe("job-1");
    expect(mockImportTx).toHaveBeenCalledWith(
      7,
      expect.any(Array),
      expect.any(Array),
      "test.csv"
    );
  });
});
