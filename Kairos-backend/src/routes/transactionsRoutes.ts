import {Router} from "express";

import { createTransaction, deleteTransaction, getTransactions, getTransaction, updateTransaction } from "../controllers/transactionsController";

const router = Router();

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/:id", getTransaction);
router.patch("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;