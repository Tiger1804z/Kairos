/**
 * Tests unitaires pour src/services/csvCostImporter.ts (S0-FIX-04)
 *
 * OBJECTIF : prouver que l'import CSV est business-scoped et all-or-nothing :
 *   - chaque product_id doit exister ET appartenir au businessId ;
 *   - une seule ligne invalide (champ ou produit externe) => 0 écriture ;
 *   - aucun cost écrit tant que TOUTES les lignes ne sont pas validées.
 *
 * STRATÉGIE : Prisma mocké (pas de DB). parseCsvBuffer réel (pur). On observe
 * imported/errors et si $transaction (l'écriture) est appelée.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockProductFindMany, mockTransaction, mockProductCostCreate } = vi.hoisted(() => ({
  mockProductFindMany: vi.fn(),
  mockTransaction: vi.fn(),
  mockProductCostCreate: vi.fn(),
}));

vi.mock("../prisma/prisma", () => ({
  default: {
    product: { findMany: mockProductFindMany },
    productCost: { create: mockProductCostCreate },
    $transaction: mockTransaction,
  },
}));

import { importCostsFromCsv } from "./csvCostImporter";

const BUSINESS_ID = 42;

function csv(...lines: string[]): Buffer {
  return Buffer.from(["product_id,cost_per_unit,note", ...lines].join("\n"), "utf-8");
}

beforeEach(() => {
  vi.clearAllMocks();
  // create renvoie un marqueur ; $transaction résout la liste des promesses.
  mockProductCostCreate.mockImplementation((args: any) => args);
  mockTransaction.mockResolvedValue([]);
});

describe("importCostsFromCsv — business-scoped, all-or-nothing", () => {
  // ── Owner : tous les produits lui appartiennent → import écrit ──
  it("importe tous les costs quand tous les produits appartiennent au business", async () => {
    mockProductFindMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);

    const result = await importCostsFromCsv(csv("p1,10", "p2,20,note2"), BUSINESS_ID);

    expect(result.imported).toBe(2);
    expect(result.errors).toEqual([]);
    // le lookup ownership est bien scopé au business
    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["p1", "p2"] }, business_id: BUSINESS_ID },
      })
    );
    // écriture atomique effectuée
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockProductCostCreate).toHaveBeenCalledTimes(2);
  });

  // ── Cœur du ticket : un produit externe → 0 écriture ───────────
  it("rejette tout l'import si un product_id est externe (aucune écriture)", async () => {
    // p1 appartient au business, pExt non (absent du résultat scopé)
    mockProductFindMany.mockResolvedValue([{ id: "p1" }]);

    const result = await importCostsFromCsv(csv("p1,10", "pExt,20"), BUSINESS_ID);

    expect(result.imported).toBe(0);
    expect(result.errors).toEqual([
      { row: 3, reason: "product_id inexistant ou hors de ce business" },
    ]);
    // AUCUNE écriture : pas d'import partiel
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockProductCostCreate).not.toHaveBeenCalled();
  });

  // ── Produit inexistant → même traitement (0 écriture) ──────────
  it("rejette tout l'import si un produit n'existe pas", async () => {
    mockProductFindMany.mockResolvedValue([]);

    const result = await importCostsFromCsv(csv("ghost,10"), BUSINESS_ID);

    expect(result.imported).toBe(0);
    expect(result.errors[0]).toEqual({
      row: 2,
      reason: "product_id inexistant ou hors de ce business",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  // ── cost_per_unit invalide → 400 comportement (0 écriture) ─────
  it("rejette l'import quand une ligne a un cost_per_unit invalide", async () => {
    mockProductFindMany.mockResolvedValue([{ id: "p1" }]);

    const result = await importCostsFromCsv(csv("p1,abc"), BUSINESS_ID);

    expect(result.imported).toBe(0);
    expect(result.errors).toEqual([{ row: 2, reason: "cost_per_unit invalide" }]);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  // ── product_id manquant → erreur, 0 écriture ───────────────────
  it("rejette l'import quand une ligne n'a pas de product_id", async () => {
    mockProductFindMany.mockResolvedValue([{ id: "p1" }]);

    const result = await importCostsFromCsv(csv(",10", "p1,20"), BUSINESS_ID);

    expect(result.imported).toBe(0);
    expect(result.errors).toContainEqual({ row: 2, reason: "product_id manquant" });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  // ── Mix valide + externe → all-or-nothing (rien écrit) ─────────
  it("n'écrit rien si une seule ligne sur plusieurs référence un produit externe", async () => {
    mockProductFindMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);

    const result = await importCostsFromCsv(csv("p1,10", "p2,20", "pExt,30"), BUSINESS_ID);

    expect(result.imported).toBe(0);
    expect(result.errors).toEqual([
      { row: 4, reason: "product_id inexistant ou hors de ce business" },
    ]);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockProductCostCreate).not.toHaveBeenCalled();
  });
});
