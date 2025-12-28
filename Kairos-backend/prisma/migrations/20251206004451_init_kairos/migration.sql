-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'employee');

-- CreateEnum
CREATE TYPE "DocumentSourceType" AS ENUM ('upload', 'generated');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('owner', 'admin', 'all');

-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "EngagementItemType" AS ENUM ('product', 'service', 'hourly', 'subscription');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card', 'transfer', 'check', 'other');

-- CreateEnum
CREATE TYPE "QueryActionType" AS ENUM ('sql_select', 'sql_aggregate', 'summary', 'financial_report', 'inventory', 'other');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('success', 'error', 'blocked');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('financial', 'inventory', 'sales', 'summary', 'custom');

-- CreateTable
CREATE TABLE "users" (
    "id_user" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'owner',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id_business" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "business_type" VARCHAR(50),
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Montreal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id_business")
);

-- CreateTable
CREATE TABLE "clients" (
    "id_client" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "company_name" VARCHAR(200),
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id_client")
);

-- CreateTable
CREATE TABLE "documents" (
    "id_document" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50),
    "file_size" INTEGER,
    "storage_path" VARCHAR(500) NOT NULL,
    "source_type" "DocumentSourceType" NOT NULL DEFAULT 'upload',
    "ai_summary" TEXT,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'owner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id_document")
);

-- CreateTable
CREATE TABLE "engagements" (
    "id_engagement" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "client_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "EngagementStatus" NOT NULL DEFAULT 'draft',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "total_amount" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagements_pkey" PRIMARY KEY ("id_engagement")
);

-- CreateTable
CREATE TABLE "engagement_items" (
    "id_item" SERIAL NOT NULL,
    "engagement_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "item_type" "EngagementItemType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_items_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id_transaction" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "client_id" INTEGER,
    "engagement_id" INTEGER,
    "transaction_type" "TransactionType" NOT NULL,
    "category" VARCHAR(100),
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod",
    "reference_number" VARCHAR(100),
    "description" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id_transaction")
);

-- CreateTable
CREATE TABLE "query_logs" (
    "id_query" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "client_id" INTEGER,
    "document_id" INTEGER,
    "natural_query" TEXT NOT NULL,
    "action_type" "QueryActionType" NOT NULL,
    "generated_sql" TEXT,
    "status" "QueryStatus" NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "execution_time_ms" INTEGER,
    "model_used" VARCHAR(50),
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "query_logs_pkey" PRIMARY KEY ("id_query")
);

-- CreateTable
CREATE TABLE "reports" (
    "id_report" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "query_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "content" TEXT NOT NULL,
    "file_path" VARCHAR(500),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id_report")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "businesses_owner_id_idx" ON "businesses"("owner_id");

-- CreateIndex
CREATE INDEX "businesses_is_active_idx" ON "businesses"("is_active");

-- CreateIndex
CREATE INDEX "clients_business_id_idx" ON "clients"("business_id");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "documents_business_id_idx" ON "documents"("business_id");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "documents_is_processed_idx" ON "documents"("is_processed");

-- CreateIndex
CREATE INDEX "engagements_business_id_idx" ON "engagements"("business_id");

-- CreateIndex
CREATE INDEX "engagements_client_id_idx" ON "engagements"("client_id");

-- CreateIndex
CREATE INDEX "engagements_status_idx" ON "engagements"("status");

-- CreateIndex
CREATE INDEX "engagement_items_engagement_id_idx" ON "engagement_items"("engagement_id");

-- CreateIndex
CREATE INDEX "engagement_items_business_id_idx" ON "engagement_items"("business_id");

-- CreateIndex
CREATE INDEX "transactions_business_id_idx" ON "transactions"("business_id");

-- CreateIndex
CREATE INDEX "transactions_client_id_idx" ON "transactions"("client_id");

-- CreateIndex
CREATE INDEX "transactions_transaction_date_idx" ON "transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "transactions_transaction_type_idx" ON "transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "query_logs_business_id_idx" ON "query_logs"("business_id");

-- CreateIndex
CREATE INDEX "query_logs_user_id_idx" ON "query_logs"("user_id");

-- CreateIndex
CREATE INDEX "query_logs_created_at_idx" ON "query_logs"("created_at");

-- CreateIndex
CREATE INDEX "query_logs_status_idx" ON "query_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reports_query_id_key" ON "reports"("query_id");

-- CreateIndex
CREATE INDEX "reports_business_id_idx" ON "reports"("business_id");

-- CreateIndex
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");

-- CreateIndex
CREATE INDEX "reports_report_type_idx" ON "reports"("report_type");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at");

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id_client") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_items" ADD CONSTRAINT "engagement_items_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagements"("id_engagement") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_items" ADD CONSTRAINT "engagement_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id_client") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagements"("id_engagement") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_logs" ADD CONSTRAINT "query_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_logs" ADD CONSTRAINT "query_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_logs" ADD CONSTRAINT "query_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id_client") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_logs" ADD CONSTRAINT "query_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id_document") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_query_id_fkey" FOREIGN KEY ("query_id") REFERENCES "query_logs"("id_query") ON DELETE SET NULL ON UPDATE CASCADE;
