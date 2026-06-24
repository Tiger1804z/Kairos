import { describe, it, expect, vi } from "vitest";
import { validateBusinessIdParam } from "./validateBusinessIdParam";

function makeReq(businessId: string) {
  return { params: { businessId } } as any;
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("validateBusinessIdParam — S0-T15", () => {
  it("400 pour businessId=abc (lettres)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateBusinessIdParam(makeReq("abc"), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "INVALID_BUSINESS_ID" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("400 pour businessId=-1 (négatif)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateBusinessIdParam(makeReq("-1"), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 pour businessId=0 (zéro)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateBusinessIdParam(makeReq("0"), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 pour businessId=1.5 (décimal)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateBusinessIdParam(makeReq("1.5"), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 pour businessId vide", () => {
    const res = makeRes();
    const next = vi.fn();
    validateBusinessIdParam(makeReq(""), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("next() pour businessId=1 (valide)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateBusinessIdParam(makeReq("1"), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("next() pour businessId=42 (valide)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateBusinessIdParam(makeReq("42"), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
