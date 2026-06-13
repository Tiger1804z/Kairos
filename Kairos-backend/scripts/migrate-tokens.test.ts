/**
 * Tests unitaires pour scripts/migrate-tokens.ts
 *
 * STRATÉGIE DE TEST :
 * On teste uniquement les helpers purs exportés :
 *   - isEncryptedTokenCandidate(value)  ← vérification de format, pas de clé requise
 *   - classifyToken(value)              ← classification complète, requiert la clé
 *   - buildMigrationPlan(stores)        ← agrège les résultats de classifyToken
 *
 * On ne teste PAS main() directement car :
 *   - Elle nécessite une vraie connexion DB et un prompt readline
 *   - La logique métier (classification) est déjà testée via les helpers
 *
 * MOCK PRISMA :
 * On mock le module prisma pour éviter que l'import de migrate-tokens.ts
 * ne tente de se connecter à Neon (ce qui échouerait en environnement de test).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Mock Prisma
// ─────────────────────────────────────────────────────────────
// IMPORTANT : ce mock doit être déclaré avant les imports du module testé.
// vitest hisse automatiquement vi.mock() avant les imports (hoisting).
// On remplace le singleton Prisma par un objet vide pour éviter toute
// tentative de connexion à la base de données pendant les tests.
vi.mock("../src/prisma/prisma", () => ({
  default: {
    shopifyStore: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Import du module APRÈS le mock (les mocks doivent être en place)
import {
  isEncryptedTokenCandidate,
  classifyToken,
  buildMigrationPlan,
} from "./migrate-tokens";
import { encryptToken } from "../src/utils/crypto";

// ─────────────────────────────────────────────────────────────
// Clé de test
// ─────────────────────────────────────────────────────────────
// 32 bytes à 0x01, encodée en base64. Valide pour AES-256 mais prévisible
// → ne jamais utiliser en production.
const VALID_TEST_KEY = Buffer.alloc(32, 0x01).toString("base64");

// Deuxième clé, différente — pour tester le cas "corrupted" (mauvaise clé)
const OTHER_TEST_KEY = Buffer.alloc(32, 0x02).toString("base64");

// ─────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────
let originalKey: string | undefined;

beforeEach(() => {
  originalKey = process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];
  process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = VALID_TEST_KEY;
});

afterEach(() => {
  if (originalKey === undefined) {
    delete process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];
  } else {
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = originalKey;
  }
});

// ─────────────────────────────────────────────────────────────
// Tests : isEncryptedTokenCandidate
// ─────────────────────────────────────────────────────────────

describe("isEncryptedTokenCandidate — vérification de format uniquement", () => {
  // TOKENS PLAINTEXT (attendu : false)

  it("retourne false pour un token Shopify en clair", () => {
    // Les tokens Shopify réels ressemblent à "shpat_xyz..." — pas de ":"
    expect(isEncryptedTokenCandidate("shpat_abc123real")).toBe(false);
  });

  it("retourne false pour une string vide", () => {
    expect(isEncryptedTokenCandidate("")).toBe(false);
  });

  it("retourne false pour une string sans ':'", () => {
    expect(isEncryptedTokenCandidate("tokenSansColon")).toBe(false);
  });

  it("retourne false pour une string avec seulement 1 ':' (2 parties)", () => {
    // On a besoin de EXACTEMENT 3 parties
    expect(isEncryptedTokenCandidate("seulement:deux")).toBe(false);
  });

  it("retourne false pour une string avec 4 parties (trop de ':')", () => {
    expect(isEncryptedTokenCandidate("a:b:c:d")).toBe(false);
  });

  it("retourne false si une des parties est vide (ex: '::ciphertext')", () => {
    // Parties vides seraient un format corrompu
    expect(isEncryptedTokenCandidate("::ciphertext")).toBe(false);
    expect(isEncryptedTokenCandidate("iv::ciphertext")).toBe(false);
    expect(isEncryptedTokenCandidate("iv:authTag:")).toBe(false);
  });

  it("retourne false si une partie contient des caractères non-base64", () => {
    // "!" n'est pas dans l'alphabet base64
    expect(isEncryptedTokenCandidate("abc!:defg:hijk")).toBe(false);
    // espace n'est pas base64
    expect(isEncryptedTokenCandidate("abc:d ef:ghij")).toBe(false);
  });

  // TOKENS AU FORMAT CHIFFRÉ (attendu : true)

  it("retourne true pour 3 parties base64 valides", () => {
    // On construit manuellement un faux "iv:authTag:ciphertext" en base64 valide
    // (pas un vrai token chiffré — juste pour tester le format)
    const iv = Buffer.alloc(12).toString("base64");         // 12 bytes en base64
    const authTag = Buffer.alloc(16).toString("base64");    // 16 bytes en base64
    const ciphertext = Buffer.alloc(20).toString("base64"); // quelconque
    expect(isEncryptedTokenCandidate(`${iv}:${authTag}:${ciphertext}`)).toBe(true);
  });

  it("retourne true pour un token réellement chiffré par encryptToken()", () => {
    // encryptToken() produit exactement le format attendu
    const encrypted = encryptToken("shpat_test_token");
    expect(isEncryptedTokenCandidate(encrypted)).toBe(true);
  });

  it("retourne true même si le padding '=' est présent en fin de partie base64", () => {
    // Le padding "=" est légal en base64
    const withPadding = "AAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAA==:AAAAAAAA";
    // On ne vérifie pas si c'est un vrai chiffrement — seulement le format
    // (certains résultats peuvent ne pas avoir de padding selon la taille)
    const parts = withPadding.split(":");
    if (parts.length === 3) {
      // Vérification flexible — le point est que le padding est accepté
      expect(isEncryptedTokenCandidate(withPadding)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Tests : classifyToken
// ─────────────────────────────────────────────────────────────

describe("classifyToken — classification complète (format + crypto)", () => {

  // CAS 'plaintext' — token en clair, à migrer

  it("retourne 'plaintext' pour un token Shopify en clair", () => {
    expect(classifyToken("shpat_abc123real_shopify_token")).toBe("plaintext");
  });

  it("retourne 'plaintext' pour une string vide", () => {
    expect(classifyToken("")).toBe("plaintext");
  });

  it("retourne 'plaintext' pour une string sans formatage base64:base64:base64", () => {
    expect(classifyToken("juste-une-string-normale")).toBe("plaintext");
  });

  // CAS 'already_encrypted' — token déjà chiffré avec la bonne clé → skip

  it("retourne 'already_encrypted' pour un token chiffré par encryptToken() avec la clé actuelle", () => {
    // Scénario : token déjà migré lors d'une exécution précédente
    const originalToken = "shpat_real_shopify_token_original";
    const encryptedToken = encryptToken(originalToken);

    // La clé dans l'env (VALID_TEST_KEY) est la même que celle utilisée pour chiffrer
    expect(classifyToken(encryptedToken)).toBe("already_encrypted");
  });

  it("retourne 'already_encrypted' pour plusieurs tokens distincts chiffrés avec la clé actuelle", () => {
    // Chaque token a un IV différent → des valeurs chiffrées différentes
    // mais les deux doivent être reconnus comme déjà chiffrés
    const t1 = encryptToken("shpat_token_boutique_A");
    const t2 = encryptToken("shpat_token_boutique_B");

    expect(classifyToken(t1)).toBe("already_encrypted");
    expect(classifyToken(t2)).toBe("already_encrypted");
  });

  // CAS 'corrupted' — format OK mais mauvaise clé → DANGER

  it("retourne 'corrupted' pour un token chiffré avec UNE AUTRE clé (mauvaise clé)", () => {
    // Scénario critique : token chiffré avec OTHER_TEST_KEY, mais la clé active est VALID_TEST_KEY
    // Cela peut arriver si on change SHOPIFY_TOKEN_ENCRYPTION_KEY entre S0-T02 et S0-T03

    // Chiffrer avec OTHER_TEST_KEY (clé temporairement différente)
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = OTHER_TEST_KEY;
    const encryptedWithOtherKey = encryptToken("shpat_some_token");

    // Remettre VALID_TEST_KEY (la "clé actuelle" qui ne correspond pas)
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = VALID_TEST_KEY;

    // Le token a le bon format (isEncryptedTokenCandidate → true)
    // mais ne peut pas être déchiffré avec VALID_TEST_KEY → 'corrupted'
    expect(classifyToken(encryptedWithOtherKey)).toBe("corrupted");
  });
});

// ─────────────────────────────────────────────────────────────
// Tests : buildMigrationPlan (idempotence + séparation)
// ─────────────────────────────────────────────────────────────

describe("buildMigrationPlan — agrégation et idempotence", () => {

  it("classe correctement un mix de stores plaintext et déjà chiffrés", () => {
    // Scénario réel : quelques stores en clair, d'autres déjà migrés
    const encryptedToken = encryptToken("shpat_déjà_migré");

    const stores = [
      { id: "store-1", shop_domain: "boutique-a.myshopify.com", access_token: "shpat_plaintext_A" },
      { id: "store-2", shop_domain: "boutique-b.myshopify.com", access_token: encryptedToken },
      { id: "store-3", shop_domain: "boutique-c.myshopify.com", access_token: "shpat_plaintext_C" },
    ];

    const plan = buildMigrationPlan(stores);

    expect(plan.toMigrate).toHaveLength(2);          // store-1 et store-3
    expect(plan.alreadyEncrypted).toHaveLength(1);   // store-2
    expect(plan.corrupted).toHaveLength(0);

    // Vérifier que le bon store est dans le bon groupe
    expect(plan.alreadyEncrypted[0]?.id).toBe("store-2");
    expect(plan.toMigrate.map(s => s.id)).toContain("store-1");
    expect(plan.toMigrate.map(s => s.id)).toContain("store-3");
  });

  it("idempotence : tous les stores déjà chiffrés → rien à migrer", () => {
    // Scénario : on relance le script après une migration réussie
    // Tous les tokens sont chiffrés → le plan doit indiquer 0 à migrer
    const stores = [
      { id: "s1", shop_domain: "a.myshopify.com", access_token: encryptToken("tok_a") },
      { id: "s2", shop_domain: "b.myshopify.com", access_token: encryptToken("tok_b") },
    ];

    const plan = buildMigrationPlan(stores);

    // C'est le test d'idempotence : une 2ème exécution ne doit rien faire
    expect(plan.toMigrate).toHaveLength(0);
    expect(plan.alreadyEncrypted).toHaveLength(2);
    expect(plan.corrupted).toHaveLength(0);
  });

  it("classe dans 'corrupted' les tokens avec format chiffré mais mauvaise clé", () => {
    // Chiffrer avec une autre clé
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = OTHER_TEST_KEY;
    const corruptedToken = encryptToken("shpat_token_autre_cle");

    // Revenir à la clé "actuelle"
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = VALID_TEST_KEY;

    const stores = [
      { id: "s1", shop_domain: "a.myshopify.com", access_token: corruptedToken },
    ];

    const plan = buildMigrationPlan(stores);

    expect(plan.corrupted).toHaveLength(1);
    expect(plan.toMigrate).toHaveLength(0);
    expect(plan.alreadyEncrypted).toHaveLength(0);
  });

  it("retourne un plan vide pour une liste de stores vide", () => {
    const plan = buildMigrationPlan([]);
    expect(plan.toMigrate).toHaveLength(0);
    expect(plan.alreadyEncrypted).toHaveLength(0);
    expect(plan.corrupted).toHaveLength(0);
  });
});
