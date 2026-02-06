/**
 * sqlGuard.ts
 *
 * Rôle:
 * - Sécuriser TOUT SQL généré par l’IA
 * - Autoriser uniquement du READ-ONLY strict
 * - Bloquer toute tentative de contournement
 *
 * Version:
 * - V2 (toujours restrictive, mais multi-tables)
 * - Allowlist tables + tenant filter obligatoire
 * - LIMIT obligatoire (<= 200)
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
  return sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
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
// Normalisation principale
//////////////////////////////

const normalize = (sql: string) =>
  sql
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

//////////////////////////////
// Extract helpers
//////////////////////////////

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

//////////////////////////////
// Guard principal
//////////////////////////////

export const isSafeSQL = (sql: string, businessId: number): boolean => {
  if (!sql) return false;
  if (!Number.isFinite(businessId) || businessId <= 0) return false;

  // 1) commentaires -> rejet (même si strip pourrait les enlever)
  if (/--|\/\*/.test(sql)) return false;

  // 2) normalisation
  const noComments = stripComments(sql);
  const ws = normalizeWhitespace(noComments);
  const cleaned = normalize(ws);

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

    // Memo: complexité/contournement (V2 toujours strict)
    /\bunion\b/,
    /\bwith\b/,
    /\bpg_sleep\b/,
    /\binformation_schema\b/,
    /\bpg_catalog\b/,

    // Memo: sous-requêtes (bloque "select ... (select ...)")
    /\(\s*select\b/,
    /\bselect\b.*\bselect\b/, // rough mais efficace pour un guard strict
  ];

  if (forbiddenPatterns.some((re) => re.test(cleaned))) return false;

  // Memo: allowlist tables (multi-tenant)
  const fromTable = extractFromTable(cleaned);
  if (!fromTable) return false;

  const ALLOWED_TABLES = new Set([
    "transactions",
    "public.transactions",
    "clients",
    "public.clients",
    "documents",
    "public.documents",
    "engagements",
    "public.engagements",
    "engagement_items",
    "public.engagement_items",
    "query_logs",
    "public.query_logs",
    "reports",
    "public.reports",
    "businesses",
    "public.businesses",
  ]);

  if (!ALLOWED_TABLES.has(fromTable)) return false;

  // Memo: tables qui DOIVENT avoir business_id
  const TABLES_REQUIRE_BUSINESS_ID = new Set([
    "transactions",
    "public.transactions",
    "clients",
    "public.clients",
    "documents",
    "public.documents",
    "engagements",
    "public.engagements",
    "engagement_items",
    "public.engagement_items",
    "query_logs",
    "public.query_logs",
    "reports",
    "public.reports",
  ]);

  // Memo: table businesses -> filtre id_business obligatoire
  const TABLES_REQUIRE_ID_BUSINESS = new Set(["businesses", "public.businesses"]);

  // Memo: exiger tenant filter
  if (TABLES_REQUIRE_BUSINESS_ID.has(fromTable)) {
    // accepte "business_id = 4" ou "business_id=4"
    const businessFilter = new RegExp(`\\bbusiness_id\\s*=\\s*${businessId}\\b`);
    if (!businessFilter.test(cleaned)) return false;
  }

  if (TABLES_REQUIRE_ID_BUSINESS.has(fromTable)) {
    const idBusinessFilter = new RegExp(`\\bid_business\\s*=\\s*${businessId}\\b`);
    if (!idBusinessFilter.test(cleaned)) return false;
  }

  // Memo: exiger LIMIT <= 200
  const limit = extractLimit(cleaned);
  if (limit === null) return false;
  if (limit <= 0 || limit > 200) return false;

  return true;
};
