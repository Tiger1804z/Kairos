-- CreateEnum
CREATE TYPE "PrivacyEventType" AS ENUM ('privacy_policy_accepted', 'data_processing_consent_given', 'data_processing_consent_withdrawn', 'data_export_requested', 'data_deletion_requested', 'marketing_consent_given', 'marketing_consent_withdrawn');

-- CreateTable
CREATE TABLE "privacy_consent_events" (
    "id" TEXT NOT NULL,
    "business_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "event_type" "PrivacyEventType" NOT NULL,
    "source" VARCHAR(100),
    "policy_version" VARCHAR(50),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privacy_consent_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "privacy_consent_events_business_id_idx" ON "privacy_consent_events"("business_id");

-- CreateIndex
CREATE INDEX "privacy_consent_events_user_id_idx" ON "privacy_consent_events"("user_id");

-- CreateIndex
CREATE INDEX "privacy_consent_events_event_type_idx" ON "privacy_consent_events"("event_type");

-- CreateIndex
CREATE INDEX "privacy_consent_events_created_at_idx" ON "privacy_consent_events"("created_at");

-- AddForeignKey
ALTER TABLE "privacy_consent_events" ADD CONSTRAINT "privacy_consent_events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id_business") ON DELETE RESTRICT ON UPDATE CASCADE;
