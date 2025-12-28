import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../../generated/prisma/client";
import "dotenv/config";

// Créer l'adaptateur Neon
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

// Créer le client Prisma
const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

export default prisma;
