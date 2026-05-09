/*
  Warnings:

  - A unique constraint covering the columns `[business_id,product_id,period_start,period_end]` on the table `profitability_snapshots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "profitability_snapshots_business_id_product_id_period_start_key" ON "profitability_snapshots"("business_id", "product_id", "period_start", "period_end");
