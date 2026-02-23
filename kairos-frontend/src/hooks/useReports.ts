import { useState, useEffect } from "react";
import { api } from "../lib/api";

type QueryLog = {
  id_query: number;
  natural_query: string;
  status: string;
  created_at: string;
};

type Report = {
  id_report: number;
  title: string;
  report_type: string;
  created_at: string;
};

// on a choise de faire cet un hook pour les reports malgré le fait qu'on en ait besoin que dans une page
// car on veut garder la meme coherance dans la facon de faire les appels API dans toute l'app
// toutes les api call qui utilisent le get et qui retourne des données sont dans des hooks (useClients, useEngagements, useTransactions, useClientDetail)
//  et on veut garder cette coherance pour faciliter la maintenance et la lisibilité du code

export function useReports(businessId: number | null) {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);

    // 2 appels en parallèle — réponses directement en tableau (pas { items })
    Promise.all([
      api.get(`/query-logs/business/${businessId}`),
      api.get(`/reports/business/${businessId}`),
    ])
      .then(([logsRes, reportsRes]) => {
        setLogs(logsRes.data);
        setReports(reportsRes.data);
      })
      .catch((err) => setError(err?.response?.data?.error || "Erreur de chargement"))
      .finally(() => setLoading(false));

  }, [businessId]);

  return { logs, reports, loading, error };
}
