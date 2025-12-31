import {Router} from "express";

import { createEngagementItem, deleteEngagementItem, getAllEngagementItems, getEngagementItem, updateEngagementItem } from "../controllers/engagementItemController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";



const router = Router();




router.post("/",requireBusinessAccess({from:"body"}), createEngagementItem);
router.get("/", requireBusinessAccess({from:"query"}), getAllEngagementItems);     // GET /engagementitems?business_id=4
router.get("/:id", requireBusinessAccess({from:"query"}), getEngagementItem);      // GET /engagementitems/2?business_id=4
router.patch("/:id", requireBusinessAccess({from:"query"}), updateEngagementItem);
router.delete("/:id", requireBusinessAccess({from:"query"}), deleteEngagementItem);
export default router;