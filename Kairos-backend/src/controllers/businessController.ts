import type { Request, Response } from "express";
import prisma from "../prisma/prisma"; // adapte le chemin si ton fichier est ailleurs

import { createNewBusiness,deleteBusinessService,getBusinessesService,getOneBusinessById, updateBusinessService} from "../services/businessService";

export const createBusiness = async (req: Request, res: Response) => {
  try {
    const business = await createNewBusiness(req.body);
    res.status(201).json(business);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getBusinesses = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user_id;

    const businesses = await getBusinessesService(userId);
    return res.status(200).json(businesses);
  } catch (err) {
    console.error("Get businesses error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const getBusinessById = async (req: Request, res: Response) => {
  const businessId = Number(req.params.id);
  if (isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid business ID" });
  }
  try {
    const business = await getOneBusinessById(businessId); 
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }
    res.status(200).json(business);
  } catch (err) {
    console.error("Get business error:", err);
    res.status(500).json({ error: "Server error while fetching business" });
  }
};

export const updateBusiness = async (req: Request, res: Response) => {
  const businessId = Number(req.params.id);
  if (isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid business ID" });
  }
  const { owner_id, name, business_type, city, country, currency, timezone, is_active } = req.body;

  try {
    const updatedBusiness = await updateBusinessService(businessId, {
      owner_id,
      name,
      business_type,
      city,
      country,
      currency,
      timezone,
      is_active,
    });
    res.status(200).json(updatedBusiness);
  } catch (err: any) {
  console.error("Update business error:", err);
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Business not found" });
  }
  res.status(500).json({ error: "Server error while updating business" });
}
};

export const deleteBusiness = async (req: Request, res: Response) => {
  const businessId = Number(req.params.id);
  if (isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid business ID" });
  }
  try {
    await deleteBusinessService(businessId);
    res.status(204).send();
  } catch (err) {
    console.error("Delete business error:", err);
    res.status(500).json({ error: "Server error while deleting business" });
  }
};
