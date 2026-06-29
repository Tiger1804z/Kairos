/**
 * Tests unitaires pour src/middleware/requireBusinessAccess.ts (S0-T05)
 *
 * OBJECTIF : prouver le cœur de la protection multi-tenant —
 *   un user authentifié qui passe un businessId qui N'EST PAS le sien reçoit 403,
 *   et un user qui passe SON propre businessId est laissé passer (next()).
 *
 * STRATÉGIE : on mock Prisma (pas de vraie DB). On fabrique des objets
 * req/res/next factices et on observe le status renvoyé ou l'appel à next().
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma — défini avec vi.hoisted pour être dispo dans vi.mock avant l'import
const { mockBusinessFindFirst, mockConversationFindUnique, mockProductFindUnique, mockImportJobFindUnique } = vi.hoisted(() => ({
  mockBusinessFindFirst: vi.fn(),
  mockConversationFindUnique: vi.fn(),
  mockProductFindUnique: vi.fn(),
  mockImportJobFindUnique: vi.fn(),
}));

vi.mock("../prisma/prisma", () => ({
  default: {
    business: { findFirst: mockBusinessFindFirst },
    chatConversation: { findUnique: mockConversationFindUnique },
    product: { findUnique: mockProductFindUnique },
    importJob: { findUnique: mockImportJobFindUnique },
  },
}));

import { requireBusinessAccess } from "./requireBusinessAccess";

// ── Helpers : faux req/res/next ───────────────────────────────────
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

function makeReq(opts: { user?: any; params?: any; body?: any }) {
  return {
    user: opts.user,
    params: opts.params ?? {},
    query: {},
    body: opts.body ?? {},
  } as any;
}

const OWNER = { user_id: 1, role: "owner", email: "owner@test.com" };
const OTHER = { user_id: 2, role: "owner", email: "other@test.com" };
const ADMIN = { user_id: 9, role: "admin", email: "admin@test.com" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireBusinessAccess — protection multi-tenant (params/businessId)", () => {
  const mw = requireBusinessAccess({ from: "params", key: "businessId" });

  // ── Cas nominal : user accède à SON business → next() ───────────
  it("laisse passer (next) quand le user possède le business", async () => {
    // Prisma trouve un business id=42 appartenant au user 1
    mockBusinessFindFirst.mockResolvedValue({ id_business: 42 });

    const req = makeReq({ user: OWNER, params: { businessId: "42" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    // le middleware injecte le businessId résolu pour le controller
    expect(req.businessId).toBe(42);
    // la requête d'ownership cible bien le user authentifié
    expect(mockBusinessFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_business: 42, owner_id: OWNER.user_id },
      })
    );
  });

  // ── Cœur du ticket : business d'un AUTRE user → 403 ─────────────
  it("renvoie 403 quand le user ne possède pas le business (cross-business)", async () => {
    // Prisma ne trouve aucun business id=42 appartenant au user 2 → null
    mockBusinessFindFirst.mockResolvedValue(null);

    const req = makeReq({ user: OTHER, params: { businessId: "42" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({ error: "FORBIDDEN" });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Sans user (requireAuth absent / échoué) → 401 ───────────────
  it("renvoie 401 quand aucun user n'est attaché à la requête", async () => {
    const req = makeReq({ user: undefined, params: { businessId: "42" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── businessId non numérique → 400 ──────────────────────────────
  it("renvoie 400 quand le businessId est invalide", async () => {
    const req = makeReq({ user: OWNER, params: { businessId: "abc" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    // pas de check ownership si l'id est invalide
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });

  // ── Admin : accès global sans check d'ownership ─────────────────
  it("laisse passer un admin sans vérifier l'ownership", async () => {
    const req = makeReq({ user: ADMIN, params: { businessId: "42" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.businessId).toBe(42);
    // admin court-circuite : pas d'appel à findFirst
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });
});

// ── S0-FIX-01 : ownership AI conversation (entity "conversation") ───────────
//
// OBJECTIF : prouver que GET /ai/shopify/conversations/:conversationId résout
//   conversationId -> chatConversation.business_id, puis applique la même
//   frontière de tenant (owner_id === user.user_id, bypass admin). Empêche
//   l'IDOR/BOLA sur un id entier auto-incrémenté énumérable.
describe("requireBusinessAccess — entity conversation (params/conversationId)", () => {
  const mw = requireBusinessAccess({
    from: "params",
    key: "conversationId",
    entity: "conversation",
  });

  // ── Owner : conversation résolue vers SON business → next() ─────
  it("laisse passer (next) l'owner du business de la conversation", async () => {
    // conversation 7 appartient au business 42
    mockConversationFindUnique.mockResolvedValue({ business_id: 42 });
    // business 42 appartient au user 1
    mockBusinessFindFirst.mockResolvedValue({ id_business: 42 });

    const req = makeReq({ user: OWNER, params: { conversationId: "7" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.businessId).toBe(42);
    // l'id du chemin est bien résolu via la conversation
    expect(mockConversationFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 } })
    );
    // l'ownership cible le user authentifié sur le business résolu
    expect(mockBusinessFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_business: 42, owner_id: OWNER.user_id },
      })
    );
  });

  // ── Cœur du ticket : conversation d'un AUTRE tenant → 403 ───────
  it("renvoie 403 quand la conversation appartient à un autre business", async () => {
    mockConversationFindUnique.mockResolvedValue({ business_id: 42 });
    // user 2 ne possède pas le business 42 → null
    mockBusinessFindFirst.mockResolvedValue(null);

    const req = makeReq({ user: OTHER, params: { conversationId: "7" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({ error: "FORBIDDEN" });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Conversation inexistante → 404 (cohérent avec les autres entity) ──
  it("renvoie 404 quand la conversation n'existe pas", async () => {
    mockConversationFindUnique.mockResolvedValue(null);

    const req = makeReq({ user: OWNER, params: { conversationId: "999" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({ error: "CONVERSATION_NOT_FOUND" });
    expect(next).not.toHaveBeenCalled();
    // pas de check ownership si la ressource n'existe pas
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });

  // ── conversationId non numérique → 400, aucun lookup ────────────
  it("renvoie 400 quand le conversationId est invalide", async () => {
    const req = makeReq({ user: OWNER, params: { conversationId: "abc" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    // id invalide : on ne touche ni la conversation ni l'ownership
    expect(mockConversationFindUnique).not.toHaveBeenCalled();
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });

  // ── Admin : bypass après résolution du business ────────────────
  it("laisse passer un admin sans vérifier l'ownership", async () => {
    mockConversationFindUnique.mockResolvedValue({ business_id: 42 });

    const req = makeReq({ user: ADMIN, params: { conversationId: "7" } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.businessId).toBe(42);
    // admin court-circuite l'ownership mais résout quand même le business
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });
});

// ── S0-FIX-02 : ownership costs produit (entity "product") ──────────────────
//
// OBJECTIF : prouver que GET /costs/:productId et POST /costs/ résolvent
//   productId/product_id (UUID String) -> product.business_id, puis appliquent
//   la même frontière de tenant (owner_id === user.user_id, bypass admin).
//   Empêche l'IDOR/BOLA en lecture/écriture des COGS d'un autre business.
//
// POINT CLÉ : Product.id est un UUID String. Le middleware NE doit PAS le passer
//   à Number() — sinon NaN -> 400 sur tout id produit valide, et les resolvers
//   numériques (business/conversation/...) doivent rester intacts.
const PRODUCT_UUID = "11111111-2222-3333-4444-555555555555";

describe("requireBusinessAccess — entity product en lecture (params/productId)", () => {
  const mw = requireBusinessAccess({
    from: "params",
    key: "productId",
    entity: "product",
  });

  // ── Owner : produit résolu vers SON business → next() ──────────
  it("laisse passer (next) l'owner du business du produit", async () => {
    mockProductFindUnique.mockResolvedValue({ business_id: 42 });
    mockBusinessFindFirst.mockResolvedValue({ id_business: 42 });

    const req = makeReq({ user: OWNER, params: { productId: PRODUCT_UUID } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.businessId).toBe(42);
    // l'UUID est passé tel quel (pas de Number()), lookup via product.id
    expect(mockProductFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: PRODUCT_UUID } })
    );
    expect(mockBusinessFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_business: 42, owner_id: OWNER.user_id },
      })
    );
  });

  // ── Cœur du ticket : produit d'un AUTRE tenant → 403 ───────────
  it("renvoie 403 quand le produit appartient à un autre business", async () => {
    mockProductFindUnique.mockResolvedValue({ business_id: 42 });
    mockBusinessFindFirst.mockResolvedValue(null);

    const req = makeReq({ user: OTHER, params: { productId: PRODUCT_UUID } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({ error: "FORBIDDEN" });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Produit inexistant → 404, aucun check ownership ────────────
  it("renvoie 404 quand le produit n'existe pas", async () => {
    mockProductFindUnique.mockResolvedValue(null);

    const req = makeReq({ user: OWNER, params: { productId: PRODUCT_UUID } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({ error: "PRODUCT_NOT_FOUND" });
    expect(next).not.toHaveBeenCalled();
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });

  // ── productId vide → 400, aucun lookup ─────────────────────────
  it("renvoie 400 quand le productId est vide", async () => {
    const req = makeReq({ user: OWNER, params: { productId: "  " } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    expect(mockProductFindUnique).not.toHaveBeenCalled();
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });

  // ── Admin : bypass après résolution du business ────────────────
  it("laisse passer un admin sans vérifier l'ownership", async () => {
    mockProductFindUnique.mockResolvedValue({ business_id: 42 });

    const req = makeReq({ user: ADMIN, params: { productId: PRODUCT_UUID } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.businessId).toBe(42);
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });
});

describe("requireBusinessAccess — entity product en écriture (body/product_id)", () => {
  const mw = requireBusinessAccess({
    from: "body",
    key: "product_id",
    entity: "product",
  });

  // ── Owner : peut écrire sur SON produit → next() ───────────────
  it("laisse passer (next) l'owner pour créer/màj un cost de son produit", async () => {
    mockProductFindUnique.mockResolvedValue({ business_id: 42 });
    mockBusinessFindFirst.mockResolvedValue({ id_business: 42 });

    const req = makeReq({ user: OWNER, body: { product_id: PRODUCT_UUID, cost_per_unit: 5 } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.businessId).toBe(42);
    expect(mockProductFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: PRODUCT_UUID } })
    );
  });

  // ── Cœur du ticket : non-owner ne peut PAS écrire → 403 ────────
  it("renvoie 403 quand le produit appartient à un autre business", async () => {
    mockProductFindUnique.mockResolvedValue({ business_id: 42 });
    mockBusinessFindFirst.mockResolvedValue(null);

    const req = makeReq({ user: OTHER, body: { product_id: PRODUCT_UUID, cost_per_unit: 5 } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({ error: "FORBIDDEN" });
    expect(next).not.toHaveBeenCalled();
  });
});

// ── S0-FIX-03 : ownership import job (entity "importJob") ───────────────────
//
// OBJECTIF : prouver que GET /import/jobs/:id résout id (UUID String) ->
//   importJob.id_business, puis applique la frontière de tenant (owner_id ===
//   user.user_id, bypass admin). Empêche l'IDOR/BOLA sur filename, errors et
//   raw_row_json d'un autre tenant. Le controller ne renvoie rien si le check
//   échoue (middleware avant getImportJob).
const JOB_UUID = "99999999-8888-7777-6666-555555555555";

describe("requireBusinessAccess — entity importJob (params/id)", () => {
  const mw = requireBusinessAccess({
    from: "params",
    key: "id",
    entity: "importJob",
  });

  // ── Owner : job résolu vers SON business → next() ──────────────
  it("laisse passer (next) l'owner du business du job", async () => {
    mockImportJobFindUnique.mockResolvedValue({ id_business: 42 });
    mockBusinessFindFirst.mockResolvedValue({ id_business: 42 });

    const req = makeReq({ user: OWNER, params: { id: JOB_UUID } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.businessId).toBe(42);
    // l'UUID est passé tel quel (pas de Number()), lookup via importJob.id
    expect(mockImportJobFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: JOB_UUID } })
    );
    expect(mockBusinessFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_business: 42, owner_id: OWNER.user_id },
      })
    );
  });

  // ── Cœur du ticket : job d'un AUTRE tenant → 403 ───────────────
  it("renvoie 403 quand le job appartient à un autre business", async () => {
    mockImportJobFindUnique.mockResolvedValue({ id_business: 42 });
    mockBusinessFindFirst.mockResolvedValue(null);

    const req = makeReq({ user: OTHER, params: { id: JOB_UUID } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({ error: "FORBIDDEN" });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Job inexistant → 404, aucun check ownership ────────────────
  it("renvoie 404 quand le job n'existe pas", async () => {
    mockImportJobFindUnique.mockResolvedValue(null);

    const req = makeReq({ user: OWNER, params: { id: JOB_UUID } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({ error: "IMPORT_JOB_NOT_FOUND" });
    expect(next).not.toHaveBeenCalled();
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });

  // ── id vide → 400, aucun lookup ────────────────────────────────
  it("renvoie 400 quand l'id est vide", async () => {
    const req = makeReq({ user: OWNER, params: { id: "  " } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    expect(mockImportJobFindUnique).not.toHaveBeenCalled();
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });

  // ── Admin : bypass après résolution du business ────────────────
  it("laisse passer un admin sans vérifier l'ownership", async () => {
    mockImportJobFindUnique.mockResolvedValue({ id_business: 42 });

    const req = makeReq({ user: ADMIN, params: { id: JOB_UUID } });
    const res = makeRes();
    const next = vi.fn();

    await mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.businessId).toBe(42);
    expect(mockBusinessFindFirst).not.toHaveBeenCalled();
  });
});
