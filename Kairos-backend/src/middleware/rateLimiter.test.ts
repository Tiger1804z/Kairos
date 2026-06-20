import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import {
  rateLimitHandler,
  userOrIpKeyGenerator,
  businessOrUserOrIpKeyGenerator,
} from "./rateLimiter";

// Fabrique un faux Response avec status()/json() chaînables et espionnés.
function makeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("rateLimitHandler", () => {
  it("renvoie 429 avec un corps JSON clair (pas de HTML)", () => {
    const res = makeRes();
    const statusSpy = vi.spyOn(res, "status");
    const jsonSpy = vi.spyOn(res, "json");

    rateLimitHandler({} as Request, res, vi.fn(), { statusCode: 429 });

    expect(statusSpy).toHaveBeenCalledWith(429);
    expect(jsonSpy).toHaveBeenCalledWith({
      error: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
    });
  });

  it("utilise le statusCode fourni par express-rate-limit", () => {
    const res = makeRes();
    rateLimitHandler({} as Request, res, vi.fn(), { statusCode: 429 });
    expect(res.statusCode).toBe(429);
  });
});

describe("userOrIpKeyGenerator (AI / costs)", () => {
  it("utilise user_id quand le user est authentifié", () => {
    const req = {
      user: { user_id: 42, role: "owner", email: "a@b.com" },
      ip: "1.2.3.4",
      params: {},
    } as unknown as Request;
    expect(userOrIpKeyGenerator(req)).toBe("42");
  });

  it("retombe sur l'IP quand aucun user n'est présent", () => {
    const req = { ip: "1.2.3.4", params: {} } as unknown as Request;
    // ipKeyGenerator renvoie l'IPv4 telle quelle.
    expect(userOrIpKeyGenerator(req)).toBe("1.2.3.4");
  });
});

describe("businessOrUserOrIpKeyGenerator (sync)", () => {
  it("priorise le businessId (param URL)", () => {
    const req = {
      params: { businessId: "7" },
      user: { user_id: 42, role: "owner", email: "a@b.com" },
      ip: "1.2.3.4",
    } as unknown as Request;
    expect(businessOrUserOrIpKeyGenerator(req)).toBe("business:7");
  });

  it("retombe sur le user quand pas de businessId", () => {
    const req = {
      params: {},
      user: { user_id: 42, role: "owner", email: "a@b.com" },
      ip: "1.2.3.4",
    } as unknown as Request;
    expect(businessOrUserOrIpKeyGenerator(req)).toBe("user:42");
  });

  it("retombe sur l'IP quand ni business ni user", () => {
    const req = { params: {}, ip: "1.2.3.4" } as unknown as Request;
    expect(businessOrUserOrIpKeyGenerator(req)).toBe("1.2.3.4");
  });
});
