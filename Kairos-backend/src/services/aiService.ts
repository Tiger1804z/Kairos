import OpenAI from "openai";
import { normalizeSqlResult, type NormalizedTable } from "../utils/sqlResultNormalizer";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default client; 

/**
 * ---------------------------------------------------------------------------
 * Kairos AI Service
 * ---------------------------------------------------------------------------
 * 3 gros usages:
 * 1) Finance (à partir d'agrégats) -> résumé court + questions
 * 2) Documents (à partir d'un extrait texte réel) -> résumé / analyse
 * 3) SQL generator (question -> SQL READ ONLY sécurisé)
 *
 * Règle d'or:
 * - On ne passe jamais tout un dataset énorme au LLM.
 * - On envoie seulement: agrégats + extrait réel + contraintes strictes.
 */

const cleanOneLine = (s: string) => s.replace(/\\n/g, " ").replace(/\n/g, " ").trim();

/**
 * ---------------------------------------------------------------------------
 * 1) Résumé financier court (à partir d'agrégats)
 * ---------------------------------------------------------------------------
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
Top catégories: ${input.topCategories.map((c) => `${c.category}: ${c.total}`).join(", ")}
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
  return cleanOneLine(text);
};

/**
 * ---------------------------------------------------------------------------
 * 2) Q&A financier (agrégats + question)
 * ---------------------------------------------------------------------------
 */
