import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

/**
 * AUTH MIDDLEWARE
 * - Vérifie Authorization: Bearer <token>
 * - Injecte req.user = { user_id, role, email }
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!JWT_SECRET) return res.status(500).json({ error: "JWT_SECRET_MISSING" });

    const auth = req.headers.authorization ?? "";
    const [type, token] = auth.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ error: "AUTH_REQUIRED" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as any;

    (req as any).user = {
      user_id: Number(payload.user_id),
      role: String(payload.role),
      email: String(payload.email),
    };

    return next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
};
