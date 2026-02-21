import {useState,useEffect} from "react";
import { api } from "../lib/api";

// types pour les réponses de l'API
type Client = {
  id_client: number;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
};

type Transaction = {
  id_transaction: number;
  transaction_type: "income" | "expense";
  amount: number;
  transaction_date: string;
  category: string | null;
  description: string | null;
    client_id: number | null;
};

type Engagement = {
  id_engagement: number;
  title: string;
  status: string;
  total_amount: number | null;
  start_date: string | null;
  client_id: number | null;
};

export function useClientDetail(clientId: number | null, businessId: number | null) {
    const [client, setClient] = useState<Client | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState<string | null>(null);

    useEffect(() => {
        if (!clientId || !businessId) return;
        setLoading(true);

        // 3 appels en parallele avec Promise.all pour que ca soit plus rapide que de les faire un par un
        Promise.all([
            api.get(`/clients/${clientId}`),
            api.get(`/transactions?business_id=${businessId}`),
            api.get(`/engagements?business_id=${businessId}`)
        ])
        .then(([clientRes, transactionsRes, engagementsRes]) => {
            setClient(clientRes.data.client);
            // filtrage dans le frontend car je n'ai pas de endpoint spécifique pour les transactions/engagements d'un client (peut etre à ajouter dans le futur)
            setTransactions(transactionsRes.data.items.filter((t: Transaction) => t.client_id === clientId));
            setEngagements(engagementsRes.data.items.filter((e: Engagement) => e.client_id === clientId));
        })
        .catch((err) => setError(err?.response?.data?.error || "Erreur de chargement"))
        .finally(() => setLoading(false));
    },[clientId, businessId]);

    return { client, transactions, engagements, loading, error };
}