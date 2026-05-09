import { api } from "../lib/api";

export async function getShopifyStatus(businessId: number) {
  const res = await api.get(`/shopify/${businessId}/status`);
  return res.data;
}

export async function connectShopify(shop: string, businessId: number) {
  const res = await api.post("/shopify/connect", { shop, businessId });
  return res.data;
}

export async function triggerShopifySync(businessId: number) {
  const res = await api.post(`/shopify/${businessId}/sync`);
  return res.data;
}
