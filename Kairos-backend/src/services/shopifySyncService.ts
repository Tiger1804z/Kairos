import axios from "axios";
import prisma from "../prisma/prisma";

interface ShopifyStore {
    shop_domain: string;
    access_token: string;
}

// ─── helpers ────────────────────────────────────────────────────
function shopifyHeaders(token: string) {
  return { 'X-Shopify-Access-Token': token };
}

// Shopify pagine via le header Link: <url>; rel="next"
function extractNextPageUrl(linkHeader: string | undefined): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match?.[1] ?? null;
}

// ─── sync produits ────────────────────────────────────────────────────
export async function syncProducts(businessId: number, store: ShopifyStore): Promise<number> {
    let url: string | null = `https://${store.shop_domain}/admin/api/2024-01/products.json?limit=250`;
    let total = 0;

    while (url) {
        const response = await axios.get(url, { headers: shopifyHeaders(store.access_token) });
        const products = response.data.products;
        
        for (const p of products) {
            const product = await prisma.product.upsert({
                where: { shopify_product_id_business_id: { shopify_product_id: String(p.id), business_id: businessId } },
                update: {title: p.title, vendor: p.vendor ?? null, product_type: p.product_type ?? null, status: p.status},
                create: {business_id: businessId, shopify_product_id: String(p.id), title: p.title, vendor: p.vendor ?? null, product_type: p.product_type ?? null, status: p.status},
            });

            for (const v of p.variants) {
                await prisma.productVariant.upsert({
                    where: { shopify_variant_id: String(v.id) },
                    update: {sku: v.sku ?? null, title: v.title, price: v.price, inventory_quantity: v.inventory_quantity ?? 0},
                    create: { product_id: product.id, shopify_variant_id: String(v.id), sku: v.sku ?? null, title: v.title, price: v.price, inventory_quantity: v.inventory_quantity ?? 0 },
                });
            }
            total++;    
        }

        url = extractNextPageUrl(response.headers['link']);
    }

    return total;
}


// ─── sync customers ────────────────────────────────────────────────────
export async function syncCustomers(businessId: number, store: ShopifyStore): Promise<number> {
    let url: string | null = `https://${store.shop_domain}/admin/api/2024-01/customers.json?limit=250`;
    let total = 0;

    while (url) {
        const response = await axios.get(url, { headers: shopifyHeaders(store.access_token) });
        const customers = response.data.customers;
        
        for (const c of customers) {
            await prisma.shopifyCustomer.upsert({
                where: { shopify_customer_id_business_id: { shopify_customer_id: String(c.id), business_id: businessId } },
                update: {
                    email: c.email ?? null,
                    first_name: c.first_name ?? null,
                    last_name: c.last_name ?? null,
                    total_spent: c.total_spent ?? "0",
                    orders_count: c.orders_count ?? 0,
                },
                create: {
                    business_id: businessId, 
                    shopify_customer_id: String(c.id),
                    email: c.email ?? null,
                    first_name: c.first_name ?? null,
                    last_name: c.last_name ?? null,
                    total_spent: c.total_spent ?? "0",
                    orders_count: c.orders_count ?? 0,
                },
            });
            total++;
        }

        url = extractNextPageUrl(response.headers['link']);
    }

    return total;

}

