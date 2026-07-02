/**
 * Tests unitaires pour shopifyCallback (GATE-A-REM-08).
 *
 * OBJECTIF : vérifier que l'échec du callback OAuth ne renvoie JAMAIS le payload
 * upstream brut (err.response.data) au client, et que les logs serveur restent
 * sanitizés (pas de token, secret, code OAuth, ni stacktrace).
 *
 * STRATÉGIE : pendingStates est privé au module — on seed un state valide en
 * appelant connectShopify (buildAuthURL mocké → state connu), puis on appelle
 * shopifyCallback avec ce state pour atteindre le bloc try/catch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockBuildAuthURL, mockExchange, mockSaveStore, mockFindFirst, mockSyncAll, mockCompute } =
    vi.hoisted(() => ({
        mockBuildAuthURL: vi.fn(),
        mockExchange: vi.fn(),
        mockSaveStore: vi.fn(),
        mockFindFirst: vi.fn(),
        mockSyncAll: vi.fn(),
        mockCompute: vi.fn(),
    }));

vi.mock("../services/shopifyAuthService", () => ({
    buildAuthURL: mockBuildAuthURL,
    exchangeCodeForToken: mockExchange,
    saveShopifyStore: mockSaveStore,
}));

vi.mock("../prisma/prisma", () => ({
    default: { business: { findFirst: mockFindFirst } },
}));

vi.mock("../services/shopifySyncService", () => ({ syncAll: mockSyncAll }));
vi.mock("./profitabilityController", () => ({ computeProfitabilityForBusiness: mockCompute }));

import { connectShopify, shopifyCallback } from "./shopifyController";

// ─────────────────────────────────────────────────────────────
// Constantes de test
// ─────────────────────────────────────────────────────────────
const TEST_SHOP = "test-boutique.myshopify.com";
const TEST_BUSINESS = 7;
const TEST_USER = 42;
const FRONTEND = "https://app.kairos.test";

// Valeurs sensibles factices — ne doivent apparaître NI dans la réponse NI dans les logs
const FAKE_TOKEN = "shpat_fake_access_token_123";
const FAKE_SECRET = "shpss_fake_client_secret_456";
const FAKE_OAUTH_CODE = "oauth_code_789_sensitive";
const UPSTREAM_DETAIL = "UPSTREAM_SENSITIVE_DETAIL_do_not_leak";

function makeRes() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.redirect = vi.fn().mockReturnValue(res);
    return res;
}

// Erreur axios simulée : payload upstream + config contenant secret et code OAuth
function makeUpstreamError() {
    const err: any = new Error("Request failed with status code 400");
    err.code = "ERR_BAD_REQUEST";
    err.response = {
        status: 400,
        data: { error: "invalid_request", error_description: UPSTREAM_DETAIL, token: FAKE_TOKEN },
    };
    err.config = { data: JSON.stringify({ client_secret: FAKE_SECRET, code: FAKE_OAUTH_CODE }) };
    return err;
}

// Seed un state valide dans pendingStates via connectShopify
async function seedPendingState(state: string) {
    mockBuildAuthURL.mockReturnValueOnce({ url: "https://shop/oauth", state });
    const req: any = { user: { user_id: TEST_USER }, body: { shop: TEST_SHOP, businessId: TEST_BUSINESS } };
    await connectShopify(req, makeRes());
}

function makeCallbackReq(state: string) {
    return { query: { shop: TEST_SHOP, code: FAKE_OAUTH_CODE, state } } as any;
}

let errorSpy: ReturnType<typeof vi.spyOn>;
let logSpy: ReturnType<typeof vi.spyOn>;
let originalFrontend: string | undefined;

beforeEach(() => {
    vi.clearAllMocks();
    originalFrontend = process.env["FRONTEND_URL"];
    process.env["FRONTEND_URL"] = FRONTEND;
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Ownership check OK par défaut (connect + callback)
    mockFindFirst.mockResolvedValue({ id_business: TEST_BUSINESS });
    mockSyncAll.mockResolvedValue({ products: 0, orders: 0, customers: 0, db: {} });
    mockCompute.mockResolvedValue(undefined);
});

afterEach(() => {
    errorSpy.mockRestore();
    logSpy.mockRestore();
    if (originalFrontend === undefined) {
        delete process.env["FRONTEND_URL"];
    } else {
        process.env["FRONTEND_URL"] = originalFrontend;
    }
});

describe("shopifyCallback — sanitization des erreurs (GATE-A-REM-08)", () => {

    it("échec upstream → 500 générique, AUCUN champ detail dans la réponse", async () => {
        await seedPendingState("state-1");
        mockExchange.mockRejectedValueOnce(makeUpstreamError());

        const res = makeRes();
        await shopifyCallback(makeCallbackReq("state-1"), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "SHOPIFY_OAUTH_CALLBACK_FAILED",
            message: "Unable to complete Shopify OAuth callback.",
        });
        const body = res.json.mock.calls[0]?.[0];
        expect(body).not.toHaveProperty("detail");
    });

    it("la réponse ne contient ni token, ni secret, ni code OAuth, ni payload upstream, ni stack", async () => {
        await seedPendingState("state-2");
        mockExchange.mockRejectedValueOnce(makeUpstreamError());

        const res = makeRes();
        await shopifyCallback(makeCallbackReq("state-2"), res);

        const serialized = JSON.stringify(res.json.mock.calls[0]?.[0]);
        expect(serialized).not.toContain(FAKE_TOKEN);
        expect(serialized).not.toContain(FAKE_SECRET);
        expect(serialized).not.toContain(FAKE_OAUTH_CODE);
        expect(serialized).not.toContain(UPSTREAM_DETAIL);
        expect(serialized).not.toContain("at "); // fragment de stacktrace
    });

    it("les logs serveur ne reçoivent ni payload upstream ni secret, mais gardent le status upstream", async () => {
        await seedPendingState("state-3");
        mockExchange.mockRejectedValueOnce(makeUpstreamError());

        await shopifyCallback(makeCallbackReq("state-3"), makeRes());

        const allLogged = errorSpy.mock.calls.map((args: unknown[]) => args.map(String).join(" ")).join("\n");
        expect(allLogged).not.toContain(FAKE_TOKEN);
        expect(allLogged).not.toContain(FAKE_SECRET);
        expect(allLogged).not.toContain(FAKE_OAUTH_CODE);
        expect(allLogged).not.toContain(UPSTREAM_DETAIL);
        // Debug utile conservé : status upstream + shop domain
        expect(allLogged).toContain("upstream_status=400");
        expect(allLogged).toContain(TEST_SHOP);
    });

    it("erreur non-axios (ex. échec chiffrement) → même 500 générique, pas de message interne au client", async () => {
        await seedPendingState("state-4");
        mockExchange.mockResolvedValueOnce(FAKE_TOKEN);
        mockSaveStore.mockRejectedValueOnce(new Error("SHOPIFY_TOKEN_ENCRYPTION_KEY manquante"));

        const res = makeRes();
        await shopifyCallback(makeCallbackReq("state-4"), res);

        expect(res.status).toHaveBeenCalledWith(500);
        const serialized = JSON.stringify(res.json.mock.calls[0]?.[0]);
        expect(serialized).not.toContain("SHOPIFY_TOKEN_ENCRYPTION_KEY");
        expect(serialized).not.toContain(FAKE_TOKEN);
    });

    it("succès OAuth inchangé : token sauvegardé puis redirect vers /shopify/success", async () => {
        await seedPendingState("state-5");
        mockExchange.mockResolvedValueOnce(FAKE_TOKEN);
        mockSaveStore.mockResolvedValueOnce({ id: 1 });

        const res = makeRes();
        await shopifyCallback(makeCallbackReq("state-5"), res);

        expect(mockSaveStore).toHaveBeenCalledWith(TEST_BUSINESS, TEST_SHOP, FAKE_TOKEN);
        expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND}/shopify/success?businessId=${TEST_BUSINESS}`);
        expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it("STORE_ALREADY_CONNECTED → redirect existant conservé (pas de 500)", async () => {
        await seedPendingState("state-6");
        mockExchange.mockResolvedValueOnce(FAKE_TOKEN);
        const conflict: any = new Error("STORE_ALREADY_CONNECTED");
        conflict.code = "STORE_ALREADY_CONNECTED";
        mockSaveStore.mockRejectedValueOnce(conflict);

        const res = makeRes();
        await shopifyCallback(makeCallbackReq("state-6"), res);

        expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND}/shopify/success?error=store_already_connected`);
        expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it("state invalide → 403, l'échange de token n'est jamais tenté", async () => {
        const res = makeRes();
        await shopifyCallback(makeCallbackReq("state-inconnu"), res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockExchange).not.toHaveBeenCalled();
    });
});
