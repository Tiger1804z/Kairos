import { describe, it, expect, vi } from "vitest";
import { validateAiMessage } from "./validateAiMessage";

function makeReq(body: unknown) {
  return { body } as any;
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("validateAiMessage — S0-T15", () => {
  it("400 si question absente", () => {
    const res = makeRes();
    const next = vi.fn();
    validateAiMessage(makeReq({}), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si question est un nombre (non-string)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateAiMessage(makeReq({ question: 42 }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "INVALID_INPUT" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si question est null", () => {
    const res = makeRes();
    const next = vi.fn();
    validateAiMessage(makeReq({ question: null }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si question vide après trim", () => {
    const res = makeRes();
    const next = vi.fn();
    validateAiMessage(makeReq({ question: "   " }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("400 si question dépasse 2000 caractères", () => {
    const res = makeRes();
    const next = vi.fn();
    validateAiMessage(makeReq({ question: "a".repeat(2001) }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("next() si question valide (texte normal)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateAiMessage(makeReq({ question: "Quel est mon produit le plus rentable?" }), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("next() si question fait exactement 2000 caractères (limite incluse)", () => {
    const res = makeRes();
    const next = vi.fn();
    validateAiMessage(makeReq({ question: "a".repeat(2000) }), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
