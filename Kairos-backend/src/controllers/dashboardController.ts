import type {Request,Response} from "express";

import { 
    getDashboardMetricsService,
    getTopClientsService,
    getRevenueGrowthService
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