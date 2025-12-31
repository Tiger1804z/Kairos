// src/routes/queryLogsRoutes.ts

import { Router } from "express";
import { createQueryLogController, getQueryLogsByBusinessController, getQueryLogsByUserController } from "../controllers/queryLogsController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";


const router = Router();

// create log
router.post("/",requireBusinessAccess({from:"body"}), createQueryLogController);

// list logs
router.get("/business/:businessId", requireBusinessAccess({from:"params", key:"businessId"}), getQueryLogsByBusinessController);
router.get("/user/:userId", requireBusinessAccess({from:"params", key:"userId"}), getQueryLogsByUserController);
export default router;
