import type { Request, Response } from "express";
import prisma from "../prisma/prisma";
import { computeProfitability, computeInsights } from "../services/shopifyEngineClient";

const TEST_PREFIX = "KAIROS-TEST-";

interface ScenarioConfig {
  id: string;
  cost: number | null;
  unitPrice: number;
  quantity: number;
  financialStatus: string;
  totalDiscounts: number;
}

const SCENARIOS: ScenarioConfig[] = [
  { id: "A", cost: 8,    unitPrice: 50, quantity: 5, financialStatus: "paid",     totalDiscounts: 0  },
  { id: "B", cost: 80,   unitPrice: 60, quantity: 3, financialStatus: "paid",     totalDiscounts: 0  },
  { id: "C", cost: 42,   unitPrice: 45, quantity: 4, financialStatus: "paid",     totalDiscounts: 0  },
  { id: "D", cost: null, unitPrice: 30, quantity: 2, financialStatus: "paid",     totalDiscounts: 0  },
  { id: "E", cost: 20,   unitPrice: 35, quantity: 2, financialStatus: "refunded", totalDiscounts: 0  },
  { id: "F", cost: 15,   unitPrice: 40, quantity: 3, financialStatus: "paid",     totalDiscounts: 60 },
];

// Produits démo — utilisés si le business n'a pas encore de produits Shopify
const DEMO_PRODUCT_DEFS = [
  { id: "A", title: "Alpine Pro Snowboard",          vendor: "Alpine Gear"   },
  { id: "B", title: "Carbon Fiber Ski Boots",        vendor: "SkiTech"       },
  { id: "C", title: "Thermal Base Layer Set",        vendor: "OutdoorPlus"   },
  { id: "D", title: "Powder Gloves XL",              vendor: "MountainWear"  },
  { id: "E", title: "Helmet with Integrated Visor",  vendor: "SafeRide"      },
  { id: "F", title: "Performance Ski Jacket",        vendor: "Alpine Gear"   },
];

/**
 * Garantit que 6 produits sont disponibles pour le business.
 * Si des produits Shopify existent → les utilise en priorité.
 * S'il en manque → crée les produits démo manquants (upsert idempotent).
 * Retourne exactement 6 produits dans l'ordre des scénarios.
 */
async function ensureDemoProducts(
  businessId: number,
): Promise<{ id: string; title: string }[]> {
  // 1. Cherche d'abord les produits existants (Shopify ou démo)
  const existing = await prisma.product.findMany({
    where: { business_id: businessId },
    take: 6,
    select: { id: true, title: true },
  });

  if (existing.length >= 6) return existing.slice(0, 6);

  // 2. Complète avec les produits démo manquants
  const results = [...existing];
  const needed = DEMO_PRODUCT_DEFS.slice(existing.length);

  for (const def of needed) {
    const shopifyProductId = `KAIROS-DEMO-PROD-${def.id}`;

    // upsert : crée si absent, ne touche à rien s'il existe déjà
    const product = await prisma.product.upsert({
      where: {
        shopify_product_id_business_id: {
          shopify_product_id: shopifyProductId,
          business_id: businessId,
        },
      },
      update: {},
      create: {
        business_id:        businessId,
        shopify_product_id: shopifyProductId,
        title:              def.title,
        vendor:             def.vendor,
        status:             "active",
      },
      select: { id: true, title: true },
    });

    results.push(product);
  }

  return results;
}

/**
 * POST /demo/:businessId/load
 *
 * Pipeline complet en 1 requête — aucun prérequis Shopify :
 *   1. ensureDemoProducts — produits Shopify existants ou création auto
 *   2. clearTestData      — supprime orders KAIROS-TEST-* + coûts des 6 produits
 *   3. seed               — recrée les 6 scénarios (coûts + orders)
 *   4. profitability      — calcule + stocke les ProfitabilitySnapshots
 *   5. insights           — calcule + stocke les Insights
 */
