// src/routes/queryLogsRoutes.ts

import { Router } from "express";
import { createQueryLogController, getQueryLogsByBusinessController, getQueryLogsByUserController } from "../controllers/queryLogsController";


const router = Router();

// create log
router.post("/", createQueryLogController);

// list logs
router.get("/business/:businessId", getQueryLogsByBusinessController);
router.get("/user/:userId", getQueryLogsByUserController);

export default router;
