import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrivacyEventType } from "../../generated/prisma/client";

const { mockTransaction, mockCreateBusiness, mockRecordConsent, mockTx } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockCreateBusiness: vi.fn(),
  mockRecordConsent: vi.fn(),
  mockTx: { __isTx: true },
}));

vi.mock("../prisma/prisma", () => ({
  default: { $transaction: mockTransaction },
}));

vi.mock("../services/businessService", () => ({
  createBusinessForOwnerService: mockCreateBusiness,
}));

vi.mock("../services/privacyConsentService", async () => {
  const { PrivacyEventType } = await import("../../generated/prisma/client");
  return { recordConsent: mockRecordConsent, PrivacyEventType };
});

import { createOnboardingBusiness } from "./onboardingController";

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function makeReq(body: Record<string, unknown>) {
  return { user: { user_id: 42 }, body } as any;
}

const fakeBusiness = { id_business: 7, owner_id: 42, name: "Boutique", currency: "CAD" };

describe("createOnboardingBusiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // $transaction execute le callback avec un tx mock ; un throw dans le callback rejette (= rollback)
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx));
  });

  it("returns 400 MISSING_FIELDS when name or currency missing", async () => {
    const res = makeRes();
    await createOnboardingBusiness(makeReq({ currency: "CAD", consent_accepted: true }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "MISSING_FIELDS" }));
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 CONSENT_REQUIRED when consent_accepted is absent, no business created", async () => {
    const res = makeRes();
    await createOnboardingBusiness(makeReq({ name: "Boutique", currency: "CAD" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "CONSENT_REQUIRED" }));
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockCreateBusiness).not.toHaveBeenCalled();
  });

  it("returns 400 CONSENT_REQUIRED when consent_accepted is false, no business created", async () => {
    const res = makeRes();
    await createOnboardingBusiness(makeReq({ name: "Boutique", currency: "CAD", consent_accepted: false }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "CONSENT_REQUIRED" }));
    expect(mockCreateBusiness).not.toHaveBeenCalled();
  });

  it("rejects non-boolean truthy consent values (string 'true')", async () => {
    const res = makeRes();
    await createOnboardingBusiness(makeReq({ name: "Boutique", currency: "CAD", consent_accepted: "true" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "CONSENT_REQUIRED" }));
  });

  it("creates business + consent event in the same transaction and returns 201", async () => {
    mockCreateBusiness.mockResolvedValueOnce(fakeBusiness);
    mockRecordConsent.mockResolvedValueOnce({ id: "uuid-1" });
    const res = makeRes();

    await createOnboardingBusiness(makeReq({ name: "Boutique", currency: "CAD", consent_accepted: true }), res);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockCreateBusiness).toHaveBeenCalledWith(
      expect.objectContaining({ owner_id: 42, name: "Boutique", currency: "CAD" }),
      mockTx
    );
    expect(mockRecordConsent).toHaveBeenCalledWith(
      7,
      42,
      PrivacyEventType.privacy_policy_accepted,
      { tx: mockTx }
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeBusiness);
  });

  it("returns 500 CONSENT_RECORDING_FAILED when recordConsent fails, transaction rolled back", async () => {
    mockCreateBusiness.mockResolvedValueOnce(fakeBusiness);
    mockRecordConsent.mockRejectedValueOnce(new Error("relation privacy_consent_events does not exist"));
    const res = makeRes();

    await createOnboardingBusiness(makeReq({ name: "Boutique", currency: "CAD", consent_accepted: true }), res);

    // le callback transaction a bien rejete → Prisma rollback la creation du business
    await expect(mockTransaction.mock.results[0]?.value).rejects.toThrow("CONSENT_RECORDING_FAILED");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "CONSENT_RECORDING_FAILED" }));
    // pas de 201, pas de business retourne
    expect(res.status).not.toHaveBeenCalledWith(201);
  });

  it("does not leak underlying error details in the consent failure response", async () => {
    mockCreateBusiness.mockResolvedValueOnce(fakeBusiness);
    mockRecordConsent.mockRejectedValueOnce(new Error("secret db detail: password=xyz host=neon"));
    const res = makeRes();

    await createOnboardingBusiness(makeReq({ name: "Boutique", currency: "CAD", consent_accepted: true }), res);

    const payload = JSON.stringify(res.json.mock.calls[0][0]);
    expect(payload).not.toContain("secret db detail");
    expect(payload).not.toContain("password");
    expect(payload).not.toContain("stack");
  });

  it("returns 400 when business name already exists", async () => {
    mockCreateBusiness.mockRejectedValueOnce(new Error("BUSINESS_NAME_ALREADY_EXISTS"));
    const res = makeRes();

    await createOnboardingBusiness(makeReq({ name: "Boutique", currency: "CAD", consent_accepted: true }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "BUSINESS_NAME_ALREADY_EXISTS" });
  });

  it("returns generic 500 on unexpected errors", async () => {
    mockCreateBusiness.mockRejectedValueOnce(new Error("connection refused 10.0.0.5:5432"));
    const res = makeRes();

    await createOnboardingBusiness(makeReq({ name: "Boutique", currency: "CAD", consent_accepted: true }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "INTERNAL_SERVER_ERROR" });
  });
});
