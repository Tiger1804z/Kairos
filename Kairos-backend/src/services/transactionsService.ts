import prisma from "../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";

const toDateIfProvided = (value: any): Date | null | undefined => {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const toDecimalIfProvided = (value: any) => {
  if (value === null) return null;
  if (value === undefined) return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) return undefined;
  return new Prisma.Decimal(n);
};

export const createTransactionForBusinessService = async (data: {
  business_id: number;
  client_id?: number | null;
  engagement_id?: number | null;
  transaction_type: any; // idéalement TransactionType
  category?: string | null;
  amount: number;
  payment_method?: any; // idéalement PaymentMethod
  reference_number?: string | null;
  description?: string | null;
  transaction_date: string | Date;
}) => {
  // vérifier client appartient au business
  if (data.client_id) {
    const ok = await prisma.client.findFirst({
      where: { id_client: data.client_id, business_id: data.business_id },
      select: { id_client: true },
    });
    if (!ok) throw new Error("CLIENT_NOT_FOUND");
  }

  // vérifier engagement appartient au business
  if (data.engagement_id) {
    const ok = await prisma.engagement.findFirst({
      where: { id_engagement: data.engagement_id, business_id: data.business_id },
      select: { id_engagement: true },
    });
    if (!ok) throw new Error("ENGAGEMENT_NOT_FOUND");
  }

  const date = toDateIfProvided(data.transaction_date);
  if (!date) throw new Error("INVALID_TRANSACTION_DATE");

  const amountDec = toDecimalIfProvided(data.amount);
  if (amountDec === undefined || amountDec === null) throw new Error("INVALID_AMOUNT");

  const payload: Prisma.TransactionUncheckedCreateInput = {
    business_id: data.business_id,
    client_id: data.client_id ?? null,
    engagement_id: data.engagement_id ?? null,
    transaction_type: data.transaction_type,
    category: data.category ?? null,
    amount: amountDec,
    payment_method: data.payment_method ?? null,
    reference_number: data.reference_number ?? null,
    description: data.description ?? null,
    transaction_date: date,
  };

  return prisma.transaction.create({ data: payload });
};

export const listTransactionsByBusinessService = async (business_id: number) => {
  return prisma.transaction.findMany({
    where: { business_id },
    orderBy: { transaction_date: "desc" },
  });
};

export const getTransactionByIdService = async (id_transaction: number, business_id: number) => {
  return prisma.transaction.findFirst({
    where: { id_transaction, business_id },
  });
};

export const updateTransactionByIdService = async (
  id_transaction: number,
  business_id: number,
  data: Partial<{
    client_id: number | null;
    engagement_id: number | null;
    transaction_type: any;
    category: string | null;
    amount: number; // NOT NULL
    payment_method: any;
    reference_number: string | null;
    description: string | null;
    transaction_date: string | Date; // NOT NULL
  }>
) => {
  // ✅ vérifier que la transaction appartient au business
  const existing = await prisma.transaction.findFirst({
    where: { id_transaction, business_id },
    select: { id_transaction: true },
  });
  if (!existing) throw new Error("TRANSACTION_NOT_FOUND");

  const patch: Prisma.TransactionUpdateInput = {};

  // ✅ si on connect un client: vérifier qu’il est dans le business
  if (data.client_id !== undefined && data.client_id !== null) {
    const ok = await prisma.client.findFirst({
      where: { id_client: data.client_id, business_id },
      select: { id_client: true },
    });
    if (!ok) throw new Error("CLIENT_NOT_FOUND");
  }

  // ✅ si on connect un engagement: vérifier qu’il est dans le business
  if (data.engagement_id !== undefined && data.engagement_id !== null) {
    const ok = await prisma.engagement.findFirst({
      where: { id_engagement: data.engagement_id, business_id },
      select: { id_engagement: true },
    });
    if (!ok) throw new Error("ENGAGEMENT_NOT_FOUND");
  }

  // relations
  if (data.client_id !== undefined) {
    patch.client =
      data.client_id === null
        ? { disconnect: true }
        : { connect: { id_client: data.client_id } };
  }

  if (data.engagement_id !== undefined) {
    patch.engagement =
      data.engagement_id === null
        ? { disconnect: true }
        : { connect: { id_engagement: data.engagement_id } };
  }

  if (data.transaction_type !== undefined) patch.transaction_type = data.transaction_type as any;
  if (data.category !== undefined) patch.category = data.category;
  if (data.payment_method !== undefined) patch.payment_method = data.payment_method as any;
  if (data.reference_number !== undefined) patch.reference_number = data.reference_number;
  if (data.description !== undefined) patch.description = data.description;

  // amount (NOT NULL)
  if (data.amount !== undefined) {
    const dec = toDecimalIfProvided(data.amount);
    if (dec === undefined || dec === null) throw new Error("INVALID_AMOUNT");
    patch.amount = dec;
  }

  // transaction_date (NOT NULL)
  if (data.transaction_date !== undefined) {
    const d = toDateIfProvided(data.transaction_date);
    if (d === undefined || d === null) throw new Error("INVALID_TRANSACTION_DATE");
    patch.transaction_date = d;
  }

  return prisma.transaction.update({
    where: { id_transaction },
    data: patch,
  });
};

export const deleteTransactionByIdService = async (id_transaction: number, business_id: number) => {
  const existing = await prisma.transaction.findFirst({
    where: { id_transaction, business_id },
    select: { id_transaction: true },
  });
  if (!existing) throw new Error("TRANSACTION_NOT_FOUND");

  await prisma.transaction.delete({ where: { id_transaction } });
  return { message: "TRANSACTION_DELETED" };
};
