/**
 * @fileoverview Helper de chiffrement AES-256-GCM pour les tokens Shopify.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  POURQUOI CE FICHIER ?                                      │
 * │                                                             │
 * │  Les tokens Shopify (ShopifyStore.access_token) donnent     │
 * │  accès complet aux boutiques des marchands. Les stocker     │
 * │  en clair dans la DB est un risque critique : si la DB      │
 * │  est volée, tous les tokens sont exposés.                   │
 * │                                                             │
 * │  Ce helper chiffre le token AVANT stockage en DB,           │
 * │  et le déchiffre APRÈS lecture. Même avec la DB volée,      │
 * │  l'attaquant ne voit que du texte chiffré inutilisable.     │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  POURQUOI AES-256-GCM ?                                     │
 * │                                                             │
 * │  AES-256 = algorithme symétrique éprouvé, clé 256 bits.    │
 * │  GCM = mode "authentifié" : chiffrement + intégrité.        │
 * │                                                             │
 * │  Concrètement : si quelqu'un modifie le ciphertext          │
 * │  (même 1 bit), le déchiffrement échoue proprement.          │
 * │  AES-CBC n'offre pas cette garantie → rejeté.               │
 * └─────────────────────────────────────────────────────────────┘
 *
 * FORMAT STOCKÉ EN DB : `iv:authTag:ciphertext`
 * Chaque partie est encodée en base64.
 *
 * VARIABLE D'ENVIRONNEMENT REQUISE :
 * SHOPIFY_TOKEN_ENCRYPTION_KEY = string base64 de 32 bytes
 *
 * Générer une clé valide :
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * RÈGLE DE SÉCURITÉ : Ne jamais logger le token, la clé, l'IV,
 * l'authTag ou le ciphertext.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────

/** Algorithme AES en mode GCM avec clé 256 bits (32 bytes). */
const ALGORITHM = "aes-256-gcm" as const;

/**
 * Taille de l'IV en bytes.
 *
 * Pourquoi 12 ? C'est la taille recommandée par le NIST pour GCM.
 * Elle maximise la performance et la sécurité du mode GCM.
 */
const IV_LENGTH = 12;

/**
 * Taille de l'authTag en bytes.
 *
 * 16 bytes = 128 bits. C'est la taille maximale et recommandée pour GCM.
 * Plus l'authTag est long, plus il est difficile de le falsifier.
 */
const AUTH_TAG_LENGTH = 16;

// ─────────────────────────────────────────────────────────────
// Helper interne : lecture et validation de la clé
// ─────────────────────────────────────────────────────────────

/**
 * Lit la clé de chiffrement depuis la variable d'environnement et la valide.
 *
 * La clé doit être :
 * - Présente dans `process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY`
 * - Une chaîne base64 valide
 * - Représenter **exactement** 32 bytes une fois décodée
 *
 * Pourquoi 32 bytes ? AES-256 = 256 bits = 32 bytes. C'est obligatoire.
 *
 * @returns Buffer de 32 bytes prêt à être utilisé comme clé AES-256.
 * @throws {Error} Si la clé est absente, invalide ou de mauvaise taille.
 *
 * @internal - Ne pas appeler directement, utilisé par encryptToken et decryptToken.
 */
