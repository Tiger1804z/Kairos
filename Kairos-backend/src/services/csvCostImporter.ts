import { parseCsvBuffer } from "./csvParserService";
import { createCost } from "./costService";
import { CostSourceType } from "../../generated/prisma";

interface ImportResult {
  imported: number;
  errors: { row: number; reason: string }[];
}

export async function importCostsFromCsv(buffer: Buffer): Promise<ImportResult> {
  const { rows } = parseCsvBuffer(buffer);
  const result: ImportResult = { imported: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const product_id = row["product_id"];
    const cost_per_unit = parseFloat(row["cost_per_unit"] ?? "");
    const note = row["note"] || undefined;

    if (!product_id) {
      result.errors.push({ row: i + 2, reason: "product_id manquant" });
      continue;
    }
    if (isNaN(cost_per_unit) || cost_per_unit < 0) {
      result.errors.push({ row: i + 2, reason: "cost_per_unit invalide" });
      continue;
    }

    await createCost({ product_id, cost_per_unit, source_type: CostSourceType.csv, ...(note ? { note } : {}) });
    result.imported++;
  }

  return result;
}
