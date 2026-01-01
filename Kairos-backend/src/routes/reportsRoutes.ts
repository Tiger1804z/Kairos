import { Router } from "express";
import {
  createReportController,
  getReportsByBusinessController,
  getReportsByUserController,
  getReportByIdController,
  toggleFavoriteReportController,
} from "../controllers/reportsController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// create report (body contient business_id)
router.post("/", requireBusinessAccess({ from: "body" }), createReportController);

// list
router.get(
  "/business/:businessId",
  requireBusinessAccess({ from: "params", key: "businessId", entity: "business" }),
  getReportsByBusinessController
);

// user reports (pas de businessId dans l’URL -> protéger dans controller)
router.get("/user/:userId", getReportsByUserController);

// single
router.get(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "report" }),
  getReportByIdController
);

// favorite toggle
router.patch(
  "/:id/favorite",
  requireBusinessAccess({ from: "params", key: "id", entity: "report" }),
  toggleFavoriteReportController
);

export default router;
