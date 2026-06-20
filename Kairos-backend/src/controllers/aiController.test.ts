/**
 * Tests unitaires pour src/controllers/aiController.ts — ticket S0-T06
 *
 * OBJECTIF : prouver que la route SQL LLM legacy (aiAsk) est DÉSACTIVÉE par
 * défaut pour la beta (décision D-SEC4) :
 *   - sans le flag LEGACY_AI_SQL_ENABLED="true" → 410, et AUCUN appel à
 *     generateSQLFromQuestion ni $queryRawUnsafe ;
 *   - le chemin legacy n'est atteignable QUE si le flag vaut explicitement "true" ;
 *   - aiAskShopify (le vrai Chat Advisor Shopify) reste exporté/inchangé.
 *
 * STRATÉGIE : on teste le controller directement (pas d'Express) avec des
 * req/res factices, et on mock toutes les dépendances (Prisma + services).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks dépendances (vi.hoisted pour être dispo dans vi.mock) ──────────────
const {
  mockGenerateSQLFromQuestion,
  mockQueryRawUnsafe,
  mockIsSafeSQL,
  mockBusinessFindUnique,
  mockCreateQueryLog,
} = vi.hoisted(() => ({
  mockGenerateSQLFromQuestion: vi.fn(),
  mockQueryRawUnsafe: vi.fn(),
  mockIsSafeSQL: vi.fn(),
  mockBusinessFindUnique: vi.fn(),
  mockCreateQueryLog: vi.fn(),
}));

vi.mock("../prisma/prisma", () => ({
  default: {
    business: { findUnique: mockBusinessFindUnique },
    $queryRawUnsafe: mockQueryRawUnsafe,
  },
}));

vi.mock("../services/aiService", () => ({
  generateSQLFromQuestion: mockGenerateSQLFromQuestion,
  generateShortFinanceSummary: vi.fn(),
  askKairosFromSql: vi.fn(),
}));

vi.mock("../services/sqlGuard", () => ({
  isSafeSQL: mockIsSafeSQL,
}));

vi.mock("../services/shopifyEngineClient", () => ({
  askShopifyChat: vi.fn(),
}));

vi.mock("../services/queryLogsService", () => ({
  createQueryLogService: mockCreateQueryLog,
}));

vi.mock("../services/reportsService", () => ({
  createReportService: vi.fn(),
}));

vi.mock("../../generated/prisma/client", () => ({
  QueryActionType: { sql_select: "sql_select", summary: "summary" },
  QueryStatus: { success: "success", error: "error", blocked: "blocked" },
  ReportType: { summary: "summary", custom: "custom" },
}));

import { aiAsk, aiAskShopify } from "./aiController";

// ── Helpers : faux req/res ───────────────────────────────────────────────────
function makeRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload: any) => {
    res.body = payload;
    return res;
  });
  return res;
}

function makeReq(opts: { businessId?: number; question?: string } = {}) {
  return {
    user: { user_id: 1 },
    businessId: opts.businessId ?? 42,
    body: { question: opts.question ?? "combien de revenus ce mois ?" },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.LEGACY_AI_SQL_ENABLED;
});

afterEach(() => {
  delete process.env.LEGACY_AI_SQL_ENABLED;
});

describe("aiAsk — SQL LLM legacy désactivé pour la beta (S0-T06)", () => {
  // ── Cœur du ticket : flag absent → 410, zéro SQL LLM ──────────────────────
  it("renvoie 410 quand LEGACY_AI_SQL_ENABLED est absent", async () => {
    const req = makeReq();
    const res = makeRes();

    await aiAsk(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.body).toEqual({
      error: "FEATURE_DISABLED_FOR_BETA",
      message: "Legacy SQL AI is disabled for beta.",
    });
    // ni 200 ni 500
    expect(res.statusCode).toBe(410);
  });

  it("n'appelle JAMAIS generateSQLFromQuestion ni $queryRawUnsafe par défaut", async () => {
    const req = makeReq();
    const res = makeRes();

    await aiAsk(req, res);

    expect(mockGenerateSQLFromQuestion).not.toHaveBeenCalled();
    expect(mockQueryRawUnsafe).not.toHaveBeenCalled();
  });

  it("reste désactivé (410) quand le flag a une valeur ≠ 'true'", async () => {
    process.env.LEGACY_AI_SQL_ENABLED = "false";
    const req = makeReq();
    const res = makeRes();

    await aiAsk(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(mockGenerateSQLFromQuestion).not.toHaveBeenCalled();
    expect(mockQueryRawUnsafe).not.toHaveBeenCalled();
  });

  it("reste désactivé (410) même si le flag vaut 'TRUE' (casse stricte)", async () => {
    process.env.LEGACY_AI_SQL_ENABLED = "TRUE";
    const req = makeReq();
    const res = makeRes();

    await aiAsk(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(mockGenerateSQLFromQuestion).not.toHaveBeenCalled();
  });

  // ── Preuve que le guard est la SEULE porte : flag explicite → chemin legacy ─
  it("n'atteint le chemin legacy QUE si LEGACY_AI_SQL_ENABLED === 'true'", async () => {
    process.env.LEGACY_AI_SQL_ENABLED = "true";
    mockBusinessFindUnique.mockResolvedValue({ name: "Acme" });
    mockGenerateSQLFromQuestion.mockResolvedValue("SELECT 1");
    // isSafeSQL=false → on s'arrête à 400 UNSAFE_SQL, AVANT $queryRawUnsafe
    mockIsSafeSQL.mockReturnValue(false);
    mockCreateQueryLog.mockResolvedValue({ id_query: 1 });

    const req = makeReq();
    const res = makeRes();

    await aiAsk(req, res);

    // le flag explicite ouvre bien le chemin legacy (generateSQL est appelé)…
    expect(mockGenerateSQLFromQuestion).toHaveBeenCalledOnce();
    // …mais le sqlGuard bloque l'exécution brute
    expect(mockQueryRawUnsafe).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("aiAskShopify — Chat Advisor Shopify légitime non affecté (S0-T06)", () => {
  it("reste exporté et n'est pas remplacé par le guard legacy", () => {
    expect(typeof aiAskShopify).toBe("function");
  });
});
