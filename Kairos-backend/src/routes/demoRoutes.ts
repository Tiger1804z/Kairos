import { Router } from "express";
import { handleLoadDemoData } from "../controllers/demoController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { validateBusinessIdParam } from "../middleware/validateBusinessIdParam";

const router = Router();

router.post("/:businessId/load", validateBusinessIdParam, requireBusinessAccess({ from: "params", key: "businessId" }), handleLoadDemoData);

export default router;
