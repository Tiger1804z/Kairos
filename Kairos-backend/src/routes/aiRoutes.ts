import {Router} from "express";
import { aiAsk, aiDailyFinanceSummary, aiAskShopify, getConversations, getConversationMessages, getChatLogs } from "../controllers/aiController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.get("/daily-finance-summary", requireBusinessAccess({from:"query"}), aiDailyFinanceSummary);
router.post("/ask", requireBusinessAccess({from:"body"}), aiAsk);
router.post("/shopify/:businessId/ask", requireBusinessAccess({ from: "params", key: "businessId" }), aiAskShopify);
router.get("/shopify/:businessId/conversations", requireBusinessAccess({ from: "params", key: "businessId" }), getConversations);
// NB: pas de :businessId dans l'URL -> ownership à vérifier dans le controller (hors scope S0-T05)
router.get("/shopify/conversations/:conversationId", getConversationMessages);
router.get("/shopify/:businessId/chat-logs", requireBusinessAccess({ from: "params", key: "businessId" }), getChatLogs);

export default router;