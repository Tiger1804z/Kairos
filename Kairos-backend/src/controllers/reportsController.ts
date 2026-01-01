import type { Request, Response } from "express";
import { ReportType } from "../../generated/prisma/client";
import {
  createReportService,
  getReportsByBusinessService,
  getReportsByUserService,
  getReportByIdService,
  toggleFavoriteReportService,
} from "../services/reportsService";

// helper enum check
const isEnumValue = <T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] => typeof value === "string" && Object.values(enumObj).includes(value);

export const createReportController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });

    const businessId = (req as any).businessId as number;

    const {
      query_id,
      title,
      report_type,
      period_start,
      period_end,
      content,
      file_path,
      is_favorite,
    } = req.body;

    const queryId = query_id != null ? Number(query_id) : null;

    if (!businessId || Number.isNaN(businessId)) {
      return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });
    }
    if (query_id != null && Number.isNaN(queryId as any)) {
      return res.status(400).json({ error: "query_id must be a number or null" });
    }
    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!content || String(content).trim().length === 0) {
      return res.status(400).json({ error: "content is required" });
    }
    if (!isEnumValue(ReportType, report_type)) {
      return res.status(400).json({
        error: "Invalid report_type",
        allowed: Object.values(ReportType),
      });
    }

    const created = await createReportService({
      user_id: user.user_id,          // ✅ depuis JWT
      business_id: businessId,        // ✅ depuis middleware
      query_id: queryId,

      title: String(title),
      report_type,

      period_start: period_start ? new Date(period_start) : null,
      period_end: period_end ? new Date(period_end) : null,

      content: String(content),
      file_path: file_path ?? null,

      is_favorite: Boolean(is_favorite ?? false),
    });

    return res.status(201).json(created);
  } catch (err: any) {
    if (String(err?.message ?? "").includes("Unique constraint failed")) {
      return res.status(400).json({ error: "This query_id already has a report (query_id is unique)." });
    }

    return res.status(500).json({
      error: "Server error while creating report",
      details: err?.message ?? String(err),
    });
  }
};

export const getReportsByBusinessController = async (req: Request, res: Response) => {
  const businessId = (req as any).businessId as number;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  if (!businessId || Number.isNaN(businessId)) {
    return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });
  }

  const reports = await getReportsByBusinessService(businessId, Number.isNaN(limit) ? 20 : limit);
  return res.status(200).json(reports);
};

export const getReportsByUserController = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });

  const userId = Number(req.params.userId);
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: "userId must be a number" });
  }

  // ✅ Fix sécurité: un user ne peut pas lire les reports d’un autre user (sauf admin)
  if (user.role !== "admin" && userId !== user.user_id) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const reports = await getReportsByUserService(userId, Number.isNaN(limit) ? 20 : limit);
  return res.status(200).json(reports);
};

export const getReportByIdController = async (req: Request, res: Response) => {
  const reportId = Number(req.params.id);
  const businessId = (req as any).businessId as number;

  if (Number.isNaN(reportId)) {
    return res.status(400).json({ error: "report id must be a number" });
  }

  const report = await getReportByIdService(reportId, businessId);
  if (!report) return res.status(404).json({ error: "Report not found" });

  return res.status(200).json(report);
};

export const toggleFavoriteReportController = async (req: Request, res: Response) => {
  const reportId = Number(req.params.id);
  const businessId = (req as any).businessId as number;

  if (Number.isNaN(reportId)) {
    return res.status(400).json({ error: "Invalid report id" });
  }

  // ✅ on lit le report en mode tenant-safe via service
  const report = await getReportByIdService(reportId, businessId);
  if (!report) return res.status(404).json({ error: "Report not found" });

  const updated = await toggleFavoriteReportService(reportId, businessId, !report.is_favorite);
  return res.status(200).json(updated);
};
