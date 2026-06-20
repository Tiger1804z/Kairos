import { Router } from "express";
import { handleComputeInsights, handleGetInsights } from "../controllers/insightController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.post("/:businessId/compute", requireBusinessAccess({ from: "params", key: "businessId" }), handleComputeInsights);
router.get("/:businessId", requireBusinessAccess({ from: "params", key: "businessId" }), handleGetInsights);

export default router;
