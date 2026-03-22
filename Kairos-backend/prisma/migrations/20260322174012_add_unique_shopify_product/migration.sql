/*
  Warnings:

  - A unique constraint covering the columns `[shopify_product_id,business_id]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "products_shopify_product_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "products_shopify_product_id_business_id_key" ON "products"("shopify_product_id", "business_id");
