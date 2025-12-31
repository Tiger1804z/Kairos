import type { Request, Response } from "express";
import { createNewEngagement, deleteEngagementById, getAllEngagements, getEngagementById, updateEngagementById } from "../services/engagementsService";

export const createMyEngagement = async (req: Request, res: Response) => {
  const {
    business_id,
    client_id,
    title,
    description,
    status,
    start_date,
    end_date,
    total_amount,
  } = req.body;
    try {
    const newEngagement = await createNewEngagement({
        business_id,
        client_id,
        title,
        description,
        status,
        start_date,
        end_date,
        total_amount,
    });
    res.status(201).json(newEngagement);
  } catch (err: any) {
    console.error("Create engagement error:", err);
    res.status(500).json({ error: "Server error while creating engagement" });
  }
};

export const listMyEngagements = async (req: Request, res: Response) => {
  const businessId = Number(req.query.business_id);

  if (isNaN(businessId)) {
    return res.status(400).json({ error: "business_id is required" });
  }

  try {
    const engagements = await getAllEngagements(businessId);
    return res.status(200).json(engagements);
  } catch (err: any) {
    console.error("Get engagements error:", err);
    return res.status(500).json({ error: "Server error while fetching engagements" });
  }
};


export const listMyEngagementById = async (req: Request, res: Response) => {
  const engagementId = Number(req.params.id);
  const businessId = Number(req.query.business_id);

  if (isNaN(engagementId) || isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid engagement ID or business ID" });
  }
  try {
    const engagement = await getEngagementById(businessId, engagementId);
    if (!engagement) {
      return res.status(404).json({ error: "Engagement not found" });
    }
    res.status(200).json(engagement);
  } catch (err: any) {
    console.error("Get engagement error:", err);
    res.status(500).json({ error: "Server error while fetching engagement" });
  }
};

export const deleteMyEngagement = async (req: Request, res: Response) => {
  const engagementId = Number(req.params.id);
  const business_Id = Number(req.query.business_id);
  if (isNaN(engagementId)) {
    return res.status(400).json({ error: "Invalid engagement ID" });
  }
  try {
    await deleteEngagementById(business_Id, engagementId );
    res.status(200).json({ message: "Engagement deleted successfully" });
  } catch (err: any) {
    if (err.message === "Engagement not found") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Delete engagement error:", err);
    res.status(500).json({ error: "Server error while deleting engagement" });
  }
};

export const updateMyEngagement = async (req: Request, res: Response) => {
  const engagementId = Number(req.params.id);
  if (isNaN(engagementId)) {
    return res.status(400).json({ error: "Invalid engagement ID" });
  }
  const { title, description, status, start_date, end_date, total_amount } = req.body;

  try {
    const updatedEngagement = await updateEngagementById(engagementId, {
      title,
      description,
      status,
      start_date,
      end_date,
      total_amount,
    });
    res.status(200).json(updatedEngagement);
  } catch (err: any) {
    if (err.message === "Engagement not found") {
      return res.status(404).json({ error: err.message });
    }
    console.error("Update engagement error:", err);
    res.status(500).json({ error: "Server error while updating engagement" });
  }
};