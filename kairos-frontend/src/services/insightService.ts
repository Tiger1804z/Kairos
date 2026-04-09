import { api } from "../lib/api";

export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  id: string;
  type: string;
  severity: InsightSeverity;
  title: string;
  message: string;
  metadata: { product_id: string; value: number } | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export async function computeInsights(businessId: number): Promise<Insight[]> {
  const res = await api.post(`/insights/${businessId}/compute`);
  return res.data.insights;
}

export async function getInsights(businessId: number): Promise<Insight[]> {
  const res = await api.get(`/insights/${businessId}`);
  return res.data.insights;
}
