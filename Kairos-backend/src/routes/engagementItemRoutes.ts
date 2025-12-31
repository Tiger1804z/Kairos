import {Router} from "express";

import { 
    createMyEngagementItem,
    listAllMyEngagementItems,
    listMyEngagementItemById,
    updateMyEngagementItem,
    deleteMyEngagementItem
 } from "../controllers/engagementItemController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";



const router = Router();




router.post("/",requireBusinessAccess({from:"body"}), createMyEngagementItem);
router.get("/", requireBusinessAccess({from:"query"}), listAllMyEngagementItems);     // GET /engagementitems?business_id=4
router.get("/:id", requireBusinessAccess({from:"query"}), listMyEngagementItemById);      // GET /engagementitems/2?business_id=4
router.patch("/:id", requireBusinessAccess({from:"query"}), updateMyEngagementItem);
router.delete("/:id", requireBusinessAccess({from:"query"}), deleteMyEngagementItem);
export default router;