import { Router } from "express";
import { login, me, signup } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";
// S0-T09 / D-SEC1: limiter centralisé (10 req/15min/IP, anti brute-force).
// Remplace l'ancien limiter inline (20/15min) pour éviter les configs dupliquées.
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Routes sensibles uniquement (pas /me, qui est une lecture légère).
router.post("/signup", authRateLimiter, signup);
router.post("/login", authRateLimiter, login);
router.get("/me", requireAuth, me);

export default router;
