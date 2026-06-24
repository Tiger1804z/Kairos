import prisma from "../prisma/prisma";
import { PrivacyEventType } from "../../generated/prisma/client";

export { PrivacyEventType };

export async function recordConsent(
  businessId: number,
  userId: number | null,
  eventType: PrivacyEventType
) {
  return prisma.privacyConsentEvent.create({
    data: {
      business_id: businessId,
      user_id: userId,
      event_type: eventType,
    },
  });
}