export const askKairos = async (input: {
  businessName: string;
  periodLabel: string;
  income: number | null;
  expenses: number | null;
  net: number | null;
  topCategories: Array<{ category: string; total: number }>;
  question: string;
  currencyLabel?: string; // ex: "$ CAD"
  rawData?: NormalizedTable; // ✅ AJOUT: données brutes
}) => {
  const currency = input.currencyLabel ?? "$ CAD";
  const fmt = (v: number | null) => (v === null ? "Non fourni" : String(v));

  // ✅ Formatter les données brutes si elles existent
  let rawDataSection = "";
  if (input.rawData && input.rawData.rows.length > 0) {
    const rows = input.rawData.rows.slice(0, 20); // Limiter à 20 lignes max pour ne pas surcharger le prompt
    // Le replacer BigInt est obligatoire: PostgreSQL retourne count()/sum() comme BigInt,
    // ce que JSON.stringify() ne peut pas sérialiser nativement — on le convertit en Number.
    rawDataSection = `
Données SQL retournées (${input.rawData.rows.length} lignes):
Colonnes: ${input.rawData.columns.join(", ")}

Extrait des données (max 20 lignes):
${JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? Number(v) : v), 2)}
`;
  }

  const prompt = `
Tu es Kairos, assistant financier.
Réponds en français.

Règles strictes:
- Pas de markdown, pas de **, pas de puces avec *
- 2 petits paragraphes max + ensuite 2 actions numérotées (1. / 2.)
- Ne pas inventer de chiffres: utiliser uniquement les données fournies ci-dessous
- Si des données SQL sont fournies, ANALYSE-LES pour répondre à la question
- IMPORTANT: si une valeur est "Non fourni", tu ne dois PAS conclure dessus
  (ex: ne pas dire "dépenses à zéro" ni calculer un bénéfice net)
- Tous les montants sont en ${currency}

Contexte:
Business: ${input.businessName}
Période: ${input.periodLabel}
Revenus: ${fmt(input.income)}
Dépenses: ${fmt(input.expenses)}
Résultat net: ${fmt(input.net)}
Top catégories: ${input.topCategories.map((c) => `${c.category}: ${c.total}`).join(", ")}
${rawDataSection}
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
  return cleanOneLine(text);
};

/**
 * ---------------------------------------------------------------------------
 * 3) Texte générique
 * ---------------------------------------------------------------------------
 */
export const askKairosText = async (prompt: string): Promise<string> => {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Tu es Kairos, un assistant analytique. Tu réponds uniquement à partir des données fournies.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  return completion.choices[0]?.message?.content ?? "";
};

/**
 * ---------------------------------------------------------------------------
 * 4) Documents (résumé à partir d'un extrait réel)
 * ---------------------------------------------------------------------------
 */
export const askKairosFromDocument = async (params: {
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  textSample: string;
}) => {
  const { fileName, fileType, fileSize, textSample } = params;

  const prompt = `
DOCUMENT
Nom: ${fileName}
Type: ${fileType ?? "unknown"}
Taille: ${fileSize ?? "unknown"} bytes

EXTRAIT RÉEL:
${textSample}

RÈGLES:
- Répondre en français
- 2 paragraphes maximum
- Puis 2 actions numérotées
- Aucun markdown
- Aucun chiffre inventé
- Si l'extrait est insuffisant, le dire clairement

TÂCHE:
Produire un résumé utile du document à partir de l'extrait fourni uniquement.
`.trim();

  const aiText = await askKairosText(prompt);
  return { aiText: cleanOneLine(aiText) };
};

/**
 * ---------------------------------------------------------------------------
 * 5) aiAsk wrapper (SQL -> normalisation -> agrégats -> réponse)
 * ---------------------------------------------------------------------------
 * FIX TS + FIX "dépenses à 0" :
 * - on ne met PAS expenses = 0 si on ne l'a pas calculé
 * - si on n'a que income, expenses/net restent null
 * - correction TS: key est toujours string (pas string|undefined)
 */
export const askKairosFromSql = async (input: {
  businessName: string;
  periodLabel: string;
  question: string;
  rawSqlResult: unknown;
  currencyLabel?: string;
}) => {
  const normalized: NormalizedTable = normalizeSqlResult(input.rawSqlResult);

  let income: number | null = null;
  let expenses: number | null = null;
  let net: number | null = null;

  const totals = normalized.summary?.numeric_totals ?? {};

  const getTotal = (key: string): number | null => {
    const v = (totals as Record<string, unknown>)[key];
    if (v === undefined || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const colsLower = normalized.columns.map((c) => c.toLowerCase());

  // --- CAS A: colonnes directes (par intent) ---
  if (colsLower.includes("total_income")) income = getTotal("total_income");
  if (colsLower.includes("total_expense")) expenses = getTotal("total_expense");

  // variantes éventuelles
  if (income === null && colsLower.includes("total_revenue")) income = getTotal("total_revenue");

  if (income !== null && expenses !== null) net = income - expenses;

  // --- CAS B: rows groupées par type ---
  const hasType = normalized.columns.includes("transaction_type");
  const amountCol =
    normalized.columns.find((c) => c === "total_amount") ??
    normalized.columns.find((c) => c === "total_income") ??
    normalized.columns.find((c) => c === "total_expense") ??
    normalized.columns.find((c) => c.startsWith("total_")) ??
    null;

  if ((income === null || expenses === null) && hasType && amountCol) {
    let inc = 0;
    let exp = 0;
    let sawIncome = false;
    let sawExpense = false;

    for (const r of normalized.rows) {
      const t = String((r as any)["transaction_type"] ?? "").toLowerCase();
      const v = Number((r as any)[amountCol] ?? 0);

      if (t === "income") {
        inc += v;
        sawIncome = true;
      }
      if (t === "expense") {
        exp += v;
        sawExpense = true;
      }
    }

    if (income === null && sawIncome) income = inc;
    if (expenses === null && sawExpense) expenses = exp;
    if (income !== null && expenses !== null) net = income - expenses;
  }

  // --- CAS C: fallback unique SUM(...) sans info de type ---
  // Important: ne JAMAIS "inventer" expenses=0
  if (income === null && expenses === null) {
    const keys = Object.keys(totals);
    if (keys.length > 0) {
      const key = keys[0] as string; // <= TS: key est string ici
      const total = getTotal(key);

      if (total !== null) {
        const k = key.toLowerCase();
        const q = input.question.toLowerCase();

        const wantsIncome =
          q.includes("revenu") || q.includes("income") || q.includes("sales") || q.includes("vente");
        const wantsExpense = q.includes("dépense") || q.includes("depense") || q.includes("expense");

        if (k.includes("expense") || k.includes("depense")) expenses = total;
        else if (k.includes("income") || k.includes("revenue") || k.includes("revenu")) income = total;
        else if (wantsExpense) expenses = total;
        else if (wantsIncome) income = total;
        else income = total; // total générique (sans conclure sur dépenses)
      }
    }
  }

  // Top categories (seulement si category + amountCol)
  const topCategories: Array<{ category: string; total: number }> = [];
  const hasCategory = normalized.columns.includes("category");
  if (hasCategory && amountCol) {
    for (const r of normalized.rows) {
      topCategories.push({
        category: String((r as any)["category"] ?? "unknown"),
        total: Number((r as any)[amountCol] ?? 0),
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
    rawData: normalized, // ✅ AJOUT: passer les données brutes
  });

  return { aiText, normalized, income, expenses, net, topCategories };
};

/**
 * ---------------------------------------------------------------------------
 * 6) SQL generator (question -> SQL READ ONLY sécurisé)
 * ---------------------------------------------------------------------------
 */
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
      ? `- Filtrer aussi transaction_date BETWEEN '${toISODate(input.start)}' AND '${toISODate(
          input.end
        )}' (inclusive)`
      : `- Aucun filtre de date si non fourni`;

  const intentRules = `
RÈGLES INTENT (très important): 
- Si l'intent = AGG_INCOME:
  -> Filtrer obligatoirement: transaction_type = 'income'
  -> Retourner: SUM(amount) as total_income
- Si l'intent = AGG_EXPENSES:
  -> Filtrer obligatoirement: transaction_type = 'expense'
  -> Retourner: SUM(amount) as total_expense
- Si l'intent = AGG_EXPENSES_BY_CATEGORY:
  -> Filtrer obligatoirement: transaction_type = 'expense'
  -> Retourner: category, SUM(amount) as total_expense
  -> GROUP BY category
  -> ORDER BY total_expense DESC
- Si l'intent = NET_INCOME_MINUS_EXPENSES:
  -> NE PAS retourner un seul SUM(amount)
  -> Retourner obligatoirement 2 colonnes:
     SUM(CASE WHEN transaction_type='income' THEN amount ELSE 0 END) as total_income
     SUM(CASE WHEN transaction_type='expense' THEN amount ELSE 0 END) as total_expense
- Si l'intent = LIST_TRANSACTIONS:
  -> Retourner une liste de transactions (id_transaction, transaction_date, transaction_type, amount, category)
  -> ORDER BY transaction_date DESC
- Si l'intent = BEST_CLIENT:
  -> Faire un LEFT JOIN public.clients c ON c.id_client = t.client_id AND c.business_id = ${input.businessId}
  -> ⚠️ INTERDIT: JOIN sur c.business_id = t.business_id (ce n'est PAS la clé de relation)
  -> Sélectionner: COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)) AS client_name, SUM(t.amount) AS total_revenue
  -> Filtrer: t.transaction_type = 'income'
  -> GROUP BY c.id_client, c.company_name, c.first_name, c.last_name
  -> ORDER BY total_revenue DESC
  -> LIMIT 5
`.trim();

  const prompt = `
Tu es Kairos, générateur SQL PostgreSQL.

OBJECTIF:
Retourner UNE requête SQL READ-ONLY correspondant à la question.

FORMAT OBLIGATOIRE:
- Tu dois répondre avec du JSON valide uniquement:
  {"sql":"select ... limit 200"}
- 1 seule clé: "sql"
- Aucun autre texte.

RÈGLES STRICTES (à respecter absolument):
- Uniquement SELECT (READ ONLY)
- AUCUN markdown, aucun backticks, aucun commentaire
- AUCUN ';'
- JOINs autorisés UNIQUEMENT avec la table "clients"
- Pour récupérer le nom du client: utiliser COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)) AS client_name
- AUCUN UNION, WITH
- AUCUNE sous-requête (pas de SELECT dans SELECT)

ALLOWLIST TABLES:
transactions, clients, documents, engagements, engagement_items, query_logs, reports, businesses
(ou avec prefix public.)

TENANT (OBLIGATOIRE):
- Si table = businesses: DOIT contenir "id_business = ${input.businessId}"
- Sinon: DOIT contenir "business_id = ${input.businessId}"

⚠️ LIMIT (ABSOLUMENT OBLIGATOIRE - TOUJOURS REQUIS):
- TOUJOURS ajouter LIMIT à la fin de CHAQUE requête
- Même pour SUM/COUNT/AVG → ajouter LIMIT 1
- LIMIT <= 200
- Exemples: "... LIMIT 1", "... LIMIT 10", "... LIMIT 100"
- ❌ INTERDIT d'oublier le LIMIT (requête rejetée sinon)

SCHÉMA transactions:
public.transactions(
  id_transaction,
  business_id,
  client_id,         -- FK vers clients.id_client (peut être NULL)
  transaction_date,
  transaction_type,  -- 'income' | 'expense'
  amount,
  category
)

SCHÉMA clients:
public.clients(
  id_client,
  business_id,
  first_name,        -- NULL si client importé via CSV
  last_name,         -- NULL si client importé via CSV
  company_name,      -- rempli pour les clients importés via CSV
  email,
  phone
)
-- Pour le nom du client: TOUJOURS utiliser COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)) AS client_name
-- JOIN: LEFT JOIN public.clients c ON c.id_client = t.client_id AND c.business_id = ${input.businessId}
  
INTENTION DÉTECTÉE:
${intent}

${intentRules}

CONTRAINTES DE PÉRIODE:
${dateRule}

RÈGLES DATES (si dates fournies):
- Si start/end fournis: ajouter transaction_date BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD'

RÉSULTATS:
- Colonnes explicites, alias clairs (snake_case)
- Toujours LIMIT <= 200

QUESTION UTILISATEUR:
"${input.question}"
`.trim();

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Tu génères du SQL PostgreSQL strict, lisible et sécurisé." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });

  const raw = (resp.choices[0]?.message?.content ?? "").trim();

  try {
    const obj = JSON.parse(raw);
    const sql = typeof obj?.sql === "string" ? obj.sql.trim() : "";
    return sql;
  } catch {
    return raw;
  }
};

