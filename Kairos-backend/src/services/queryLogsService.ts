import prisma from "../prisma/prisma";
import { QueryActionType, QueryStatus } from "../../generated/prisma/client";



/**
 * Service pour sauvegarder les requêtes IA de Kairos
 * Ici c'est du "logging": on garde la question, l'action, le status,
 * et (si on en a) le SQL généré + infos de perf.
 */

type CreateQueryLogInput = {
  user_id: number;
  business_id: number;

  // optionnel
  client_id?: number | null;
  document_id?: number | null;

  // la question en langage naturel (celle du user)
  natural_query: string;

  // ex: QueryActionType.ai_ask, QueryActionType.sql_select, etc.
  action_type: QueryActionType;

  // si  génères du SQL (optionnel)
  generated_sql?: string | null;

  // status: success | error | blocked
  status?: QueryStatus;

  // si erreur
  error_message?: string | null;

  // perf / tracking (optionnel)
  execution_time_ms?: number | null;
  model_used?: string | null;     // ex: "gpt-4o-mini"
  tokens_used?: number | null;

  // si on veux logger quand la requête a été exécutée
  executed_at?: Date | null;
};

export const createQueryLogService = async (data: CreateQueryLogInput) => {
  // petit guard (pas obligé, mais ça évite des logs vides)
  if (!data.natural_query || data.natural_query.trim().length === 0) {
    throw new Error("natural_query is required");
  }

  return prisma.queryLog.create({
    data: {
      user_id: data.user_id,
      business_id: data.business_id,

      client_id: data.client_id ?? null,
      document_id: data.document_id ?? null,

      natural_query: data.natural_query,
      action_type: data.action_type,

      generated_sql: data.generated_sql ?? null,

      status: data.status ?? QueryStatus.success,
      error_message: data.error_message ?? null,

      execution_time_ms: data.execution_time_ms ?? null,
      model_used: data.model_used ?? null,
      tokens_used: data.tokens_used ?? null,

      executed_at: data.executed_at ?? null,
    },
  });
};

/**
 * Récupérer l'historique des logs IA (par business)
 * (utile pour un dashboard / audit)
 */
export const getQueryLogsByBusinessService = async (businessId: number, limit = 20) => {
  return prisma.queryLog.findMany({
    where: { business_id: businessId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
};

/**
 * Récupérer l'historique des logs (par user) - si tu veux voir qui fait quoi
 */
export const getQueryLogsByUserService = async (userId: number, limit = 20) => {
  return prisma.queryLog.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
};