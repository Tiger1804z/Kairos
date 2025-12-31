import { Router } from "express";
import {
  listMyClients,
  deleteMyClient,
  getMyClientById,
  updateMyClient,
  createMyClient,
} from "../controllers/clientController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// POST /clients  (body contient business_id)
router.post("/", requireBusinessAccess({ from: "body" }), createMyClient);

// GET /clients?business_id=4
router.get("/", requireBusinessAccess({ from: "query" }), listMyClients);

// GET /clients/:id   (id = id_client)
router.get(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "client" }),
  getMyClientById
);

router.patch(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "client" }),
  updateMyClient
);

router.delete(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "client" }),
  deleteMyClient
);

export default router;
