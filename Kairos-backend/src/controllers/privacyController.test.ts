import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrivacyEventType } from "../../generated/prisma/client";

const { mockRecordConsent } = vi.hoisted(() => ({
  mockRecordConsent: vi.fn(),
}));

vi.mock("../services/privacyConsentService", () => ({
  recordConsent: mockRecordConsent,
}));

import { requestDataExport, requestDataDeletion } from "./privacyController";

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("requestDataExport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls recordConsent with data_export_requested", async () => {
    mockRecordConsent.mockResolvedValueOnce({});
    const req: any = { businessId: 1, user: { user_id: 42, role: "owner", email: "a@a.com" } };
    const res = makeRes();

    await requestDataExport(req, res);

    expect(mockRecordConsent).toHaveBeenCalledWith(
      1,
      42,
      PrivacyEventType.data_export_requested,
      { source: "api", metadata: { status: "pending" } }
    );
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("returns 400 when businessId missing", async () => {
    const req: any = { businessId: undefined, user: { user_id: 42 } };
    const res = makeRes();

    await requestDataExport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockRecordConsent).not.toHaveBeenCalled();
  });

  it("returns 500 on service error", async () => {
    mockRecordConsent.mockRejectedValueOnce(new Error("db error"));
    const req: any = { businessId: 1, user: { user_id: 42 } };
    const res = makeRes();

    await requestDataExport(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("requestDataDeletion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls recordConsent with data_deletion_requested", async () => {
    mockRecordConsent.mockResolvedValueOnce({});
    const req: any = { businessId: 5, user: { user_id: 7, role: "owner", email: "b@b.com" } };
    const res = makeRes();

    await requestDataDeletion(req, res);

    expect(mockRecordConsent).toHaveBeenCalledWith(
      5,
      7,
      PrivacyEventType.data_deletion_requested,
      { source: "api", metadata: { status: "pending" } }
    );
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("returns 400 when businessId missing", async () => {
    const req: any = { businessId: undefined, user: { user_id: 7 } };
    const res = makeRes();

    await requestDataDeletion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockRecordConsent).not.toHaveBeenCalled();
  });

  it("returns 500 on service error", async () => {
    mockRecordConsent.mockRejectedValueOnce(new Error("db error"));
    const req: any = { businessId: 5, user: { user_id: 7 } };
    const res = makeRes();

    await requestDataDeletion(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
