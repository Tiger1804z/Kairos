import { PrismaClient } from '../generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});



// Créer le client Prisma avec l'adaptateur
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seeding...');

  // Hash du mot de passe
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  // Créer un utilisateur admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kairos.com' },
    update: {},
    create: {
      first_name: 'Admin',
      last_name: 'Kairos',
      email: 'admin@kairos.com',
      password_hash: passwordHash,
      role: 'admin',
      is_active: true,
    },
  });

  console.log('✅ Admin user created:', {
    id: adminUser.id_user,
    email: adminUser.email,
    role: adminUser.role,
  });

  // Créer un utilisateur owner avec une entreprise
  const ownerPasswordHash = await bcrypt.hash('Owner123!', 10);

  // ========================
  // TRANSACTIONS DE TEST
  // ========================
  const transactionsData = [
    // --- REVENUS (income) ---
    { business_id: 4, client_id: 9,    transaction_type: 'income' as const, category: 'consulting', amount: 1500.00, payment_method: 'transfer' as const, reference_number: 'INV-2026-021', description: 'Consultation stratégie marketing Q1',       transaction_date: new Date('2026-02-01') },
    { business_id: 4, client_id: 10,   transaction_type: 'income' as const, category: 'software',   amount: 2200.00, payment_method: 'card' as const,     reference_number: 'INV-2026-022', description: 'Développement site web landing page',      transaction_date: new Date('2026-02-03') },
    { business_id: 4, client_id: 11,   transaction_type: 'income' as const, category: 'consulting', amount: 950.00,  payment_method: 'transfer' as const, reference_number: 'INV-2026-023', description: 'Optimisation SEO mensuelle',                transaction_date: new Date('2026-02-05') },
    { business_id: 4, client_id: 12,   transaction_type: 'income' as const, category: 'marketing',  amount: 1800.00, payment_method: 'transfer' as const, reference_number: 'INV-2026-024', description: 'Campagne contenu Instagram',                transaction_date: new Date('2026-02-06') },
    { business_id: 4, client_id: 13,   transaction_type: 'income' as const, category: 'consulting', amount: 2750.00, payment_method: 'card' as const,     reference_number: 'INV-2026-025', description: 'Stratégie branding visuel',                transaction_date: new Date('2026-02-07') },
    { business_id: 4, client_id: 14,   transaction_type: 'income' as const, category: 'consulting', amount: 3200.00, payment_method: 'transfer' as const, reference_number: 'INV-2026-026', description: 'Planification financière annuelle',         transaction_date: new Date('2026-02-08') },
    { business_id: 4, client_id: 9,    transaction_type: 'income' as const, category: 'software',   amount: 1400.00, payment_method: 'transfer' as const, reference_number: 'INV-2026-027', description: 'Refonte site vitrine',                      transaction_date: new Date('2026-02-09') },
    { business_id: 4, client_id: 10,   transaction_type: 'income' as const, category: 'marketing',  amount: 1100.00, payment_method: 'card' as const,     reference_number: 'INV-2026-028', description: 'Gestion Ads février',                      transaction_date: new Date('2026-02-10') },
    { business_id: 4, client_id: 11,   transaction_type: 'income' as const, category: 'consulting', amount: 870.00,  payment_method: 'transfer' as const, reference_number: 'INV-2026-029', description: 'Audit performance site',                    transaction_date: new Date('2026-02-11') },
    { business_id: 4, client_id: 12,   transaction_type: 'income' as const, category: 'software',   amount: 2600.00, payment_method: 'transfer' as const, reference_number: 'INV-2026-030', description: 'Développement module personnalisé',         transaction_date: new Date('2026-02-12') },

    // --- DÉPENSES (expense) ---
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'rent',      amount: 1800.00, payment_method: 'transfer' as const, reference_number: 'EXP-2026-011', description: 'Loyer bureau février',                      transaction_date: new Date('2026-02-01') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'salaries',  amount: 7200.00, payment_method: 'transfer' as const, reference_number: 'EXP-2026-012', description: 'Paie employés février',                     transaction_date: new Date('2026-02-05') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'marketing',  amount: 950.00, payment_method: 'card' as const,     reference_number: 'EXP-2026-013', description: 'Publicité Facebook',                       transaction_date: new Date('2026-02-06') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'software',   amount: 320.00, payment_method: 'card' as const,     reference_number: 'EXP-2026-014', description: 'Abonnement SaaS outils design',            transaction_date: new Date('2026-02-07') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'supplies',   amount: 280.00, payment_method: 'cash' as const,     reference_number: 'EXP-2026-015', description: 'Fournitures bureau',                       transaction_date: new Date('2026-02-08') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'software',   amount: 120.00, payment_method: 'card' as const,     reference_number: 'EXP-2026-016', description: 'Hébergement cloud',                        transaction_date: new Date('2026-02-09') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'marketing',  amount: 600.00, payment_method: 'card' as const,     reference_number: 'EXP-2026-017', description: 'Email marketing tool',                     transaction_date: new Date('2026-02-10') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'rent',       amount: 200.00, payment_method: 'transfer' as const, reference_number: 'EXP-2026-018', description: 'Espace coworking',                          transaction_date: new Date('2026-02-12') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'supplies',   amount: 150.00, payment_method: 'cash' as const,     reference_number: 'EXP-2026-019', description: 'Matériel administratif',                   transaction_date: new Date('2026-02-13') },
    { business_id: 4, client_id: null, transaction_type: 'expense' as const, category: 'software',    amount: 89.00, payment_method: 'card' as const,     reference_number: 'EXP-2026-020', description: 'Licence gestion projet',                   transaction_date: new Date('2026-02-14') },
  ];

  for (const tx of transactionsData) {
    await prisma.transaction.create({
      data: tx,
    });
  }

  console.log(`✅ ${transactionsData.length} transactions créées (10 revenus + 10 dépenses)`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });