import { Router } from "express";
import {
  createMyEngagement,
  deleteMyEngagement,
  listMyEngagements,
  listMyEngagementById,
  updateMyEngagement,
} from "../controllers/engagementsController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// POST /engagements  (body contient business_id)
router.post("/", requireBusinessAccess({ from: "body" }), createMyEngagement);

// GET /engagements?business_id=4
router.get("/", requireBusinessAccess({ from: "query" }), listMyEngagements);

// GET /engagements/:id (id = id_engagement)
router.get(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "engagement" }),
  listMyEngagementById
);

router.patch(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "engagement" }),
  updateMyEngagement
);

router.delete(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "engagement" }),
  deleteMyEngagement
);

export default router;
