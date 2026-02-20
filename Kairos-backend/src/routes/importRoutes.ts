import { Router } from "express";
import multer from "multer";
import { previewImport, executeImport, listImportJobs, getImportJob } from "../controllers/importController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// multer en memoire : on garde le fichier en buffer, pas sur le disque
// sans ca multer doit l'ecrire dans un dossier temporaire, et ca complique la lecture du fichier pour le parser ensuite
// correct pour un mvp avec des fichiers de taille raisonnable 
const upload = multer({ storage: multer.memoryStorage() });

// POST /import/transactions/preview — upload CSV + retourne preview + mapping suggere
router.post("/transactions/preview", upload.single("file"), previewImport);

// POST /import/transactions — lance l'import avec le mapping valide
router.post("/transactions", upload.single("file"), requireBusinessAccess({ from: "body" }), executeImport);

// GET /import/jobs?business_id=X — liste les jobs d'import
router.get("/jobs", requireBusinessAccess({ from: "query" }), listImportJobs);

// GET /import/jobs/:id — detail d'un job
router.get("/jobs/:id", getImportJob);

export default router;
