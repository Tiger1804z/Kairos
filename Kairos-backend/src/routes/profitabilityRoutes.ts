import { Router } from "express";
import { handleComputeProfitability } from "../controllers/profitabilityController";

const router = Router();

router.post("/:businessId/compute", handleComputeProfitability);

export default router;
