import prisma from "../prisma/prisma";
import type { TransactionType, PaymentMethod } from "../../generated/prisma/client";



// ============================================================================
// Synonymes pour normaliser les types et méthodes de paiement
// ============================================================================

const TYPE_SYNONYMS: Record<string, TransactionType> = {
    income: "income",
    revenue: "income",
    revenu: "income",
    entrée: "income",
    entree: "income",
    vente: "income",
    sale: "income",
    expense: "expense",
    dépense: "expense",
    depense: "expense",
    cost: "expense",
    sortie: "expense",
    achat: "expense",
};

const PAYMENT_SYNONYMS: Record<string, PaymentMethod> = {
    cash: "cash",
    espèces: "cash",
    especes: "cash",
    card: "card",
    carte: "card",
    credit: "card",
    debit: "card",
    transfer: "transfer",
    virement: "transfer",
    wire: "transfer",
    check: "check",
    chèque: "check",
    cheque: "check",
};

// ============================================================================
// Types
// ============================================================================

export interface MappedRow {
    date: string;
    type: string;
    amount: string;
    category?: string;
    client_name?: string;
    description?: string;
    payment_method?: string;
    reference_number?: string;
}

// ============================================================================
// Fonctions utilitaires
// ============================================================================

/** Applique le mapping : transforme les clés CSV en clés Kairos */
export function applyMapping(row: Record<string, string>, mappingDict: Record<string, string>): MappedRow {
    const result: Record<string, string> = {};
    for (const [csvCol, value] of Object.entries(row)) {
        const kairosField = mappingDict[csvCol];
        if (kairosField) {
            result[kairosField] = value;
        }
    }
    return result as unknown as MappedRow;
}

/** Parse une date dans les formats acceptés → Date ISO */
export function parseDate(value: string): Date | null {
    const trimmed = value.trim();

    // YYYY-MM-DD ou YYYY/MM/DD
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
        const d = new Date(`${isoMatch[1]}-${isoMatch[2]!.padStart(2, "0")}-${isoMatch[3]!.padStart(2, "0")}`);
        return isNaN(d.getTime()) ? null : d;
    }

    // DD/MM/YYYY
    const euMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (euMatch) {
        const d = new Date(`${euMatch[3]}-${euMatch[2]!.padStart(2, "0")}-${euMatch[1]!.padStart(2, "0")}`);
        return isNaN(d.getTime()) ? null : d;
    }

    return null;
}

/** Parse un montant en gérant virgules, espaces, points → number */
export function parseAmount(value: string): number | null {
    // enlever espaces et symboles monétaires
    let cleaned = value.trim().replace(/[\s$€CAD]/g, "");

    // format français : "1 234,56" → "1234.56"
    if (cleaned.includes(",")) {
        if (cleaned.includes(".")) {
            // virgule ET point → point = séparateur de milliers, virgule = décimal (ex: "1.234,56")
            cleaned = cleaned.replace(/\./g, "").replace(",", ".");
        } else {
            // virgule seule = décimal (ex: "1234,56")
            cleaned = cleaned.replace(",", ".");
        }
    }

    const num = parseFloat(cleaned);
    return isNaN(num) || num < 0 ? null : num;
}

/** Normalise le type vers l'enum TransactionType */
export function normalizeType(value: string): TransactionType | null {
    const normalized = value.toLowerCase().trim();
    return TYPE_SYNONYMS[normalized] ?? null;
}

/** Normalise la méthode de paiement vers l'enum PaymentMethod */
export function normalizePaymentMethod(value: string): PaymentMethod | null {
    const normalized = value.toLowerCase().trim();
    return PAYMENT_SYNONYMS[normalized] ?? "other";
}

/** Vérifie si une transaction similaire existe déjà (déduplication) */
export async function checkDuplicate(
    businessId: number,
    date: Date,
    amount: number,
    description?: string
): Promise<boolean> {
    const existing = await prisma.transaction.findFirst({
        where: {
            business_id: businessId,
            transaction_date: date,
            amount,
            ...(description ? { description: { equals: description, mode: "insensitive" as const } } : {}),
        },
    });
    return !!existing;
}

/** Trouve un client par nom ou le crée automatiquement (déduplication case-insensitive) */
export async function findOrCreateClient(businessId: number, clientName: string): Promise<number> {
    const trimmed = clientName.trim();

    // chercher un client existant (case-insensitive sur company_name)
    const existing = await prisma.client.findFirst({
        where: {
            business_id: businessId,
            company_name: { equals: trimmed, mode: "insensitive" as const },
        },
    });

    if (existing) return existing.id_client;

    // créer le client avec company_name
    const newClient = await prisma.client.create({
        data: {
            business_id: businessId,
            company_name: trimmed,
        },
    });

    return newClient.id_client;
}