/*
  Warnings:

  - A unique constraint covering the columns `[shopify_line_item_id]` on the table `order_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopify_order_id,business_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopify_refund_id]` on the table `refunds` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shopify_line_item_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopify_refund_id` to the `refunds` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "orders_shopify_order_id_idx";

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "shopify_line_item_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "refunds" ADD COLUMN     "shopify_refund_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "order_items_shopify_line_item_id_key" ON "order_items"("shopify_line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_shopify_order_id_business_id_key" ON "orders"("shopify_order_id", "business_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_shopify_refund_id_key" ON "refunds"("shopify_refund_id");
