/**
 * Tests unitaires pour src/utils/validateEnv.ts
 *
 * STRATÉGIE :
 * On teste les fonctions PURES (`validateRequiredEnv`, `getMissingEnvVars`,
 * `validateShopifyTokenEncryptionKey`) en leur passant un objet `env` factice.
 * Ainsi on ne touche jamais au vrai `process.env` et les tests restent
 * indépendants.
 *
 * On ne teste PAS `validateEnv()` directement : elle appelle `process.exit(1)`,
 * ce qui complexifie le test pour peu de valeur. Toute la logique réelle vit
 * dans `validateRequiredEnv`, qui est pure et entièrement couverte.
 *
 * SÉCURITÉ : on vérifie aussi que le résultat ne contient JAMAIS de valeurs de
 * secrets, uniquement des noms de variables.
 */

import { describe, it, expect } from "vitest";
import {
  REQUIRED_ENV_VARS,
  getMissingEnvVars,
  validateShopifyTokenEncryptionKey,
  validateRequiredEnv,
} from "./validateEnv";

// Clé de chiffrement valide : 32 bytes encodés en base64 (AES-256).
const VALID_ENC_KEY = Buffer.alloc(32, 0x01).toString("base64");

/**
 * Construit un environnement complet et valide, qu'on peut ensuite altérer
 * test par test (supprimer/vider/casser une variable).
 */
function makeValidEnv(): NodeJS.ProcessEnv {
  return {
    JWT_SECRET: "test-jwt-secret",
    DATABASE_URL: "postgres://localhost:5432/test",
    SHOPIFY_API_KEY: "test-api-key",
    SHOPIFY_API_SECRET: "test-api-secret",
    SHOPIFY_TOKEN_ENCRYPTION_KEY: VALID_ENC_KEY,
    OPENAI_API_KEY: "test-openai-key",
  };
}

describe("validateRequiredEnv", () => {
  it("retourne ok=true quand toutes les variables sont présentes et valides", () => {
    const result = validateRequiredEnv(makeValidEnv());
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it("signale DATABASE_URL manquante dans missing", () => {
    const env = makeValidEnv();
    delete env.DATABASE_URL;
    const result = validateRequiredEnv(env);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("DATABASE_URL");
  });

  it("signale SHOPIFY_TOKEN_ENCRYPTION_KEY manquante dans missing", () => {
    const env = makeValidEnv();
    delete env.SHOPIFY_TOKEN_ENCRYPTION_KEY;
    const result = validateRequiredEnv(env);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("SHOPIFY_TOKEN_ENCRYPTION_KEY");
    // Manquante => on ne la met PAS aussi dans invalid (pas de double signalement).
    expect(result.invalid).not.toContain("SHOPIFY_TOKEN_ENCRYPTION_KEY");
  });

  it("traite une variable vide '   ' comme manquante", () => {
    const env = makeValidEnv();
    env.JWT_SECRET = "   ";
    const result = validateRequiredEnv(env);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("JWT_SECRET");
  });

  it("signale SHOPIFY_TOKEN_ENCRYPTION_KEY dans invalid si mauvaise longueur (16 bytes)", () => {
    const env = makeValidEnv();
    env.SHOPIFY_TOKEN_ENCRYPTION_KEY = Buffer.alloc(16, 0x01).toString("base64");
    const result = validateRequiredEnv(env);
    expect(result.ok).toBe(false);
    expect(result.invalid).toContain("SHOPIFY_TOKEN_ENCRYPTION_KEY");
    expect(result.missing).not.toContain("SHOPIFY_TOKEN_ENCRYPTION_KEY");
  });

  it("signale SHOPIFY_TOKEN_ENCRYPTION_KEY dans invalid si non-base64 / mauvaise longueur", () => {
    const env = makeValidEnv();
    env.SHOPIFY_TOKEN_ENCRYPTION_KEY = "pas-une-cle-base64-valide";
    const result = validateRequiredEnv(env);
    expect(result.ok).toBe(false);
    expect(result.invalid).toContain("SHOPIFY_TOKEN_ENCRYPTION_KEY");
  });

  it("accumule plusieurs variables manquantes", () => {
    const env = makeValidEnv();
    delete env.JWT_SECRET;
    delete env.OPENAI_API_KEY;
    const result = validateRequiredEnv(env);
    expect(result.missing).toEqual(
      expect.arrayContaining(["JWT_SECRET", "OPENAI_API_KEY"])
    );
  });

  it("ne contient jamais de valeurs de secrets, uniquement des noms", () => {
    const env = makeValidEnv();
    env.JWT_SECRET = "super-secret-value-12345";
    delete env.DATABASE_URL;
    const result = validateRequiredEnv(env);

    const allReported = [...result.missing, ...result.invalid];
    // Aucun nom rapporté ne doit être une valeur de secret.
    expect(allReported).not.toContain("super-secret-value-12345");
    // Tout ce qui est rapporté doit être un nom de variable connu.
    for (const name of allReported) {
      expect(REQUIRED_ENV_VARS).toContain(name as (typeof REQUIRED_ENV_VARS)[number]);
    }
  });
});

describe("getMissingEnvVars", () => {
  it("retourne [] quand toutes les variables demandées sont présentes", () => {
    const env = { A: "1", B: "2" };
    expect(getMissingEnvVars(["A", "B"], env)).toEqual([]);
  });

  it("retourne les noms absents ou vides", () => {
    const env = { A: "1", B: "", C: "   " };
    expect(getMissingEnvVars(["A", "B", "C", "D"], env)).toEqual(["B", "C", "D"]);
  });
});

describe("validateShopifyTokenEncryptionKey", () => {
  it("true pour une clé base64 qui décode en 32 bytes", () => {
    expect(validateShopifyTokenEncryptionKey(VALID_ENC_KEY)).toBe(true);
  });

  it("false pour 16 bytes", () => {
    expect(
      validateShopifyTokenEncryptionKey(Buffer.alloc(16, 0x01).toString("base64"))
    ).toBe(false);
  });

  it("false pour 31 bytes", () => {
    expect(
      validateShopifyTokenEncryptionKey(Buffer.alloc(31, 0x01).toString("base64"))
    ).toBe(false);
  });

  it("false pour 33 bytes", () => {
    expect(
      validateShopifyTokenEncryptionKey(Buffer.alloc(33, 0x01).toString("base64"))
    ).toBe(false);
  });

  it("false pour une string non-base64", () => {
    expect(validateShopifyTokenEncryptionKey("pas-une-cle-base64-valide")).toBe(false);
  });

  it("false pour une string avec caractères invalides (espace au milieu)", () => {
    // 32 bytes valides, mais on injecte un caractère hors alphabet base64.
    const valid = Buffer.alloc(32, 0x01).toString("base64");
    const corrupted = valid.slice(0, 10) + " " + valid.slice(11);
    expect(validateShopifyTokenEncryptionKey(corrupted)).toBe(false);
  });

  it("false pour une string vide", () => {
    expect(validateShopifyTokenEncryptionKey("")).toBe(false);
  });

  it("false pour une string d'espaces", () => {
    expect(validateShopifyTokenEncryptionKey("   ")).toBe(false);
  });
});