function getEncryptionKey(): Buffer {
  const raw = process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];

  // Vérification 1 : la variable existe
  if (!raw) {
    throw new Error(
      "[crypto] SHOPIFY_TOKEN_ENCRYPTION_KEY manquante. " +
      "Générez une clé avec : node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }

  // Décodage base64 → Buffer de bytes
  // Base64 convertit des données binaires en texte ASCII.
  // Ici, on fait l'inverse : on récupère les bytes bruts.
  const keyBuffer = Buffer.from(raw, "base64");

  // Vérification 2 : exactement 32 bytes pour AES-256
  if (keyBuffer.length !== 32) {
    throw new Error(
      `[crypto] SHOPIFY_TOKEN_ENCRYPTION_KEY doit représenter exactement 32 bytes. ` +
      `Taille actuelle après décodage base64 : ${keyBuffer.length} bytes.`
    );
  }

  return keyBuffer;
}

// ─────────────────────────────────────────────────────────────
// encryptToken
// ─────────────────────────────────────────────────────────────

/**
 * Chiffre un token Shopify avec AES-256-GCM.
 *
 * ## Processus interne
 *
 * 1. Lit et valide la clé depuis `SHOPIFY_TOKEN_ENCRYPTION_KEY`
 * 2. Génère un **IV aléatoire de 12 bytes** (unique par appel)
 *    → Garantit que le même token chiffré 2 fois → 2 résultats différents
 * 3. Chiffre le token avec AES-256-GCM
 * 4. Récupère l'**authTag** (empreinte d'intégrité de 16 bytes)
 * 5. Retourne `"iv:authTag:ciphertext"` en base64
 *
 * ## Schéma visuel
 *
 * ```
 * token: "shpat_abc123"
 *    ↓  + clé (32 bytes) + IV aléatoire (12 bytes)
 * [AES-256-GCM]
 *    ↓
 * ciphertext (bytes) + authTag (16 bytes)
 *    ↓  base64
 * "abc123==:def456==:xyz789=="
 *    IV    authTag  ciphertext
 * ```
 *
 * @param plain - Le token Shopify en clair (ex: "shpat_abc123")
 * @returns Chaîne chiffrée au format `"iv:authTag:ciphertext"` (tout en base64)
 * @throws {Error} Si `SHOPIFY_TOKEN_ENCRYPTION_KEY` est absente ou invalide
 */
export function encryptToken(plain: string): string {
  const key = getEncryptionKey();

  // ── Étape 1 : Génération de l'IV ──────────────────────────
  // IV = Initialization Vector (vecteur d'initialisation)
  // C'est un nombre aléatoire, généré FRESH à chaque appel.
  // Rôle : si on chiffre le même token 100 fois, chaque résultat est différent.
  // L'IV n'est pas secret (on le stocke), mais il doit être aléatoire et unique.
  const iv = randomBytes(IV_LENGTH);

  // ── Étape 2 : Création du cipher ──────────────────────────
  // Le cipher est l'objet qui va faire le chiffrement.
  // Il a besoin de : l'algorithme, la clé, et l'IV.
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // ── Étape 3 : Chiffrement ─────────────────────────────────
  // update() chiffre les données en entrée (le token en UTF-8).
  // final() termine le chiffrement et flush les données restantes.
  // Buffer.concat() réunit les deux morceaux en un seul Buffer.
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);

  // ── Étape 4 : Récupération de l'authTag ───────────────────
  // L'authTag est généré APRÈS cipher.final().
  // C'est l'empreinte cryptographique de ce chiffrement spécifique.
  // Si le ciphertext est modifié après coup, l'authTag ne correspondra plus.
  const authTag = cipher.getAuthTag();

  // ── Étape 5 : Format final ────────────────────────────────
  // On encode chaque partie en base64 (binaire → texte ASCII stockable en DB).
  // Le séparateur ":" est choisi car il n'apparaît jamais dans une string base64.
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

// ─────────────────────────────────────────────────────────────
// decryptToken
// ─────────────────────────────────────────────────────────────

/**
 * Déchiffre un token Shopify chiffré par `encryptToken()`.
 *
 * ## Processus interne
 *
 * 1. Lit et valide la clé depuis `SHOPIFY_TOKEN_ENCRYPTION_KEY`
 * 2. Parse le format `"iv:authTag:ciphertext"` (split sur ":")
 * 3. Décode chaque partie du base64 en bytes
 * 4. Recrée le decipher avec la même clé et l'IV d'origine
 * 5. Fournit l'authTag pour vérification d'intégrité
 * 6. Déchiffre → si l'authTag ne correspond pas, throw automatiquement
 * 7. Retourne le token original en UTF-8
 *
 * ## Ce qui échoue (et pourquoi c'est voulu)
 *
 * - Mauvaise clé → authTag mismatch → throw ✓
 * - Ciphertext altéré → authTag mismatch → throw ✓
 * - Format invalide → split ne donne pas 3 parties → throw ✓
 *
 * @param encrypted - Chaîne au format `"iv:authTag:ciphertext"` (base64)
 * @returns Le token Shopify original en clair
 * @throws {Error} Si le format est invalide (pas exactement 3 parties)
 * @throws {Error} Si la clé est invalide ou ne correspond pas
 * @throws {Error} Si les données ont été altérées (authTag mismatch)
 */
export function decryptToken(encrypted: string): string {
  const key = getEncryptionKey();

  // ── Étape 1 : Parse du format ─────────────────────────────
  // On découpe la string sur ":" pour retrouver les 3 parties.
  const parts = encrypted.split(":");

  if (parts.length !== 3) {
    throw new Error(
      `[crypto] Format invalide. Attendu : "iv:authTag:ciphertext" (3 parties base64 séparées par ":"). ` +
      `Reçu : ${parts.length} partie(s).`
    );
  }

  // TypeScript sait que parts a exactement 3 éléments grâce au guard ci-dessus.
  const [ivB64, authTagB64, ciphertextB64] = parts as [string, string, string];

  // ── Étape 2 : Décodage base64 → bytes ─────────────────────
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  // ── Étape 3 : Création du decipher ────────────────────────
  // On recrée exactement le même contexte de déchiffrement :
  // - Même algorithme
  // - Même clé (doit être identique à l'encryption)
  // - Même IV (récupéré depuis le format stocké)
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // ── Étape 4 : Fourniture de l'authTag ─────────────────────
  // On donne l'authTag au decipher pour qu'il puisse vérifier l'intégrité.
  // Si le ciphertext ou la clé sont différents de ceux utilisés à l'encryption,
  // decipher.final() va throw (c'est Node.js qui gère ça en interne).
  decipher.setAuthTag(authTag);

  // ── Étape 5 : Déchiffrement ───────────────────────────────
  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(), // ← throw ici si authTag invalide (mauvaise clé ou données altérées)
    ]);

    return decrypted.toString("utf8");
  } catch {
    // On catch l'erreur native de Node.js pour donner un message plus clair.
    // On ne logue PAS les détails (clé, IV, ciphertext...).
    throw new Error(
      "[crypto] Échec du déchiffrement. Clé incorrecte, données altérées, ou authTag invalide."
    );
  }
}
