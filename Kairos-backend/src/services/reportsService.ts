import prisma from "../prisma/prisma";
import { ReportType } from "../../generated/prisma/client";

type CreateReportInput = {
  user_id: number;
  business_id: number;
  query_id?: number | null;

  title: string;
  report_type: ReportType;

  period_start?: Date | null;
  period_end?: Date | null;

  content: string;
  file_path?: string | null;

  is_favorite?: boolean;
};

export const createReportService = async (data: CreateReportInput) => {
  const queryId = data.query_id ?? null;

  // 1) Si pas de query_id -> create manuel
  if (!queryId) {
    return prisma.report.create({
      data: {
        user_id: data.user_id,
        business_id: data.business_id,
        query_id: null,

        title: data.title,
        report_type: data.report_type,

        period_start: data.period_start ?? null,
        period_end: data.period_end ?? null,

        content: data.content,
        file_path: data.file_path ?? null,

        is_favorite: data.is_favorite ?? false,
      },
    });
  }

  // 2) Vérifier QueryLog existe + appartient au même business (✅ fix)
  const qlog = await prisma.queryLog.findUnique({
    where: { id_query: queryId },
    select: { id_query: true, business_id: true },
  });

  if (!qlog || qlog.business_id !== data.business_id) {
    // fallback: report manuel (query_id = null) pour ne pas casser ton flow
    return prisma.report.create({
      data: {
        user_id: data.user_id,
        business_id: data.business_id,
        query_id: null,

        title: data.title,
        report_type: data.report_type,

        period_start: data.period_start ?? null,
        period_end: data.period_end ?? null,

        content: data.content,
        file_path: data.file_path ?? null,

        is_favorite: data.is_favorite ?? false,
      },
    });
  }

  // 3) Si report existe déjà pour query_id, update
  const existing = await prisma.report.findUnique({
    where: { query_id: queryId },
    select: { id_report: true, business_id: true },
  });

  if (existing) {
    // ✅ fix: défense en profondeur, si jamais mismatch tenant
    if (existing.business_id !== data.business_id) {
      // on fallback: create manuel
      return prisma.report.create({
        data: {
          user_id: data.user_id,
          business_id: data.business_id,
          query_id: null,

          title: data.title,
          report_type: data.report_type,

          period_start: data.period_start ?? null,
          period_end: data.period_end ?? null,

          content: data.content,
          file_path: data.file_path ?? null,

          is_favorite: data.is_favorite ?? false,
        },
      });
    }

    return prisma.report.update({
      where: { id_report: existing.id_report },
      data: {
        title: data.title,
        report_type: data.report_type,

        period_start: data.period_start ?? null,
        period_end: data.period_end ?? null,

        content: data.content,
        file_path: data.file_path ?? null,

        ...(data.is_favorite !== undefined ? { is_favorite: data.is_favorite } : {}),
      },
    });
  }

  // 4) Create normal avec query_id valide
  return prisma.report.create({
    data: {
      user_id: data.user_id,
      business_id: data.business_id,
      query_id: queryId,

      title: data.title,
      report_type: data.report_type,

      period_start: data.period_start ?? null,
      period_end: data.period_end ?? null,

      content: data.content,
      file_path: data.file_path ?? null,

      is_favorite: data.is_favorite ?? false,
    },
  });
};

export const getReportsByBusinessService = async (businessId: number, limit = 20) => {
  return prisma.report.findMany({
    where: { business_id: businessId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
};

export const getReportsByUserService = async (userId: number, limit = 20) => {
  return prisma.report.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
};

// ✅ fix: filtre tenant
export const getReportByIdService = async (reportId: number, businessId: number) => {
  return prisma.report.findFirst({
    where: { id_report: reportId, business_id: businessId },
  });
};

// ✅ fix: filtre tenant + check existence
export const toggleFavoriteReportService = async (
  reportId: number,
  businessId: number,
  isFavorite: boolean
) => {
  const existing = await prisma.report.findFirst({
    where: { id_report: reportId, business_id: businessId },
    select: { id_report: true },
  });

  if (!existing) throw new Error("REPORT_NOT_FOUND");

  return prisma.report.update({
    where: { id_report: reportId },
    data: { is_favorite: isFavorite },
  });
};