// ─── sync orders ────────────────────────────────────────────────────
export async function syncOrders(businessId: number, store: ShopifyStore): Promise<number> {
    let url: string | null = `https://${store.shop_domain}/admin/api/2024-01/orders.json?limit=250&status=any`;
    let total = 0;

    while (url) {
        const response = await axios.get(url, { headers: shopifyHeaders(store.access_token) });
        const orders = response.data.orders;

        for (const o of orders) {
            // retrouver le customer en db si l'order en a un
            let customerId: string| null = null;
            if (o.customer?.id) {
                const customer = await prisma.shopifyCustomer.findFirst({
                    where: { shopify_customer_id: String(o.customer.id), business_id: businessId },
                    select: { id: true },
                });
                customerId = customer?.id ?? null;

            }

            const order = await prisma.order.upsert({
                where: { shopify_order_id_business_id: { shopify_order_id: String(o.id), business_id: businessId } },
                update: {
                    customer_id: customerId,
                    order_number: String(o.order_number),
                    total_price: o.total_price ?? "0",
                    total_discounts: o.total_discounts ?? "0",
                    financial_status: o.financial_status ?? "unknown",
                    fulfillment_status: o.fulfillment_status ?? null,
                },
                create: {
                    business_id: businessId,
                    shopify_order_id: String(o.id),
                    customer_id: customerId,
                    order_number: String(o.order_number),
                    total_price: o.total_price ?? "0",
                    total_discounts: o.total_discounts ?? "0",
                    financial_status: o.financial_status ?? "unknown",
                    fulfillment_status: o.fulfillment_status ?? null,
                    created_at: new Date(o.created_at),
                },
            });

            // line items -> order items
            for (const item of o.line_items ?? []) {
                // chercher le product et le variant en DB via leurs IDs Shopify
                const product = item.product_id
                    ? await prisma.product.findFirst({ where: { shopify_product_id: String(item.product_id), business_id: businessId }, select: { id: true } })
                    : null;

                const variant = item.variant_id
                    ? await prisma.productVariant.findFirst({ where: { shopify_variant_id: String(item.variant_id) }, select: { id: true } })
                    : null;

                await prisma.orderItem.upsert({
                    where: { shopify_line_item_id: String(item.id) },
                    update: {
                        quantity: item.quantity,
                        unit_price: item.price ?? "0",
                        line_total: String(parseFloat(item.price ?? "0") * item.quantity),
                        product_id: product?.id ?? null,
                        variant_id: variant?.id ?? null,
                    },
                    create: {
                        shopify_line_item_id: String(item.id),
                        order_id: order.id,
                        product_id: product?.id ?? null,
                        variant_id: variant?.id ?? null,
                        quantity: item.quantity,
                        unit_price: item.price ?? "0",
                        line_total: String(parseFloat(item.price ?? "0") * item.quantity),
                        sku: item.sku ?? null,
                        title: item.title ?? "",
                    },
                });
            }

            // refunds
            for (const refund of o.refunds ?? []) {
                const refundAmount = refund.transactions?.reduce(
                    (sum: number, t: any) => sum + parseFloat(t.amount ?? "0"), 0
                ) ?? 0;

                await prisma.refund.upsert({
                    where: { shopify_refund_id: String(refund.id) },
                    update: { amount: String(refundAmount), reason: refund.note ?? null },
                    create: {
                        shopify_refund_id: String(refund.id),
                        order_id: order.id,
                        amount: String(refundAmount),
                        reason: refund.note ?? null,
                        created_at: new Date(refund.created_at),
                    },
                });
            }

            total++;
        }
        url = extractNextPageUrl(response.headers['link']);
    }

    return total;
}


// ─── sync all ───────────────────────────────────────────────────────
export async function syncAll(businessId: number): Promise<{ products: number; customers: number; orders: number }> {
    const store = await prisma.shopifyStore.findFirst({
        where: { business_id: businessId, status: "active" },
    });

    if (!store) throw new Error("Aucun store Shopify connecté pour ce business");

    const products  = await syncProducts(businessId, store);
    const customers = await syncCustomers(businessId, store).catch((err) => { console.warn("[syncAll] customers skipped:", err.message); return 0; });
    const orders    = await syncOrders(businessId, store).catch((err) => { console.warn("[syncAll] orders skipped:", err.message); return 0; });

    await prisma.shopifyStore.update({
        where: { id: store.id },
        data: { last_sync_at: new Date() },
    });

    return { products, customers, orders };
}


            
            


            