import {Router} from "express";
import { aiAsk, aiDailyFinanceSummary, aiAskShopify, getConversations, getConversationMessages, getChatLogs } from "../controllers/aiController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { validateBusinessIdParam } from "../middleware/validateBusinessIdParam";
import { validateAiMessage } from "../middleware/validateAiMessage";

const router = Router();

router.get("/daily-finance-summary", requireBusinessAccess({from:"query"}), aiDailyFinanceSummary);
router.post("/ask", requireBusinessAccess({from:"body"}), aiAsk);
router.post("/shopify/:businessId/ask", validateBusinessIdParam, validateAiMessage, requireBusinessAccess({ from: "params", key: "businessId" }), aiAskShopify);
router.get("/shopify/:businessId/conversations", validateBusinessIdParam, requireBusinessAccess({ from: "params", key: "businessId" }), getConversations);
// NB: pas de :businessId dans l'URL -> ownership à vérifier dans le controller (hors scope S0-T05)
router.get("/shopify/conversations/:conversationId", getConversationMessages);
router.get("/shopify/:businessId/chat-logs", validateBusinessIdParam, requireBusinessAccess({ from: "params", key: "businessId" }), getChatLogs);

export default router;