import { Router } from "express";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { requestDataExport, requestDataDeletion } from "../controllers/privacyController";

const router = Router();

// POST /privacy/:businessId/data-export-request
// requireAuth global → requireBusinessAccess: 401 sans user, 403 si non-owner
router.post(
  "/:businessId/data-export-request",
  requireBusinessAccess({ from: "params", key: "businessId", entity: "business" }),
  requestDataExport
);

// POST /privacy/:businessId/deletion-request
// requireAuth global → requireBusinessAccess: 401 sans user, 403 si non-owner
router.post(
  "/:businessId/deletion-request",
  requireBusinessAccess({ from: "params", key: "businessId", entity: "business" }),
  requestDataDeletion
);

export default router;
