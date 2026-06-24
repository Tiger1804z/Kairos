import prisma from "../prisma/prisma";
import { PrivacyEventType } from "../../generated/prisma/client";

export { PrivacyEventType };

export async function recordConsent(
  businessId: number,
  userId: number | null,
  eventType: PrivacyEventType,
  options?: { source?: string; metadata?: Record<string, unknown> }
) {
  return prisma.privacyConsentEvent.create({
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
