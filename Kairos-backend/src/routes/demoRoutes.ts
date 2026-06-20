import { Router } from "express";
import { handleLoadDemoData } from "../controllers/demoController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.post("/:businessId/load", requireBusinessAccess({ from: "params", key: "businessId" }), handleLoadDemoData);

export default router;
