/**
 * @fileoverview Script one-time : migration des tokens Shopify en clair → chiffrés.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  CONTEXTE (S0-T03)                                                  │
 * │                                                                     │
 * │  S0-T02 a modifié shopifyAuthService.ts pour chiffrer les           │
 * │  nouveaux tokens avant stockage. Mais les tokens créés AVANT        │
 * │  S0-T02 sont encore en clair dans shopify_stores.access_token.      │
 * │                                                                     │
 * │  Ce script détecte ces tokens et les chiffre avec AES-256-GCM       │
 * │  via le helper src/utils/crypto.ts.                                 │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  USAGE                                                              │
 * │                                                                     │
 * │  Dry-run (TOUJOURS COMMENCER PAR LÀ — aucune écriture) :           │
 * │    npm run migrate:tokens                                           │
 * │    npm run migrate:tokens -- --dry-run                              │
 * │                                                                     │
 * │  Exécution réelle (écrit en base) :                                 │
 * │    npm run migrate:tokens -- --execute                              │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  SÉCURITÉ                                                           │
 * │                                                                     │
 * │  - Ce script ne log JAMAIS un token (ni plaintext ni chiffré)       │
 * │  - La backup va dans .token-migration-backups/ (dans .gitignore)    │
 * │  - Faire un backup DB complet AVANT --execute (Neon console)        │
 * │  - SUPPRIMER le fichier backup après validation                     │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  ROLLBACK                                                           │
 * │                                                                     │
 * │  Option 1 (recommandée) : restaurer depuis le backup DB Neon        │
 * │  Option 2 : utiliser .token-migration-backups/backup-*.json         │
 * │    → contient les valeurs originales des access_token               │
 * │    → UPDATE shopify_stores SET access_token = ? WHERE id = ?        │
 * └─────────────────────────────────────────────────────────────────────┘
 */

import path from "node:path";
import fs from "node:fs";
import readline from "node:readline";
import { encryptToken, decryptToken } from "../src/utils/crypto";
import prisma from "../src/prisma/prisma";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Un store tel qu'on le lit depuis Prisma (champs nécessaires seulement). */
interface StoreRecord {
  id: string;
  shop_domain: string;
  access_token: string;
}

/**
 * Le statut d'un token après classification :
 * - 'already_encrypted' : format correct ET déchiffrable avec la clé actuelle → skip
 * - 'plaintext'         : format incorrect → à migrer
 * - 'corrupted'         : format correct MAIS non déchiffrable → ERREUR (mauvaise clé ?)
 */
export type TokenStatus = "already_encrypted" | "plaintext" | "corrupted";

/** Résultat de l'analyse de tous les stores. */
interface MigrationPlan {
  alreadyEncrypted: StoreRecord[];
  toMigrate: StoreRecord[];
  corrupted: StoreRecord[];
}

// ─────────────────────────────────────────────────────────────
// Helpers purs (exportés pour les tests)
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie si une string ressemble structurellement au format `iv:authTag:ciphertext`.
 *
 * ## Ce que cette fonction fait
 * - Compte les parties séparées par ":"
 * - Vérifie que chaque partie est non-vide
 * - Vérifie que chaque partie ne contient que des caractères base64 valides
 *
 * ## Ce que cette fonction NE fait PAS
 * - Elle NE tente PAS de déchiffrer
 * - Elle NE requiert PAS la clé SHOPIFY_TOKEN_ENCRYPTION_KEY
 * - Elle n'est pas suffisante seule → utiliser classifyToken() pour la décision finale
 *
 * @param value - Le contenu du champ access_token à inspecter
 * @returns true si la string a exactement 3 parties base64 non-vides séparées par ":"
 */
