import { Router } from "express";
import { handleCreateCost, handleGetCosts, handleImportCsv, csvUpload } from "../controllers/costController";
import { costWriteRateLimiter } from "../middleware/rateLimiter";
import { validateCostBody } from "../middleware/validateCostBody";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { validateBusinessIdParam } from "../middleware/validateBusinessIdParam";

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
// S0-FIX-04 : import CSV business-scoped. Chaque product_id du CSV est validé
// contre ce businessId (ownership par ligne, all-or-nothing) dans le service.
// Ordre : validateBusinessIdParam -> requireBusinessAccess -> rate limiter ->
// upload -> controller.
router.post(
  "/:businessId/import-csv",
  validateBusinessIdParam,
  requireBusinessAccess({ from: "params", key: "businessId", entity: "business" }),
  costWriteRateLimiter,
  csvUpload,
  handleImportCsv
);

// S0-FIX-04 : ancienne route non scopée démontée (pas de frontière tenant).
// 410 Gone -> plus aucune écriture possible. Utiliser la route scopée ci-dessus.
router.post("/import-csv", (_req, res) =>
  res.status(410).json({
    error: "GONE",
    message: "Use POST /costs/:businessId/import-csv",
  })
);
router.get(
  "/:productId",
  requireBusinessAccess({ from: "params", key: "productId", entity: "product" }),
  handleGetCosts
);

export default router;
