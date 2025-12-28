import type { Request, Response } from "express";
import prisma from "../prisma/prisma";
import {  generateShortFinanceSummary } from "../services/aiService";
import { generateSQLFromQuestion } from "../services/aiService";
import { isSafeSQL } from "../services/sqlGuard";
import { normalizeSqlResult } from "../utils/sqlResultNormalizer";
import { askKairosFromSql } from "../services/aiService";

//  logging
import { createQueryLogService } from "../services/queryLogsService";
import { QueryActionType, QueryStatus, ReportType } from "../../generated/prisma/client";
import { createReportService } from "../services/reportsService";

export const aiDailyFinanceSummary = async (req: Request, res: Response) => {
  // 1) Inputs en query string (option A)
  const businessId = Number(req.query.business_id);
  const userId = Number(req.query.user_id);
  const dateStr = req.query.date?.toString();

  // 2) Guards (on bloque vite si quelque chose manque)
  if (isNaN(businessId)) {
    return res.status(400).json({ error: "business_id is required" });
  }
  if (isNaN(userId)) {
    return res.status(400).json({ error: "user_id is required" });
  }
  if (!dateStr) {
    return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
  }

  // 3) Période du jour (UTC)
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }

  // 4) Timer perf (temps total du endpoint)
  const t0 = Date.now();

  try {
    // 5) Vérifier business
    const business = await prisma.business.findUnique({
      where: { id_business: businessId },
      select: { name: true },
    });

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // 6) Transactions du jour
    const txs = await prisma.transaction.findMany({
      where: {
        business_id: businessId,
        transaction_date: { gte: start, lte: end },
      },
      select: { transaction_type: true, amount: true, category: true },
    });

    // 7) Calcul des agrégats + top catégories
    let income = 0;
    let expenses = 0;

    const byCat = new Map<string, number>(); // category -> total (income +, expense -)

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

    // 8) Appel IA (résumé court)
    const aiText = await generateShortFinanceSummary({
      businessName: business.name,
      periodLabel: `Jour: ${dateStr}`,
      income,
      expenses,
      net,
      topCategories,
    });

    // 9) QueryLog (trace/audit)
    const qlog = await createQueryLogService({
      user_id: userId,
      business_id: businessId,
      natural_query: `Daily summary ${dateStr}`,
      action_type: QueryActionType.summary,
      status: QueryStatus.success,
      model_used: "gpt-4o-mini",
      execution_time_ms: Date.now() - t0,
      executed_at: new Date(),
    });

    // 10) Report (contenu qu'on garde)
    const report = await createReportService({
      user_id: userId,
      business_id: businessId,
      query_id: qlog.id_query, // 1-1 (unique)
      title: `Résumé quotidien (${dateStr})`,
      report_type: ReportType.summary,
      period_start: start,
      period_end: end,
      content: aiText,
    });

    // 11) Réponse API (on renvoie aussi report_id pour que le frontend puisse l’ouvrir)
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

    // 12) Log d’erreur (userId déjà validé, donc pas de FK fail)
    try {
      await createQueryLogService({
        user_id: userId,
        business_id: businessId,
        natural_query: `Daily summary ${dateStr}`,
        action_type: QueryActionType.summary,
        status: QueryStatus.error,
        error_message: err?.message ?? "Unknown error",
        model_used: "gpt-4o-mini",
        execution_time_ms: Date.now() - t0,
        executed_at: new Date(),
      });
    } catch (logErr) {
      console.error("Failed to create query log (daily summary error):", logErr);
    }

    return res.status(500).json({ error: "Server error while generating AI summary" });
  }
};


/**
 * aiAsk v2
 * - Question -> SQL -> DB
 * - Sécurité: guard strict + allowlist table + business_id + LIMIT
 * - Dates: start/end optionnels
 * - Logging: query_logs (success/error)
 * - Report: reports ()
 */
export const aiAsk = async (req: Request, res: Response) => {
  const t0 = Date.now();

  const businessId = Number(req.body.business_id);
  const userId = Number(req.body.user_id); // Memo: temporaire tant que JWT non branché
  const question = req.body.question?.toString()?.trim();

  if (Number.isNaN(businessId)) {
    return res.status(400).json({ error: "business_id is required" });
  }
  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: "user_id is required" });
  }
  if (!question || question.length < 3) {
    return res.status(400).json({ error: "question is required" });
  }

  // Memo: dates optionnelles
  const startStr = req.body.start?.toString();
  const endStr = req.body.end?.toString();

  const { start, end, periodLabel } = parsePeriod(startStr, endStr);

  try {
    // Memo: business doit exister
    const business = await prisma.business.findUnique({
      where: { id_business: businessId },
      select: { name: true },
    });

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Memo: générer SQL
    const sql = await generateSQLFromQuestion({
      question,
      businessId,
      start,
      end,
    });

    // Memo: sécuriser SQL
    if (!isSafeSQL(sql, businessId)) {
      // Log erreur (best-effort)
      await safeLogError({
        userId,
        businessId,
        question,
        sql,
        t0,
        message: "Unsafe SQL generated by AI",
      });

      return res.status(400).json({
        error: "Unsafe SQL generated by AI",
        sql_preview: sql?.slice(0, 200) ?? "",
      });
    }

    // Memo: exécution SQL (unsafe mais contrôlé par guard)
    const result = await prisma.$queryRawUnsafe(sql);

    

    // Memo: optional narrative text from Kairos (based on normalized only)
     const { aiText, normalized } = await askKairosFromSql({
      businessName: business.name,
      periodLabel,
      question,
      rawSqlResult: result,
      currencyLabel: "$ CAD",
    });

    // Memo: log succès
    const qlog = await createQueryLogService({
      user_id: userId,
      business_id: businessId,
      natural_query: question,

      action_type: QueryActionType.sql_select,
      generated_sql: sql,

      status: QueryStatus.success,
      model_used: "gpt-4o-mini",
      execution_time_ms: Date.now() - t0,
      executed_at: new Date(),
    });

    // Memo: report (historique utilisateur)
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

    // Memo: réponse API (front-friendly)
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
    console.error("aiAsk v2 error:", err);

    await safeLogError({
      userId , 
      businessId,
      question,
      t0,
      message: err?.message ?? "Unknown error",
    });

    return res.status(500).json({ error: "Server error while processing AI SQL query" });
  }
};

/**
 * Memo: parsing période optionnelle
 * - Si start & end fournis (YYYY-MM-DD), convertir en UTC day range
 * - Sinon: période non spécifiée
 */
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

/**
 * Memo: logging d’erreur best-effort (ne doit jamais casser la réponse)
 */
const safeLogError = async (args: {
  userId: number;
  businessId: number;
  question: string;
  sql?: string;
  t0: number;
  message: string;
}) => {
  try {
    await createQueryLogService({
      user_id: args.userId,
      business_id: args.businessId,
      natural_query: args.question,

      action_type: QueryActionType.sql_select,
      generated_sql: args.sql ?? null,

      status: QueryStatus.error,
      error_message: args.message,
      model_used: "gpt-4o-mini",
      execution_time_ms: Date.now() - args.t0,
      executed_at: new Date(),
    });
  } catch (e) {
    console.error("Failed to create query log (error):", e);
  }
};