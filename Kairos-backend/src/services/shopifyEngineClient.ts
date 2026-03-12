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