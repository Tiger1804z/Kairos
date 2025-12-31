import type { Request, Response } from "express";
import {
  createBusinessForOwnerService,
  listBusinessesByOwnerService,
  getBusinessByIdService,
  updateBusinessByIdService,
  deleteBusinessByIdService,
} from "../services/businessService";

// --------------------
// MY (user connecté)
// --------------------
export const createMyBusiness = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "AUTH_REQUIRED" });

    const owner_id = req.user.user_id; // 🔒 forcé
    const { name, business_type, city, country, currency, timezone, is_active } = req.body;

    const business = await createBusinessForOwnerService({
      owner_id,
      name,
      business_type,
      city,
      country,
      currency,
      timezone,
      is_active,
    });

    return res.status(201).json({ business });
  } catch (error: any) {
    const msg = error?.message ?? "SERVER_ERROR";
    if (msg === "BUSINESS_NAME_ALREADY_EXISTS") {
      return res.status(400).json({ error: "BUSINESS_NAME_ALREADY_EXISTS" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const listMyBusinesses = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "AUTH_REQUIRED" });

    const businesses = await listBusinessesByOwnerService(req.user.user_id);
    return res.status(200).json({ items: businesses });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const getMyBusinessById = async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });

    const business = await getBusinessByIdService(businessId);
    if (!business) return res.status(404).json({ error: "BUSINESS_NOT_FOUND" });

    return res.status(200).json({ business });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const updateMyBusinessById = async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });

    const { name, business_type, city, country, currency, timezone, is_active } = req.body ?? {};

    const updated = await updateBusinessByIdService(businessId, {
      name,
      business_type,
      city,
      country,
      currency,
      timezone,
      is_active,
    });

    return res.status(200).json({ business: updated });
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "BUSINESS_NOT_FOUND" });
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const deleteMyBusinessById = async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });

    await deleteBusinessByIdService(businessId);
    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "BUSINESS_NOT_FOUND" });
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
