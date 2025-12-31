import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  adminCreateUser,
  adminListUsers,
  adminGetUserById,
  adminUpdateUserById,
  adminDeleteUserById,
  getMe,
  updateMe,
} from "../controllers/userController";

const router = Router();

// Tout /users est protégé
router.use(requireAuth);

// Self
router.get("/me", getMe);
router.patch("/me", updateMe);

// Admin
router.get("/", requireAdmin, adminListUsers);
router.post("/", requireAdmin, adminCreateUser);
router.get("/:id", requireAdmin, adminGetUserById);
router.patch("/:id", requireAdmin, adminUpdateUserById);
router.delete("/:id", requireAdmin, adminDeleteUserById);

export default router;
