import { Router } from "express";
import {
  createMyTransaction,
  deleteMyTransactionById,
  listMyTransactions,
  getMyTransactionById,
  updateMyTransactionById,
} from "../controllers/transactionsController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

// POST /transactions  (body contient business_id)
router.post("/", requireBusinessAccess({ from: "body" }), createMyTransaction);

// GET /transactions?business_id=4
router.get("/", requireBusinessAccess({ from: "query" }), listMyTransactions);

// GET /transactions/:id (id_transaction)
router.get(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "transaction" }),
  getMyTransactionById
);

router.patch(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "transaction" }),
  updateMyTransactionById
);

router.delete(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "transaction" }),
  deleteMyTransactionById
);

export default router;
