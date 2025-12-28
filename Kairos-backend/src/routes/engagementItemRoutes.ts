import {Router} from "express";

import { createEngagementItem, deleteEngagementItem, getAllEngagementItems, getEngagementItem, updateEngagementItem } from "../controllers/engagementItemController";



const router = Router();




router.post("/", createEngagementItem);
router.get("/", getAllEngagementItems);     // GET /engagementitems?business_id=4
router.get("/:id", getEngagementItem);      // GET /engagementitems/2?business_id=4
router.patch("/:id", updateEngagementItem);
router.delete("/:id", deleteEngagementItem);

export default router;