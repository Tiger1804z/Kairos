import prisma from "../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";

// Optionnel mais pratique: select stable
const businessSafeSelect = {
  id_business: true,
  owner_id: true,
  name: true,
  business_type: true,
  city: true,
  country: true,
  currency: true,
  timezone: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.BusinessSelect;

export const createBusinessForOwnerService = async (data: {
  owner_id: number;
  name: string;
  business_type?: string | null;
  city?: string | null;
  country?: string | null;
  currency?: string;     // ⚠️ PAS null (schema = String non-null)
  timezone?: string;     // ⚠️ PAS null (schema = String non-null)
  is_active?: boolean;
}) => {
  const { owner_id, name, business_type, city, country, currency, timezone, is_active } = data;

  const existing = await prisma.business.findFirst({
    where: { owner_id, name },
    select: { id_business: true },
  });
  if (existing) throw new Error("BUSINESS_NAME_ALREADY_EXISTS");

  const createData: Prisma.BusinessUncheckedCreateInput = {
    owner_id,
    name,
    business_type: business_type ?? null,
    city: city ?? null,
    country: country ?? null,
    currency: currency ?? "CAD",
    timezone: timezone ?? "America/Montreal",
    is_active: is_active ?? true,
  };

  return prisma.business.create({
    data: createData,
    select: businessSafeSelect,
  });
};

export const listBusinessesByOwnerService = async (ownerId: number) => {
  return prisma.business.findMany({
    where: { owner_id: ownerId },
    orderBy: { created_at: "desc" },
    select: businessSafeSelect,
  });
};

export const getBusinessByIdService = async (id_business: number) => {
  return prisma.business.findUnique({
    where: { id_business },
    select: businessSafeSelect,
  });
};

export const updateBusinessByIdService = async (
  id_business: number,
  data: Partial<{
    name: string;
    business_type: string | null;
    city: string | null;
    country: string | null;
    currency: string;     // ⚠️ PAS null
    timezone: string;     // ⚠️ PAS null
    is_active: boolean;
  }>
) => {
  const updateData: Prisma.BusinessUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.business_type !== undefined) updateData.business_type = data.business_type;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  return prisma.business.update({
    where: { id_business },
    data: updateData,
    select: businessSafeSelect,
  });
};

export const deleteBusinessByIdService = async (id_business: number) => {
  return prisma.business.delete({
    where: { id_business },
  });
};
