import { Router } from "express";
import {
  createBusiness,
  deleteBusiness,
  getBusinessById,
  getBusinesses,
  updateBusiness,
} from "../controllers/businessController";
import { requireAuth } from "../middleware/authMiddleware";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// POST /businesses  (créer)
router.post("/", requireAuth, createBusiness);

// GET /businesses  (liste "mes businesses")
router.get("/", requireAuth, getBusinesses);

// GET /businesses/:id (détail)
router.get("/:id", requireBusinessAccess({ from: "params", key: "id" }), getBusinessById);

// PATCH /businesses/:id
router.patch("/:id", requireBusinessAccess({ from: "params", key: "id" }), updateBusiness);

// DELETE /businesses/:id
router.delete("/:id", requireBusinessAccess({ from: "params", key: "id" }), deleteBusiness);

export default router;
