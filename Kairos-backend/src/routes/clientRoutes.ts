import {Router} from "express";
import { createClient,getClients,getClientById, updateClient, deleteClient } from "../controllers/clientController";

const router = Router();

// POST /clients
router.post("/", createClient);

router.get("/", getClients);

router.get("/:id", getClientById);
router.patch("/:id", updateClient);
router.delete("/:id", deleteClient);
export default router;