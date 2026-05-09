/*
  Warnings:

  - A unique constraint covering the columns `[shopify_variant_id]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "product_variants_shopify_variant_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_shopify_variant_id_key" ON "product_variants"("shopify_variant_id");
