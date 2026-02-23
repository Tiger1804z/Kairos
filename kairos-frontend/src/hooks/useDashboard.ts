/**
 * useDashboard — Hook pour charger toutes les données du dashboard en parallèle
 *
 * Lance 5 appels simultanés (Promise.all) vers /dashboard/*:
 *   - metrics          → totalClients, activeEngagements, monthlyRevenue
 *   - top-clients      → top 5 clients par revenu
 *   - revenue-growth   → comparaison mois en cours vs mois précédent
 *   - monthly-trend    → revenus + dépenses des 6 derniers mois (line chart)
 *   - expenses-by-category → dépenses du mois par catégorie (pie chart)
 */
import {useState,useEffect} from "react";
import {api} from "../lib/api";


// types pour les reponses de l'API

type DashboardMetrics = {
    totalClients: number;
    activeEngagements : number;
    monthlyRevenue : number;
};


type TopClient ={
    id: number;
    name: string;
    revenue: number;
};

type RevenueGrowth = {
    growth: number;
    lastMonth:number;
    thisMonth:number;
};

type DashboardData = {
    metrics: DashboardMetrics | null;
    topClients: TopClient[] | null;
    revenueGrowth: RevenueGrowth | null;
    monthlyTrend: MonthlyTrend[] | null;
    expenseByCategory: ExpenseByCategory[] | null;
};

type MonthlyTrend = {
    month: string;
    income: number;
    expenses: number;
};

type ExpenseByCategory = {
    category: string;
    amount: number;
};


export function useDashboard(businessId: number | null) {
    const [data, setData] = useState<DashboardData>({
        metrics: null,
        topClients: null,
        revenueGrowth: null,
        monthlyTrend: null,
        expenseByCategory: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // refreshKey permet de forcer un re-fetch sans changer businessId
    // (ex: après un import CSV, businessId reste le même mais les données ont changé)
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        // si on a pas de bussinesId, on ne fait rien
        if (!businessId) {
            setLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            try {
                // apeller les 3 metrics en parallele
                const [metricsRes, topClientsRes, revenueGrowthRes, monthlyTrendRes, expenseByCategoryRes] = await Promise.all([
                    api.get( `/dashboard/metrics?business_id=${businessId}`),
                    api.get( `/dashboard/top-clients?business_id=${businessId}`),
                    api.get( `/dashboard/revenue-growth?business_id=${businessId}`),
                    api.get( `/dashboard/monthly-trend?business_id=${businessId}`),
                    api.get( `/dashboard/expenses-by-category?business_id=${businessId}`),
                ]);
                setData({
                    metrics: metricsRes.data,
                    topClients: topClientsRes.data,
                    revenueGrowth: revenueGrowthRes.data,
                    monthlyTrend: monthlyTrendRes.data,
                    expenseByCategory: expenseByCategoryRes.data,
                });
            } catch (err: any) {
                console.error("Error fetching dashboard data:", err);
                setError(err?.response?.data?.error || err?.message || "Failed to load dashboard data");
            }finally{
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [businessId, refreshKey]); // refreshKey dans les deps: s'incrémente → re-fetch forcé

    // exposé au composant pour déclencher un re-fetch manuel (ex: après import CSV)
    const refresh = () => setRefreshKey(k => k + 1);

    return { data, loading, error, refresh };
}

