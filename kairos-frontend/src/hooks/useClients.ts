import {useState,useEffect, use} from "react";
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

export function useClients(businessId: number | null) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState<string | null>(null);

    useEffect(() => {
        if (!businessId) return;
        setLoading(true);

        api.get(`/clients?business_id=${businessId}`)
            .then((response) => {
                setClients(response.data.items);
            })
            .catch((err) => setError(err?.response?.data?.error || "Erreur de chargement"))
            .finally(() => setLoading(false));
    },[businessId]);

    return { clients, loading, error };
}
