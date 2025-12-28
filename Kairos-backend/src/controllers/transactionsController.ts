import type { Request, Response } from "express";
import {
  createNewTransaction,
  getAllTransactionsService,
  getTransactionById,
  updateTransactionById,
  deleteTransactionById,
} from "../services/transactionsService";

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { business_id, ...rest } = req.body;

    const businessId = Number(business_id);
    if (isNaN(businessId)) return res.status(400).json({ error: "business_id is required" });

    const created = await createNewTransaction({
      business_id: businessId,
      ...rest, // doit contenir transaction_date, type, amount, etc.
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("Create transaction error:", err);
    return res.status(500).json({ error: "Server error while creating transaction" });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  const businessId = Number(req.query.business_id);
  if (isNaN(businessId)) return res.status(400).json({ error: "business_id is required" });

  try {
    const rows = await getAllTransactionsService(businessId);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Get transactions error:", err);
    return res.status(500).json({ error: "Server error while fetching transactions" });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  const businessId = Number(req.query.business_id);
  const transactionId = Number(req.params.id);

  if (isNaN(businessId) || isNaN(transactionId)) {
    return res.status(400).json({ error: "Invalid transaction ID or business ID" });
  }

  try {
    const tx = await getTransactionById(businessId, transactionId);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    return res.status(200).json(tx);
  } catch (err) {
    console.error("Get transaction error:", err);
    return res.status(500).json({ error: "Server error while fetching transaction" });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  const businessId = Number(req.query.business_id);
  const transactionId = Number(req.params.id);

  if (isNaN(businessId) || isNaN(transactionId)) {
    return res.status(400).json({ error: "Invalid transaction ID or business ID" });
  }

  try {
    const updated = await updateTransactionById(businessId, transactionId, req.body);
    return res.status(200).json(updated);
  } catch (err: any) {
    if (err.message === "Transaction not found") return res.status(404).json({ error: err.message });
    console.error("Update transaction error:", err);
    return res.status(500).json({ error: "Server error while updating transaction" });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const businessId = Number(req.query.business_id);
  const transactionId = Number(req.params.id);

  if (isNaN(businessId) || isNaN(transactionId)) {
    return res.status(400).json({ error: "Invalid transaction ID or business ID" });
  }

  try {
    await deleteTransactionById(businessId, transactionId);
    return res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (err: any) {
    if (err.message === "Transaction not found") return res.status(404).json({ error: err.message });
    console.error("Delete transaction error:", err);
    return res.status(500).json({ error: "Server error while deleting transaction" });
  }
};
