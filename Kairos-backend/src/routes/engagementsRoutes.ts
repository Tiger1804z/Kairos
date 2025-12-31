import { Router } from "express";
import {
  createEngagement,
  deleteEngagement,
  getEngagement,
  getEngagements,
  updateEngagement,
} from "../controllers/engagementsController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.post("/",requireBusinessAccess({from:"body"}), createEngagement);
router.get("/", requireBusinessAccess({from:"query"}), getEngagements);
router.get("/:id", requireBusinessAccess({from:"query"}), getEngagement);
router.patch("/:id", requireBusinessAccess({from:"query"}), updateEngagement);
router.delete("/:id", requireBusinessAccess({from:"query"}), deleteEngagement);
export default router;
