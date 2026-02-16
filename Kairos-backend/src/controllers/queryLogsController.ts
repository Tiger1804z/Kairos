import type { Request, Response } from "express";
import {
  createQueryLogService,
  getQueryLogsByBusinessService,
  getQueryLogsByUserService,
} from "../services/queryLogsService";
import { QueryActionType, QueryStatus } from "../../generated/prisma/client";

const isEnumValue = <T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] => typeof value === "string" && Object.values(enumObj).includes(value);

export const createQueryLogController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });

    const businessId = (req as any).businessId as number;
    if (!businessId || Number.isNaN(businessId)) {
      return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });
    }

    const {
      client_id,
      document_id,
      natural_query,
      action_type,
      generated_sql,
      status,
      error_message,
      execution_time_ms,
      model_used,
      tokens_used,
      executed_at,
    } = req.body;

    if (!natural_query || String(natural_query).trim().length === 0) {
      return res.status(400).json({ error: "natural_query is required" });
    }

    if (!isEnumValue(QueryActionType, action_type)) {
      return res.status(400).json({
        error: "Invalid action_type",
        allowed: Object.values(QueryActionType),
      });
    }

    if (status && !isEnumValue(QueryStatus, status)) {
      return res.status(400).json({
        error: "Invalid status",
        allowed: Object.values(QueryStatus),
      });
    }

    const created = await createQueryLogService({
      user_id: user.user_id,          // JWT (pas body)
      business_id: businessId,        // middleware (pas body)

      client_id: client_id != null ? Number(client_id) : null,
      document_id: document_id != null ? Number(document_id) : null,

      natural_query: String(natural_query),
      action_type,

      generated_sql: generated_sql ?? null,

      status: status ?? QueryStatus.success,
      error_message: error_message ?? null,

      execution_time_ms: execution_time_ms != null ? Number(execution_time_ms) : null,
      model_used: model_used ?? null,
      tokens_used: tokens_used != null ? Number(tokens_used) : null,

      executed_at: executed_at ? new Date(executed_at) : null,
    });

    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({
      error: "Server error while creating query log",
      details: err?.message ?? String(err),
    });
  }
};

export const getQueryLogsByBusinessController = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId as number;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    if (!businessId || Number.isNaN(businessId)) {
      return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });
    }

    const logs = await getQueryLogsByBusinessService(businessId, Number.isNaN(limit) ? 20 : limit);
    return res.status(200).json(logs);
  } catch (err: any) {
    return res.status(500).json({
      error: "Server error while fetching query logs by business",
      details: err?.message ?? String(err),
    });
  }
};

export const getQueryLogsByUserController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });

    const userId = Number(req.params.userId);
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "userId param must be a number" });
    }

    // Fix sécurité: un user ne peut pas lire les logs d’un autre user (sauf admin)
    if (user.role !== "admin" && userId !== user.user_id) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const logs = await getQueryLogsByUserService(userId, Number.isNaN(limit) ? 20 : limit);
    return res.status(200).json(logs);
  } catch (err: any) {
    return res.status(500).json({
      error: "Server error while fetching query logs by user",
      details: err?.message ?? String(err),
    });
  }
};
