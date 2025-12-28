import type { Request, Response } from "express";
import { ReportType } from "../../generated/prisma/client";
import {
  createReportService,
  getReportsByBusinessService,
  getReportsByUserService,
  getReportByIdService,
  toggleFavoriteReportService,
} from "../services/reportsService";
import prisma from "../prisma/prisma";

// helper enum check (même style que QueryLog)
const isEnumValue = <T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] => typeof value === "string" && Object.values(enumObj).includes(value);

export const createReportController = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      business_id,
      query_id,
      title,
      report_type,
      period_start,
      period_end,
      content,
      file_path,
      is_favorite,
    } = req.body;

    const userId = Number(user_id);
    const businessId = Number(business_id);
    const queryId = query_id != null ? Number(query_id) : null;

    if (isNaN(userId) || isNaN(businessId)) {
      return res.status(400).json({ error: "user_id and business_id are required (number)" });
    }
    if (query_id != null && isNaN(queryId as any)) {
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
      user_id: userId,
      business_id: businessId,
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
    // si query_id est @unique et tu essaies de créer 2 reports pour le même query_id
    // Prisma va throw -> on renvoie un 400 plus clair
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
  const businessId = Number(req.params.businessId);
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  if (isNaN(businessId)) {
    return res.status(400).json({ error: "businessId must be a number" });
  }

  const reports = await getReportsByBusinessService(businessId, isNaN(limit) ? 20 : limit);
  return res.status(200).json(reports);
};



export const getReportsByUserController = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  if (isNaN(userId)) {
    return res.status(400).json({ error: "userId must be a number" });
  }

  const reports = await getReportsByUserService(userId, isNaN(limit) ? 20 : limit);
  return res.status(200).json(reports);
};



export const getReportByIdController = async (req: Request, res: Response) => {
  const reportId = Number(req.params.id);

  if (isNaN(reportId)) {
    return res.status(400).json({ error: "report id must be a number" });
  }

  const report = await getReportByIdService(reportId);
  if (!report) return res.status(404).json({ error: "Report not found" });

  return res.status(200).json(report);
};



export const toggleFavoriteReportController = async (
  req: Request,
  res: Response
) => {
  const reportId = Number(req.params.id);

  if (isNaN(reportId)) {
    return res.status(400).json({ error: "Invalid report id" });
  }

  // Récupération du report avant modification
  const report = await prisma.report.findUnique({
    where: { id_report: reportId },
  });

  /**
   * Sécurité:
   * - Impossible de toggler un report inexistant
   * - Évite les erreurs Prisma + crash runtime
   */
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  const updated = await toggleFavoriteReportService(
    reportId,
    !report.is_favorite
  );

  return res.status(200).json(updated);
};