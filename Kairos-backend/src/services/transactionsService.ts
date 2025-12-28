import prisma from "../prisma/prisma";

//id_transaction   Int             @id @default(autoincrement())
  //business_id      Int
  //client_id        Int?
  //engagement_id    Int?
  //transaction_type TransactionType
  //category         String?         @db.VarChar(100)
  //amount           Decimal         @db.Decimal(12, 2)
  //payment_method   PaymentMethod?
  //reference_number String?         @db.VarChar(100)
  //description      String?         @db.Text
  //transaction_date DateTime
  //created_at       DateTime        @default(now())
  //updated_at       DateTime        @updatedAt

  // Relations
  //business   Business    @relation(fields: [business_id], references: [id_business], onDelete: Cascade)
  //client     Client?     @relation(fields: [client_id], references: [id_client], onDelete: SetNull)
  //engagement Engagement? @relation(fields: [engagement_id], references: [id_engagement], onDelete: SetNull)

  //@@index([business_id])
  //@@index([client_id])
  //@@index([transaction_date])
  //@@index([transaction_type])
  //@@map("transactions")




/**
 * Petit helper: si on reçois une date en string (ex: "2025-12-15"),
 * on la transforme en Date pour Prisma (plus safe).
 */
const toDateIfProvided = (value: any) => {
  if (!value) return undefined;
  // si c'est déjà une Date, parfait
  if (value instanceof Date) return value;

  // sinon on tente de parser
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
};

/**
 * Create
 * - ici on crée une transaction
 * - si transaction_date arrive en string, on la convertit
 */
export const createNewTransaction = async (data: any) => {
  const payload = {
    ...data,
    // si on passes transaction_date OU date, on supporte les 2 (pratique)
    transaction_date:
      toDateIfProvided(data.transaction_date) ?? toDateIfProvided(data.date),
  };

  return prisma.transaction.create({ data: payload });
};

/**
 * Read one
 * - on sécurise avec business_id + id_transaction
 * - comme ça un business peut pas lire une tx d'un autre business
 */
export const getTransactionById = async (businessId: number, transactionId: number) => {
  return prisma.transaction.findFirst({
    where: { business_id: businessId, id_transaction: transactionId },
  });
};

/**
 * Read all
 * - liste toutes les transactions d'un business
 * - tri desc (les plus récentes en haut)
 */
export const getAllTransactionsService = async (businessId: number) => {
  return prisma.transaction.findMany({
    where: { business_id: businessId },
    orderBy: { transaction_date: "desc" },
  });
};

/**
 * Update
 * - on check d'abord si ça existe ET que ça appartient au business
 * - ensuite on update par id_transaction (unique)
 */
export const updateTransactionById = async (
  businessId: number,
  transactionId: number,
  data: any
) => {
  const existing = await prisma.transaction.findFirst({
    where: { business_id: businessId, id_transaction: transactionId },
    select: { id_transaction: true },
  });

  if (!existing) throw new Error("Transaction not found");

  const payload = {
    ...data,
    // si tu update la date, on la convertit aussi
    ...(data.transaction_date || data.date
      ? {
          transaction_date:
            toDateIfProvided(data.transaction_date) ?? toDateIfProvided(data.date),
        }
      : {}),
  };

  return prisma.transaction.update({
    where: { id_transaction: transactionId },
    data: payload,
  });
};

/**
 * Delete
 * - même logique que update:
 *   on vérifie l'appartenance au business
 *   puis delete par id unique
 */
export const deleteTransactionById = async (
  businessId: number,
  transactionId: number
) => {
  const existing = await prisma.transaction.findFirst({
    where: { business_id: businessId, id_transaction: transactionId },
    select: { id_transaction: true },
  });

  if (!existing) throw new Error("Transaction not found");

  return prisma.transaction.delete({
    where: { id_transaction: transactionId },
  });
};
