import type { Request, Response } from "express";
import {
  createEngagementItemForBusinessService,
  listEngagementItemsByBusinessService,
  getEngagementItemByIdService,
  updateEngagementItemByIdService,
  deleteEngagementItemByIdService,
} from "../services/engagementItemsService";

// POST /engagementitems
export const createMyEngagementItem = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;

    const { engagement_id, item_name, item_type, quantity, unit_price } = req.body ?? {};

    if (!engagement_id || Number.isNaN(Number(engagement_id))) {
      return res.status(400).json({ error: "ENGAGEMENT_ID_REQUIRED" });
    }
    if (!item_name || typeof item_name !== "string") {
      return res.status(400).json({ error: "ITEM_NAME_REQUIRED" });
    }
    if (quantity === undefined || Number.isNaN(Number(quantity))) {
      return res.status(400).json({ error: "QUANTITY_REQUIRED" });
    }

    const newItem = await createEngagementItemForBusinessService({
      business_id: businessId,
      engagement_id: Number(engagement_id),
      item_name,
      item_type,
      quantity: Number(quantity),
      unit_price: unit_price === null || unit_price === undefined ? null : Number(unit_price),
    });

    return res.status(201).json({ item: newItem });
  } catch (err: any) {
    if (err.message === "ENGAGEMENT_NOT_FOUND") {
      return res.status(404).json({ error: "ENGAGEMENT_NOT_FOUND" });
    }
    if (err.message === "ENGAGEMENT_NOT_IN_BUSINESS") {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};


export const listAllMyEngagementItems = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;
    const engagementId = req.query.engagement_id ? Number(req.query.engagement_id) : undefined;

    if (req.query.engagement_id && Number.isNaN(engagementId!)) {
      return res.status(400).json({ error: "INVALID_ENGAGEMENT_ID" });
    }

    const items = await listEngagementItemsByBusinessService(businessId, engagementId);
    return res.json({ items });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};


export const listMyEngagementItemById = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "INVALID_ITEM_ID" });
    }

    const item = await getEngagementItemByIdService(itemId);
    if (!item) return res.status(404).json({ error: "ENGAGEMENT_ITEM_NOT_FOUND" });

    return res.json({ item });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const updateMyEngagementItem = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "INVALID_ITEM_ID" });
    }

    const { item_name, item_type, quantity, unit_price } = req.body ?? {};

    const patch: {
      item_name?: string;
      item_type?: any; // ajuster selon type réel
      quantity?: number;
      unit_price?: number | null;
    } = {};

    if (item_name !== undefined) patch.item_name = item_name;
    if (item_type !== undefined) patch.item_type = item_type;

    if (quantity !== undefined) patch.quantity = Number(quantity);

    if (unit_price !== undefined) {
      patch.unit_price = unit_price === null ? null : Number(unit_price);
    }

    const updated = await updateEngagementItemByIdService(itemId, patch);
    return res.status(200).json({ item: updated });
  } catch (err: any) {
    const msg = err?.message ?? "SERVER_ERROR";
    return res.status(500).json({ error: msg });
  }
};



export const deleteMyEngagementItem = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ error: "INVALID_ITEM_ID" });
    }

    await deleteEngagementItemByIdService(itemId);
    return res.status(204).send();
  } catch (err: any) {
    if (err.message === "ENGAGEMENT_ITEM_NOT_FOUND" || err?.code === "P2025") {
      return res.status(404).json({ error: "ENGAGEMENT_ITEM_NOT_FOUND" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
