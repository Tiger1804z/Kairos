import { Router } from "express";
import { handleCreateCost, handleGetCosts, handleImportCsv, csvUpload } from "../controllers/costController";
import { costWriteRateLimiter } from "../middleware/rateLimiter";
import { validateCostBody } from "../middleware/validateCostBody";

const router = Router();

// S0-T09: limiter sur les mutations uniquement (30 req/min/user). La lecture
// GET /:productId reste non limitée pour ne pas gêner l'affichage des coûts.
router.post("/", costWriteRateLimiter, validateCostBody, handleCreateCost);
router.post("/import-csv", costWriteRateLimiter, csvUpload, handleImportCsv);
router.get("/:productId", handleGetCosts);

export default router;
