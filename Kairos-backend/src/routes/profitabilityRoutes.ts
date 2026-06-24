import { Router } from "express";
import { handleComputeProfitability } from "../controllers/profitabilityController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { validateBusinessIdParam } from "../middleware/validateBusinessIdParam";

const router = Router();

router.post("/:businessId/compute", validateBusinessIdParam, requireBusinessAccess({ from: "params", key: "businessId" }), handleComputeProfitability);

export default router;