export function isEncryptedTokenCandidate(value: string): boolean {
  const parts = value.split(":");

  // Condition 1 : exactement 3 parties
  // Notre format stocke : "iv:authTag:ciphertext" → toujours 3 parties
  // Un token Shopify légitime ("shpat_xyz") n'a pas de ":" → 1 partie
  if (parts.length !== 3) return false;

  // TypeScript narrow : parts a exactement 3 éléments après le guard ci-dessus
  const [iv, authTag, ciphertext] = parts as [string, string, string];

  // Condition 2 : chaque partie est non-vide
  // Protège contre des strings malformées comme "::" ou "a::b"
  if (!iv || !authTag || !ciphertext) return false;

  // Condition 3 : chaque partie ne contient que des caractères base64 valides
  // Base64 = [A-Z][a-z][0-9][+/] avec padding "=" en fin de string seulement
  // Pourquoi vérifier ça ? Un token Shopify POURRAIT avoir un ":" si Shopify change son format.
  // La vérification base64 réduit les faux positifs.
  const BASE64_REGEX = /^[A-Za-z0-9+/]+=*$/;
  return (
    BASE64_REGEX.test(iv) &&
    BASE64_REGEX.test(authTag) &&
    BASE64_REGEX.test(ciphertext)
  );
}

/**
 * Classifie un token en 3 catégories selon son état réel.
 *
 * ## Logique
 *
 * ```
 * isEncryptedTokenCandidate(value) ?
 *   NON  → 'plaintext'         (format incorrect → token en clair)
 *   OUI  → tenter decryptToken(value)
 *              réussit → 'already_encrypted'  (skip)
 *              échoue  → 'corrupted'          (DANGER)
 * ```
 *
 * ## Cas 'corrupted'
 *
 * Ce cas survient si :
 * - Le token a été partiellement chiffré avec une AUTRE clé
 * - Les données sont corrompues en base
 * - La clé dans .env ne correspond pas à celle utilisée lors du chiffrement
 *
 * Le script DOIT arrêter si un token est 'corrupted'. Continuer pourrait
 * corrompre d'autres tokens ou masquer un problème de clé.
 *
 * @param value - Le contenu du champ access_token
 * @returns TokenStatus
 * @requires SHOPIFY_TOKEN_ENCRYPTION_KEY valide dans process.env
 */
export function classifyToken(value: string): TokenStatus {
  // Étape 1 : vérification de format (rapide, pas de clé requise)
  if (!isEncryptedTokenCandidate(value)) {
    return "plaintext";
  }

  // Étape 2 : vérification cryptographique
  // Si isEncryptedTokenCandidate() est true, on sait que le FORMAT ressemble
  // au nôtre. Maintenant on confirme que la CLEF actuelle peut le déchiffrer.
  try {
    decryptToken(value);
    // decryptToken() a réussi → ce token a été chiffré avec la clé actuelle → skip
    return "already_encrypted";
  } catch {
    // decryptToken() a échoué malgré un format correct.
    // On ne log PAS l'erreur (elle pourrait contenir des infos sensibles).
    // On retourne 'corrupted' → le script principal décidera d'arrêter.
    return "corrupted";
  }
}

// ─────────────────────────────────────────────────────────────
// Validation au démarrage
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie que les variables d'environnement critiques sont présentes et valides.
 * Appelle process.exit(1) avec un message clair si une variable manque.
 *
 * Pourquoi faire ça au démarrage plutôt qu'à la première requête ?
 * Échouer tôt avec un message clair est toujours préférable à un crash
 * au milieu de la migration avec un message cryptique.
 */
