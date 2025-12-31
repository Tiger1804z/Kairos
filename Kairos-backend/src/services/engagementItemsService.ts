import prisma from "../prisma/prisma";
import { Prisma, EngagementItemType } from "../../generated/prisma/client";

export const createEngagementItemForBusinessService = async (data: {
  engagement_id: number;
  business_id: number;
  item_name: string;
  item_type: EngagementItemType;
  quantity: number;
  unit_price?: number | null;
}) => {
  const engagement = await prisma.engagement.findUnique({
    where: { id_engagement: data.engagement_id },
    select: { business_id: true },
  });

  if (!engagement) throw new Error("ENGAGEMENT_NOT_FOUND");
  if (engagement.business_id !== data.business_id) throw new Error("ENGAGEMENT_NOT_IN_BUSINESS");

  const qty = Number(data.quantity);
  const price = data.unit_price != null ? Number(data.unit_price) : 0;
  const total = qty * price;

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

export const listEngagementItemsByBusinessService = async (
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

export const getEngagementItemByIdService = async (id_item: number) => {
  return prisma.engagementItem.findUnique({
    where: { id_item },
  });
};

export const updateEngagementItemByIdService = async (
  id_item: number,
  data: Partial<{
    item_name: string;
    item_type: EngagementItemType;
    quantity: number;
    unit_price: number | null;
  }>
) => {
  const existing = await prisma.engagementItem.findUnique({
    where: { id_item },
  });
  if (!existing) throw new Error("ENGAGEMENT_ITEM_NOT_FOUND");

  const nextQty = data.quantity ?? existing.quantity;
  const nextPrice =
    data.unit_price !== undefined ? Number(data.unit_price ?? 0) : Number(existing.unit_price);

  const nextTotal = nextQty * nextPrice;

  const updateData: Prisma.EngagementItemUpdateInput = {
    line_total: nextTotal,
  };

  if (data.item_name !== undefined) updateData.item_name = data.item_name;
  if (data.item_type !== undefined) updateData.item_type = data.item_type;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.unit_price !== undefined) updateData.unit_price = nextPrice;

  return prisma.engagementItem.update({
    where: { id_item },
    data: updateData,
  });
};

export const deleteEngagementItemByIdService = async (id_item: number) => {
  const existing = await prisma.engagementItem.findUnique({
    where: { id_item },
    select: { id_item: true },
  });
  if (!existing) throw new Error("ENGAGEMENT_ITEM_NOT_FOUND");

  await prisma.engagementItem.delete({ where: { id_item } });
  return { message: "ENGAGEMENT_ITEM_DELETED" };
};
