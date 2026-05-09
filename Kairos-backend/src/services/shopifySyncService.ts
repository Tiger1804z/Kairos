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
    const endpoint = `https://${store.shop_domain}/admin/api/2025-10/graphql.json`;
    let cursor: string | null = null;
    let hasNextPage = true;
    let total = 0;
    let page = 0;

    console.log(`[shopify] Fetching products via GraphQL for business ${businessId} from shop ${store.shop_domain}`);
    console.log(`[shopify] GraphQL endpoint: ${endpoint}`);

    // verify token has read_products scope before wasting  a full api round-trip
    try{
        const scopeRes = await axios.get(
            `https://${store.shop_domain}/admin/oauth/access_scopes.json`,
            { headers: shopifyHeaders(store.access_token) }
        );
        const grantedScopes: string[] = (scopeRes.data.access_scopes ?? []).map((s: any) => s.handle);
        console.log(`[shopify] Token granted scopes: ${grantedScopes.join(", ")}`);
        if (!grantedScopes.includes("read_products")) {
            console.error(`[shopify] FATAL: token does not have read_products scope - product fetch will return empty. Re-authorization required.`);
        }
    
    }catch(err: any) {
        console.warn(`[shopify] Could not verify token scopes before product fetch: ${err.message}`);

    }
    while (hasNextPage) {
        page++;
        const query: string = `{
          products(first: 250${cursor ? `, after: "${cursor}"` : ''}) {
            edges {
              node {
                legacyResourceId
                title
                vendor
                productType
                status
                variants(first: 100) {
                  edges {
                    node {
                      legacyResourceId
                      sku
                      title
                      price
                      inventoryQuantity
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`;

        const response: any = await axios.post(endpoint, { query }, { headers: { ...shopifyHeaders(store.access_token), 'Content-Type': 'application/json' } });
        
        if (response.data.errors) {
            console.error(`[shopify] GraphQL errors on page ${page}: ${JSON.stringify(response.data.errors)}`);
            throw new Error(`Shopify GraphQL product fetch failed: ${response.data.errors[0]?.message}`);
        }

        const products : any[] = response.data.data?.products?.edges ?? [];
        const pageInfo: { hasNextPage: boolean; endCursor: string | null } = response.data.data?.products?.pageInfo ?? {};

        console.log(`[shopify] Products fetched from Shopify GraphQL (page ${page}): ${products.length}`);
        
        for (const edge of products){
            const p = edge.node;
            const shopifyProductId = p.legacyResourceId;
            const status = (p.status as string).toLowerCase();

            console.log(`[shopify] Upserting product  shopify_product_id=${shopifyProductId}, title="${p.title}"`);
            let product : {id: string};
            try  {
                product = await prisma.product.upsert({
                    where: { shopify_product_id_business_id: { shopify_product_id: shopifyProductId, business_id: businessId } },
                    update: { title: p.title, vendor: p.vendor ?? null, product_type: p.productType ?? null, status },
                    create: { business_id: businessId, shopify_product_id: shopifyProductId, title: p.title, vendor: p.vendor ?? null, product_type: p.productType ?? null, status },
                });
                
            }catch(err: any) {
                console.error(`[shopify] ERROR upserting product shopify_product_id=${shopifyProductId}, title="${p.title}": ${err.message}`); 
                throw err;
            }

            console.log(`[shopify] Product upserted local_id=${product.id}`);

            let variantCount = 0;
            for( const vEdge of p.variants?.edges ?? []){
                const v = vEdge.node;
                
                try{
                    await prisma.productVariant.upsert({
                        where: { shopify_variant_id: v.legacyResourceId },
                        // product_id included so re-sync after cascade-delete re-links correctly
                        update: { product_id: product.id, sku: v.sku ?? null, title: v.title, price: v.price, inventory_quantity: v.inventoryQuantity ?? 0 },
                        create: { product_id: product.id, shopify_variant_id: v.legacyResourceId, sku: v.sku ?? null, title: v.title, price: v.price, inventory_quantity: v.inventoryQuantity ?? 0 },
                    });
                    variantCount++;

                } catch (err: any) {
                    console.error(`[shopify] ERROR upserting variant shopify_variant_id=${v.legacyResourceId} for product ${shopifyProductId}: ${err.message}`);
                    throw err;
                }
            }
            console.log(`[shopify] Product variants upserted count=${variantCount}`);
            total++;
        }

        hasNextPage = pageInfo.hasNextPage ?? false;
        cursor = pageInfo.endCursor ?? null;
    }

    console.log(`[shopify] Products persisted for business ${businessId}: ${total}`);
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
                if (item.product_id && !product) {
                    console.warn(`[syncOrders] product not found in DB: shopify_product_id=${item.product_id}, business=${businessId}, title="${item.title}"`);
                }

                const variant = item.variant_id
                    ? await prisma.productVariant.findFirst({ where: { shopify_variant_id: String(item.variant_id) }, select: { id: true } })
                    : null;

                await prisma.orderItem.upsert({
                    where: { shopify_line_item_id: String(item.id) },
                    update: {
                        order_id: order.id,
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
export async function syncAll(businessId: number): Promise<{ products: number; customers: number; orders: number; db: { products: number; customers: number; orders: number; order_items: number } }> {
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

    // Post-sync DB verification
    const [dbProducts, dbCustomers, dbOrders, dbOrderItems] = await Promise.all([
        prisma.product.count({ where: { business_id: businessId } }),
        prisma.shopifyCustomer.count({ where: { business_id: businessId } }),
        prisma.order.count({ where: { business_id: businessId } }),
        prisma.orderItem.count({ where: { order: { business_id: businessId } } }),
    ]);
    console.log(`[shopify] DB verification for business ${businessId}: products=${dbProducts}, customers=${dbCustomers}, orders=${dbOrders}, order_items=${dbOrderItems}`);

    if (products === 0 && orders > 0) {
        console.warn(`[shopify] WARNING: orders exist (${orders}) but Shopify product fetch returned 0 products — check store scopes or product availability`);
    }
    if (dbProducts === 0 && dbOrders > 0) {
        console.warn(`[shopify] WARNING: DB has orders (${dbOrders}) but 0 products — order items will have null product_id, profitability cannot be computed`);
    }

    return { products, customers, orders, db: { products: dbProducts, customers: dbCustomers, orders: dbOrders, order_items: dbOrderItems } };
}


            
            


            