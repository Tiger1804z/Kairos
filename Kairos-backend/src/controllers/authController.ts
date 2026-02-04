import type { Request, Response } from "express";
import { signupService, loginService, meService } from "../services/authService";

/**
 * Controller: POST /auth/signup
 * Body:
 * - first_name
 * - last_name
 * - email
 * - password
 * - role (optionnel)
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    const result = await signupService({ first_name, last_name, email, password, role });

    return res.status(201).json(result);
  } catch (err: any) {
    const msg = err?.message ?? "SERVER_ERROR";

    if (msg === "EMAIL_ALREADY_USED") {
      return res.status(409).json({ error: msg });
    }

    if (msg === "ROLE_NOT_ALLOWED") {
      return res.status(400).json({ error: msg });
    }

    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};


/**
 * Controller: POST /auth/login
 * Body:
 * - email
 * - password
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    const result = await loginService({ email, password });
    // result = { token, user: { id_user, first_name, last_name, email, role } }

    return res.status(200).json(result);
  } catch (err: any) {
    const msg = err?.message ?? "SERVER_ERROR";

    if (msg === "INVALID_CREDENTIALS") return res.status(401).json({ error: msg });
    if (msg === "JWT_SECRET_MISSING") return res.status(500).json({ error: msg });

    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};


export const me = async (req: Request, res: Response) => {
  try {
    // injecté par requireAuth
    const { user_id } = req.user!;

    const user = await meService(user_id);

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};