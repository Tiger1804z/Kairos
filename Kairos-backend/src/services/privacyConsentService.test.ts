import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrivacyEventType } from "../../generated/prisma/client";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("../prisma/prisma", () => ({
  default: {
    privacyConsentEvent: { create: mockCreate },
  },
}));

import { recordConsent } from "./privacyConsentService";

describe("recordConsent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates event with a non-null userId", async () => {
    const fakeEvent = {
      id: "uuid-1",
      business_id: 1,
      user_id: 42,
      event_type: PrivacyEventType.privacy_policy_accepted,
      created_at: new Date(),
    };
    mockCreate.mockResolvedValueOnce(fakeEvent);

    const result = await recordConsent(1, 42, PrivacyEventType.privacy_policy_accepted);

    expect(mockCreate).toHaveBeenCalledWith({
      data: { business_id: 1, user_id: 42, event_type: PrivacyEventType.privacy_policy_accepted },
    });
    expect(result).toBe(fakeEvent);
  });

  it("creates event with null userId (anonymous)", async () => {
    const fakeEvent = {
      id: "uuid-2",
      business_id: 5,
      user_id: null,
      event_type: PrivacyEventType.privacy_policy_accepted,
      created_at: new Date(),
    };
    mockCreate.mockResolvedValueOnce(fakeEvent);

    await recordConsent(5, null, PrivacyEventType.privacy_policy_accepted);

    expect(mockCreate).toHaveBeenCalledWith({
      data: { business_id: 5, user_id: null, event_type: PrivacyEventType.privacy_policy_accepted },
    });
  });

  it("returns the created event", async () => {
    const fakeEvent = { id: "uuid-3" };
    mockCreate.mockResolvedValueOnce(fakeEvent);

    const result = await recordConsent(3, 5, PrivacyEventType.data_processing_consent_given);

    expect(result).toStrictEqual(fakeEvent);
  });
});
