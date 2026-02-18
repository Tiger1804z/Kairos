import type { Request, Response } from "express";
import { parseCsvBuffer, getPreview } from "../services/csvParserService";
import { autoMapColumns, getUnmappedColumns, aiMapColumns } from "../services/columnMappingService";
import { importTransactions } from "../services/importService";
import prisma from "../prisma/prisma";
import { me } from "./authController";


/**
 * POST /import/transactions/preview
 * Upload un CSV et retourne :
 * - preview des 10 premieres lignes
 * - mapping suggere (heuristique + IA si besoin)
 *
 * Le fichier CSV est envoye en multipart/form-data via multer
 */

export const previewImport = async (req: Request, res: Response) => {
    try {
        // multer stocke le fichier dans req.file
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "NO_FILE", message: "Aucun fichier CSV n'a été téléchargé." });
        }
        
        // etape 1 : parser le csv en memoire
        const parseResult = parseCsvBuffer(file.buffer);

        // etape 2 :  preview des 10 premieres lignes
        const preview = getPreview(parseResult);

        // etape 3 : mapping automatique avec sysnonymes
        let mappings = autoMapColumns(parseResult.headers);

        // etape 4 : si il y a des colonnes non mappées, on essaye avec l'IA
        const unmapped = getUnmappedColumns(mappings);
        if (unmapped.length > 0) {
            const aiMappings = await aiMapColumns(
                unmapped.map((m) => m.csvColumn),
                parseResult.rows.slice(0, 5) // on envoie que 5 lignes a l'IA, pas tout le fichier
                
            );
            // fusionner : remplacer les mappings "none" par les suggestions de l'IA
            const aiMap = new Map(aiMappings.map((m) => [m.csvColumn, m]));
            mappings = mappings.map((m) => 
                m.kairosField === null && aiMap.has(m.csvColumn) ? aiMap.get(m.csvColumn)! : m
            );
        }

        return res.json({
            preview : preview.rows,
            totalRows: parseResult.totalRows,
            headers: parseResult.headers,
            mappings,
        });
    } catch (error: any) {
        return res.status(500).json({ error: "PARSE_ERROR",message: error.message});
    }
} 

/**
 * POST /import/transactions
 * Lance l'import avec le mapping valide par le user
 * Body: business_id, mappings (le mapping final apres validation du user)
 * Le fichier CSV est renvoye en multipart/form-data
 */
export const executeImport = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "NO_FILE", message: "Aucun fichier CSV n'a été téléchargé." });
        }

        const {business_id, mappings } = req.body;
        if (!business_id || !mappings) {
            return res.status(400).json({ error: "MISSING_FIELDS", message: "business_id et mappings sont obligatoires." });
        }

        // parser les mappings envoyés en JSON  string depuis le frontend car multipart 
        const parsedMappings = typeof mappings === "string" ? JSON.parse(mappings) : mappings;

        // parser le CSV en memoire
        const parseResult = parseCsvBuffer(file.buffer);

        // lancer l'import
        const result = await importTransactions(
            Number(business_id),
            parseResult.rows,
            parsedMappings,
            file.originalname
        );
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: "IMPORT_ERROR", message: error.message });
    }
};

/**
 * GET /import/jobs?business_id=X
 * Liste les jobs d'import pour un business
 */

export const listImportJobs = async (req: Request, res: Response) => {
    try {
        const business_id = Number(req.query.business_id);
        if (!business_id) {
            return res.status(400).json({ error: "MISSING_BUSINESS_ID" });
        }
        const jobs = await prisma.importJob.findMany({
            where: { id_business: business_id },
            orderBy: { created_at: "desc" },
        });
        return res.json(jobs);
    } catch (error: any) {
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
};

/**
 * GET /import/jobs/:id
 * Detail d'un job d'import avec ses erreurs
 */
export const getImportJob = async (req: Request, res: Response) => {
    try {
        const job = await prisma.importJob.findUnique({
            where: { id: String(req.params.id) },
            include: { errors: true },
        });
        if (!job) {
            return res.status(404).json({ error: "JOB_NOT_FOUND" });
        }
        return res.json(job);
    } catch (error: any) {
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
};