import type { Request, Response } from "express";
import prisma from "../prisma/prisma";
import {
  generateShortFinanceSummary,
  generateSQLFromQuestion,
  askKairosFromSql,
} from "../services/aiService";
import { isSafeSQL } from "../services/sqlGuard";

import { askShopifyChat } from "../services/shopifyEngineClient";

// logging
import { createQueryLogService } from "../services/queryLogsService";
import { createReportService } from "../services/reportsService";
import { QueryActionType, QueryStatus, ReportType } from "../../generated/prisma/client";


export const aiDailyFinanceSummary = async (req: Request, res: Response) => {
  const t0 = Date.now();

  // ✅ businessId vient du middleware
  const businessId = (req as any).businessId as number;

  // ✅ userId vient du JWT / auth middleware
  const userId = req.user!.user_id;

  const dateStr = req.query.date?.toString();
  if (!dateStr) {
    return res.status(400).json({ error: "DATE_REQUIRED" });
  }

  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ error: "INVALID_DATE_FORMAT" });
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id_business: businessId },
      select: { name: true },
    });

    if (!business) {
      return res.status(404).json({ error: "BUSINESS_NOT_FOUND" });
    }

    const txs = await prisma.transaction.findMany({
      where: {
        business_id: businessId,
        transaction_date: { gte: start, lte: end },
      },
      select: { transaction_type: true, amount: true, category: true },
    });

    let income = 0;
    let expenses = 0;
    const byCat = new Map<string, number>();

    for (const tx of txs) {
      const amount = Number(tx.amount);
      const category = tx.category ?? "uncategorized";

      if (tx.transaction_type === "income") income += amount;
      else expenses += amount;

      const signed = tx.transaction_type === "income" ? amount : -amount;
      byCat.set(category, (byCat.get(category) ?? 0) + signed);
    }

    const net = income - expenses;

    const topCategories = [...byCat.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
      .slice(0, 5);

    const aiText = await generateShortFinanceSummary({
      businessName: business.name,
      periodLabel: `Jour: ${dateStr}`,
      income,
      expenses,
      net,
      topCategories,
    });

    const qlog = await createQueryLogService({
      user_id: userId,
      business_id: businessId,
      natural_query: `Daily summary ${dateStr}`,
      action_type: QueryActionType.summary,
      status: QueryStatus.success,
      model_used: "gpt-5.2",
      execution_time_ms: Date.now() - t0,
      executed_at: new Date(),
    });

    const report = await createReportService({
      user_id: userId,
      business_id: businessId,
      query_id: qlog.id_query,
      title: `Résumé quotidien (${dateStr})`,
      report_type: ReportType.summary,
      period_start: start,
      period_end: end,
      content: aiText,
    });

    return res.status(200).json({
      business_id: businessId,
      period: { start, end },
      totals: { income, expenses, net },
      top_categories: topCategories,
      ai_summary: aiText,
      report_id: report.id_report,
      query_id: qlog.id_query,
    });
  } catch (err: any) {
    console.error("aiDailyFinanceSummary error:", err);

    await safeLogError({
      userId,
      businessId,
      question: `Daily summary ${dateStr}`,
      t0,
      message: err?.message ?? "Unknown error",
      action_type: QueryActionType.summary,
      status: QueryStatus.error,
    });

    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const aiAsk = async (req: Request, res: Response) => {
  // ──────────────────────────────────────────────────────────────────────────
  // S0-T06 — SQL LLM legacy DÉSACTIVÉ pour la beta (décision D-SEC4).
  //
  // Cette route demandait à un LLM de GÉNÉRER du SQL (generateSQLFromQuestion),
  // puis l'exécutait via prisma.$queryRawUnsafe(). Interdit en beta :
  //   - le LLM ne doit jamais produire du SQL exécuté en production ;
  //   - le LLM ne doit pas calculer les chiffres financiers ;
  //   - ce chemin expose des tables legacy (transactions, clients, documents…).
  //
  // Le code legacy plus bas (generateSQLFromQuestion, isSafeSQL/sqlGuard,
  // $queryRawUnsafe) reste présent POUR RÉFÉRENCE mais INACTIF par défaut.
  // Réactivation explicite (JAMAIS en prod) : LEGACY_AI_SQL_ENABLED="true".
  // Par défaut (flag absent ou ≠ "true") → 410 Gone, zéro SQL LLM exécuté.
  //
  // NB: ce guard est volontairement la TOUTE PREMIÈRE instruction afin qu'aucun
  // appel à generateSQLFromQuestion ni $queryRawUnsafe ne soit atteignable
  // tant que le flag n'est pas explicitement activé.
  // ──────────────────────────────────────────────────────────────────────────
  if (process.env.LEGACY_AI_SQL_ENABLED !== "true") {
    return res.status(410).json({
      error: "FEATURE_DISABLED_FOR_BETA",
      message: "Legacy SQL AI is disabled for beta.",
    });
  }

  const t0 = Date.now();

  const businessId = (req as any).businessId as number;
  const userId = req.user!.user_id;

  const question = req.body.question?.toString()?.trim();
  if (!question || question.length < 3) {
    return res.status(400).json({ error: "QUESTION_REQUIRED" });
  }

  const startStr = req.body.start?.toString();
  const endStr = req.body.end?.toString();
  const { start, end, periodLabel } = parsePeriod(startStr, endStr);

  try {
    const business = await prisma.business.findUnique({
      where: { id_business: businessId },
      select: { name: true },
    });

    if (!business) {
      return res.status(404).json({ error: "BUSINESS_NOT_FOUND" });
    }

    const sql = await generateSQLFromQuestion({
      question,
      businessId,
      start,
      end,
    });

    if (!isSafeSQL(sql, businessId)) {
      // ✅ log en status "blocked" (plus propre pour ton QueryStatus enum)
      await safeLogError({
        userId,
        businessId,
        question,
        sql,
        t0,
        message: "Unsafe SQL generated by AI",
        action_type: QueryActionType.sql_select,
        status: QueryStatus.blocked,
      });

      return res.status(400).json({
        error: "UNSAFE_SQL",
        sql_preview: sql?.slice(0, 200) ?? "",
      });
    }

    const result = await prisma.$queryRawUnsafe(sql);

    const { aiText, normalized } = await askKairosFromSql({
      businessName: business.name,
      periodLabel,
      question,
      rawSqlResult: result,
      currencyLabel: "$ CAD",
    });

    const qlog = await createQueryLogService({
      user_id: userId,
      business_id: businessId,
      natural_query: question,
      action_type: QueryActionType.sql_select,
      generated_sql: sql,
      status: QueryStatus.success,
      model_used: "gpt-5.2",
      execution_time_ms: Date.now() - t0,
      executed_at: new Date(),
    });

    const reportContent = {
      sql,
      normalized,
      aiText,
      meta: {
        business_id: businessId,
        business_name: business.name,
        period: periodLabel,
        created_at: new Date().toISOString(),
      },
    };

    const report = await createReportService({
      user_id: userId,
      business_id: businessId,
      query_id: qlog.id_query,
      title: `Résultat SQL – ${periodLabel}`,
      report_type: ReportType.custom,
      period_start: start ?? null,
      period_end: end ?? null,
      content: JSON.stringify(reportContent, null, 2),
    });

    return res.status(200).json({
      sql,
      normalized,
      aiText,
      report_id: report.id_report,
      query_id: qlog.id_query,
      meta: {
        business_id: businessId,
        business_name: business.name,
        period: periodLabel,
        execution_time_ms: Date.now() - t0,
      },
    });
  } catch (err: any) {
    console.error("aiAsk error:", err);

    await safeLogError({
      userId,
      businessId,
      question,
      t0,
      message: err?.message ?? "Unknown error",
      action_type: QueryActionType.sql_select,
      status: QueryStatus.error,
    });

    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

const parsePeriod = (startStr?: string, endStr?: string) => {
  if (startStr && endStr) {
    const start = new Date(`${startStr}T00:00:00.000Z`);
    const end = new Date(`${endStr}T23:59:59.999Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { start: null, end: null, periodLabel: "Période non spécifiée" };
    }
    return { start, end, periodLabel: `Du ${startStr} au ${endStr}` };
  }
  return { start: null, end: null, periodLabel: "Période non spécifiée" };
};

const safeLogError = async (args: {
  userId: number;
  businessId: number;
  question: string;
  sql?: string;
  t0: number;
  message: string;
  action_type: QueryActionType;
  status: QueryStatus;
}) => {
  try {
    await createQueryLogService({
      user_id: args.userId,
      business_id: args.businessId,
      natural_query: args.question,
      action_type: args.action_type,
      generated_sql: args.sql ?? null,
      status: args.status,
      error_message: args.message,
      model_used: "gpt-5.2",
      execution_time_ms: Date.now() - args.t0,
      executed_at: new Date(),
    });
  } catch (e) {
    console.error("Failed to create query log (error):", e);
  }
};

export const aiAskShopify = async (req: Request, res: Response) => {
  const t0 = Date.now();
  const businessId = parseInt(req.params.businessId ?? "", 10);
  const userId = req.user!.user_id;
  const question = req.body.question?.toString()?.trim();
  const conversationId: number | undefined = req.body.conversationId ? parseInt(req.body.conversationId, 10) : undefined;

  if (!question || question.length < 3) {
    return res.status(400).json({ error: "QUESTION_REQUIRED" });
  }

  // 1. Charger ou créer la conversation
  let conversation;
  if (conversationId) {
    conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, business_id: businessId },
    });
    if (!conversation) {
      return res.status(404).json({ error: "CONVERSATION_NOT_FOUND" });
    }
  } else {
    conversation = await prisma.chatConversation.create({
      data: {
        business_id: businessId,
        user_id: userId,
        title: question.slice(0, 80),
      },
    });
  }

  // 2. Charger les 10 derniers messages (historique)
  const recentMessages = await prisma.chatMessage.findMany({
    where: { conversation_id: conversation.id },
    orderBy: { created_at: "asc" },
    take: 10,
  });

  const history = recentMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // 3. Fetch snapshots
  const allSnapshots = await prisma.profitabilitySnapshot.findMany({
    where: { business_id: businessId },
    orderBy: { period_end: "desc" },
    include: { product: { select: { title: true } } },
  });

  const seen = new Set<string>();
  const snapshots = allSnapshots.filter((s) => {
    if (seen.has(s.product_id)) return false;
    seen.add(s.product_id);
    return true;
  });

  // 4. Fetch insights
  const insights = await prisma.insight.findMany({
    where: { business_id: businessId },
    orderBy: { created_at: "desc" },
  });

  // 5. Appel Python avec historique
  const result = await askShopifyChat({
    business_id: businessId,
    question,
    history,
    snapshots: snapshots.map((s) => ({
      product_id: s.product_id,
      product_name: s.product?.title ?? s.product_id,
      revenue: Number(s.revenue),
      cogs: Number(s.cogs),
      gross_profit: Number(s.gross_profit),
      gross_margin_pct: Number(s.gross_margin_pct),
      units_sold: s.units_sold,
      has_cost: Number(s.cogs) > 0,
    })),
    insights: insights.map((i) => {
      const meta = (i.metadata ?? {}) as { product_id?: string; value?: number };
      return {
        type: i.type,
        title: i.title,
        description: i.message,
        severity: i.severity,
        product_id: meta.product_id ?? "",
        value: meta.value ?? 0,
      };
    }),
  });

  // 6. Sauvegarder les 2 messages en DB (métadonnées d'intent sur le message user)
  await prisma.chatMessage.createMany({
    data: [
      {
        conversation_id: conversation.id,
        role: "user",
        content: question,
        intent_family: result.intent_family ?? "unknown",
        routing_status: result.routing_status ?? "unknown",
        execution_time_ms: Date.now() - t0,
      },
      { conversation_id: conversation.id, role: "assistant", content: result.answer },
    ],
  });

  // 7. Mettre à jour updated_at de la conversation
  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updated_at: new Date() },
  });

  return res.status(200).json({
    answer: result.answer,
    conversationId: conversation.id,
  });
}

export const getConversations = async (req: Request, res: Response) => {
  const businessId = parseInt(req.params.businessId ?? "", 10);

  const conversations = await prisma.chatConversation.findMany({
    where: { business_id: businessId },
    orderBy: { updated_at: "desc" },
    select: {
      id: true,
      title: true,
      created_at: true,
      updated_at: true,
    },
  });

  return res.status(200).json({ conversations });
};

export const getChatLogs = async (req: Request, res: Response) => {
  const businessId = parseInt(req.params.businessId ?? "", 10);
  const limit = Math.min(parseInt(req.query.limit?.toString() ?? "50", 10), 200);

  const messages = await prisma.chatMessage.findMany({
    where: {
      role: "user",
      conversation: { business_id: businessId },
    },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      content: true,
      intent_family: true,
      routing_status: true,
      execution_time_ms: true,
      created_at: true,
      conversation: { select: { id: true, title: true } },
    },
  });

  return res.status(200).json({ logs: messages, count: messages.length });
};

export const getConversationMessages = async (req: Request, res: Response) => {
  const conversationId = parseInt(req.params.conversationId ?? "", 10);

  const messages = await prisma.chatMessage.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      created_at: true,
    },
  });

  return res.status(200).json({ messages });
};