const guessIntent = (q: string) => {
  const s = q.toLowerCase();

  if (s.includes("par catégorie") || s.includes("par categorie") || s.includes("revenue")) return "AGG_EXPENSES_BY_CATEGORY";
  if (s.includes("revenu") || s.includes("income")) return "AGG_INCOME";
  if (s.includes("dépense") || s.includes("depense") || s.includes("expense")) return "AGG_EXPENSES";
  if (s.includes("profit") || s.includes("net") || s.includes("bénéfice") || s.includes("benefice"))
    return "NET_INCOME_MINUS_EXPENSES";
  // Détecte les questions sur le meilleur/top client (en français et en anglais)
  if (
    (s.includes("meilleur") || s.includes("best") || s.includes("top")) &&
    (s.includes("client") || s.includes("customer"))
  ) return "BEST_CLIENT";
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

/**
 * ---------------------------------------------------------------------------
 * 7) Finance prompt builder (OPTION A - documents financiers)
 * ---------------------------------------------------------------------------
 */
export const buildFinancePrompt = (params: {
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  textSample: string;
}) => {
  const { fileName, fileType, fileSize, textSample } = params;

  return {
    system: `
Tu es un analyste financier senior.
Tu travailles UNIQUEMENT à partir des données fournies.
Tu ne dois JAMAIS inventer de chiffres, périodes, catégories ou conclusions.
Si une information est absente ou incertaine, indique-le clairement.
`.trim(),

    input: {
      file_name: fileName,
      file_type: fileType ?? "unknown",
      file_size_bytes: fileSize ?? null,
      text_sample: textSample,
    },

    rules: [
      "Répondre en français",
      "Maximum 2 courts paragraphes",
      "Aucune mise en forme markdown",
      "Aucun chiffre inventé",
      "Utiliser 'Non précisé' si l'information est absente",
      "Ne pas supposer le type de document sans preuve explicite",
    ],

    task: `
Analyse ce document financier et produis :

1) Identification
- Type de document (ex: état des résultats, bilan, tableau de flux de trésorerie)
- Période couverte
- Devise utilisée

2) Résumé financier
- Revenus
- Dépenses
- Résultat net
- Catégories principales mentionnées

3) Qualité des données
- Complètes / partielles / insuffisantes

4) Actions suggérées (1 à 3)

Si l'analyse est impossible, explique pourquoi (extrait trop court, tableau illisible, etc.).
`.trim(),
  };
};

/**
 * ---------------------------------------------------------------------------
 * 8) Wrapper qui envoie le buildFinancePrompt à askKairosText
 * ---------------------------------------------------------------------------
 */
export const askKairosFinanceFromDocument = async (params: {
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  textSample: string;
}) => {
  const promptObj = buildFinancePrompt(params);
  const aiText = await askKairosText(JSON.stringify(promptObj));
  return { aiText: cleanOneLine(aiText) };
};
