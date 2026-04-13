import { useState, useEffect } from "react";
import { api } from "../lib/api";

export type TopProduct = {
  productId: string;
  title: string;
  revenue: number;
  grossProfit: number;
  marginPct: number;
  unitsSold: number;
};

export type RiskProduct = {
  productId: string;
  title: string;
  grossProfit: number;
  marginPct: number;
  revenue: number;
  riskReason: "negative_margin" | "missing_cost";
};

export type DashboardInsight = {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
};

export type ShopifyKpis = {
  // Row 1
  totalRevenue: number;
  totalProfit: number;
  avgMarginPct: number;
  missingCostsCount: number;
  productsTracked: number;
  // Row 2
  negativeProfitCount: number;
  lowMarginCount: number;
  topProfitProduct: { title: string; profit: number; marginPct: number } | null;
  revenueAtRisk: number;
  // Panels
  topProductsByProfit: TopProduct[];
  highestRiskProducts: RiskProduct[];
  recentInsights: DashboardInsight[];
};

export function useShopifyKpis(businessId: number | null) {
  const [kpis, setKpis] = useState<ShopifyKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!businessId) return;

    const fetchKpis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/shopify-dashboard/${businessId}/kpis`);
        setKpis(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || "Failed to load KPIs");
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, [businessId, refreshCount]);

  const refetch = () => setRefreshCount((c) => c + 1);

  return { kpis, loading, error, refetch };
}
