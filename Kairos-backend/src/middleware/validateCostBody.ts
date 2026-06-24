import type { Request, Response, NextFunction } from "express";
import { createCostSchema } from "../schemas/cost";

export const validateCostBody = (req: Request, res: Response, next: NextFunction) => {
  const result = createCostSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input";
    return res.status(400).json({ error: "INVALID_INPUT", message });
  }
  next();
};
