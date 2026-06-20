/**
 * validateEnv.ts — Validation "fail fast" des variables d'environnement critiques.
 *
 * ## Objectif (S0-T10)
 * Au démarrage du serveur, on veut **refuser de démarrer** si une variable
 * d'environnement critique est manquante, vide ou invalide. Plutôt que de
 * laisser le serveur démarrer puis échouer silencieusement à la première
 * requête (erreurs 500 aléatoires, difficiles à tracer), on échoue tout de
 * suite avec un message clair, au seul endroit où ça doit échouer : le boot.
 *
 * ## Principe "fail fast"
 * Détecter l'état invalide le plus tôt possible et arrêter le processus.
 * Le démarrage tourne une seule fois par déploiement, avant tout trafic :
 * c'est l'endroit idéal pour valider la configuration.
 *
 * ## Sécurité
 * On ne logge JAMAIS la valeur d'un secret. On logge uniquement le **nom**
 * des variables présentes / manquantes / invalides. Les logs finissent dans
 * trop d'endroits (stdout, dashboard d'hébergeur, agrégateurs) pour qu'on s'y
 * autorise la moindre fuite.
 */

/**
 * Liste des variables d'environnement critiques, réellement consommées par le
 * code backend.
 *
 * NOTE: le ticket mentionnait aussi `PYTHON_ENGINE_URL`, mais ce nom n'existe
 * nulle part dans le code. Les services Python sont appelés via
 * `SHOPIFY_ENGINE_URL` et `EXTRACTOR_SERVICE_URL`, qui possèdent tous deux une
 * valeur par défaut (fallback) et ne font donc pas planter le démarrage si
 * absents. Ils ne sont pas considérés comme critiques ici.
 */
export const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "DATABASE_URL",
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SHOPIFY_TOKEN_ENCRYPTION_KEY",
  "OPENAI_API_KEY",
] as const;

/**
 * Résultat de la validation. Structure pure et testable :
 * - `ok`       : true si aucune variable manquante ni invalide.
 * - `missing`  : noms des variables absentes ou vides (après trim).
 * - `invalid`  : noms des variables présentes mais au format invalide.
 *
 * IMPORTANT: ne contient QUE des noms de variables, jamais de valeurs.
 */
export type EnvValidationResult = {
  ok: boolean;
  missing: string[];
  invalid: string[];
};

/**
 * Retourne les noms des variables critiques manquantes ou vides.
 *
 * Une variable est considérée comme manquante si :
 * - elle est absente de `env` (`undefined`), OU
 * - sa valeur est vide après `trim()` (ex. `""` ou `"   "`).
 *
 * On `trim()` volontairement : `!value` n'attrape pas `"   "` (espaces), qui
 * est pourtant une valeur inutilisable.
 *
 * @param requiredVars Noms des variables à vérifier.
 * @param env          Environnement à inspecter (défaut: `process.env`).
 * @returns Tableau des noms manquants (jamais de valeurs).
 */
export function getMissingEnvVars(
  requiredVars: readonly string[],
  env: NodeJS.ProcessEnv = process.env
): string[] {
  return requiredVars.filter((name) => {
    const value = env[name];
    return value === undefined || value.trim() === "";
  });
}

/**
 * Format base64 strict : uniquement les caractères de l'alphabet base64
 * standard (`A-Z a-z 0-9 + /`) suivis d'un padding optionnel `=` (0 à 2).
 * La longueur totale doit être un multiple de 4.
 */
const STRICT_BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Valide que `SHOPIFY_TOKEN_ENCRYPTION_KEY` est une **vraie** chaîne base64 qui
 * décode en **exactement** 32 bytes (AES-256 = 256 bits = 32 bytes).
 *
 * `Buffer.from(value, "base64")` est volontairement tolérant : il ignore
 * silencieusement les caractères invalides. Pour un fail-fast strict, on ne
 * peut pas s'y fier seul. On valide donc en plusieurs étapes :
 *   1. la valeur (trimée) est non vide ;
 *   2. elle respecte un format base64 strict (alphabet + padding + longueur %4) ;
 *   3. une fois décodée, elle fait exactement 32 bytes ;
 *   4. round-trip canonique : ré-encoder les bytes décodés redonne exactement
 *      la valeur normalisée. Cela rejette les chaînes que Buffer décode de
 *      façon laxiste mais qui ne sont pas une représentation base64 canonique.
 *
 * @param value Valeur brute de la variable.
 * @returns true si la clé est une base64 stricte décodant en 32 bytes, false sinon.
 */
export function validateShopifyTokenEncryptionKey(value: string): boolean {
  const normalized = value.trim();

  // 1. non vide
  if (normalized === "") return false;

  // 2. format base64 strict (longueur multiple de 4 + alphabet valide)
  if (normalized.length % 4 !== 0 || !STRICT_BASE64_PATTERN.test(normalized)) {
    return false;
  }

  // 3. exactement 32 bytes après décodage (AES-256)
  const decoded = Buffer.from(normalized, "base64");
  if (decoded.length !== 32) return false;

  // 4. round-trip canonique : la ré-encodage doit correspondre à l'entrée.
  return decoded.toString("base64") === normalized;
}

/**
 * Fonction PURE de validation : aucune écriture console, aucun `process.exit`.
 * Facile à tester unitairement.
 *
 * @param env Environnement à valider (défaut: `process.env`).
 * @returns Résultat structuré (noms uniquement, jamais de valeurs).
 */
export function validateRequiredEnv(
  env: NodeJS.ProcessEnv = process.env
): EnvValidationResult {
  const missing = getMissingEnvVars(REQUIRED_ENV_VARS, env);
  const invalid: string[] = [];

  // Validation de format : uniquement pour les variables présentes et non vides.
  // Une variable manquante est déjà dans `missing`, on ne la re-signale pas.
  const encKey = env["SHOPIFY_TOKEN_ENCRYPTION_KEY"];
  if (encKey !== undefined && encKey.trim() !== "") {
    if (!validateShopifyTokenEncryptionKey(encKey)) {
      invalid.push("SHOPIFY_TOKEN_ENCRYPTION_KEY");
    }
  }

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

/**
 * Point d'entrée appelé au démarrage du serveur.
 *
 * Comportement :
 * - Si la config est invalide → log clair (noms uniquement) + `process.exit(1)`.
 * - Si tout est valide → log court de confirmation, sans aucune valeur.
 *
 * À appeler le plus tôt possible dans `index.ts`, juste après `dotenv.config()`
 * et avant de monter les routes / `app.listen`.
 */
export function validateEnv(): void {
  const result = validateRequiredEnv(process.env);

  if (!result.ok) {
    console.error("[env] Fatal: invalid environment configuration.");
    console.error("[env] Missing:", result.missing.join(", ") || "none");
    console.error("[env] Invalid:", result.invalid.join(", ") || "none");
    console.error(
      "[env] Le serveur refuse de démarrer. Corrigez les variables ci-dessus."
    );
    process.exit(1);
  }

  console.log(
    `[env] Environment validation passed: ${REQUIRED_ENV_VARS.length} required variables present.`
  );
}
