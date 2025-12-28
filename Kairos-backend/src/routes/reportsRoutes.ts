import { Router } from "express";
import {
  createReportController,
  getReportsByBusinessController,
  getReportsByUserController,
  getReportByIdController,
  toggleFavoriteReportController,
} from "../controllers/reportsController";

const router = Router();

// create report
router.post("/", createReportController);

// list
router.get("/business/:businessId", getReportsByBusinessController);
router.get("/user/:userId", getReportsByUserController);

// single
router.get("/:id", getReportByIdController);

// favorite toggle
router.patch("/:id/favorite", toggleFavoriteReportController);

export default router;