export async function handleLoadDemoData(req: Request, res: Response) {
  const businessId = parseInt(req.params.businessId ?? "", 10);
  if (isNaN(businessId)) {
    return res.status(400).json({ error: "Invalid businessId" });
  }

  try {

  // 1. Produits — crée les démo si nécessaire
  const products = await ensureDemoProducts(businessId);

  // 2. Nettoyage idempotent
  await prisma.orderItem.deleteMany({
    where: { shopify_line_item_id: { startsWith: TEST_PREFIX } },
  });
  await prisma.order.deleteMany({
    where: {
      business_id:      businessId,
      shopify_order_id: { startsWith: TEST_PREFIX },
    },
  });
  await prisma.productCost.deleteMany({
    where: { product_id: { in: products.map((p) => p.id) } },
  });

  // 3. Seed — 6 scénarios
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 5);

  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i]!;
    const product  = products[i]!;

    if (scenario.cost !== null) {
      await prisma.productCost.create({
        data: {
          product_id:    product.id,
          cost_per_unit: scenario.cost,
          source_type:   "manual",
          effective_from: new Date(),
        },
      });
    }

    const totalPrice = scenario.unitPrice * scenario.quantity;
    const order = await prisma.order.create({
      data: {
        business_id:        businessId,
        shopify_order_id:   `${TEST_PREFIX}${scenario.id}`,
        order_number:       `${TEST_PREFIX}${scenario.id}`,
        total_price:        totalPrice,
        total_discounts:    scenario.totalDiscounts,
        financial_status:   scenario.financialStatus,
        fulfillment_status: "fulfilled",
        created_at:         thisMonth,
      },
    });

    await prisma.orderItem.create({
      data: {
        shopify_line_item_id: `${TEST_PREFIX}ITEM-${scenario.id}`,
        order_id:   order.id,
        product_id: product.id,
        quantity:   scenario.quantity,
        unit_price: scenario.unitPrice,
        line_total: totalPrice,
        title:      product.title,
      },
    });
  }

  // 4. Profitability — même logique que profitabilityController
  const now         = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd   = now;

  const orderItems = await prisma.orderItem.findMany({
    where: { order: { business_id: businessId }, product_id: { not: null } },
    select: { product_id: true, quantity: true, unit_price: true },
  });

  const costs = await prisma.productCost.findMany({
    where:     { product: { business_id: businessId }, variant_id: null },
    orderBy:   { effective_from: "desc" },
    distinct:  ["product_id"],
    select:    { product_id: true, cost_per_unit: true },
  });

  const snapshots = await computeProfitability({
    business_id:   businessId,
    period_start:  periodStart.toISOString().split("T")[0]!,
    period_end:    periodEnd.toISOString().split("T")[0]!,
    order_items:   orderItems.map((i) => ({
      product_id: i.product_id!,
      quantity:   i.quantity,
      unit_price: Number(i.unit_price),
    })),
    product_costs: costs.map((c) => ({
      product_id:    c.product_id,
      cost_per_unit: Number(c.cost_per_unit),
    })),
  });

  for (const s of snapshots) {
    await prisma.profitabilitySnapshot.upsert({
      where: {
        business_id_product_id_period_start_period_end: {
          business_id: businessId,
          product_id:  s.product_id,
          period_start: periodStart,
          period_end:   periodEnd,
        },
      },
      update: {
        revenue:          s.revenue,
        cogs:             s.cogs,
        gross_profit:     s.gross_profit,
        gross_margin_pct: s.gross_margin_pct,
        units_sold:       s.units_sold,
        calculated_at:    now,
      },
      create: {
        business_id:      businessId,
        product_id:       s.product_id,
        period_start:     periodStart,
        period_end:       periodEnd,
        revenue:          s.revenue,
        cogs:             s.cogs,
        gross_profit:     s.gross_profit,
        gross_margin_pct: s.gross_margin_pct,
        units_sold:       s.units_sold,
        calculated_at:    now,
      },
    });
  }

  // 5. Insights — même logique que insightController
  const allSnapshots = await prisma.profitabilitySnapshot.findMany({
    where:   { business_id: businessId },
    orderBy: { calculated_at: "desc" },
    include: { product: { select: { title: true } } },
  });

  const seen = new Set<string>();
  const dedupedSnapshots = allSnapshots.filter((s) => {
    if (seen.has(s.product_id)) return false;
    seen.add(s.product_id);
    return true;
  });

  const orderItemsForInsights = await prisma.orderItem.findMany({
    where: { order: { business_id: businessId }, product_id: { not: null } },
    select: {
      product_id: true,
      quantity:   true,
      unit_price: true,
      order: {
        select: {
          financial_status: true,
          total_discounts:  true,
          total_price:      true,
        },
      },
    },
  });

  const insights = await computeInsights({
    business_id:  businessId,
    period_start: periodStart.toISOString().split("T")[0]!,
    period_end:   periodEnd.toISOString().split("T")[0]!,
    snapshots: dedupedSnapshots.map((s) => ({
      product_id:       s.product_id,
      product_name:     s.product?.title ?? s.product_id,
      revenue:          Number(s.revenue),
      cogs:             Number(s.cogs),
      gross_profit:     Number(s.gross_profit),
      gross_margin_pct: Number(s.gross_margin_pct),
      units_sold:       s.units_sold,
      has_cost:         Number(s.cogs) > 0,
    })),
    order_items: orderItemsForInsights.map((i) => {
      const unitPrice     = Number(i.unit_price);
      const lineTotal     = unitPrice * i.quantity;
      const orderTotal    = Number(i.order.total_price);
      const ratio         = orderTotal > 0 ? lineTotal / orderTotal : 0;
      const discountShare = Number(i.order.total_discounts) * ratio;
      return {
        product_id:      i.product_id!,
        quantity:        i.quantity,
        unit_price:      unitPrice,
        original_price:  unitPrice + discountShare / i.quantity,
        refunded_amount: i.order.financial_status === "refunded" ? lineTotal : 0,
      };
    }),
  });

  await prisma.insight.deleteMany({ where: { business_id: businessId } });

  if (insights.length > 0) {
    await prisma.insight.createMany({
      data: insights.map((insight) => ({
        business_id:  businessId,
        type:         insight.type,
        severity:     insight.severity,
        title:        insight.title,
        message:      insight.description,
        action:       insight.action ?? null,
        metadata:     { product_id: insight.product_id, value: insight.value },
        period_start: periodStart,
        period_end:   periodEnd,
      })),
    });
  }

    return res.json({
      success:           true,
      productsSeeded:    SCENARIOS.length,
      insightsGenerated: insights.length,
    });
  } catch (err: any) {
    const message = err?.message ?? "Demo load failed";
    const isPythonDown = message.includes("ECONNREFUSED") || message.includes("connect");
    return res.status(500).json({
      error: isPythonDown
        ? "Python engine is not running. Start it with: uvicorn app.main:app --reload --port 8002"
        : message,
    });
  }
}
