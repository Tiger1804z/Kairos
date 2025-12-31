import {Router} from "express";

import { createTransaction, deleteTransaction, getTransactions, getTransaction, updateTransaction } from "../controllers/transactionsController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.post("/", requireBusinessAccess({from:"body"}), createTransaction);
router.get("/",requireBusinessAccess({from:"query"}) , getTransactions);
router.get("/:id", requireBusinessAccess({from:"query"}) , getTransaction);
router.patch("/:id", requireBusinessAccess({from:"query"}) , updateTransaction);
router.delete("/:id", requireBusinessAccess({from:"query"}) , deleteTransaction);

export default router;