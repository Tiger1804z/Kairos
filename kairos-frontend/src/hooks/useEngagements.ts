import { useState, useEffect } from "react";
import { api } from "../lib/api";

type Engagement = {
  id_engagement: number;
  title: string;
  status: string;
  total_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  client: { first_name: string | null; last_name: string | null; company_name: string | null } | null;
};

export function useEngagements(businessId: number | null) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);

    api.get(`/engagements?business_id=${businessId}`)
      .then((response) => setEngagements(response.data.items))
      .catch((err) => setError(err?.response?.data?.error || "Erreur de chargement"))
      .finally(() => setLoading(false));

  }, [businessId]);

  return { engagements, loading, error };
}
