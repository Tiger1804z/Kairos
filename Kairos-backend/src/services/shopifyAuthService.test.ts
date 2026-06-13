/**
 * Tests unitaires pour src/services/shopifyAuthService.ts
 *
 * OBJECTIF : vérifier que saveShopifyStore chiffre le token AVANT de l'écrire en DB.
 *
 * STRATÉGIE DE TEST :
 * On mock Prisma pour ne pas avoir besoin d'une vraie base de données.
 * On capture les arguments passés à prisma.shopifyStore.upsert et on vérifie
 * que access_token est chiffré (pas égal au token brut, format iv:authTag:ciphertext).
 *
 * POURQUOI vi.hoisted() ?
 * vitest hisse (hoiste) les appels vi.mock() avant les imports, ce qui crée une
 * référence circulaire si on utilise des variables définies après les imports.
 * vi.hoisted() permet de définir les mocks AVANT les imports sans ce problème.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { decryptToken } from '../utils/crypto';

// ─────────────────────────────────────────────────────────────
// Mocks Prisma — définis avec vi.hoisted pour être disponibles
// dans vi.mock() avant les imports
// ─────────────────────────────────────────────────────────────
const { mockFindUnique, mockUpsert } = vi.hoisted(() => ({
    mockFindUnique: vi.fn(),
    mockUpsert: vi.fn(),
}));

// Mock du module Prisma entier.
// Quand shopifyAuthService importe '../prisma/prisma', il reçoit ce mock.
vi.mock('../prisma/prisma', () => ({
    default: {
        shopifyStore: {
            findUnique: mockFindUnique,
            upsert: mockUpsert,
        },
    },
}));

// Import du service APRÈS les mocks (important : les mocks doivent être en place)
import { saveShopifyStore } from './shopifyAuthService';

// ─────────────────────────────────────────────────────────────
// Constantes de test
// ─────────────────────────────────────────────────────────────
const VALID_TEST_KEY = Buffer.alloc(32, 0x01).toString('base64');
const PLAIN_TOKEN    = 'shpat_abc123xyz_token_brut_shopify';
const TEST_SHOP      = 'test-boutique.myshopify.com';
const TEST_BUSINESS  = 42;

// Réponse simulée de prisma.shopifyStore.upsert (objet store minimal)
const MOCK_STORE_RESULT = {
    id:           1,
    shop_domain:  TEST_SHOP,
    business_id:  TEST_BUSINESS,
    access_token: 'placeholder', // sera écrasé par le mock
    status:       'active',
};

// ─────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────
let originalKey: string | undefined;

beforeEach(() => {
    originalKey = process.env['SHOPIFY_TOKEN_ENCRYPTION_KEY'];
    process.env['SHOPIFY_TOKEN_ENCRYPTION_KEY'] = VALID_TEST_KEY;

    vi.clearAllMocks();

    // Par défaut : pas de store existant → upsert crée un nouveau
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue(MOCK_STORE_RESULT);
});

afterEach(() => {
    if (originalKey === undefined) {
        delete process.env['SHOPIFY_TOKEN_ENCRYPTION_KEY'];
    } else {
        process.env['SHOPIFY_TOKEN_ENCRYPTION_KEY'] = originalKey;
    }
});

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────
describe('saveShopifyStore — chiffrement du token (S0-T02)', () => {

    // ── Test 1 : Le token passé à upsert N'EST PAS le token brut ──────
    it("stocke un token chiffré — PAS le token en clair", async () => {
        await saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN);

        // On récupère les arguments passés à prisma.shopifyStore.upsert
        expect(mockUpsert).toHaveBeenCalledOnce();
        const upsertArg = mockUpsert.mock.calls[0]?.[0];

        // Dans la branche CREATE
        const storedToken: string = upsertArg.create.access_token;

        // Le token stocké NE DOIT PAS être le token brut
        expect(storedToken).not.toBe(PLAIN_TOKEN);
    });

    // ── Test 2 : Le format stocké est iv:authTag:ciphertext ───────────
    it("le token stocké a le format iv:authTag:ciphertext (3 parties base64)", async () => {
        await saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN);

        const upsertArg = mockUpsert.mock.calls[0]?.[0];
        const storedToken: string = upsertArg.create.access_token;

        // Split sur ":" doit donner exactement 3 parties
        const parts = storedToken.split(':');
        expect(parts).toHaveLength(3);

        // Chaque partie doit être une string base64 non vide
        for (const part of parts) {
            expect(part.length).toBeGreaterThan(0);
        }
    });

    // ── Test 3 : Round-trip — le token stocké peut être déchiffré ─────
    it("round-trip : decryptToken(tokenStocké) === token original", async () => {
        await saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN);

        const upsertArg = mockUpsert.mock.calls[0]?.[0];
        const storedToken: string = upsertArg.create.access_token;

        // Le token stocké doit être déchiffrable et retourner la valeur originale
        expect(decryptToken(storedToken)).toBe(PLAIN_TOKEN);
    });

    // ── Test 4 : update et create reçoivent tous les deux le token chiffré
    it("les branches create ET update reçoivent le même token chiffré", async () => {
        await saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN);

        const upsertArg = mockUpsert.mock.calls[0]?.[0];
        const tokenInCreate: string = upsertArg.create.access_token;
        const tokenInUpdate: string = upsertArg.update.access_token;

        // Les deux branches reçoivent le même token chiffré
        // (même valeur car encryptToken est appelé une seule fois avant le upsert)
        expect(tokenInCreate).toBe(tokenInUpdate);

        // Et ce token n'est pas le token brut
        expect(tokenInCreate).not.toBe(PLAIN_TOKEN);
        expect(tokenInUpdate).not.toBe(PLAIN_TOKEN);
    });

    // ── Test 5 : Deux saves du même token → deux chiffrements différents
    it("deux sauvegardes du même token donnent deux valeurs chiffrées différentes (IV aléatoire)", async () => {
        await saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN);
        await saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN);

        const firstCall  = mockUpsert.mock.calls[0]?.[0];
        const secondCall = mockUpsert.mock.calls[1]?.[0];

        const token1: string = firstCall.create.access_token;
        const token2: string = secondCall.create.access_token;

        // IV différent à chaque appel → tokens chiffrés différents
        expect(token1).not.toBe(token2);

        // Mais les deux se déchiffrent vers le même token original
        expect(decryptToken(token1)).toBe(PLAIN_TOKEN);
        expect(decryptToken(token2)).toBe(PLAIN_TOKEN);
    });

    // ── Test 6 : Throw si SHOPIFY_TOKEN_ENCRYPTION_KEY est absente ────
    it("throw si SHOPIFY_TOKEN_ENCRYPTION_KEY est absente au moment de la sauvegarde", async () => {
        delete process.env['SHOPIFY_TOKEN_ENCRYPTION_KEY'];

        await expect(
            saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN)
        ).rejects.toThrow('SHOPIFY_TOKEN_ENCRYPTION_KEY');
    });

    // ── Test 7 : Prisma upsert N'EST PAS appelé si le chiffrement échoue
    it("prisma.upsert n'est pas appelé si le chiffrement échoue (clé absente)", async () => {
        delete process.env['SHOPIFY_TOKEN_ENCRYPTION_KEY'];

        await expect(
            saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN)
        ).rejects.toThrow();

        // La DB ne doit pas avoir été touchée
        expect(mockUpsert).not.toHaveBeenCalled();
    });

    // ── Test 8 : Store déjà connecté à un autre business → throw ──────
    it("throw STORE_ALREADY_CONNECTED si le store appartient à un autre business", async () => {
        // Simuler un store existant appartenant au business 99 (pas TEST_BUSINESS=42)
        mockFindUnique.mockResolvedValue({
            id:          1,
            shop_domain: TEST_SHOP,
            business_id: 99, // différent de TEST_BUSINESS
        });

        await expect(
            saveShopifyStore(TEST_BUSINESS, TEST_SHOP, PLAIN_TOKEN)
        ).rejects.toThrow('STORE_ALREADY_CONNECTED');

        // La DB ne doit pas avoir été modifiée
        expect(mockUpsert).not.toHaveBeenCalled();
    });
});
