/*
  Warnings:

  - A unique constraint covering the columns `[shopify_customer_id,business_id]` on the table `shopify_customers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "shopify_customers_shopify_customer_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "shopify_customers_shopify_customer_id_business_id_key" ON "shopify_customers"("shopify_customer_id", "business_id");
