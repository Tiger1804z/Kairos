import type { Request, Response } from "express";
import {
  createNewEngagementItem,
  getEngagementItemsService,
  getEngagementItemById,
  updateEngagementItemById,
  deleteEngagementItemById,
} from "../services/engagementItemsService";

// POST /engagementitems
export const createEngagementItem = async (req: Request, res: Response) => {
  try {
    const { engagement_id, business_id, item_name, item_type, quantity, unit_price } = req.body;

    const newItem = await createNewEngagementItem({
      engagement_id: Number(engagement_id),
      business_id: Number(business_id),
      item_name,
      item_type,
      quantity: Number(quantity),
      unit_price: unit_price === null || unit_price === undefined ? null : Number(unit_price),
    });

    return res.status(201).json(newItem);
  } catch (err: any) {
    console.error("Create engagement item error:", err);
    return res.status(400).json({ error: err.message ?? "Error creating engagement item" });
  }
};

// GET /engagementitems?business_id=4&engagement_id=1
export const getAllEngagementItems = async (req: Request, res: Response) => {
  try {
    const businessId = Number(req.query.business_id);
    const engagementId = req.query.engagement_id ? Number(req.query.engagement_id) : undefined;

    if (isNaN(businessId)) return res.status(400).json({ error: "business_id is required" });
    if (req.query.engagement_id && isNaN(Number(req.query.engagement_id))) {
      return res.status(400).json({ error: "engagement_id must be a number" });
    }

    const items = await getEngagementItemsService(businessId, engagementId);
    return res.status(200).json(items);
  } catch (err: any) {
    console.error("Get engagement items error:", err);
    return res.status(500).json({ error: "Server error while fetching engagement items" });
  }
};

// GET /engagementitems/:id?business_id=4
export const getEngagementItem = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    const businessId = Number(req.query.business_id);

    if (isNaN(itemId) || isNaN(businessId)) {
      return res.status(400).json({ error: "Invalid item id or business_id" });
    }

    const item = await getEngagementItemById(businessId, itemId);
    if (!item) return res.status(404).json({ error: "Engagement item not found" });

    return res.status(200).json(item);
  } catch (err: any) {
    console.error("Get engagement item error:", err);
    return res.status(500).json({ error: "Server error while fetching engagement item" });
  }
};

// PATCH /engagementitems/:id?business_id=4
export const updateEngagementItem = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    const businessId = Number(req.query.business_id);

    if (isNaN(itemId) || isNaN(businessId)) {
      return res.status(400).json({ error: "Invalid item id or business_id" });
    }

    const { item_name, item_type, quantity, unit_price } = req.body;

    const updateData: {
      item_name?: string;
      item_type?: "service" | "product";
      quantity?: number;
      unit_price?: number | null;
    } = {};

    if (item_name !== undefined) updateData.item_name = item_name;
    if (item_type !== undefined) updateData.item_type = item_type;
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (unit_price !== undefined) updateData.unit_price = unit_price === null ? null : Number(unit_price);

    const updated = await updateEngagementItemById(businessId, itemId, updateData);
    return res.status(200).json(updated);
  } catch (err: any) {
    console.error("Update engagement item error:", err);
    const msg = err.message ?? "Server error while updating engagement item";
    return res.status(msg.includes("not found") ? 404 : 400).json({ error: msg });
  }
};

// DELETE /engagementitems/:id?business_id=4
export const deleteEngagementItem = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    const businessId = Number(req.query.business_id);

    if (isNaN(itemId) || isNaN(businessId)) {
      return res.status(400).json({ error: "Invalid item id or business_id" });
    }

    await deleteEngagementItemById(businessId, itemId);
    return res.status(200).json({ message: "Engagement item deleted successfully" });
  } catch (err: any) {
    console.error("Delete engagement item error:", err);
    const msg = err.message ?? "Server error while deleting engagement item";
    return res.status(msg.includes("not found") ? 404 : 400).json({ error: msg });
  }
};
