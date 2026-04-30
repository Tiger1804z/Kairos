import type { Request, Response } from "express";
import { signupService, loginService, meService } from "../services/authService";
import { signupSchema, loginSchema } from "../schemas/auth";

export const signup = async (req: Request, res: Response) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.issues[0]?.message ?? "Invalid input",
    });
  }

  try {
    const data = await signupService(result.data);
    return res.status(201).json(data);
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg === "EMAIL_ALREADY_USED") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.issues[0]?.message ?? "Invalid input",
    });
  }

  try {
    const data = await loginService(result.data);
    return res.status(200).json(data);
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.user!;
    const user = await meService(user_id);
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
