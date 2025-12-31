import prisma from "../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";

// (Optionnel) safe select minimal (évite de renvoyer tout si tu ajoutes des champs plus tard)
const clientSafeSelect = {
  id_client: true,
  business_id: true,
  first_name: true,
  last_name: true,
  company_name: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  country: true,
  postal_code: true,
  notes: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ClientSelect;

/**
 * Create client (business scoped)
 * - email unique par business (si fourni)
 */
export const createClientForBusinessService = async (data: {
  business_id: number;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  is_active?: boolean;
}) => {
  const {
    business_id,
    first_name,
    last_name,
    company_name,
    email,
    phone,
    address,
    city,
    country,
    postal_code,
    notes,
    is_active,
  } = data;

  if (email) {
    const existing = await prisma.client.findFirst({
      where: { business_id, email },
      select: { id_client: true },
    });
    if (existing) throw new Error("CLIENT_EMAIL_ALREADY_EXISTS");
  }

  return prisma.client.create({
    data: {
      business_id,
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      company_name: company_name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      city: city ?? null,
      country: country ?? null,
      postal_code: postal_code ?? null,
      notes: notes ?? null,
      is_active: is_active ?? true,
    },
    select: clientSafeSelect,
  });
};

/**
 * List clients for a business (business scoped)
 */
export const listClientsByBusinessService = async (businessId: number) => {
  return prisma.client.findMany({
    where: { business_id: businessId },
    orderBy: { created_at: "desc" },
    select: clientSafeSelect,
  });
};

/**
 * Get client by id
 */
export const getClientByIdService = async (id_client: number) => {
  return prisma.client.findUnique({
    where: { id_client },
    select: clientSafeSelect,
  });
};

/**
 * Update client by id
 * - IMPORTANT: ne jamais accepter business_id ici
 * - email unique par business (si modifié) -> nécessite de retrouver le client d'abord
 */
export const updateClientByIdService = async (
  id_client: number,
  data: Partial<{
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    postal_code: string | null;
    notes: string | null;
    is_active: boolean;
  }>
) => {
  // On lit le business_id pour faire la règle "email unique par business"
  const current = await prisma.client.findUnique({
    where: { id_client },
    select: { business_id: true, email: true },
  });
  if (!current) {
    // Prisma update throw P2025, mais ici on veut un message clair si besoin
    throw new Error("CLIENT_NOT_FOUND");
  }

  if (data.email !== undefined && data.email !== null) {
    const existing = await prisma.client.findFirst({
      where: {
        business_id: current.business_id,
        email: data.email,
        NOT: { id_client },
      },
      select: { id_client: true },
    });
    if (existing) throw new Error("CLIENT_EMAIL_ALREADY_EXISTS");
  }

  const updateData: Prisma.ClientUpdateInput = {};
  if (data.first_name !== undefined) updateData.first_name = data.first_name;
  if (data.last_name !== undefined) updateData.last_name = data.last_name;
  if (data.company_name !== undefined) updateData.company_name = data.company_name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.postal_code !== undefined) updateData.postal_code = data.postal_code;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  return prisma.client.update({
    where: { id_client },
    data: updateData,
    select: clientSafeSelect,
  });
};

/**
 * Delete client by id
 */
export const deleteClientByIdService = async (id_client: number) => {
  return prisma.client.delete({
    where: { id_client },
    select: { id_client: true },
  });
};
