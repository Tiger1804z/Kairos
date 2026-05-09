import type { Request, Response } from "express";
import prisma from "../prisma/prisma";
import { computeProfitability } from "../services/shopifyEngineClient";

export async function computeProfitabilityForBusiness(businessId: number): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = now;

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: { business_id: businessId },
    },
    include: { order: true },
  });

  console.log(`[profitability] orderItems count for business ${businessId}:`, orderItems.length);

  const costs = await prisma.productCost.findMany({
    where: {
      product: { business_id: businessId },
      variant_id: null,
    },
    select: { product_id: true, cost_per_unit: true },
  });

  console.log(`[profitability] product costs count for business ${businessId}:`, costs.length);

  if (orderItems.length === 0) {
    console.log(`[profitability] No order items found for business ${businessId} — orders may not have synced yet`);
    return;
  }

  const itemsWithProduct = orderItems.filter((i) => i.product_id !== null);
  console.log(`[profitability] items with linked product: ${itemsWithProduct.length}/${orderItems.length}`);

  if (itemsWithProduct.length === 0) {
    console.log(`[profitability] All order items have null product_id for business ${businessId} — products not linked during sync`);
  }

  const snapshots = await computeProfitability({
    business_id: businessId,
    period_start: periodStart.toISOString().split("T")[0]!,
    period_end: periodEnd.toISOString().split("T")[0]!,
    order_items: itemsWithProduct.map((i) => ({
      product_id: i.product_id!,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
    })),
    product_costs: costs.map((c) => ({
      product_id: c.product_id,
      cost_per_unit: Number(c.cost_per_unit),
    })),
  });

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

  console.log(`[profitability] Compute completed: ${snapshots.length} snapshots for business ${businessId}`);
}

export async function handleComputeProfitability(req: Request, res: Response) {
  const businessId = parseInt(req.params.businessId ?? "", 10);
  if (isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid businessId" });
  }

  await computeProfitabilityForBusiness(businessId);
  return res.json({ ok: true });
}
