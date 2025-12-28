import { Router } from "express";
import {
  createEngagement,
  deleteEngagement,
  getEngagement,
  getEngagements,
  updateEngagement,
} from "../controllers/engagementsController";

const router = Router();

router.post("/", createEngagement);
router.get("/", getEngagements);
router.get("/:id", getEngagement);
router.patch("/:id", updateEngagement);
router.delete("/:id", deleteEngagement);

export default router;
