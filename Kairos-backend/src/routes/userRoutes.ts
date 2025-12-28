import { Router } from "express";
import { createUser, getUsers, getUser, updateUser, deleteUser } 
  from "../controllers/userController"; // ✅ tout vient du controller

const router = Router();

// POST /users
router.post("/", createUser);

// GET /users
router.get("/", getUsers);

// GET /users/:id
router.get("/:id", getUser);

// PATCH /users/:id
router.patch("/:id", updateUser); // ✅ handler Express


// DELETE /users/:id
router.delete("/:id", deleteUser); // ✅ handler Express

export default router;
