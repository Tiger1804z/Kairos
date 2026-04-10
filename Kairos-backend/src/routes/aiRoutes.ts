import {Router} from "express";

import { aiAsk, aiDailyFinanceSummary,aiAskShopify } from "../controllers/aiController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.get("/daily-finance-summary", requireBusinessAccess({from:"query"}), aiDailyFinanceSummary);
router.post("/ask", requireBusinessAccess({from:"body"}), aiAsk);
router.post("/shopify/:businessId/ask", aiAskShopify);

export default router;