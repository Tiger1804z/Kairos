/**
 * Tests unitaires pour src/utils/crypto.ts
 *
 * On teste les deux fonctions publiques : encryptToken et decryptToken.
 *
 * CONVENTION : chaque test est indépendant.
 * - beforeEach installe une clé de test valide dans process.env
 * - afterEach restaure l'état original
 *
 * CLÉ DE TEST UTILISÉE :
 * Buffer.alloc(32, 0x01) = 32 bytes tous à 0x01, encodé en base64.
 * Ce n'est PAS une clé de production (trop prévisible), mais parfaite pour les tests.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptToken, decryptToken } from "./crypto";

// ─────────────────────────────────────────────────────────────
// Clé de test : 32 bytes (valide pour AES-256), encodée en base64
// ─────────────────────────────────────────────────────────────
const VALID_TEST_KEY = Buffer.alloc(32, 0x01).toString("base64");

// Une deuxième clé différente (pour tester la mauvaise clé)
const OTHER_TEST_KEY = Buffer.alloc(32, 0x02).toString("base64");

// ─────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────

// Variable pour sauvegarder la clé originale avant chaque test
let originalKey: string | undefined;

beforeEach(() => {
  // Sauvegarde la valeur actuelle (peut être undefined si pas définie)
  originalKey = process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];
  // Installe une clé valide pour tous les tests
  process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = VALID_TEST_KEY;
});

afterEach(() => {
  // Restaure la valeur originale (important : ne pas polluer les autres tests)
  if (originalKey === undefined) {
    delete process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];
  } else {
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = originalKey;
  }
});

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe("encryptToken", () => {
  // ── Test 1 ────────────────────────────────────────────────
  it("retourne une string au format iv:authTag:ciphertext (3 parties base64)", () => {
    const result = encryptToken("shpat_abc123");

    // Le résultat doit contenir exactement 2 ":" → 3 parties
    const parts = result.split(":");
    expect(parts).toHaveLength(3);

    // Chaque partie doit être une string base64 non vide
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0);
    }
  });

  // ── Test 2 ────────────────────────────────────────────────
  it("deux chiffrements du MÊME token donnent deux strings DIFFÉRENTES (IV aléatoire)", () => {
    // Ce test vérifie que l'IV est bien aléatoire à chaque appel.
    // Si l'IV était fixe, deux chiffrements identiques = même résultat = risque de sécurité.
    const token = "shpat_same_token_chiffré_deux_fois";

    const encrypted1 = encryptToken(token);
    const encrypted2 = encryptToken(token);

    // Les deux strings chiffrées sont différentes (IVs différents)
    expect(encrypted1).not.toBe(encrypted2);

    // Mais les deux sont quand même déchiffrables vers le même token
    expect(decryptToken(encrypted1)).toBe(token);
    expect(decryptToken(encrypted2)).toBe(token);
  });

  // ── Test 3 ────────────────────────────────────────────────
  it("throw si SHOPIFY_TOKEN_ENCRYPTION_KEY est absente", () => {
    delete process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];

    // La fonction doit throw avec un message mentionnant la variable manquante
    expect(() => encryptToken("shpat_test")).toThrowError(
      "SHOPIFY_TOKEN_ENCRYPTION_KEY"
    );
  });

  // ── Test 4 ────────────────────────────────────────────────
  it("throw si la clé décodée n'est pas exactement 32 bytes", () => {
    // 16 bytes en base64 → trop court pour AES-256 (qui exige 32 bytes)
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = Buffer.alloc(16).toString("base64");

    expect(() => encryptToken("shpat_test")).toThrowError("32 bytes");
  });

  it("throw si la clé est de 31 bytes (un byte de moins)", () => {
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = Buffer.alloc(31).toString("base64");

    expect(() => encryptToken("shpat_test")).toThrowError("32 bytes");
  });

  it("throw si la clé est de 33 bytes (un byte de plus)", () => {
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = Buffer.alloc(33).toString("base64");

    expect(() => encryptToken("shpat_test")).toThrowError("32 bytes");
  });
});

describe("decryptToken", () => {
  // ── Test 5 : Round-trip ───────────────────────────────────
  it("round-trip : decryptToken(encryptToken(token)) === token", () => {
    // C'est le test le plus important :
    // ce qu'on chiffre doit pouvoir être déchiffré exactement.
    const token = "shpat_abc123_token_original";

    const encrypted = encryptToken(token);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(token);
  });

  it("round-trip fonctionne pour un token vide", () => {
    const token = "";
    expect(decryptToken(encryptToken(token))).toBe(token);
  });

  it("round-trip fonctionne pour un token avec caractères spéciaux", () => {
    const token = "shpat_café_résumé_données_unicode_🔑";
    expect(decryptToken(encryptToken(token))).toBe(token);
  });

  it("round-trip fonctionne pour un très long token", () => {
    const token = "shpat_" + "x".repeat(1000);
    expect(decryptToken(encryptToken(token))).toBe(token);
  });

  // ── Test 6 : Format invalide ──────────────────────────────
  it("throw si le format n'a pas 3 parties (trop peu de ':')", () => {
    // Une string sans ":" → 1 partie seulement → format invalide
    expect(() => decryptToken("pas-de-colon-du-tout")).toThrowError("[crypto]");
  });

  it("throw si le format a seulement 2 parties (1 seul ':')", () => {
    expect(() => decryptToken("seulement:deux")).toThrowError("[crypto]");
  });

  it("throw si le format a plus de 3 parties (trop de ':')", () => {
    expect(() => decryptToken("a:b:c:d:e")).toThrowError("[crypto]");
  });

  it("throw si la string est vide", () => {
    expect(() => decryptToken("")).toThrowError("[crypto]");
  });

  // ── Test 7 : Clé absente ──────────────────────────────────
  it("throw si SHOPIFY_TOKEN_ENCRYPTION_KEY est absente au moment du déchiffrement", () => {
    // On chiffre d'abord avec la clé en place...
    const encrypted = encryptToken("shpat_test");

    // ...puis on supprime la clé et on essaie de déchiffrer
    delete process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];

    expect(() => decryptToken(encrypted)).toThrowError(
      "SHOPIFY_TOKEN_ENCRYPTION_KEY"
    );
  });

  // ── Test 8 : Mauvaise clé ────────────────────────────────
  it("throw si on déchiffre avec une clé DIFFÉRENTE de celle qui a chiffré", () => {
    // Illustration du principe de sécurité fondamental :
    // La même clé doit chiffrer ET déchiffrer.

    // Chiffrement avec la clé VALID_TEST_KEY (installée par beforeEach)
    const encrypted = encryptToken("shpat_token_secret");

    // On change la clé pour une autre valide mais différente
    process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"] = OTHER_TEST_KEY;

    // Le déchiffrement doit échouer (authTag ne correspond plus)
    expect(() => decryptToken(encrypted)).toThrowError("[crypto]");
  });
});
