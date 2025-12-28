import type { Request, Response } from "express";
import {
  createQueryLogService,
  getQueryLogsByBusinessService,
  getQueryLogsByUserService,
} from "../services/queryLogsService";
import { QueryActionType, QueryStatus } from "../../generated/prisma/client";

/**
 * Petit helper: check si une string est une valeur d'enum
 * (sinon on renvoie 400 au lieu de crash)
 */
const isEnumValue = <T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] => typeof value === "string" && Object.values(enumObj).includes(value);

/**
 * POST /query-logs
 * On crée un log IA (question / sql / status / etc.)
 */
export const createQueryLogController = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      business_id,
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

    // check rapides (on reste simple)
    const userIdNum = Number(user_id);
    const businessIdNum = Number(business_id);

    if (isNaN(userIdNum) || isNaN(businessIdNum)) {
      return res.status(400).json({ error: "user_id and business_id are required (number)" });
    }

    if (!natural_query || String(natural_query).trim().length === 0) {
      return res.status(400).json({ error: "natural_query is required" });
    }

    // action_type doit être dans l'enum Prisma
    if (!isEnumValue(QueryActionType, action_type)) {
      return res.status(400).json({
        error: "Invalid action_type",
        allowed: Object.values(QueryActionType),
      });
    }

    // status (optionnel)
    if (status && !isEnumValue(QueryStatus, status)) {
      return res.status(400).json({
        error: "Invalid status",
        allowed: Object.values(QueryStatus),
      });
    }

    const created = await createQueryLogService({
      user_id: userIdNum,
      business_id: businessIdNum,

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

/**
 * GET /query-logs/business/:businessId?limit=20
 * Logs par business (dashboard)
 */
export const getQueryLogsByBusinessController = async (req: Request, res: Response) => {
  try {
    const businessId = Number(req.params.businessId);
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    if (isNaN(businessId)) {
      return res.status(400).json({ error: "businessId param must be a number" });
    }

    const logs = await getQueryLogsByBusinessService(businessId, isNaN(limit) ? 20 : limit);
    return res.status(200).json(logs);
  } catch (err: any) {
    return res.status(500).json({
      error: "Server error while fetching query logs by business",
      details: err?.message ?? String(err),
    });
  }
};

/**
 * GET /query-logs/user/:userId?limit=20
 * Logs par user (audit / activité)
 */
export const getQueryLogsByUserController = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "userId param must be a number" });
    }

    const logs = await getQueryLogsByUserService(userId, isNaN(limit) ? 20 : limit);
    return res.status(200).json(logs);
  } catch (err: any) {
    return res.status(500).json({
      error: "Server error while fetching query logs by user",
      details: err?.message ?? String(err),
    });
  }
};
