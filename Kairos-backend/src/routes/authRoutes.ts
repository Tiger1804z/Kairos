import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me, signup } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 tentatives max par IP sur la fenêtre
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, me);

export default router;
