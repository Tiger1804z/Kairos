import prisma from "../prisma/prisma";
import { Prisma, PrivacyEventType } from "../../generated/prisma/client";

export { PrivacyEventType };

export async function recordConsent(
  businessId: number,
  userId: number | null,
  eventType: PrivacyEventType,
  options?: {
    source?: string;
    metadata?: Record<string, unknown>;
    /** Client transactionnel Prisma — permet d'inclure l'event dans une transaction appelante */
    tx?: Prisma.TransactionClient;
  }
) {
  const client = options?.tx ?? prisma;
  return client.privacyConsentEvent.create({
    data: {
      business_id: businessId,
      user_id: userId,
      event_type: eventType,
      ...(options?.source != null ? { source: options.source } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(options?.metadata != null ? { metadata: options.metadata as any } : {}),
    },
  });
}
