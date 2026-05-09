-- CreateEnum
CREATE TYPE "CostSourceType" AS ENUM ('manual', 'csv', 'document', 'api');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateTable
CREATE TABLE "shopify_stores" (
    "id" TEXT NOT NULL,
    "business_id" INTEGER NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "shopify_store_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shopify_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "business_id" INTEGER NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT,
    "product_type" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "shopify_variant_id" TEXT NOT NULL,
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "inventory_quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_costs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "cost_per_unit" DECIMAL(12,2) NOT NULL,
    "source_type" "CostSourceType" NOT NULL,
    "source_ref" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "product_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_customers" (
    "id" TEXT NOT NULL,
    "business_id" INTEGER NOT NULL,
    "shopify_customer_id" TEXT NOT NULL,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "total_spent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "orders_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shopify_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "business_id" INTEGER NOT NULL,
    "shopify_order_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "order_number" TEXT NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "total_discounts" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "financial_status" TEXT NOT NULL,
    "fulfillment_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "sku" TEXT,
    "title" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profitability_snapshots" (
    "id" TEXT NOT NULL,
    "business_id" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL,
    "cogs" DECIMAL(12,2) NOT NULL,
    "gross_profit" DECIMAL(12,2) NOT NULL,
    "gross_margin_pct" DECIMAL(8,4) NOT NULL,
    "units_sold" INTEGER NOT NULL,
    "refunds_count" INTEGER NOT NULL DEFAULT 0,
    "refund_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profitability_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "business_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "InsightSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_stores_shop_domain_key" ON "shopify_stores"("shop_domain");

-- CreateIndex
CREATE INDEX "shopify_stores_business_id_idx" ON "shopify_stores"("business_id");

-- CreateIndex
CREATE INDEX "products_business_id_idx" ON "products"("business_id");

-- CreateIndex
CREATE INDEX "products_shopify_product_id_idx" ON "products"("shopify_product_id");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_shopify_variant_id_idx" ON "product_variants"("shopify_variant_id");

-- CreateIndex
CREATE INDEX "product_costs_product_id_idx" ON "product_costs"("product_id");

-- CreateIndex
CREATE INDEX "product_costs_variant_id_idx" ON "product_costs"("variant_id");

-- CreateIndex
CREATE INDEX "shopify_customers_business_id_idx" ON "shopify_customers"("business_id");

-- CreateIndex
CREATE INDEX "shopify_customers_shopify_customer_id_idx" ON "shopify_customers"("shopify_customer_id");

-- CreateIndex
CREATE INDEX "orders_business_id_idx" ON "orders"("business_id");

-- CreateIndex
CREATE INDEX "orders_shopify_order_id_idx" ON "orders"("shopify_order_id");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "refunds_order_id_idx" ON "refunds"("order_id");

-- CreateIndex
CREATE INDEX "profitability_snapshots_business_id_idx" ON "profitability_snapshots"("business_id");

-- CreateIndex
CREATE INDEX "profitability_snapshots_product_id_idx" ON "profitability_snapshots"("product_id");

-- CreateIndex
CREATE INDEX "profitability_snapshots_period_start_period_end_idx" ON "profitability_snapshots"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "insights_business_id_idx" ON "insights"("business_id");

-- CreateIndex
CREATE INDEX "insights_severity_idx" ON "insights"("severity");

-- CreateIndex
CREATE INDEX "insights_created_at_idx" ON "insights"("created_at");

-- AddForeignKey
ALTER TABLE "shopify_stores" ADD CONSTRAINT "shopify_stores_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_costs" ADD CONSTRAINT "product_costs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_costs" ADD CONSTRAINT "product_costs_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_customers" ADD CONSTRAINT "shopify_customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "shopify_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profitability_snapshots" ADD CONSTRAINT "profitability_snapshots_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profitability_snapshots" ADD CONSTRAINT "profitability_snapshots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;
