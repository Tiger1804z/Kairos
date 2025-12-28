import prisma from "../prisma/prisma";

export const createNewEngagement = async (data: {
  business_id: number;
  title: string; // REQUIS
  client_id?: number | null;
  description?: string | null;
  status?: "draft" | "active" | "completed" | "cancelled";
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  total_amount?: number | null;
}) => {
  const {
    business_id,
    client_id,
    title,
    description,
    status,
    start_date,
    end_date,
    total_amount,
  } = data;

  // Vérifier que la business existe
  const isBusinessExisting = await prisma.business.findUnique({
    where: { id_business: business_id },
  });

  if (!isBusinessExisting) {
    throw new Error("Business does not exist");
  }

  // Si un client_id est fourni, vérifier qu'il existe
  if (client_id) {
    const isClientExisting = await prisma.client.findUnique({
      where: { id_client: client_id },
    });

    if (!isClientExisting) {
      throw new Error("Client does not exist");
    }
  }

  // Construire l'objet de données conditionnellement
  const engagementData: any = {
    business_id,
    title, // REQUIS
  };

  // Ajouter les champs optionnels seulement s'ils sont définis
  if (client_id !== undefined) engagementData.client_id = client_id;
  if (description !== undefined) engagementData.description = description;
  if (status !== undefined) engagementData.status = status;
  if (start_date !== undefined) engagementData.start_date = start_date;
  if (end_date !== undefined) engagementData.end_date = end_date;
  if (total_amount !== undefined) engagementData.total_amount = total_amount;

  // Créer l'engagement
  return prisma.engagement.create({
    data: engagementData,
  });
};

export const getAllEngagements = async (business_id: number) => {
  return prisma.engagement.findMany({
    where: { business_id },
    include: {
      client: true,
      items: true,
    },
    orderBy: { created_at: "desc" },
  });
};

export const getEngagementById = async (business_id: number, engagement_id: number) => {
  return prisma.engagement.findFirst({
    where: {
      id_engagement: engagement_id,
      business_id,
    },
    include: {
      client: true,
      items: true,
      transactions: true,
    },
  });
};

export const updateEngagementById = async (
  engagement_id: number,
  data: {
    title?: string;
    description?: string | null;
    status?: "draft" | "active" | "completed" | "cancelled";
    start_date?: string | Date | null;
    end_date?: string | Date | null;
    total_amount?: number | null;
  }
) => {
  const existing = await prisma.engagement.findUnique({
    where: { id_engagement: engagement_id },
  });

  if (!existing) throw new Error("Engagement not found");

  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.start_date !== undefined) updateData.start_date = data.start_date;
  if (data.end_date !== undefined) updateData.end_date = data.end_date;
  if (data.total_amount !== undefined) updateData.total_amount = data.total_amount;

  return prisma.engagement.update({
    where: { id_engagement: engagement_id },
    data: updateData,
  });
};

export const deleteEngagementById = async (business_id: number, engagement_id: number) => {
  const existing = await prisma.engagement.findFirst({
    where: {
      id_engagement: engagement_id,
      business_id,
    },
  });

  if (!existing) throw new Error("Engagement not found");

  return prisma.engagement.delete({
    where: { id_engagement: engagement_id },
  });
};