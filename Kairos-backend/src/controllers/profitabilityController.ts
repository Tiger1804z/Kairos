import type { Request, Response } from "express";
import prisma from "../prisma/prisma";
import { computeProfitability } from "../services/shopifyEngineClient";

export async function handleComputeProfitability(req: Request, res: Response) {
  const businessId = parseInt(req.params.businessId ?? "", 10);
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // 1er du mois
  const periodEnd = now;

  // 1. Récupérer tous les order_items du business (via orders)
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: { business_id: businessId },
      product_id: { not: null },
    },
    select: {
      product_id: true,
      quantity: true,
      unit_price: true,
    },
  });

  // 2. Récupérer le dernier coût par produit
  const costs = await prisma.productCost.findMany({
    where: {
      product: { business_id: businessId },
      variant_id: null,
    },
    orderBy: { effective_from: "desc" },
    distinct: ["product_id"],
    select: {
      product_id: true,
      cost_per_unit: true,
    },
  });

  if (orderItems.length === 0) {
    return res.json({ snapshots: [] });
  }

  // 3. Appeler Python
  const snapshots = await computeProfitability({
    business_id: businessId,
    period_start: periodStart.toISOString().split("T")[0]!,
    period_end: periodEnd.toISOString().split("T")[0]!,
    order_items: orderItems.map((i) => ({
      product_id: i.product_id!,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
    })),
    product_costs: costs.map((c) => ({
      product_id: c.product_id,
      cost_per_unit: Number(c.cost_per_unit),
    })),
  });

  // 4. Stocker les snapshots en DB (upsert par product + période)
  for (const s of snapshots) {
    await prisma.profitabilitySnapshot.upsert({
      where: {
        business_id_product_id_period_start_period_end: {
          business_id: businessId,
          product_id: s.product_id,
          period_start: periodStart,
          period_end: periodEnd,
        },
      },
      update: {
        revenue: s.revenue,
        cogs: s.cogs,
        gross_profit: s.gross_profit,
        gross_margin_pct: s.gross_margin_pct,
        units_sold: s.units_sold,
        calculated_at: now,
      },
      create: {
        business_id: businessId,
        product_id: s.product_id,
        period_start: periodStart,
        period_end: periodEnd,
        revenue: s.revenue,
        cogs: s.cogs,
        gross_profit: s.gross_profit,
        gross_margin_pct: s.gross_margin_pct,
        units_sold: s.units_sold,
        calculated_at: now,
      },
    });
  }

  return res.json({ snapshots });
}