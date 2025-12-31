import { Router } from "express";
import {
  createMyEngagement,
  deleteMyEngagement,
  listMyEngagements,
  listMyEngagementById,
  updateMyEngagement
} from "../controllers/engagementsController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.post("/",requireBusinessAccess({from:"body"}), createMyEngagement);
router.get("/", requireBusinessAccess({from:"query"}), listMyEngagements);
router.get("/:id", requireBusinessAccess({from:"query"}), listMyEngagementById);
router.patch("/:id", requireBusinessAccess({from:"query"}), updateMyEngagement);
router.delete("/:id", requireBusinessAccess({from:"query"}), deleteMyEngagement);
export default router;
