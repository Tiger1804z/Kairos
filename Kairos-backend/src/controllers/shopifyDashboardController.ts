import type { Request, Response } from "express";
import prisma from "../prisma/prisma";

/**
 * GET /shopify-dashboard/:businessId/kpis
 *
 * Retourne toutes les données nécessaires au dashboard Shopify profit intelligence :
 *
 * Row 1 — Métriques globales
 *   totalRevenue, totalProfit, avgMarginPct, missingCostsCount, productsTracked
 *
 * Row 2 — Signaux de risque
 *   negativeProfitCount  : produits avec gross_profit < 0
 *   lowMarginCount       : produits avec marge entre 0% et 15%
 *   topProfitProduct     : meilleur produit par gross_profit
 *   revenueAtRisk        : revenu lié aux produits à marge négative ou sans coût
 *
 * Panels
 *   topProductsByProfit  : top 5 produits par gross_profit
 *   highestRiskProducts  : produits les plus problématiques (marge < 0 ou coût manquant)
 *   recentInsights       : 3 insights les plus récents (critical > warning > info)
 */
export async function handleGetShopifyKpis(req: Request, res: Response) {
  const businessId = parseInt(req.params.businessId ?? "", 10);
  if (isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid businessId" });
  }

  // 1. Récupérer tous les snapshots, garder le plus récent par produit
  const allSnapshots = await prisma.profitabilitySnapshot.findMany({
    where: { business_id: businessId },
    orderBy: { calculated_at: "desc" },
  });

  const seen = new Set<string>();
  const snapshots = allSnapshots.filter((s) => {
    if (seen.has(s.product_id)) return false;
    seen.add(s.product_id);
    return true;
  });

  // 2. Récupérer les titres produits
  const productIds = snapshots.map((s) => s.product_id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.title]));

  // 3. Produits sans coût (avec ventes)
  const productIdsWithSales = snapshots.filter((s) => s.units_sold > 0).map((s) => s.product_id);
  const costsExisting = await prisma.productCost.findMany({
    where: { product_id: { in: productIdsWithSales }, variant_id: null },
    distinct: ["product_id"],
    select: { product_id: true },
  });
  const productIdsWithCost = new Set(costsExisting.map((c) => c.product_id));
  const missingCostProductIds = new Set(productIdsWithSales.filter((id) => !productIdsWithCost.has(id)));

  // 4. Métriques Row 1
  const totalRevenue = snapshots.reduce((sum, s) => sum + Number(s.revenue), 0);
  const totalProfit = snapshots.reduce((sum, s) => sum + Number(s.gross_profit), 0);
  const avgMarginPct =
    totalRevenue > 0
      ? snapshots.reduce((sum, s) => sum + Number(s.gross_margin_pct) * Number(s.revenue), 0) / totalRevenue
      : 0;

  // 5. Métriques Row 2
  const negativeProfitSnapshots = snapshots.filter((s) => Number(s.gross_profit) < 0);
  const lowMarginSnapshots = snapshots.filter(
    (s) => Number(s.gross_margin_pct) >= 0 && Number(s.gross_margin_pct) < 15
  );

  const topSnapshot = snapshots.reduce<typeof snapshots[0] | null>((best, s) => {
    if (!best || Number(s.gross_profit) > Number(best.gross_profit)) return s;
    return best;
  }, null);

  const revenueAtRisk = snapshots
    .filter((s) => Number(s.gross_margin_pct) < 0 || missingCostProductIds.has(s.product_id))
    .reduce((sum, s) => sum + Number(s.revenue), 0);

  // 6. Panel — Top 5 produits par profit
  const topProductsByProfit = [...snapshots]
    .sort((a, b) => Number(b.gross_profit) - Number(a.gross_profit))
    .slice(0, 5)
    .map((s) => ({
      productId: s.product_id,
      title: productMap.get(s.product_id) ?? "Unknown product",
      revenue: Math.round(Number(s.revenue) * 100) / 100,
      grossProfit: Math.round(Number(s.gross_profit) * 100) / 100,
      marginPct: Math.round(Number(s.gross_margin_pct) * 10) / 10,
      unitsSold: s.units_sold,
    }));

  // 7. Panel — Produits à risque (marge < 0 ou coût manquant), triés par sévérité
  const riskSnapshots = snapshots.filter(
    (s) => Number(s.gross_margin_pct) < 0 || missingCostProductIds.has(s.product_id)
  );
  const highestRiskProducts = riskSnapshots
    .sort((a, b) => Number(a.gross_margin_pct) - Number(b.gross_margin_pct))
    .slice(0, 5)
    .map((s) => ({
      productId: s.product_id,
      title: productMap.get(s.product_id) ?? "Unknown product",
      grossProfit: Math.round(Number(s.gross_profit) * 100) / 100,
      marginPct: Math.round(Number(s.gross_margin_pct) * 10) / 10,
      revenue: Math.round(Number(s.revenue) * 100) / 100,
      riskReason: Number(s.gross_margin_pct) < 0
        ? "negative_margin"
        : "missing_cost",
    }));

  // 8. Panel — 3 insights récents (critical > warning > info)
  const insights = await prisma.insight.findMany({
    where: { business_id: businessId },
    orderBy: [
      { created_at: "desc" },
    ],
    take: 10,
    select: { type: true, severity: true, title: true, message: true },
  });

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const recentInsights = [...insights]
    .sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
    .slice(0, 3);

  return res.json({
    // Row 1
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    avgMarginPct: Math.round(avgMarginPct * 10) / 10,
    missingCostsCount: missingCostProductIds.size,
    productsTracked: snapshots.length,
    // Row 2
    negativeProfitCount: negativeProfitSnapshots.length,
    lowMarginCount: lowMarginSnapshots.length,
    topProfitProduct: topSnapshot
      ? {
          title: productMap.get(topSnapshot.product_id) ?? "Unknown product",
          profit: Math.round(Number(topSnapshot.gross_profit) * 100) / 100,
          marginPct: Math.round(Number(topSnapshot.gross_margin_pct) * 10) / 10,
        }
      : null,
    revenueAtRisk: Math.round(revenueAtRisk * 100) / 100,
    // Panels
    topProductsByProfit,
    highestRiskProducts,
    recentInsights,
  });
}
