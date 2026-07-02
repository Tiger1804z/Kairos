import { Router } from "express";
import { previewImport, executeImport, listImportJobs, getImportJob } from "../controllers/importController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { csvUploadSingle } from "../middleware/csvUpload";
import { importPreviewRateLimiter, importWriteRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// GATE-A-REM-06 : upload multer partagé (memoryStorage + limits.fileSize 5 MB → 413)
// + rate limiters (preview peut déclencher OpenAI). Limiter AVANT upload : une
// requête rejetée 429 ne bufferise pas le fichier.

// POST /import/transactions/preview — upload CSV + retourne preview + mapping suggere
router.post("/transactions/preview", importPreviewRateLimiter, csvUploadSingle, previewImport);

// POST /import/transactions — lance l'import avec le mapping valide
// business_id arrive dans le body multipart → l'upload doit passer avant requireBusinessAccess.
router.post(
  "/transactions",
  importWriteRateLimiter,
  csvUploadSingle,
  requireBusinessAccess({ from: "body" }),
  executeImport
);

// GET /import/jobs?business_id=X — liste les jobs d'import
router.get("/jobs", requireBusinessAccess({ from: "query" }), listImportJobs);

// GET /import/jobs/:id — detail d'un job
// S0-FIX-03 : ownership check importJob -> business avant de retourner le job
// (filename, errors, raw_row_json). id est un UUID résolu vers id_business.
router.get(
  "/jobs/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "importJob" }),
  getImportJob
);

export default router;
