import { Router } from "express";
import { handleLoadDemoData } from "../controllers/demoController";

const router = Router();

router.post("/:businessId/load", handleLoadDemoData);

export default router;
