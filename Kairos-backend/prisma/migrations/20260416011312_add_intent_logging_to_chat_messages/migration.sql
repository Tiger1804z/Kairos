-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "execution_time_ms" INTEGER,
ADD COLUMN     "intent_family" TEXT,
ADD COLUMN     "routing_status" TEXT;

-- CreateIndex
CREATE INDEX "chat_messages_intent_family_idx" ON "chat_messages"("intent_family");

-- CreateIndex
CREATE INDEX "chat_messages_routing_status_idx" ON "chat_messages"("routing_status");
