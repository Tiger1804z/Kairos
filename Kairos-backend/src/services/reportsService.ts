import prisma from "../prisma/prisma";
import { ReportType } from "../../generated/prisma/client";

/**
 * Reports = le "résultat final" qu'on veut garder (texte IA, rapport, etc.)
 * QueryLog = la trace (audit: qui a demandé quoi, status, perf)
 */

type CreateReportInput = {
  user_id: number;
  business_id: number;

  // si tu veux relier au QueryLog (souvent oui)
  query_id?: number | null;

  title: string;
  report_type: ReportType;

  period_start?: Date | null;
  period_end?: Date | null;

  content: string; // texte (ou JSON stringifié si tu veux)
  file_path?: string | null;

  is_favorite?: boolean;
};

export const createReportService = async (data: CreateReportInput) => {
  /**
   * Memo:
   * - query_id est optionnel
   * - si query_id est fourni:
   *    1) vérifier qu’il existe dans query_logs (sinon FK error)
   *    2) query_id est UNIQUE dans reports -> si déjà utilisé, faire update au lieu de create
   */

  // Normaliser
  const queryId = data.query_id ?? null;

  // 1) Si pas de query_id -> create "manuel"
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

  // 2) Vérifier que le QueryLog existe (sinon FK constraint)
  const qlog = await prisma.queryLog.findUnique({
    where: { id_query: queryId },
    select: { id_query: true },
  });

  if (!qlog) {
    /**
     * Memo:
     * - Ne jamais créer un report avec query_id invalide
     * - Deux options possibles:
     *    A) throw (plus strict)
     *    B) fallback -> créer report manuel (query_id = null)
     *
     * Ici: fallback pour éviter de casser le flow en prod.
     */
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

  // 3) Si un report existe déjà pour ce query_id (unique), update au lieu de create
  const existing = await prisma.report.findUnique({
    where: { query_id: queryId },
    select: { id_report: true },
  });

  if (existing) {
    return prisma.report.update({
      where: { id_report: existing.id_report },
      data: {
        // Memo: garder query_id inchangé, juste mettre à jour le contenu/metadata
        title: data.title,
        report_type: data.report_type,

        period_start: data.period_start ?? null,
        period_end: data.period_end ?? null,

        content: data.content,
        file_path: data.file_path ?? null,

        // Memo: si is_favorite pas fourni, ne pas écraser la valeur existante
        ...(data.is_favorite !== undefined ? { is_favorite: data.is_favorite } : {}),
      },
    });
  }

  // 4) Sinon create normal avec query_id valide
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

export const getReportByIdService = async (reportId: number) => {
  return prisma.report.findUnique({
    where: { id_report: reportId },
  });
};

export const toggleFavoriteReportService = async (reportId: number, isFavorite: boolean) => {
  return prisma.report.update({
    where: { id_report: reportId },
    data: { is_favorite: isFavorite },
  });
};