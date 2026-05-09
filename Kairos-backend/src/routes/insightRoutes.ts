import { Router } from "express";
import { handleComputeInsights, handleGetInsights } from "../controllers/insightController";

const router = Router();

router.post("/:businessId/compute", handleComputeInsights);
router.get("/:businessId", handleGetInsights);

export default router;