function validateStartupConditions(): void {
  const errors: string[] = [];

  // Vérification 1 : SHOPIFY_TOKEN_ENCRYPTION_KEY présente
  const rawKey = process.env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];
  if (!rawKey) {
    errors.push("SHOPIFY_TOKEN_ENCRYPTION_KEY manquante");
  } else {
    // Vérification 2 : la clé fait bien 32 bytes une fois décodée
    try {
      const keyBuf = Buffer.from(rawKey, "base64");
      if (keyBuf.length !== 32) {
        errors.push(
          `SHOPIFY_TOKEN_ENCRYPTION_KEY doit représenter 32 bytes (AES-256). ` +
            `Taille actuelle après décodage: ${keyBuf.length} bytes.`
        );
      }
    } catch {
      errors.push("SHOPIFY_TOKEN_ENCRYPTION_KEY n'est pas un base64 valide.");
    }
  }

  // Vérification 3 : DATABASE_URL présente
  if (!process.env["DATABASE_URL"]) {
    errors.push("DATABASE_URL manquante");
  }

  if (errors.length > 0) {
    console.error("");
    console.error("ERREUR FATALE — Variables d'environnement invalides :");
    for (const e of errors) {
      console.error(`  ✗ ${e}`);
    }
    console.error("");
    console.error("Vérifiez Kairos-backend/.env");
    console.error("Clé valide : node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"");
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────
// Backup
// ─────────────────────────────────────────────────────────────

/**
 * Crée un fichier JSON de backup avec l'état ACTUEL de tous les stores.
 *
 * ## SÉCURITÉ
 *
 * Ce fichier contient les valeurs ORIGINALES des access_token (avant migration).
 * Pour les stores encore en clair, cela inclut les tokens Shopify en plaintext.
 * Ce fichier est dans .gitignore — NE JAMAIS COMMITER.
 * SUPPRIMER ce fichier après validation réussie de la migration.
 *
 * ## Utilité pour le rollback
 *
 * Si la migration a été exécutée avec la mauvaise clé, ce fichier permet de
 * restaurer les tokens originaux via des UPDATE manuels.
 *
 * @param stores - L'état actuel de tous les stores (avant migration)
 * @returns Le chemin absolu du fichier backup créé
 * @throws Si le dossier ou le fichier ne peuvent pas être créés
 */
function createBackup(stores: StoreRecord[]): string {
  // Le dossier backup est toujours dans le répertoire courant (Kairos-backend/)
  // Quand lancé via npm run, process.cwd() = Kairos-backend/
  const backupDir = path.join(process.cwd(), ".token-migration-backups");

  try {
    // recursive: true → ne throw pas si le dossier existe déjà (idempotent)
    fs.mkdirSync(backupDir, { recursive: true });
  } catch (err) {
    throw new Error(
      `Impossible de créer le dossier backup ${backupDir}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Nom de fichier avec timestamp ISO → chaque exécution crée un nouveau fichier
  // On remplace ":" et "." pour éviter les problèmes de nom de fichier sur Windows
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-pre-migration-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);

  // Structure du fichier backup
  // Les champs "_*" sont des métadonnées pour guider le rollback
  const backup = {
    _WARNING:
      "⚠ CE FICHIER CONTIENT DES DONNÉES SENSIBLES (tokens Shopify). NE PAS COMMITER. SUPPRIMER APRÈS VALIDATION.",
    _created_at: new Date().toISOString(),
    _purpose:
      "Backup pre-migration S0-T03. Contient les valeurs access_token AVANT chiffrement.",
    _rollback_instructions: [
      "OPTION 1 (recommandée): restaurer depuis un backup DB Neon complet.",
      "OPTION 2: pour chaque entrée dans 'stores', exécuter:",
      "  UPDATE shopify_stores SET access_token = '<access_token>' WHERE id = '<id>';",
      "  OU via Prisma: prisma.shopifyStore.update({ where: { id }, data: { access_token } })",
    ].join(" "),
    // SÉCURITÉ: On stocke les données nécessaires au rollback.
    // Le champ access_token ici peut contenir des tokens plaintext pour les stores non-migrés.
    // C'est inévitable pour un rollback valide — d'où le warning ci-dessus.
    stores: stores.map((s) => ({
      id: s.id,
      shop_domain: s.shop_domain,
      access_token: s.access_token,
    })),
  };

  try {
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf8");
  } catch (err) {
    throw new Error(
      `Impossible d'écrire le fichier backup ${filepath}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return filepath;
}

// ─────────────────────────────────────────────────────────────
// Confirmation interactive
// ─────────────────────────────────────────────────────────────

/**
 * Affiche une question et attend que l'utilisateur tape "yes" (insensible à la casse).
 * Retourne false si l'utilisateur tape autre chose ou ferme l'entrée standard.
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "yes");
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Analyse des stores
// ─────────────────────────────────────────────────────────────

/**
 * Classifie chaque store et construit le plan de migration.
 *
 * Pourquoi séparer cette fonction ?
 * Pour que les tests puissent vérifier la classification sans déclencher main().
 * Et pour avoir un résumé clair avant d'écrire quoi que ce soit.
 *
 * @param stores - Tous les stores lus depuis Prisma
 * @returns MigrationPlan avec les 3 groupes : skip / migrer / corrompus
 */
export function buildMigrationPlan(stores: StoreRecord[]): MigrationPlan {
  const plan: MigrationPlan = {
    alreadyEncrypted: [],
    toMigrate: [],
    corrupted: [],
  };

  for (const store of stores) {
    const status = classifyToken(store.access_token);
    if (status === "already_encrypted") {
      plan.alreadyEncrypted.push(store);
    } else if (status === "plaintext") {
      plan.toMigrate.push(store);
    } else {
      // status === 'corrupted'
      plan.corrupted.push(store);
    }
  }

  return plan;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Déterminer le mode
  // Par défaut : dry-run. Il faut --execute explicitement pour écrire.
  const isDryRun = !process.argv.includes("--execute");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Kairos — Script de migration tokens Shopify (S0-T03)");
  console.log(
    `  Mode : ${isDryRun ? "🔍 DRY-RUN  (lecture seule, aucune écriture)" : "⚡ EXECUTE  (ÉCRITURE EN BASE ACTIVE)"}`
  );
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  // ── Étape 1 : Validation environnement ────────────────────
  // On arrête immédiatement si une variable critique manque.
  validateStartupConditions();
  console.log("[✓] Variables d'environnement validées");

  // ── Étape 2 : Lecture de tous les stores ──────────────────
  // On lit UNIQUEMENT les champs nécessaires (select strict).
  // Moins de données en mémoire = moins de surface d'exposition accidentelle.
  let stores: StoreRecord[];
  try {
    stores = await prisma.shopifyStore.findMany({
      select: {
        id: true,
        shop_domain: true,
        access_token: true,
      },
    });
  } catch (err) {
    console.error("[✗] Impossible de lire les stores depuis la base de données.");
    console.error(
      `    Erreur: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }

  console.log(`[✓] ${stores.length} store(s) trouvé(s) dans shopify_stores`);

  if (stores.length === 0) {
    console.log("    Aucun store à migrer. Fin du script.");
    return;
  }

  // ── Étape 3 : Classification ──────────────────────────────
  // On analyse chaque token pour savoir quoi faire avec lui.
  let plan: MigrationPlan;
  try {
    plan = buildMigrationPlan(stores);
  } catch (err) {
    console.error("[✗] Erreur lors de la classification des tokens.");
    console.error(
      `    Erreur: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }

  // ── Étape 4 : Résumé ──────────────────────────────────────
  console.log("");
  console.log("  Analyse terminée :");
  console.log(
    `    Déjà chiffrés (skip)     : ${plan.alreadyEncrypted.length}`
  );
  console.log(
    `    Plaintext (à migrer)      : ${plan.toMigrate.length}`
  );
  console.log(
    `    Corrompus / mauvaise clé  : ${plan.corrupted.length}`
  );
  console.log("");

  // ── Étape 5 : Bloquer si tokens corrompus ─────────────────
  // Un token au format chiffré mais non déchiffrable = signal d'alarme.
  // Continuer dans ce cas pourrait masquer un problème de clé.
  if (plan.corrupted.length > 0) {
    console.error(
      "[✗] ERREUR CRITIQUE : Des tokens ont le format chiffré mais ne peuvent pas être déchiffrés."
    );
    console.error("    Causes possibles :");
    console.error(
      "      - SHOPIFY_TOKEN_ENCRYPTION_KEY dans .env ≠ clé utilisée lors du chiffrement"
    );
    console.error("      - Données altérées en base de données");
    console.error("");
    console.error("    Stores affectés :");
    for (const s of plan.corrupted) {
      // On peut afficher l'ID et le domaine — pas le token
      console.error(`      ID: ${s.id} | Domain: ${s.shop_domain}`);
    }
    console.error("");
    console.error("    Actions recommandées :");
    console.error("      1. Vérifier SHOPIFY_TOKEN_ENCRYPTION_KEY dans .env");
    console.error(
      "      2. Comparer avec la clé utilisée lors de S0-T02 (générée le 2026-06-13)"
    );
    console.error(
      "      3. Si mauvaise clé : restaurer depuis un backup DB et relancer"
    );
    process.exit(1);
  }

  // ── Étape 6 : Rien à faire ────────────────────────────────
  if (plan.toMigrate.length === 0) {
    console.log("[✓] Tous les tokens sont déjà chiffrés. Rien à migrer.");
    return;
  }

  // ── Étape 7 : Dry-run → afficher le plan et arrêter ───────
  if (isDryRun) {
    console.log(
      `[ℹ] DRY-RUN : ${plan.toMigrate.length} token(s) SERAIENT migrés.`
    );
    console.log("");
    console.log("  Stores qui seraient migrés :");
    for (const s of plan.toMigrate) {
      // On affiche uniquement l'ID et le domaine, jamais le token
      console.log(`    - ${s.id} | ${s.shop_domain}`);
    }
    console.log("");
    console.log("  Pour effectuer la migration :");
    console.log("    1. Faire un backup DB complet (Neon console → Backups)");
    console.log(
      "    2. Relancer avec : npm run migrate:tokens -- --execute"
    );
    return;
  }

  // ═══ ZONE EXECUTE (--execute requis) ════════════════════════

  // ── Étape 8 : Round-trip AVANT écriture ───────────────────
  // Pour chaque token à migrer, on chiffre puis on déchiffre immédiatement.
  // Si le résultat ne correspond pas à l'original, quelque chose ne va pas
  // (clé invalide, mémoire corrompue...) → ARRÊT de sécurité.
  //
  // SÉCURITÉ : On ne log JAMAIS store.access_token ni le résultat du round-trip.
  // La comparaison se fait en mémoire, sans passer par console.log.
  console.log(
    `[…] Vérification des round-trips pour ${plan.toMigrate.length} token(s)...`
  );

  const encryptedUpdates: Array<{ id: string; newEncryptedToken: string }> = [];

  for (const store of plan.toMigrate) {
    // Chiffre le token
    const newEncryptedToken = encryptToken(store.access_token);

    // Déchiffre immédiatement pour vérifier
    const roundTripped = decryptToken(newEncryptedToken);

    // Comparaison silencieuse (pas de log des valeurs)
    if (roundTripped !== store.access_token) {
      // Ce cas ne devrait jamais arriver si la clé est valide.
      // Mais on arrête par sécurité si c'est le cas.
      console.error(
        `[✗] Round-trip FAILED pour le store ${store.id} (${store.shop_domain}). ARRÊT DE SÉCURITÉ.`
      );
      console.error(
        "    Le token chiffré ne peut pas être déchiffré vers sa valeur originale."
      );
      console.error("    Aucune modification n'a été écrite.");
      process.exit(1);
    }

    encryptedUpdates.push({ id: store.id, newEncryptedToken });
  }

  console.log("[✓] Tous les round-trips validés");

  // ── Étape 9 : Confirmation interactive ────────────────────
  console.log("");
  console.log(
    "┌─────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│  ⚠  ATTENTION — ACTION IRRÉVERSIBLE SANS BACKUP             │"
  );
  console.log(
    `│  ${plan.toMigrate.length} token(s) vont être modifiés dans shopify_stores.         │`
  );
  console.log(
    "│  Un fichier backup sera créé dans .token-migration-backups/  │"
  );
  console.log(
    "│  ⚠ SUPPRIMEZ ce fichier après validation (il contient des   │"
  );
  console.log(
    "│     tokens Shopify sensibles).                               │"
  );
  console.log(
    "└─────────────────────────────────────────────────────────────┘"
  );
  console.log("");

  const confirmed = await askConfirmation(
    '  Avez-vous fait un backup DB complet? Tapez "yes" pour continuer: '
  );

  if (!confirmed) {
    console.log("");
    console.log(
      "[ℹ] Migration annulée. Aucune modification effectuée en base."
    );
    return;
  }

  // ── Étape 10 : Backup ─────────────────────────────────────
  // On backup l'état ACTUEL de TOUS les stores (pas seulement ceux à migrer)
  // pour permettre un rollback complet si nécessaire.
  console.log("");
  console.log("[…] Création du fichier backup...");

  let backupPath: string;
  try {
    backupPath = createBackup(stores);
    console.log(`[✓] Backup créée : ${backupPath}`);
    console.log(
      "    ⚠ SUPPRIMER ce fichier après validation de la migration."
    );
  } catch (err) {
    console.error("[✗] Impossible de créer le fichier backup. ARRÊT.");
    console.error(
      "    On refuse d'écrire en base sans backup. C'est voulu."
    );
    console.error(
      `    Erreur : ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }

  // ── Étape 11 : Transaction Prisma ─────────────────────────
  // On regroupe toutes les updates dans une seule transaction.
  //
  // Pourquoi une transaction ?
  // Si une update échoue à mi-chemin, Prisma annule TOUTES les updates.
  // On évite l'état mixte (certains stores chiffrés, d'autres pas).
  //
  // Limitation : les transactions ont un timeout (défaut Prisma : 5s).
  // Avec peu de stores (< 100), ce n'est pas un problème.
  // Si > 100 stores : augmenter avec prisma.$transaction([...], { timeout: 30000 })
  console.log(
    `[…] Migration de ${encryptedUpdates.length} token(s) dans une transaction Prisma...`
  );

  try {
    await prisma.$transaction(
      encryptedUpdates.map(({ id, newEncryptedToken }) =>
        prisma.shopifyStore.update({
          where: { id },
          data: { access_token: newEncryptedToken },
          // select minimal : on n'a pas besoin de relire le token après update
          select: { id: true },
        })
      )
    );
  } catch (err) {
    console.error(
      "[✗] ERREUR pendant la transaction. Prisma a annulé TOUTES les modifications (rollback automatique)."
    );
    console.error(
      `    Erreur : ${err instanceof Error ? err.message : String(err)}`
    );
    console.error("");
    console.error("    La base de données est intacte (aucun token modifié).");
    console.error(`    Le fichier backup est disponible : ${backupPath}`);
    process.exit(1);
  }

  // ── Étape 12 : Résumé final ───────────────────────────────
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  MIGRATION TERMINÉE AVEC SUCCÈS");
  console.log(
    `  ${encryptedUpdates.length} token(s) migrés de plaintext → chiffré AES-256-GCM.`
  );
  console.log("");
  console.log("  Prochaines étapes :");
  console.log(
    "    1. Tester le sync Shopify (npm run dev → déclencher un sync)"
  );
  console.log(
    "    2. Vérifier les logs : aucun token ne doit apparaître"
  );
  console.log(
    `    3. SUPPRIMER le fichier backup : ${backupPath}`
  );
  console.log("    4. Marquer S0-T03 comme Done dans le ticket");
  console.log("═══════════════════════════════════════════════════════════════");
}

// ─────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────

// Pourquoi ce guard ?
// Sans lui, main() serait appelé même quand vitest importe ce fichier pour
// tester les helpers. process.env.VITEST est mis à 'true' par vitest
// automatiquement lors de l'exécution des tests.
if (!process.env["VITEST"]) {
  main()
    .catch((err) => {
      console.error(
        "[✗] Erreur inattendue :",
        err instanceof Error ? err.message : String(err)
      );
      process.exit(1);
    })
    .finally(async () => {
      // Toujours fermer la connexion Prisma en fin de script
      await prisma.$disconnect();
    });
}
