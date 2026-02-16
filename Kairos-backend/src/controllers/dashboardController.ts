import type {Request,Response} from "express";

import { 
    getDashboardMetricsService,
    getTopClientsService,
    getRevenueGrowthService,
    getMonthlyTrendService,
    getExpenseByCategoryService
 } from "../services/dashboardService";


 // GET /dashboard/metrics

export const getDashboardMetrics = async (req: Request, res: Response) => {
    try {
        const businessId = req.businessId!; // injecter par requireBusinessAccess middleware

        const metrcis = await getDashboardMetricsService(businessId);

        res.status(200).json(metrcis);
    } catch (error) {
        console.error("Error in getDashboardMetrics:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
};

// GET /dashboard/top-clients
export const getTopClients = async (req: Request, res: Response) => {
    try {
        const businessId = req.businessId!; // injecter par requireBusinessAccess middleware

        const topClients = await getTopClientsService(businessId);

        res.status(200).json(topClients);
    } catch (error) {
        console.error("Error in getTopClients:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
};

// GET /dashboard/revenue-growth
export const getRevenueGrowth = async (req: Request, res: Response) => {
    try {
        const businessId = req.businessId!; // injecter par requireBusinessAccess middleware

        const revenueGrowth = await getRevenueGrowthService(businessId);

        res.status(200).json(revenueGrowth);
    }catch (error) {
        console.error("Error in getRevenueGrowth:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
};

// GET /dashboard/monthly-trend
export const getMonthlyTrend = async (req: Request, res: Response) => {
    try {
        const businessId = req.businessId!; // injecter par requireBusinessAccess middleware
        const trend = await getMonthlyTrendService(businessId);
        res.status(200).json(trend);
    } catch (error) {
        console.error("Error in getMonthlyTrend:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
};

// GET /dashboard/expense-by-category
export const getExpenseByCategory = async (req: Request, res: Response) => {
    try {
        const businessId = req.businessId!; // injecter par requireBusinessAccess middleware
        const expenses = await getExpenseByCategoryService(businessId);
        res.status(200).json(expenses);
    } catch (error) {
        console.error("Error in getExpenseByCategory:", error);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
};