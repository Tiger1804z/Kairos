import { useState,useEffect } from "react";
import { api } from "../lib/api";

// types pour les réponses de l'API

type Transaction = {
    id_transaction: number;
    transaction_type: "income" | "expense";
    amount: number;
    transaction_date: string;
    category: string | null;
    description: string | null;
    client_id: number | null;
};

type TransactionsSummary = {
    totalIncome: number;
    totalExpense: number;
    net: number;
};

export function useTransactions(businessId: number | null) {
    // on inilialise à un tableau vide pour permettre a .reduce de fonctionner 
    // et eviter les erreurs de type undefined (sans ca on devrait faire des checks de type transactions ? .reduce  qui peut retourner undefined si pas charger)
    const [transactions, setTransactions] = useState<Transaction[]>([]); // on inilialise à un tableau vide pour permettre a .reduce de fonctionner 
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState<string | null>(null);
    
    // le fetch se relance automatiquement si  le user change de business
    useEffect(() => {
        if (!businessId) return;
        setLoading(true);
        
        api.get(`/transactions?business_id=${businessId}`)
            .then((response) => {
                setTransactions(response.data.items);
            })
            .catch((err) => setError(err?.response?.data?.error || "Erreur de chargement"))
            .finally(() => setLoading(false));


    },[businessId]);

    const  summary: TransactionsSummary = transactions.reduce(
        (acc, t) => {
            // on convertit le montant en number car prisma retourne des decinaml comme des string en JSON
            const amount = Number(t.amount) ;
            if (t.transaction_type === "income") acc.totalIncome += amount;
            else acc.totalExpense += amount;
            acc.net = acc.totalIncome - acc.totalExpense;
            return acc;
        },
        { totalIncome: 0, totalExpense: 0, net: 0 }
    );

    return { transactions, summary, loading, error };
}

            
    