import {Router} from "express";

import { aiAsk, aiDailyFinanceSummary } from "../controllers/aiController";

const router = Router();

router.get("/daily-finance-summary", aiDailyFinanceSummary);
router.post("/ask", aiAsk);

export default router;