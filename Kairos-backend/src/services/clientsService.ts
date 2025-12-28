import prisma from "../prisma/prisma";



export const createNewClient = async (data: {
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

  // 🔍 Vérifier si un client avec ce email existe déjà pour cette business
  if (email) {  // seulement si un email est fourni
    const clientExisting = await prisma.client.findFirst({
      where: { email, business_id },
    });

    if (clientExisting) {
      throw new Error("Client with this email already exists for this business");
    }
  }

  // ✅ Création du client
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
      is_active: is_active ?? true, // par défaut actif
    },
  });
};

export const  getAllClients = async () => {
    return prisma.client.findMany();
};

export const getOneClientById = async (id: number) => {
    const client = await prisma.client.findUnique({ where: { id_client: id } });
    return client;
};

export const updateClientService = async (
  id: number,
  data: Partial<{
    business_id: number;
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
  const updateData: any = { ...data };

  return prisma.client.update({
    where: { id_client: id },
    data: updateData,
  });
};

export const deleteClientService = async (id: number) => {
  return prisma.client.delete({
    where: { id_client: id },
  });
};
