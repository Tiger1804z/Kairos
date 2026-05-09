import type { Request, Response } from "express";
import prisma from "../prisma/prisma";
import { computeInsights } from "../services/shopifyEngineClient";

export async function handleComputeInsights(req: Request, res: Response) {
  const businessId = parseInt(req.params.businessId ?? "", 10);
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = now;

  const periodStartStr = periodStart.toISOString().split("T")[0]!;
  const periodEndStr = periodEnd.toISOString().split("T")[0]!;

  // 1. Récupérer le snapshot le plus récent par produit pour ce business
  const allSnapshots = await prisma.profitabilitySnapshot.findMany({
    where: { business_id: businessId },
    orderBy: { calculated_at: "desc" },
    include: { product: { select: { title: true } } },
  });

  // Garder un seul snapshot par product_id (le plus récent)
  const seen = new Set<string>();
  const snapshots = allSnapshots.filter((s) => {
    if (seen.has(s.product_id)) return false;
    seen.add(s.product_id);
    return true;
  });

  if (snapshots.length === 0) {
    return res.json({ insights: [], message: "Aucun snapshot disponible. Calculez d'abord la profitabilité." });
  }

  // 2. Récupérer les order items avec leur order (pour remises + statut)
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: { business_id: businessId },
      product_id: { not: null },
    },
    select: {
      product_id: true,
      quantity: true,
      unit_price: true,
      order: {
        select: {
          financial_status: true,
          total_discounts: true,
          total_price: true,
        },
      },
    },
  });

  // 3. Appeler Python
  const insights = await computeInsights({
    business_id: businessId,
    period_start: periodStartStr,
    period_end: periodEndStr,
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
    order_items: orderItems.map((i) => {
      const unitPrice = Number(i.unit_price);
      const lineTotal = unitPrice * i.quantity;
      const orderTotal = Number(i.order.total_price);
      // Proportion de la ligne dans l'order pour distribuer les remises/remboursements
      const ratio = orderTotal > 0 ? lineTotal / orderTotal : 0;
      const discountShare = Number(i.order.total_discounts) * ratio;
      const refundedAmount = i.order.financial_status === "refunded" ? lineTotal : 0;

      return {
        product_id: i.product_id!,
        quantity: i.quantity,
        unit_price: unitPrice,
        original_price: unitPrice + discountShare / i.quantity, // prix avant remise estimé
        refunded_amount: refundedAmount,
      };
    }),
  });

  // 4. Supprimer tous les insights existants du business avant de recréer
  await prisma.insight.deleteMany({
    where: { business_id: businessId },
  });

  if (insights.length > 0) {
    await prisma.insight.createMany({
      data: insights.map((insight) => ({
        business_id: businessId,
        type: insight.type,
        severity: insight.severity,
        title: insight.title,
        message: insight.description,
        action: insight.action ?? null,
        metadata: { product_id: insight.product_id, value: insight.value },
        period_start: periodStart,
        period_end: periodEnd,
      })),
    });
  }

  return res.json({ insights, count: insights.length });
}

export async function handleGetInsights(req: Request, res: Response) {
  const businessId = parseInt(req.params.businessId ?? "", 10);

  const insights = await prisma.insight.findMany({
    where: { business_id: businessId },
    orderBy: [{ severity: "asc" }, { created_at: "desc" }],
  });

  return res.json({ insights });
}
