import axios from "axios";

const ENGINE_URL = process.env.SHOPIFY_ENGINE_URL || "http://127.0.0.1:8002";
const TIMEOUT_MS = 5_000;



export type EngigneHeathResponse = {
    status: string;
    service: string;
    version: string;
};

export const shopifyEngineHealth = async (): Promise<EngigneHeathResponse | null> => {
    try{
        const res = await axios.get(`${ENGINE_URL}/health`, { timeout: TIMEOUT_MS });
        return res.data as EngigneHeathResponse;

    }catch{
        return null;
    }
};

export type ProfitabilitySnapshot = {
    product_id: string;
    period_start: string; // ISO date string
    period_end: string;   // ISO date string
    revenue: number;
    cogs: number;
    gross_profit: number;
    gross_margin_pct: number;
    units_sold: number;
    has_cost: boolean;
};

export const computeProfitability = async (payload: {
    business_id: number;
    period_start: string; // ISO date string
    period_end: string;   // ISO date string
    order_items: {product_id: string; quantity: number; unit_price: number;}[];
    product_costs: {product_id: string; cost_per_unit: number;}[];
}): Promise<ProfitabilitySnapshot[]> => {
    const res = await axios.post(`${ENGINE_URL}/profit/compute`, payload, { timeout: 10_000 }); 
    return res.data.snapshots
};