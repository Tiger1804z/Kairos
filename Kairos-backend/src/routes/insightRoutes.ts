import { Router } from "express";
import { handleComputeInsights, handleGetInsights } from "../controllers/insightController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { validateBusinessIdParam } from "../middleware/validateBusinessIdParam";

const router = Router();

router.post("/:businessId/compute", validateBusinessIdParam, requireBusinessAccess({ from: "params", key: "businessId" }), handleComputeInsights);
router.get("/:businessId", validateBusinessIdParam, requireBusinessAccess({ from: "params", key: "businessId" }), handleGetInsights);

export default router;
