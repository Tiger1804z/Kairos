import prisma from "../prisma/prisma";
import type { ColumnMapping } from "./columnMappingService";

// on importe toutes les fonctions utilitaires depuis importHelpers
// ca garde le service clean : ici on gere juste le flow, la logique est dans les helpers
import {
    applyMapping,
    parseDate,
    parseAmount,
    normalizeType,
    normalizePaymentMethod,
    checkDuplicate,
    findOrCreateClient,
} from "../utils/importHelpers";

// ============================================================================
// Types
// ============================================================================

// le resultat retourne apres un import complet
// on a les compteurs + la liste des erreurs pour afficher dans le frontend
interface ImportResult {
    jobId: string;
    insertedCount: number;
    skippedCount: number;
    errorCount: number;
    errors: Array<{ rowNumber: number; message: string }>;
}


// ============================================================================
// Fonction principale d'import
// ============================================================================

/**
 * Importe des transactions a partir des lignes CSV deja parsees.
 *
 * Le flow :
 * 1. Creer un job d'import en base (pour tracker le progres)
 * 2. Pour chaque ligne : mapper → valider → normaliser → inserer
 * 3. Mettre a jour le job avec les compteurs finaux
 * 4. Sauvegarder les erreurs en base pour les afficher au user
 */
export async function importTransactions(
    businessId: number,
    rows: Record<string, string>[],
    mapping: ColumnMapping[],
    filename: string
): Promise<ImportResult> {
    // creer le job d'import dans la base avec status "PROCESSING"
    // ca nous donne un id pour tracker cette import
    const job = await prisma.importJob.create({
        data: {
            id_business: businessId,
            filename,
            status: "PROCESSING",
        },
    });

    // on va remplir ces tableaux/compteurs au fur et a mesure qu'on traite les lignes
    const errors: Array<{ rowNumber: number; message: string }> = [];
    let insertedCount = 0;
    let skippedCount = 0;

    // construire un dict csvColumn => kairosField pour un lookup facile
    // ex: { "Revenue": "type", "Montant": "amount", "Date": "date" }
    const mappingDict: Record<string, string> = {};
    for (const m of mapping) {
        if (m.kairosField) {
            mappingDict[m.csvColumn] = m.kairosField;
        }
    }

    // on boucle sur chaque ligne du CSV
    for (let i = 0; i < rows.length; i++) {
        // +2 car : ligne 1 = header (pas dans rows), et on commence a compter a 1 pas 0
        const rowNumber = i + 2;
        const rawRow = rows[i]!;

        try {
            // etape 1 : appliquer le mapping
            // on transforme les cles CSV (ex: "Revenue") en cles Kairos (ex: "type")
            const mapped = applyMapping(rawRow, mappingDict);

            // etape 2 : verifier que les 3 champs obligatoires sont la
            if (!mapped.date || !mapped.type || !mapped.amount) {
                errors.push({ rowNumber, message: "Champs obligatoire manquant (date, type ou amount)." });
                skippedCount++;
                continue; // on passe a la ligne suivante
            }

            // etape 3 : normaliser la date (gere plusieurs formats comme DD/MM/YYYY, YYYY-MM-DD etc)
            const date = parseDate(mapped.date);
            if (!date) {
                errors.push({ rowNumber, message: `Format de date invalide: ${mapped.date}` });
                skippedCount++;
                continue;
            }

            // etape 4 : normaliser le montant (gere virgules, espaces, symboles $€)
            const amount = parseAmount(mapped.amount);
            if (amount === null) {
                errors.push({ rowNumber, message: `Format de montant invalide: ${mapped.amount}` });
                skippedCount++;
                continue;
            }

            // etape 5 : normaliser le type (income/expense + synonymes comme "revenu", "depense" etc)
            const transactionType = normalizeType(mapped.type);
            if (!transactionType) {
                errors.push({ rowNumber, message: `Type de transaction invalide: "${mapped.type}" (attendu: "income" ou "expense")` });
                skippedCount++;
                continue;
            }

            // etape 6 : normaliser le payment method si fourni (sinon null)
            const paymentMethod = mapped.payment_method ? normalizePaymentMethod(mapped.payment_method) : null;

            // etape 7 : normaliser la categorie en lowercase, fallback "other" si vide
            const category = mapped.category ? mapped.category.toLowerCase().trim() || "other" : null;

            // etape 8 : checker si cette transaction existe deja (meme date + montant + description)
            // ca evite les doublons si le user reimporte le meme fichier
            const isDuplicate = await checkDuplicate(businessId, date, amount, mapped.description);
            if (isDuplicate) {
                skippedCount++;
                continue;
            }

            // etape 9 : si un client_name est fourni, on le cherche ou on le cree
            // ex: "Acme Corp" → soit on trouve le client existant, soit on le cree automatiquement
            let clientId: number | null = null;
            if (mapped.client_name) {
                clientId = await findOrCreateClient(businessId, mapped.client_name);
            }

            // etape 10 : inserer la transaction dans la base
            await prisma.transaction.create({
                data: {
                    business_id: businessId,
                    transaction_type: transactionType,
                    amount,
                    transaction_date: date,
                    category,
                    description: mapped.description || null,
                    payment_method: paymentMethod,
                    reference_number: mapped.reference_number || null,
                    client_id: clientId,
                },
            });
            insertedCount++;

        } catch (err: any) {
            // si une ligne crash pour une raison pas prevue, on log l'erreur et on continue
            errors.push({ rowNumber, message: err.message || "Erreur inconnue" });
        }
    }

    // toutes les lignes sont traitees, on met a jour le job avec les resultats
    // FAILED = aucune ligne inseree + des erreurs, sinon COMPLETED (meme si quelques erreurs)
    const finalStatus = errors.length > 0 && insertedCount === 0 ? "FAILED" : "COMPLETED";
    await prisma.importJob.update({
        where: { id: job.id },
        data: {
            status: finalStatus,
            inserted_count: insertedCount,
            skipped_count: skippedCount,
            error_count: errors.length,
        },
    });

    // sauvegarder les erreurs en base pour que le frontend puisse les afficher
    // on garde aussi la ligne brute (raw_row_json) pour que le user puisse voir ce qui a foiré
    if (errors.length > 0) {
        await prisma.importRowError.createMany({
            data: errors.map((e) => ({
                job_id: job.id,
                row_number: e.rowNumber,
                message: e.message,
                raw_row_json: rows[e.rowNumber - 2] ?? {},
            })),
        });
    }

    // retourner le resultat au controller pour le renvoyer au frontend
    return {
        jobId: job.id,
        insertedCount,
        skippedCount,
        errorCount: errors.length,
        errors,
    };
}
