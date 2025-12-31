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

// create report
router.post("/", createReportController);

// list
router.get("/business/:businessId",requireBusinessAccess({from:"params", key:"businessId"}), getReportsByBusinessController);
router.get("/user/:userId", requireBusinessAccess({from:"params", key:"userId"}), getReportsByUserController);

// single
router.get("/:id", requireBusinessAccess({from:"params", key:"id"}), getReportByIdController);
// favorite toggle
router.patch("/:id/favorite", requireBusinessAccess({from:"params", key:"id"}), toggleFavoriteReportController);

export default router;