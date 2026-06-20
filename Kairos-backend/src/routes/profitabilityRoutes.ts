import { Router } from "express";
import { handleComputeProfitability } from "../controllers/profitabilityController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.post("/:businessId/compute", requireBusinessAccess({ from: "params", key: "businessId" }), handleComputeProfitability);

export default router;
