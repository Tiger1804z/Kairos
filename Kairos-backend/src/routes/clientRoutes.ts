import {Router} from "express";
import { createClient,getClients,getClientById, updateClient, deleteClient } from "../controllers/clientController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// POST /clients
router.post("/",requireBusinessAccess({from:"body"}), createClient);

router.get("/", requireBusinessAccess({from:"query"}), getClients);

router.get("/:id", requireBusinessAccess({from:"query"}), getClientById);
router.patch("/:id", requireBusinessAccess({from:"query"}), updateClient);
router.delete("/:id", requireBusinessAccess({from:"query"}), deleteClient);
export default router;