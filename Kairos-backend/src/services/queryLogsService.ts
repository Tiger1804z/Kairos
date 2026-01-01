import prisma from "../prisma/prisma";
import { QueryActionType, QueryStatus } from "../../generated/prisma/client";

type CreateQueryLogInput = {
  user_id: number;
  business_id: number;

  client_id?: number | null;
  document_id?: number | null;

  natural_query: string;
  action_type: QueryActionType;

  generated_sql?: string | null;

  status?: QueryStatus;
  error_message?: string | null;

  execution_time_ms?: number | null;
  model_used?: string | null;
  tokens_used?: number | null;

  executed_at?: Date | null;
};

export const createQueryLogService = async (data: CreateQueryLogInput) => {
  if (!data.natural_query || data.natural_query.trim().length === 0) {
    throw new Error("natural_query is required");
  }

  // ✅ Fix: défense en profondeur sur client_id / document_id (optionnel)
  if (data.client_id != null) {
    const ok = await prisma.client.findFirst({
      where: { id_client: data.client_id, business_id: data.business_id },
      select: { id_client: true },
    });
    if (!ok) throw new Error("CLIENT_NOT_FOUND");
  }

  if (data.document_id != null) {
    const ok = await prisma.document.findFirst({
      where: { id_document: data.document_id, business_id: data.business_id },
      select: { id_document: true },
    });
    if (!ok) throw new Error("DOCUMENT_NOT_FOUND");
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

export const getQueryLogsByBusinessService = async (businessId: number, limit = 20) => {
  return prisma.queryLog.findMany({
    where: { business_id: businessId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
};

export const getQueryLogsByUserService = async (userId: number, limit = 20) => {
  return prisma.queryLog.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
};
