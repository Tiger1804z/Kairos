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
    }, [businessId]);
    return { data, loading, error };
}

