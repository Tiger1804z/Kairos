import prisma from "../prisma/prisma";



export const createNewBusiness = async (data: {
  owner_id: number;
  name: string;
  business_type?: string | null;
  city?: string | null;
  country?: string | null;
  currency?: string | null;
  timezone?: string | null;
  is_active?: boolean;
}) => {
  const {
    owner_id,
    name,
    business_type,
    city,
    country,
    currency,
    timezone,
    is_active,
  } = data;

  // Vérifier si le même owner a déjà une business avec ce nom
  const businessExisting = await prisma.business.findFirst({
    where: { owner_id, name },
  });

  if (businessExisting) {
    throw new Error("Business with this name already exists for the owner");
  }

  return prisma.business.create({
    data: {
      owner_id,
      name,
      business_type: business_type ?? null,
      city: city ?? null,
      country: country ?? null,
      currency: currency ?? "CAD",
      timezone: timezone ?? "America/Montreal",
      is_active: is_active ?? true, // 👈 par défaut active
    },
  });
};

export const getAllBusinesses = async () => {
  return prisma.business.findMany();
};

export const getOneBusinessById = async (id: number) => {
  const business = await prisma.business.findUnique({ where: { id_business: id } });
  return business;
};

export const updateBusinessService = async (
  id: number,
  data: Partial<{
    owner_id: number;
    name: string;
    business_type: string;  
    city: string;
    country: string;
    currency: string;
    timezone: string;
    is_active: boolean;
  }>
) => {
  const updateData: any = { ...data };
  return prisma.business.update({
    where: { id_business: id },
    data: updateData,
  });
};

export const deleteBusinessService = async (id: number) => {
  return prisma.business.delete({
    where: { id_business: id },
  });
};



