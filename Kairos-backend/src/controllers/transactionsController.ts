import type { Request, Response } from "express";
import {
  createTransactionForBusinessService,
  listTransactionsByBusinessService,
  getTransactionByIdService,
  updateTransactionByIdService,
  deleteTransactionByIdService,
} from "../services/transactionsService";

// POST /transactions
export const createMyTransaction = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;

    const {
      client_id,
      engagement_id,
      transaction_type,
      category,
      amount,
      payment_method,
      reference_number,
      description,
      transaction_date,
    } = req.body ?? {};

    if (!transaction_type) {
      return res.status(400).json({ error: "TRANSACTION_TYPE_REQUIRED" });
    }

    if (amount === undefined || Number.isNaN(Number(amount))) {
      return res.status(400).json({ error: "AMOUNT_REQUIRED" });
    }

    if (!transaction_date) {
      return res.status(400).json({ error: "TRANSACTION_DATE_REQUIRED" });
    }

    const created = await createTransactionForBusinessService({
      business_id: businessId,
      client_id: client_id ?? null,
      engagement_id: engagement_id ?? null,
      transaction_type,
      category: category ?? null,
      amount: Number(amount),
      payment_method: payment_method ?? null,
      reference_number: reference_number ?? null,
      description: description ?? null,
      transaction_date,
    });

    return res.status(201).json({ transaction: created });
  } catch (err: any) {
    if (err?.message === "CLIENT_NOT_FOUND") {
      return res.status(404).json({ error: "CLIENT_NOT_FOUND" });
    }
    if (err?.message === "ENGAGEMENT_NOT_FOUND") {
      return res.status(404).json({ error: "ENGAGEMENT_NOT_FOUND" });
    }
    if (err?.message === "INVALID_TRANSACTION_DATE") {
      return res.status(400).json({ error: "INVALID_TRANSACTION_DATE" });
    }
    if (err?.message === "INVALID_AMOUNT") {
      return res.status(400).json({ error: "INVALID_AMOUNT" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

// GET /transactions?business_id=4
export const listMyTransactions = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;
    const items = await listTransactionsByBusinessService(businessId);
    return res.json({ items });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

// GET /transactions/:id
export const getMyTransactionById = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "INVALID_TRANSACTION_ID" });
    }

    const tx = await getTransactionByIdService(id, businessId);
    if (!tx) return res.status(404).json({ error: "TRANSACTION_NOT_FOUND" });

    return res.json({ transaction: tx });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

// PATCH /transactions/:id
export const updateMyTransactionById = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "INVALID_TRANSACTION_ID" });
    }

    const {
      client_id,
      engagement_id,
      transaction_type,
      category,
      amount,
      payment_method,
      reference_number,
      description,
      transaction_date,
    } = req.body ?? {};

    const patch: any = {};

    if (client_id !== undefined) patch.client_id = client_id;               // number | null
    if (engagement_id !== undefined) patch.engagement_id = engagement_id;   // number | null
    if (transaction_type !== undefined) patch.transaction_type = transaction_type;
    if (category !== undefined) patch.category = category;
    if (payment_method !== undefined) patch.payment_method = payment_method;
    if (reference_number !== undefined) patch.reference_number = reference_number;
    if (description !== undefined) patch.description = description;
    if (transaction_date !== undefined) patch.transaction_date = transaction_date;

    // ✅ IMPORTANT: amount est NOT NULL => on refuse null si présent
    if (amount !== undefined) {
      if (amount === null || Number.isNaN(Number(amount))) {
        return res.status(400).json({ error: "INVALID_AMOUNT" });
      }
      patch.amount = Number(amount);
    }

    const updated = await updateTransactionByIdService(id, businessId, patch);
    return res.json({ transaction: updated });
  } catch (err: any) {
    const msg = err?.message ?? "SERVER_ERROR";

    if (msg === "TRANSACTION_NOT_FOUND" || err?.code === "P2025") {
      return res.status(404).json({ error: "TRANSACTION_NOT_FOUND" });
    }
    if (msg === "CLIENT_NOT_FOUND") {
      return res.status(404).json({ error: "CLIENT_NOT_FOUND" });
    }
    if (msg === "ENGAGEMENT_NOT_FOUND") {
      return res.status(404).json({ error: "ENGAGEMENT_NOT_FOUND" });
    }
    if (msg === "INVALID_TRANSACTION_DATE") {
      return res.status(400).json({ error: "INVALID_TRANSACTION_DATE" });
    }
    if (msg === "INVALID_AMOUNT") {
      return res.status(400).json({ error: "INVALID_AMOUNT" });
    }

    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

// DELETE /transactions/:id
export const deleteMyTransactionById = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "INVALID_TRANSACTION_ID" });
    }

    await deleteTransactionByIdService(id, businessId);
    return res.status(204).send();
  } catch (err: any) {
    if (err?.message === "TRANSACTION_NOT_FOUND" || err?.code === "P2025") {
      return res.status(404).json({ error: "TRANSACTION_NOT_FOUND" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
