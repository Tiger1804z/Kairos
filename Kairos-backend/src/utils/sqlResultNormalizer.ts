// src/utils/sqlResultNormalizer.ts

/**
 * Memo: Normalization SQL result
 * Objectif: transformer un résultat brut (unknown) en structure stable:
 * - columns: string[]
 * - rows: Array<Record<string, any>>
 * - summary: (row_count, numeric_totals, numeric_avgs, top_rows)
 * - insights: string[]
 *
 * Ça sert même sans front:
 * - reports.content stable et comparable
 * - debug/logs plus propres
 * - plus tard: AI explanation / PDF export / UI table directe
 */

export type NormalizedTable = {
  columns: string[];
  rows: Array<Record<string, any>>;
  summary: {
    row_count: number;
    numeric_totals: Record<string, number>;
    numeric_avgs: Record<string, number>;
    top_rows: Array<Record<string, any>>;
  };
  insights: string[];
};

// ---------------------------
// Memo: helpers type guards
// ---------------------------
const isPlainObject = (v: unknown): v is Record<string, any> => {
  return typeof v === "object" && v !== null && !Array.isArray(v);
};

const isArrayOfPlainObjects = (v: unknown): v is Array<Record<string, any>> => {
  return Array.isArray(v) && v.every(isPlainObject);
};

// Memo: tenter de convertir en number (support Decimal string, number, etc.)
const toNumber = (v: any): number | null => {
  if (v === null || v === undefined) return null;

  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null;
  }

  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  // Memo: Prisma Decimal parfois a .toString()
  if (typeof v === "object" && v !== null) {
    if (typeof (v as any).toNumber === "function") {
      const n = (v as any).toNumber();
      return typeof n === "number" && Number.isFinite(n) ? n : null;
    }
    if (typeof (v as any).toString === "function") {
      const n = Number((v as any).toString());
      return Number.isFinite(n) ? n : null;
    }
  }

  return null;
};

// Memo: choisir colonnes = union des keys
const extractColumns = (rows: Array<Record<string, any>>): string[] => {
  const set = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) set.add(k);
  }
  return [...set];
};

const pickTopRows = (
  rows: Array<Record<string, any>>,
  columns: string[]
): Array<Record<string, any>> => {
  // Memo: choisir une "meilleure colonne numérique" pour trier les rows
  const numericCols = columns.filter((c) => {
    // Memo: au moins une valeur convertible en number dans cette colonne
    return rows.some((r) => toNumber(r[c]) !== null);
  });

  if (numericCols.length === 0) {
    // Memo: si aucune colonne numérique, juste retourner 5 premières rows
    return rows.slice(0, 5);
  }

  // Memo: bestCol ne doit jamais être undefined
  let bestCol: string = numericCols[0]!;

  // Memo: scoring = max abs value observée
  let bestScore = -Infinity;

  for (const c of numericCols) {
    let maxAbs = 0;
    for (const r of rows) {
      const n = toNumber(r[c]);
      if (n !== null) maxAbs = Math.max(maxAbs, Math.abs(n));
    }
    if (maxAbs > bestScore) {
      bestScore = maxAbs;
      bestCol = c;
    }
  }

  // Memo: tri décroissant sur abs(bestCol)
  const sorted = [...rows].sort((a, b) => {
    const an = toNumber(a[bestCol]) ?? 0;
    const bn = toNumber(b[bestCol]) ?? 0;
    return Math.abs(bn) - Math.abs(an);
  });

  return sorted.slice(0, 5);
};

const buildInsights = (
  rows: Array<Record<string, any>>,
  columns: string[]
): string[] => {
  const insights: string[] = [];

  // Memo: pattern 1 => category + total_* (ex: "category", "total_expense" / "total_amount")
  const hasCategory = columns.includes("category");
  const totalCol =
    columns.find((c) => c === "total_amount") ??
    columns.find((c) => c.startsWith("total_")) ??
    null;

  if (hasCategory && totalCol) {
    const sortable = rows
      .map((r) => ({
        category: String(r["category"] ?? "unknown"),
        total: toNumber(r[totalCol]) ?? 0,
      }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

    if (sortable.length > 0) {
      // Memo: TS-safe: on re-check et on assume non-null
      const top = sortable[0]!;
      const totalAbs = sortable.reduce((acc, x) => acc + Math.abs(x.total), 0);

      // Memo: share seulement si totalAbs > 0
      const share =
        totalAbs > 0 ? Math.round((Math.abs(top.total) / totalAbs) * 100) : null;

      if (share !== null) {
        insights.push(
          `Catégorie dominante: ${top.category} (${top.total}) ~ ${share}% du total.`
        );
      } else {
        insights.push(`Catégorie dominante: ${top.category} (${top.total}).`);
      }
    }
  }

  // Memo: pattern 2 => transaction_type + total_amount (income/expense)
  const hasType = columns.includes("transaction_type");
  const amountCol =
    columns.find((c) => c === "total_amount") ??
    columns.find((c) => c.startsWith("total_")) ??
    null;

  if (hasType && amountCol) {
    let income = 0;
    let expense = 0;

    for (const r of rows) {
      const type = String(r["transaction_type"] ?? "");
      const val = toNumber(r[amountCol]) ?? 0;
      if (type === "income") income += val;
      if (type === "expense") expense += val;
    }

    const net = income - expense;
    if (income !== 0 || expense !== 0) {
      insights.push(`Résumé: revenus=${income}, dépenses=${expense}, net=${net}.`);
    }
  }

  return insights;
};

// ---------------------------
// Memo: MAIN
// ---------------------------
export const normalizeSqlResult = (raw: unknown): NormalizedTable => {
  // Memo: si pas array-of-objects => retourner structure vide mais stable
  if (!isArrayOfPlainObjects(raw)) {
    return {
      columns: [],
      rows: [],
      summary: {
        row_count: 0,
        numeric_totals: {},
        numeric_avgs: {},
        top_rows: [],
      },
      insights: [],
    };
  }

  const rows = raw;
  const columns = extractColumns(rows);

  // Memo: totals & counts par colonne numérique
  const numericTotals: Record<string, number> = {};
  const numericCounts: Record<string, number> = {};

  for (const c of columns) {
    for (const r of rows) {
      const n = toNumber(r[c]);
      if (n === null) continue;

      numericTotals[c] = (numericTotals[c] ?? 0) + n;
      numericCounts[c] = (numericCounts[c] ?? 0) + 1;
    }
  }

  // Memo: avgs (TS-safe: si count absent => 0)
  const numericAvgs: Record<string, number> = {};
  for (const c of Object.keys(numericTotals)) {
    const total = numericTotals[c] ?? 0; // Memo: safe
    const cnt = numericCounts[c] ?? 0;   // Memo: safe
    const avg = cnt > 0 ? total / cnt : 0;
    numericAvgs[c] = Number(avg.toFixed(2));
  }


  const topRows = pickTopRows(rows, columns);
  const insights = buildInsights(rows, columns);

  return {
    columns,
    rows,
    summary: {
      row_count: rows.length,
      numeric_totals: numericTotals,
      numeric_avgs: numericAvgs,
      top_rows: topRows,
    },
    insights,
  };
};
