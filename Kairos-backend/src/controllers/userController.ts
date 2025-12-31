import type { Request, Response } from "express";
import {
  listUsersAdminService,
  createUserService,
  getUserByIdService,
  updateUserByIdService,
  deleteUserByIdService,
} from "../services/userService";

// --------------------
// ADMIN
// --------------------
export const adminListUsers = async (req: Request, res: Response) => {
  try {
    const users = await listUsersAdminService();
    return res.json({ items: users });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const adminCreateUser = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    const user = await createUserService({
      first_name,
      last_name,
      email,
      password,
      role,
    });

    return res.status(201).json({ user });
  } catch (err: any) {
    if (err.message === "USER_ALREADY_EXISTS") {
      return res.status(400).json({ error: "USER_ALREADY_EXISTS" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const adminGetUserById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: "INVALID_USER_ID" });

  const user = await getUserByIdService(id);
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

  return res.json({ user });
};

export const adminUpdateUserById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: "INVALID_USER_ID" });

  try {
    const updated = await updateUserByIdService(id, req.body);
    return res.json({ user: updated });
  } catch (err: any) {
    if (err.message === "EMAIL_ALREADY_USED") {
      return res.status(400).json({ error: "EMAIL_ALREADY_USED" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const adminDeleteUserById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: "INVALID_USER_ID" });

  try {
    const result = await deleteUserByIdService(id);
    return res.json(result);
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

// --------------------
// SELF (user connecté)
// --------------------
export const getMe = async (req: Request, res: Response) => {
  const userId = req.user!.user_id;
  const user = await getUserByIdService(userId);
  return res.json({ user });
};

export const updateMe = async (req: Request, res: Response) => {
  const userId = req.user!.user_id;

  // IMPORTANT: on empêche un user de changer son role lui-même
  const { role, ...safeBody } = req.body ?? {};

  try {
    const updated = await updateUserByIdService(userId, safeBody);
    return res.json({ user: updated });
  } catch (err: any) {
    if (err.message === "EMAIL_ALREADY_USED") {
      return res.status(400).json({ error: "EMAIL_ALREADY_USED" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
