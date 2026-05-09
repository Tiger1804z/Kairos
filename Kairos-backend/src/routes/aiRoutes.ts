import {Router} from "express";
import { aiAsk, aiDailyFinanceSummary, aiAskShopify, getConversations, getConversationMessages, getChatLogs } from "../controllers/aiController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.get("/daily-finance-summary", requireBusinessAccess({from:"query"}), aiDailyFinanceSummary);
router.post("/ask", requireBusinessAccess({from:"body"}), aiAsk);
router.post("/shopify/:businessId/ask", aiAskShopify);
router.get("/shopify/:businessId/conversations", getConversations);
router.get("/shopify/conversations/:conversationId", getConversationMessages);
router.get("/shopify/:businessId/chat-logs", getChatLogs);

export default router;