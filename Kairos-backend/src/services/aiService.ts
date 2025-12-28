import OpenAI from "openai";
import { normalizeSqlResult, type NormalizedTable } from "../utils/sqlResultNormalizer";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Ici on envoie juste des agrégats (pas besoin d'envoyer 200 transactions).
 * C'est plus safe + plus rapide.
 */
export const generateShortFinanceSummary = async (input: {
  businessName: string;
  periodLabel: string;
  income: number;
  expenses: number;
  net: number;
  topCategories: Array<{ category: string; total: number }>;
}) => {
  const prompt = `
Tu es Kairos, assistant financier.
Réponds en FRANÇAIS.
IMPORTANT:
- Texte simple (pas de markdown, pas de **, pas de puces avec *)
- Pas de "\\n" visibles dans la réponse
- 2 petits paragraphes + ensuite 2 recommandations numérotées "1." et "2."
- Tous les montants sont en dollars canadiens ($ CAD)

Business: ${input.businessName}
Période: ${input.periodLabel}
Revenus: ${input.income}
Dépenses: ${input.expenses}
Net: ${input.net}
Top catégories: ${input.topCategories.map(c => `${c.category}: ${c.total}`).join(", ")}
`.trim();

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Tu es un assistant financier clair, concis, pratique." },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
  });

  const text = resp.choices[0]?.message?.content ?? "Aucun résumé généré.";
  return text.replace(/\\n/g, " ").replace(/\n/g, " ").trim();
};

export const askKairos = async (input: {
  businessName: string;
  periodLabel: string;
  income: number;
  expenses: number;
  net: number;
  topCategories: Array<{ category: string; total: number }>;
  question: string;
  currencyLabel?: string; // ex: "$ CAD"
}) => {
  const currency = input.currencyLabel ?? "$ CAD";

  const prompt = `
Tu es Kairos, assistant financier.
Réponds en français.

Règles strictes:
- Pas de markdown, pas de **, pas de puces avec *
- 2 petits paragraphes max + ensuite 2 actions numérotées (1. / 2.)
- Ne pas inventer de chiffres: utiliser uniquement les données fournies
- Tous les montants sont en ${currency}

Contexte:
Business: ${input.businessName}
Période: ${input.periodLabel}
Revenus: ${input.income}
Dépenses: ${input.expenses}
Net: ${input.net}
Top catégories: ${input.topCategories.map(c => `${c.category}: ${c.total}`).join(", ")}

Question utilisateur: ${input.question}
`.trim();

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Assistant financier clair, concis, pratique. Ne pas halluciner." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  const text = resp.choices[0]?.message?.content ?? "Aucune réponse générée.";
  return text.replace(/\\n/g, " ").replace(/\n/g, " ").trim();
};

/**
 * Wrapper pour aiAsk
 * - Prend le résultat brut SQL (unknown)
 * - Normalise
 * - Extrait des agrégats (income/expense/net + top categories)
 * - Appelle askKairos
 */
export const askKairosFromSql = async (input: {
  businessName: string;
  periodLabel: string;
  question: string;
  rawSqlResult: unknown;
  currencyLabel?: string;
}) => {
  const normalized: NormalizedTable = normalizeSqlResult(input.rawSqlResult);

  let income = 0;
  let expenses = 0;

  const hasType = normalized.columns.includes("transaction_type");
  const amountCol =
    normalized.columns.find((c) => c === "total_amount") ??
    normalized.columns.find((c) => c === "total_expense") ??   // utile pour ta query category
    normalized.columns.find((c) => c === "total_amount") ??
    normalized.columns.find((c) => c.startsWith("total_")) ??
    null;

  if (hasType && amountCol) {
    for (const r of normalized.rows) {
      const t = String(r["transaction_type"] ?? "").toLowerCase();
      const v = Number(r[amountCol] ?? 0);

      if (t === "income") income += v;
      if (t === "expense") expenses += v;
    }
  } else {
    const totals = normalized.summary?.numeric_totals ?? {};
    const firstTotalKey = Object.keys(totals)[0];
    if (firstTotalKey) {
      const total = Number(totals[firstTotalKey] ?? 0);
      if (input.question.toLowerCase().includes("dépense") || input.question.toLowerCase().includes("depense")) {
        expenses = total;
      }
    }
  }

  const net = income - expenses;

  const topCategories: Array<{ category: string; total: number }> = [];
  const hasCategory = normalized.columns.includes("category");

  if (hasCategory && amountCol) {
    for (const r of normalized.rows) {
      topCategories.push({
        category: String(r["category"] ?? "unknown"),
        total: Number(r[amountCol] ?? 0),
      });
    }
    topCategories.sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    topCategories.splice(5);
  }

  const aiText = await askKairos({
    businessName: input.businessName,
    periodLabel: input.periodLabel,
    income,
    expenses,
    net,
    topCategories,
    question: input.question,
    currencyLabel: input.currencyLabel ?? "$ CAD",
  });

  return { aiText, normalized, income, expenses, net, topCategories };
};

type SqlGenInput = {
  question: string;
  businessId: number;
  start?: Date | null;
  end?: Date | null;
};

export const generateSQLFromQuestion = async (input: SqlGenInput) => {
  const intent = guessIntent(input.question);

  const dateRule =
    input.start && input.end
      ? `- Filtrer aussi transaction_date BETWEEN '${toISODate(input.start)}' AND '${toISODate(input.end)}' (inclusive)`
      : `- Aucun filtre de date si non fourni`;

  const prompt = `
Tu es Kairos, générateur SQL PostgreSQL.

OBJECTIF:
Retourner UNE requête SQL READ-ONLY correspondant à la question.

RÈGLES STRICTES (à respecter absolument):
- SQL READ ONLY
- Uniquement SELECT
- AUCUN texte autour, aucun markdown, aucun commentaire
- AUCUN ';'
- AUCUN JOIN, UNION, WITH
- Table autorisée: public.transactions uniquement
- DOIT contenir: business_id = ${input.businessId}
- DOIT contenir: LIMIT 50

SCHÉMA:
public.transactions(
  id_transaction,
  business_id,
  transaction_date,
  transaction_type,  -- 'income' | 'expense'
  amount,
  category
)

INTENTION DÉTECTÉE:
${intent}

CONTRAINTES DE PÉRIODE:
${dateRule}

RÉSULTATS:
- Colonnes explicites, alias clairs (snake_case)
- Si agrégation: utiliser SUM(amount)
- Si groupement: GROUP BY la colonne demandée
- Toujours LIMIT 50

QUESTION UTILISATEUR:
"${input.question}"
`.trim();

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Tu génères du SQL PostgreSQL strict et sécurisé." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });

  return (resp.choices[0]?.message?.content ?? "").trim();
};

const guessIntent = (q: string) => {
  const s = q.toLowerCase();

  if (s.includes("par catégorie") || s.includes("par categorie")) return "AGG_EXPENSES_BY_CATEGORY";
  if (s.includes("revenu") || s.includes("income")) return "AGG_INCOME";
  if (s.includes("dépense") || s.includes("depense") || s.includes("expense")) return "AGG_EXPENSES";
  if (s.includes("profit") || s.includes("net") || s.includes("bénéfice") || s.includes("benefice"))
    return "NET_INCOME_MINUS_EXPENSES";
  if (s.includes("top") || s.includes("plus") || s.includes("meilleur")) return "TOP_CATEGORIES_OR_BIGGEST";
  if (s.includes("liste") || s.includes("transactions") || s.includes("détails") || s.includes("details"))
    return "LIST_TRANSACTIONS";
  return "GENERIC_SELECT";
};

const toISODate = (d: Date) => {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
