
import client  from "./aiService" ;

const KAIROS_FIELDS = [ 
    "date",
    "type",
    "amount",
    "category",
    "client_name",
    "description",
    "payment_method",
    "reference_number"
    ] as const;

type KairosField = (typeof KAIROS_FIELDS)[number];

export interface ColumnMapping {
    csvColumn: string;
    kairosField: KairosField | null; // null si non mappé
    confidence:  "high" | "low" | "none"; // confiance du mapping
}

const SYNONYMS: Record<KairosField, string[]> = {
  date: ["date", "transaction_date", "trans_date", "dat", "fecha"],
  type: ["type", "transaction_type", "trans_type", "revenue", "income", "revenu", "entrée", "entree", "cost", "expense", "dépense", "depense", "sortie"],
  amount: ["amount", "montant", "total", "sum", "somme", "prix", "price", "value", "valeur"],
  category: ["category", "catégorie", "categorie", "cat", "type_depense", "type_revenu"],
  client_name: ["client", "client_name", "customer", "nom_client", "customer_name", "nom"],
  description: ["description", "desc", "libellé", "libelle", "label", "memo", "note", "details"],
  payment_method: ["payment", "payment_method", "mode_paiement", "paiement", "method", "moyen_paiement"],
  reference_number: ["reference", "ref", "reference_number", "invoice", "facture", "numero", "num", "invoice_number"],
};

export function autoMapColumns(csvHeaders: string[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    const useFields = new Set<KairosField>();

    for (const headers of csvHeaders) {
        const normalized = headers.toLowerCase().trim().replace(/[\s-]+/g, "_"); // normaliser le header
        let bestMatch: KairosField | null = null;
        let confidence: "high" | "low" | "none" = "none";

        for (const [field, synonyms] of Object.entries(SYNONYMS) as [KairosField, string[]][]) {
            if  (useFields.has(field)) continue; // déjà utilisé
            // match exact (confiance haute)
            if (synonyms.includes(normalized)) {
                bestMatch = field;
                confidence = "high";
                break; 
            }
            
            // ici normalized = notre headers csv et s = les synonymes de notre champs kairos
            //  on check si l'un contient l'autre pour catch des cas comme "transaction_date" vs "date_transaction" ou "amount_usd" vs "amount"
            // cest low confidence car c'est pas un match exact
            if (synonyms.some((s) => normalized.includes(s) || s.includes(normalized))) {
                bestMatch = field;
                confidence = "low";
            }
        }
        if (bestMatch) useFields.add(bestMatch);

        mappings.push({
            csvColumn: headers,
            kairosField: bestMatch,
            confidence,
        });
    }
    return mappings;
}

export function getMissingRequiredFields(mappings: ColumnMapping[]): KairosField[] {
    // les champs obligatoires pour importer
    const required: KairosField[] = ["date", "type", "amount"];
    // on extrait les champs mappés
    // .filter(Boolean) pour ne garder que ceux qui sont mappés (non null) 
    // et on les met dans un Set pour une recherche rapide
    const mapped = new Set(mappings.map((m) => m.kairosField).filter(Boolean));
    return required.filter((field) => !mapped.has(field));
}

export function getUnmappedColumns(mappings: ColumnMapping[]):  ColumnMapping[] { 
    // on filtre les colonnes non mappées
    return mappings.filter((m) => m.kairosField === null);
}


/**
 * Appel à OpenAI pour mapper les colonnes que l'heuristique n'a pas reconnues.
 * On envoie UNIQUEMENT les headers non mappés + 5 lignes d'échantillon.
 * L'IA ne voit jamais la base de données ni les données complètes.
 */
export async function aiMapColumns(
    unmappedHeaders: string[],
    sampleRows: Record<string, string>[]
): Promise<ColumnMapping[]> {
    // on prend max 5 lignes pour limiter ce qu'on envoie à l'IA
    const sample = sampleRows.slice(0, 5); 

    // prompt structuré : on demande un JSON strict, pas de blabla
    const prompt = `Tu es un assistant de mapping de données CSV.

Voici des colonnes CSV non reconnues avec un échantillon de données.
Associe chaque colonne à UN des champs Kairos suivants, ou "null" si aucun ne correspond.

Champs Kairos disponibles: date, type (income/expense), amount, category, client_name, description, payment_method, reference_number

Colonnes non reconnues: ${JSON.stringify(unmappedHeaders)}

Échantillon (5 premières lignes):
${JSON.stringify(sample, null, 2)}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication:
[
  { "csvColumn": "nom_colonne", "kairosField": "champ_kairos_ou_null" }
]`;

    // appel OpenAI avec temperature 0 pour des résultats precis (pas de créativité)
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
    });

    // on récupère la réponse texte de l'IA, fallback sur "[]" si vide
    const content = response.choices[0]?.message?.content?.trim() ?? "[]";

    try {
        // on parse le JSON retourné par l'IA
        const parsed = JSON.parse(content) as Array<{ csvColumn: string; kairosField: string | null }>;

        return parsed.map((item) => ({
            csvColumn: item.csvColumn,
            // validation : on vérifie que le champ suggéré existe bien dans KAIROS_FIELDS
            // si l'IA hallucine un champ qui n'existe pas → null
            kairosField: KAIROS_FIELDS.includes(item.kairosField as any) ? (item.kairosField as KairosField) : null,
            // confidence "low" car c'est une suggestion IA, pas un match exact
            confidence: item.kairosField ? ("low" as const) : ("none" as const),
        }));
    } catch {
        // si le JSON de l'IA est invalide (malformé, markdown, etc.)
        // on retourne tout en "none" plutôt que de crasher
        return unmappedHeaders.map((h) => ({
            csvColumn: h,
            kairosField: null,
            confidence: "none" as const,
        }));
    }
}




