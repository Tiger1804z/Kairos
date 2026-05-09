/**
 * prisma/seedShopifyTestData.ts
 *
 * Seed de données de test directement en DB via Prisma.
 * Valide le pipeline : profitabilité → insights (6 scénarios).
 *
 * Usage (depuis Kairos-backend/) :
 *   TEST_BUSINESS_ID=<id> npm run seed:db
 *
 * Flow ensuite :
 *   POST /profitability/:businessId/compute
 *   POST /insights/:businessId/compute
 */

import { PrismaClient } from '../generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BUSINESS_ID = parseInt(process.env.TEST_BUSINESS_ID ?? '1', 10);
const TEST_PREFIX  = 'KAIROS-TEST-';
const THIS_MONTH   = new Date(new Date().getFullYear(), new Date().getMonth(), 5);

// ─── Config des 6 scénarios ───────────────────────────────────────────────────
//
// financial_status "refunded" → insightController détecte refund_impact
// total_discounts 60          → insightController reconstruit le prix catalogue
//                               pour détecter discount_erosion

interface ScenarioConfig {
  id: string;           // A, B, C, D, E, F
  cost: number | null;  // null = missing_cost_alert
  unitPrice: number;
  quantity: number;
  financialStatus: string;
  totalDiscounts: number;
  expectedInsight: string;
}

const SCENARIOS: ScenarioConfig[] = [
  { id: 'A', cost: 8,    unitPrice: 50, quantity: 5, financialStatus: 'paid',     totalDiscounts: 0,  expectedInsight: 'true_top_product'     },
  { id: 'B', cost: 80,   unitPrice: 60, quantity: 3, financialStatus: 'paid',     totalDiscounts: 0,  expectedInsight: 'negative_margin_alert' },
  { id: 'C', cost: 42,   unitPrice: 45, quantity: 4, financialStatus: 'paid',     totalDiscounts: 0,  expectedInsight: 'low_margin_warning'    },
  { id: 'D', cost: null, unitPrice: 30, quantity: 2, financialStatus: 'paid',     totalDiscounts: 0,  expectedInsight: 'missing_cost_alert'    },
  { id: 'E', cost: 20,   unitPrice: 35, quantity: 2, financialStatus: 'refunded', totalDiscounts: 0,  expectedInsight: 'refund_impact'         },
  { id: 'F', cost: 15,   unitPrice: 40, quantity: 3, financialStatus: 'paid',     totalDiscounts: 60, expectedInsight: 'discount_erosion'      },
];

// ─── Nettoyage ────────────────────────────────────────────────────────────────

async function clearTestData(productIds: string[]): Promise<void> {
  // Orders test (cascade supprime aussi les OrderItems)
  const deletedOrders = await prisma.order.deleteMany({
    where: {
      business_id: BUSINESS_ID,
      shopify_order_id: { startsWith: TEST_PREFIX },
    },
  });
  console.log(`🗑️  ${deletedOrders.count} orders de test supprimés`);

  // Coûts des produits de test
  if (productIds.length > 0) {
    const deletedCosts = await prisma.productCost.deleteMany({
      where: { product_id: { in: productIds } },
    });
    console.log(`🗑️  ${deletedCosts.count} coûts de test supprimés`);
  }
}

// ─── Coût produit ─────────────────────────────────────────────────────────────

async function setCost(productId: string, cost: number | null): Promise<void> {
  // Supprime d'abord pour garantir l'idempotence
  await prisma.productCost.deleteMany({ where: { product_id: productId } });

  if (cost === null) return; // missing_cost_alert : pas de coût

  await prisma.productCost.create({
    data: {
      product_id: productId,
      cost_per_unit: cost,
      source_type: 'manual',
      effective_from: new Date(),
    },
  });
}

// ─── Créer un order + son orderItem ──────────────────────────────────────────

async function createOrder(
  scenario: ScenarioConfig,
  product: { id: string; title: string },
): Promise<void> {
  const totalPrice = scenario.unitPrice * scenario.quantity;

  const order = await prisma.order.create({
    data: {
      business_id:        BUSINESS_ID,
      shopify_order_id:   `${TEST_PREFIX}${scenario.id}`,
      order_number:       `${TEST_PREFIX}${scenario.id}`,
      total_price:        totalPrice,
      total_discounts:    scenario.totalDiscounts,
      financial_status:   scenario.financialStatus,
      fulfillment_status: 'fulfilled',
      created_at:         THIS_MONTH,
    },
  });

  await prisma.orderItem.create({
    data: {
      shopify_line_item_id: `${TEST_PREFIX}ITEM-${scenario.id}`,
      order_id:             order.id,
      product_id:           product.id,
      quantity:             scenario.quantity,
      unit_price:           scenario.unitPrice,
      line_total:           totalPrice,
      title:                product.title,
    },
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🌱 Kairos — Seed DB Test Data`);
  console.log(`   business_id : ${BUSINESS_ID}`);
  console.log('─'.repeat(50));

  // 1. Récupère 6 produits existants en DB (synced depuis Shopify)
  const products = await prisma.product.findMany({
    where: { business_id: BUSINESS_ID },
    take: 6,
    select: { id: true, title: true },
  });

  if (products.length < 6) {
    console.error(
      `\n❌ Seulement ${products.length} produit(s) en DB (6 requis).\n` +
      `   Lance d'abord une sync Shopify : POST /shopify/${BUSINESS_ID}/sync\n`
    );
    process.exit(1);
  }

  // 2. Nettoyage des anciennes données de test
  console.log('\n🗑️  Nettoyage...');
  await clearTestData(products.map(p => p.id));

  // 3. Seed : coûts + orders
  console.log('\n📦 Création des scénarios...\n');

  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i]!;
    const product  = products[i]!;

    await setCost(product.id, scenario.cost);
    await createOrder(scenario, product);

    const costLabel = scenario.cost !== null ? `${scenario.cost}$/u` : 'sans coût';
    const margin    = scenario.cost !== null
      ? `${(((scenario.unitPrice - scenario.cost) / scenario.unitPrice) * 100).toFixed(0)}%`
      : 'N/A';

    console.log(
      `   ✅ ${scenario.id} — "${product.title}"\n` +
      `      coût: ${costLabel} | prix: ${scenario.unitPrice}$ × ${scenario.quantity} | marge: ${margin}\n` +
      `      financial_status: ${scenario.financialStatus} | discounts: ${scenario.totalDiscounts}$\n` +
      `      → insight attendu : ${scenario.expectedInsight}\n`
    );
  }

  console.log('─'.repeat(50));
  console.log('✅ Seed terminé !\n');
  console.log('📋 Lance ensuite :');
  console.log(`   POST /profitability/${BUSINESS_ID}/compute`);
  console.log(`   POST /insights/${BUSINESS_ID}/compute`);
  console.log('─'.repeat(50) + '\n');
}

main()
  .catch((err: unknown) => {
    console.error('❌ Erreur :', (err as Error).message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
