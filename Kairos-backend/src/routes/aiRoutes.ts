import {Router} from "express";

import { aiAsk, aiDailyFinanceSummary } from "../controllers/aiController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.get("/daily-finance-summary", requireBusinessAccess({from:"query"}), aiDailyFinanceSummary);
router.post("/ask", requireBusinessAccess({from:"body"}), aiAsk);

export default router;