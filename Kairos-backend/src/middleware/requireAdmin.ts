import type { Request, Response, NextFunction } from "express";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });
  if (user.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
  return next();
};
