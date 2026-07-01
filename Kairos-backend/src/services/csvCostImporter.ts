import prisma from "../prisma/prisma";
import { parseCsvBuffer } from "./csvParserService";
import { CostSourceType } from "../../generated/prisma";

interface ImportResult {
  imported: number;
  errors: { row: number; reason: string }[];
}

/**
 * S0-FIX-04 : import CSV business-scoped.
 *
 * Stratégie = collect errors then reject (all-or-nothing). On valide TOUTES les
 * lignes (champs + ownership produit -> businessId) avant d'écrire quoi que ce
 * soit. Si au moins une erreur est trouvée, aucun cost n'est écrit (imported: 0)
 * et le controller renvoie 400 avec la liste des erreurs. Cela évite tout import
 * partiel silencieux et toute écriture cross-tenant.
 *
 * Le message d'erreur ownership combine "inexistant" et "hors business"
 * volontairement : ne pas révéler si un product_id existe dans un autre business
 * (pas d'oracle d'énumération).
 */
export async function importCostsFromCsv(buffer: Buffer, businessId: number): Promise<ImportResult> {
  const { rows } = parseCsvBuffer(buffer);
  const errors: { row: number; reason: string }[] = [];
  const valid: { row: number; product_id: string; cost_per_unit: number; note?: string }[] = [];

  // Phase 1 — validation des champs de chaque ligne
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const product_id = row["product_id"];
    const cost_per_unit = parseFloat(row["cost_per_unit"] ?? "");
    const note = row["note"] || undefined;
    const rowNumber = i + 2; // +1 header, +1 index base-0

    if (!product_id) {
      errors.push({ row: rowNumber, reason: "product_id manquant" });
      continue;
    }
    if (isNaN(cost_per_unit) || cost_per_unit < 0) {
      errors.push({ row: rowNumber, reason: "cost_per_unit invalide" });
      continue;
    }

    valid.push({ row: rowNumber, product_id, cost_per_unit, ...(note ? { note } : {}) });
  }

  // Phase 2 — ownership : chaque produit doit exister ET appartenir au business
  if (valid.length > 0) {
    const uniqueIds = [...new Set(valid.map((v) => v.product_id))];
    const owned = await prisma.product.findMany({
      where: { id: { in: uniqueIds }, business_id: businessId },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((p) => p.id));

    for (const v of valid) {
      if (!ownedSet.has(v.product_id)) {
        errors.push({ row: v.row, reason: "product_id inexistant ou hors de ce business" });
      }
    }
  }

  // No partial import : la moindre erreur -> on n'écrit rien
  if (errors.length > 0) {
    return { imported: 0, errors };
  }

  // Phase 3 — écriture atomique de toutes les lignes valides
  await prisma.$transaction(
    valid.map((v) =>
      prisma.productCost.create({
        data: {
          product_id: v.product_id,
          cost_per_unit: v.cost_per_unit,
          source_type: CostSourceType.csv,
          note: v.note ?? null,
        },
      })
    )
  );

  return { imported: valid.length, errors: [] };
}
