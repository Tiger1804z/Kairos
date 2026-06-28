import { Router } from "express";
import { handleCreateCost, handleGetCosts, handleImportCsv, csvUpload } from "../controllers/costController";
import { costWriteRateLimiter } from "../middleware/rateLimiter";
import { validateCostBody } from "../middleware/validateCostBody";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// S0-T09: limiter sur les mutations uniquement (30 req/min/user). La lecture
// GET /:productId reste non limitée pour ne pas gêner l'affichage des coûts.
//
// S0-FIX-02 : ownership check produit -> business avant toute lecture/écriture
// de costs. product_id / productId est un UUID résolu vers product.business_id,
// puis requireBusinessAccess vérifie l'ownership (bypass admin). Placé APRÈS
// validateCostBody pour qu'un body invalide renvoie 400 avant le lookup.
router.post(
  "/",
  costWriteRateLimiter,
  validateCostBody,
  requireBusinessAccess({ from: "body", key: "product_id", entity: "product" }),
  handleCreateCost
);
router.post("/import-csv", costWriteRateLimiter, csvUpload, handleImportCsv);
router.get(
  "/:productId",
  requireBusinessAccess({ from: "params", key: "productId", entity: "product" }),
  handleGetCosts
);

export default router;
