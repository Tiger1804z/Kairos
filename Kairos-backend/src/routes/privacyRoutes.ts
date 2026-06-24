import { Router } from "express";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { requestDataExport, requestDataDeletion } from "../controllers/privacyController";
import { validateBusinessIdParam } from "../middleware/validateBusinessIdParam";

const router = Router();

// POST /privacy/:businessId/data-export-request
// validateBusinessIdParam → format invalide = 400 (sans DB call)
// requireAuth global → requireBusinessAccess: 401 sans user, 403 si non-owner
router.post(
  "/:businessId/data-export-request",
  validateBusinessIdParam,
  requireBusinessAccess({ from: "params", key: "businessId", entity: "business" }),
  requestDataExport
);

// POST /privacy/:businessId/deletion-request
// validateBusinessIdParam → format invalide = 400 (sans DB call)
// requireAuth global → requireBusinessAccess: 401 sans user, 403 si non-owner
router.post(
  "/:businessId/deletion-request",
  validateBusinessIdParam,
  requireBusinessAccess({ from: "params", key: "businessId", entity: "business" }),
  requestDataDeletion
);

export default router;
