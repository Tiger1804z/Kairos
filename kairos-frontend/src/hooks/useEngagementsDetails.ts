import { useState, useEffect } from "react";
import { api } from "../lib/api";

type EngagementDetail = {
  id_engagement: number;
  title: string;
  description: string | null;
  status: string;
  total_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  client: { first_name: string | null; last_name: string | null; company_name: string | null } | null;
  items: {
    id_item: number;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  transactions: {
    id_transaction: number;
    transaction_type: "income" | "expense";
    amount: number;
    transaction_date: string;
    category: string | null;
  }[];
};

export function useEngagementDetail(engagementId: number | null) {
  const [engagement, setEngagement] = useState<EngagementDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!engagementId) return;
    setLoading(true);

    // 1 seul appel — le backend inclut déjà client + items + transactions
    api.get(`/engagements/${engagementId}`)
      .then((response) => setEngagement(response.data.engagement))
      .catch((err) => setError(err?.response?.data?.error || "Erreur de chargement"))
      .finally(() => setLoading(false));

  }, [engagementId]);

  return { engagement, loading, error };
}
