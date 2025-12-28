import type { Request, Response } from "express";
import prisma from "../prisma/prisma"; 
import { 
  getAllUsers, 
  createNewUser, 
  getUserById, 
  updateUserService ,
  deleteUserService
} from "../services/userService";


export const createUser = async (req: Request, res: Response) => {
  try {
    // 1. Récupérer les données envoyées par le client
    const { first_name, last_name, email, password, role } = req.body;

    // 2. Appeler le service
    const user = await createNewUser({
      first_name,
      last_name,
      email,
      password,
      role,
    });

    // 3. Réponse HTTP
    res.status(201).json(user);
  } catch (err: any) {
    console.error("Create user error:", err);

    // Si c’est une erreur métier connue
    if (err.message === "User already exists") {
      return res.status(400).json({ error: err.message });
    }

    // Sinon erreur serveur
    res.status(500).json({ error: "Server error while creating user" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Server error while fetching users" });
  };
};

export const getUser = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error while fetching user" });
  }
};



export const updateUser = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const { first_name, last_name, email, password, role } = req.body;

  try {
    const updatedUser = await updateUserService(userId, {
      first_name,
      last_name,
      email,
      password,
      role,
    });

    res.status(200).json(updatedUser);
  } catch (err: any) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Server error while updating user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const result = await deleteUserService(userId);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: "Server error while deleting user" });
  }
};
