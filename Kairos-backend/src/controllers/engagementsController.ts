import type { Request, Response } from "express";
import {
  createEngagementForBusinessService,
  listEngagementsByBusinessService,
  getEngagementByIdService,
  updateEngagementByIdService,
  deleteEngagementByIdService,
} from "../services/engagementsService";

// --------------------
// MY (user connecté) - business scoped
// --------------------

export const createMyEngagement = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;

    const {
      client_id,
      title,
      description,
      status,
      start_date,
      end_date,
      total_amount,
    } = req.body ?? {};

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "TITLE_REQUIRED" });
    }

    const engagement = await createEngagementForBusinessService({
      business_id: businessId, //  forcé
      client_id,
      title: title.trim(),
      description,
      status,
      start_date,
      end_date,
      total_amount,
    });

    return res.status(201).json({ engagement });
  } catch (err: any) {
    if (err.message === "CLIENT_NOT_FOUND") {
      return res.status(404).json({ error: "CLIENT_NOT_FOUND" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const listMyEngagements = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;
    const items = await listEngagementsByBusinessService(businessId);
    return res.json({ items });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const listMyEngagementById = async (req: Request, res: Response) => {
  try {
    const engagementId = Number(req.params.id);
    if (!engagementId || Number.isNaN(engagementId)) {
      return res.status(400).json({ error: "INVALID_ENGAGEMENT_ID" });
    }

    const engagement = await getEngagementByIdService(engagementId);
    if (!engagement) return res.status(404).json({ error: "ENGAGEMENT_NOT_FOUND" });

    return res.json({ engagement });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const updateMyEngagement = async (req: Request, res: Response) => {
  try {
    const engagementId = Number(req.params.id);
    if (!engagementId || Number.isNaN(engagementId)) {
      return res.status(400).json({ error: "INVALID_ENGAGEMENT_ID" });
    }

    //  allowlist
    const { title, description, status, start_date, end_date, total_amount } = req.body ?? {};

    const updated = await updateEngagementByIdService(engagementId, {
      title,
      description,
      status,
      start_date,
      end_date,
      total_amount,
    });

    return res.json({ engagement: updated });
  } catch (err: any) {
    if (err.message === "ENGAGEMENT_NOT_FOUND" || err?.code === "P2025") {
      return res.status(404).json({ error: "ENGAGEMENT_NOT_FOUND" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const deleteMyEngagement = async (req: Request, res: Response) => {
  try {
    const engagementId = Number(req.params.id);
    if (!engagementId || Number.isNaN(engagementId)) {
      return res.status(400).json({ error: "INVALID_ENGAGEMENT_ID" });
    }

    await deleteEngagementByIdService(engagementId);
    return res.status(204).send();
  } catch (err: any) {
    if (err.message === "ENGAGEMENT_NOT_FOUND" || err?.code === "P2025") {
      return res.status(404).json({ error: "ENGAGEMENT_NOT_FOUND" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
