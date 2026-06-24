import type { Request, Response, NextFunction } from "express";

export const validateBusinessIdParam = (req: Request, res: Response, next: NextFunction) => {
  const raw = req.params.businessId;
  // Entiers positifs uniquement : pas de lettres, pas de point décimal, pas de signe négatif
  if (!raw || !/^\d+$/.test(raw) || parseInt(raw, 10) <= 0) {
    return res.status(400).json({ error: "INVALID_BUSINESS_ID", message: "Invalid businessId" });
  }
  next();
};
