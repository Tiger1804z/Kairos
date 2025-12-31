import prisma from "../prisma/prisma";
import { Prisma,  EngagementStatus } from "../../generated/prisma/client";

const engagementSafeSelect = {
  id_engagement: true,
  business_id: true,
  client_id: true,
  title: true,
  description: true,
  status: true,
  start_date: true,
  end_date: true,
  total_amount: true,
  created_at: true,
  updated_at: true,
  client: true,
  items: true,
} satisfies Prisma.EngagementSelect;

export const createEngagementForBusinessService = async (data: {
  business_id: number;
  title: string;
  client_id?: number | null;
  description?: string | null;
  status?: EngagementStatus;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  total_amount?: number | null;
}) => {
  // Si client fourni, vérifier qu'il existe ET appartient au même business
  if (data.client_id) {
    const client = await prisma.client.findFirst({
      where: { id_client: data.client_id, business_id: data.business_id },
      select: { id_client: true },
    });
    if (!client) throw new Error("CLIENT_NOT_FOUND");
  }

  const createData: Prisma.EngagementUncheckedCreateInput = {
    business_id: data.business_id,
    client_id: data.client_id ?? null,
    title: data.title,
    description: data.description ?? null,
    status: data.status ?? EngagementStatus.draft, // si ton Prisma enum est strict, on peut ajuster
    start_date: data.start_date ?? null,
    end_date: data.end_date ?? null,
    total_amount: data.total_amount ?? null,
  };

  return prisma.engagement.create({
    data: createData,
    select: engagementSafeSelect,
  });
};

export const listEngagementsByBusinessService = async (business_id: number) => {
  return prisma.engagement.findMany({
    where: { business_id },
    orderBy: { created_at: "desc" },
    include: {
      client: true,
      items: true,
    },
  });
};

export const getEngagementByIdService = async (id_engagement: number) => {
  return prisma.engagement.findUnique({
    where: { id_engagement },
    include: {
      client: true,
      items: true,
      transactions: true,
    },
  });
};

export const updateEngagementByIdService = async (
  id_engagement: number,
  data: Partial<{
    title: string;
    description: string | null;
    status: "draft" | "active" | "completed" | "cancelled";
    start_date: string | Date | null;
    end_date: string | Date | null;
    total_amount: number | null;
  }>
) => {
  const existing = await prisma.engagement.findUnique({
    where: { id_engagement },
    select: { id_engagement: true },
  });
  if (!existing) throw new Error("ENGAGEMENT_NOT_FOUND");

  const updateData: Prisma.EngagementUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status as any;
  if (data.start_date !== undefined) updateData.start_date = data.start_date as any;
  if (data.end_date !== undefined) updateData.end_date = data.end_date as any;
  if (data.total_amount !== undefined) updateData.total_amount = data.total_amount as any;

  return prisma.engagement.update({
    where: { id_engagement },
    data: updateData,
    include: { client: true, items: true },
  });
};

export const deleteEngagementByIdService = async (id_engagement: number) => {
  // Si tu veux garder le pattern "message métier"
  const existing = await prisma.engagement.findUnique({
    where: { id_engagement },
    select: { id_engagement: true },
  });
  if (!existing) throw new Error("ENGAGEMENT_NOT_FOUND");

  await prisma.engagement.delete({ where: { id_engagement } });
  return { message: "ENGAGEMENT_DELETED" };
};
