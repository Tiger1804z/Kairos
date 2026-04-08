import {api} from "../lib/api";

export async function getProducts(businessId: number) {
    const res = await api.get(`/products/${businessId}`);
    return res.data;
}

export async function computeProfitability(businessId: number) {
    const res = await api.post(`/profitability/${businessId}/compute`);
    return res.data.snapshots as {
        product_id: string;
        revenue: number;
        cogs: number;
        gross_profit: number;
        gross_margin_pct: number;
        units_sold: number;
        has_cost: boolean;
    }[];
}

export async function createCost(data:{
    product_id: string;
    variant_id?: string;
    cost_per_unit: number;
    note?: string;
}) {
    const res = await api.post("/costs", data);
    return res.data;
}

export async function importCostsCsv(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/costs/import-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as { imported: number; errors: { row: number; reason: string }[] };
}