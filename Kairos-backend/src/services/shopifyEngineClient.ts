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

export type InsightResult = {
    type: string;
    product_id: string;
    title: string;
    description: string;
    action: string | null;
    severity: "info" | "warning" | "critical";
    value: number;
};

export const computeInsights = async (payload: {
    business_id: number;
    period_start: string;
    period_end: string;
    snapshots: {
        product_id: string;
        product_name: string;
        revenue: number;
        cogs: number;
        gross_profit: number;
        gross_margin_pct: number;
        units_sold: number;
        has_cost: boolean;
    }[];
    order_items: {
        product_id: string;
        quantity: number;
        unit_price: number;
        original_price: number;
        refunded_amount: number;
    }[];
}): Promise<InsightResult[]> => {
    const res = await axios.post(`${ENGINE_URL}/insights/compute`, payload, { timeout: 30_000 });
    return res.data.insights;
};

export type ChatAnswer = {
    business_id: number;
    question: string;
    answer: string;
};

export const askShopifyChat = async (payload: {
    business_id: number;
    question: string;
    history: { role: "user" | "assistant"; content: string }[];
    snapshots: {
        product_id: string;
        product_name: string;
        revenue: number;
        gross_profit: number;
        gross_margin_pct: number;
        units_sold: number;
        has_cost: boolean;
    }[];
    insights: {
        type: string;
        title: string;
        description: string;
        severity: string;
        product_id: string;
        value: number;
    }[];
}): Promise<ChatAnswer> => {
    const res = await axios.post(`${ENGINE_URL}/chat/compute`, payload, { timeout: 30_000 });
    return res.data;
};

    