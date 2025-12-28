/**
 * sqlGuard.ts
 *
 * Rôle:
 * - Sécuriser TOUT SQL généré par l’IA
 * - Autoriser uniquement du READ-ONLY strict
 * - Bloquer toute tentative de contournement
 *
 * Version:
 * - V1 volontairement restrictive
 * - Une seule table autorisée: public.transactions
 */

//////////////////////////////
// Helpers internes
//////////////////////////////

/**
 * Memo:
 * - Supprime commentaires SQL
 * - Si l’IA en génère → rejet direct
 */
const stripComments = (sql: string): string => {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
};

/**
 * Memo:
 * - Normalisation whitespace
 * - Facilite regex et sécurité
 */
const normalizeWhitespace = (sql: string): string => {
  return sql.replace(/\s+/g, " ").trim();
};

//////////////////////////////
// Guard principal
//////////////////////////////

export const isSafeSQL = (sql: string, businessId: number): boolean => {
  if (!sql) return false;

  const cleaned = normalize(sql);

  // Memo: doit commencer par SELECT (CTE WITH interdit pour éviter contournements)
  if (!cleaned.startsWith("select ")) return false;

  // Memo: refuser multi-statement
  if (cleaned.includes(";")) return false;

  // Memo: mots clés dangereux / contournements
  const forbiddenPatterns: RegExp[] = [
    /\binsert\b/,
    /\bupdate\b/,
    /\bdelete\b/,
    /\bdrop\b/,
    /\balter\b/,
    /\btruncate\b/,
    /\bcreate\b/,
    /\bgrant\b/,
    /\brevoke\b/,
    /\bcopy\b/,
    /\bexecute\b/,
    /\bcall\b/,
    /\btransaction\b/, // Memo: "transaction" (SQL) ≠ "transactions" (table)
    /\bcommit\b/,
    /\brollback\b/,

    // Memo: complexité/contournement
    /\bunion\b/,
    /\bjoin\b/,
    /\bwith\b/,
    /\bpg_sleep\b/,
    /\binformation_schema\b/,
    /\bpg_catalog\b/,

    // Memo: sous-requêtes (bloque "select ... (select ...)")
    /\(\s*select\b/,
    /\bselect\b.*\bselect\b/, // rough but efficace pour un v1 strict
    /--/,
    /\/\*/,
  ];

  if (forbiddenPatterns.some((re) => re.test(cleaned))) return false;

  // Memo: allowlist stricte: une seule table permise
  const fromTable = extractFromTable(cleaned);
  if (!fromTable) return false;

  const allowed = new Set(["public.transactions", "transactions"]);
  if (!allowed.has(fromTable)) return false;

  // Memo: exiger business_id = <businessId>
  // - accepte "business_id = 4" ou "business_id=4"
  // - refuse si absent
  const businessFilter = new RegExp(`\\bbusiness_id\\s*=\\s*${businessId}\\b`);
  if (!businessFilter.test(cleaned)) return false;

  // Memo: exiger LIMIT <= 50
  const limit = extractLimit(cleaned);
  if (limit === null) return false;
  if (limit <= 0 || limit > 50) return false;

  return true;
};

const normalize = (sql: string) =>
  sql
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const extractFromTable = (cleaned: string): string | null => {
  // Memo: repère "from <table>" (simple)
  // - accepte "from public.transactions" ou "from transactions"
  const m = cleaned.match(/\bfrom\s+([a-z0-9_."]+)\b/);
  if (!m?.[1]) return null;

  return m[1].replace(/"/g, "");
};

const extractLimit = (cleaned: string): number | null => {
  const m = cleaned.match(/\blimit\s+(\d+)\b/);
  if (!m?.[1]) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
};