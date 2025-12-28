import prisma from "../prisma/prisma";
import { EngagementItemType } from "../../generated/prisma";

export const createNewEngagementItem = async (data: {
  engagement_id: number;
  business_id: number;
  item_name: string;
  item_type: EngagementItemType; // Utilisez l'enum Prisma
  quantity: number;
  unit_price?: number | null;
}) => {
  // Vérifier que l'engagement existe et appartient au business
  const engagement = await prisma.engagement.findUnique({
    where: { id_engagement: data.engagement_id },
    select: { business_id: true },
  });

  if (!engagement) throw new Error("Engagement does not exist");
  if (engagement.business_id !== data.business_id) {
    throw new Error("Engagement does not belong to this business");
  }

  // Calculer le prix et le total
  const qty = data.quantity;
  const price = data.unit_price != null ? Number(data.unit_price) : 0;
  const total = qty * price;

  // Créer l'item
  return prisma.engagementItem.create({
    data: {
      engagement_id: data.engagement_id,
      business_id: data.business_id,
      item_name: data.item_name,
      item_type: data.item_type,
      quantity: qty,
      unit_price: price,
      line_total: total,
    },
  });
};

export const getEngagementItemsService = async (
  business_id: number,
  engagement_id?: number
) => {
  return prisma.engagementItem.findMany({
    where: {
      business_id,
      ...(engagement_id ? { engagement_id } : {}),
    },
    orderBy: { created_at: "desc" },
  });
};

export const getEngagementItemById = async (
  business_id: number,
  item_id: number
) => {
  return prisma.engagementItem.findFirst({
    where: { id_item: item_id, business_id },
  });
};

export const updateEngagementItemById = async (
  business_id: number,
  item_id: number,
  data: {
    item_name?: string;
    item_type?: EngagementItemType; // Utilisez l'enum Prisma
    quantity?: number;
    unit_price?: number | null;
  }
) => {
  const existing = await prisma.engagementItem.findFirst({
    where: { id_item: item_id, business_id },
  });

  if (!existing) throw new Error("Engagement item not found");

  const nextQty = data.quantity ?? existing.quantity;
  const nextPrice =
    data.unit_price !== undefined ? Number(data.unit_price ?? 0) : Number(existing.unit_price);

  const nextTotal = nextQty * nextPrice;

  // Construire l'objet de mise à jour conditionnellement
  const updateData: any = {
    line_total: nextTotal,
  };

  if (data.item_name !== undefined) {
    updateData.item_name = data.item_name;
  }
  if (data.item_type !== undefined) {
    updateData.item_type = data.item_type;
  }
  if (data.quantity !== undefined) {
    updateData.quantity = data.quantity;
  }
  if (data.unit_price !== undefined) {
    updateData.unit_price = nextPrice;
  }

  return prisma.engagementItem.update({
    where: { id_item: item_id },
    data: updateData,
  });
};

export const deleteEngagementItemById = async (
  business_id: number,
  item_id: number
) => {
  const existing = await prisma.engagementItem.findFirst({
    where: { id_item: item_id, business_id },
    select: { id_item: true },
  });

  if (!existing) throw new Error("Engagement item not found");

  return prisma.engagementItem.delete({
    where: { id_item: item_id },
  });
};