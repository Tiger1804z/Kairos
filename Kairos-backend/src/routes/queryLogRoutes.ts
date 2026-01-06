// src/routes/queryLogsRoutes.ts
import { Router } from "express";
import {
  createQueryLogController,
  getQueryLogsByBusinessController,
  getQueryLogsByUserController,
} from "../controllers/queryLogsController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// create log (body contient business_id)
router.post("/", requireBusinessAccess({ from: "body" }), createQueryLogController);

// list logs
router.get(
  "/business/:businessId",
  requireBusinessAccess({ from: "params", key: "businessId", entity: "business" }),
  getQueryLogsByBusinessController
);

// user logs (pas de businessId dans l’URL -> protéger dans controller)
router.get("/user/:userId", getQueryLogsByUserController);

export default router;
