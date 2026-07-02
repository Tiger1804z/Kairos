import type { Request, Response } from "express";
import { createCost, getCostByProduct } from "../services/costService";
import { importCostsFromCsv } from "../services/csvCostImporter";
import { csvUploadSingle } from "../middleware/csvUpload";

// GATE-A-REM-06 : multer partagé avec limits.fileSize (5 MB → 413), même
// comportement que les routes /import. Export conservé pour costRoutes.
export const csvUpload = csvUploadSingle;

export async function handleCreateCost(req: Request, res: Response) {
    const {product_id, variant_id, cost_per_unit, note} = req.body;

    if (!product_id || cost_per_unit === undefined){
        return res.status(400).json({ error: " product_id et cost_per_unit sont requis" });

    }

    const cost = await createCost({ product_id, variant_id, cost_per_unit, note });

    return res.status(201).json(cost);
}


export async function handleGetCosts(req: Request, res: Response) {
    const { productId } = req.params as { productId: string };

    const cost = await getCostByProduct(productId);

    return res.json(cost);
}

export async function handleImportCsv(req: Request, res: Response) {
    if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier envoyé" });
    }

    // businessId résolu + ownership vérifié par requireBusinessAccess (route scopée).
    const businessId = (req as any).businessId as number;

    try {
        const result = await importCostsFromCsv(req.file.buffer, businessId);
        // Stratégie all-or-nothing : la moindre erreur -> rien écrit -> 400.
        if (result.errors.length > 0) {
            return res.status(400).json(result);
        }
        return res.json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur import CSV";
        return res.status(400).json({ error: message });
    }
}