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