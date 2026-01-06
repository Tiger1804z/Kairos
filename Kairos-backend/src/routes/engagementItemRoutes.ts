import { Router } from "express";
import {
  createMyEngagementItem,
  listAllMyEngagementItems,
  listMyEngagementItemById,
  updateMyEngagementItem,
  deleteMyEngagementItem,
} from "../controllers/engagementItemController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

/**
 * POST /engagementitems
 * body: { engagement_id, item_name, item_type, quantity, unit_price }
 * businessId est résolu via engagement_id
 */
router.post(
  "/",
  requireBusinessAccess({ from: "body", key: "engagement_id", entity: "engagement" }),
  createMyEngagementItem
);

/**
 * GET /engagementitems?business_id=...
 * (optionnel) &engagement_id=...
 */
router.get("/", requireBusinessAccess({ from: "query" }), listAllMyEngagementItems);

/**
 * GET /engagementitems/:id
 * businessId est résolu via id_item
 */
router.get(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "engagementItem" }),
  listMyEngagementItemById
);

router.patch(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "engagementItem" }),
  updateMyEngagementItem
);

router.delete(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "engagementItem" }),
  deleteMyEngagementItem
);

export default router;
