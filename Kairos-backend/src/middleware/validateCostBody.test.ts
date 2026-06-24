import { describe, it, expect, vi } from "vitest";
import { validateCostBody } from "./validateCostBody";

function makeReq(body: unknown) {
  return { body } as any;
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

const VALID_BODY = { product_id: "prod_abc", cost_per_unit: 9.99 };

describe("validateCostBody — S0-T15", () => {
  it("400 si cost_per_unit est négatif", () => {
    const res = makeRes();
    const next = vi.fn();
    validateCostBody(makeReq({ ...VALID_BODY, cost_per_unit: -5 }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "INVALID_INPUT" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si cost_per_unit est 0", () => {
    const res = makeRes();
    const next = vi.fn();
    validateCostBody(makeReq({ ...VALID_BODY, cost_per_unit: 0 }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si cost_per_unit est une string non numérique", () => {
    const res = makeRes();
    const next = vi.fn();
    validateCostBody(makeReq({ ...VALID_BODY, cost_per_unit: "abc" }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si cost_per_unit est Infinity", () => {
    const res = makeRes();
    const next = vi.fn();
    validateCostBody(makeReq({ ...VALID_BODY, cost_per_unit: Infinity }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si product_id est absent", () => {
    const res = makeRes();
    const next = vi.fn();
    validateCostBody(makeReq({ cost_per_unit: 9.99 }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si product_id est une string vide", () => {
    const res = makeRes();
    const next = vi.fn();
    validateCostBody(makeReq({ product_id: "", cost_per_unit: 9.99 }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("next() pour body valide (product_id + cost_per_unit)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateCostBody(makeReq(VALID_BODY), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("next() pour body valide avec note et variant_id optionnels", () => {
    const res = makeRes();
    const next = vi.fn();
    validateCostBody(makeReq({ ...VALID_BODY, variant_id: "var_123", note: "Prix fournisseur" }), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
