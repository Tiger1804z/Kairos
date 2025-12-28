import prisma from "../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";

type CreateDocumentInput = {
  user_id: number;
  business_id: number;
  file_name: string;
  file_type?: string;
  file_size?: number;
  storage_path: string;
  visibility: "owner" | "admin" | "all";
  source_type: "upload" | "generated";
};

export const createDocumentService = async (data: CreateDocumentInput) => {
  // IMPORTANT: Utiliser le type Prisma pour satisfaire TS strict
  const prismaData: Prisma.DocumentCreateInput = {
    file_name: data.file_name,
    storage_path: data.storage_path,
    visibility: data.visibility,
    source_type: data.source_type,

    // Relations : Prisma attend des "connect" (pas user_id / business_id directement)
    user: { connect: { id_user: data.user_id } },
    business: { connect: { id_business: data.business_id } },
  };

  // Champs optionnels (ne pas envoyer undefined)
  if (data.file_type) prismaData.file_type = data.file_type;
  if (data.file_size !== undefined) prismaData.file_size = data.file_size;

  const doc = await prisma.document.create({
    data: prismaData,
  });

  return doc;
};


export const listDocumentsByBusinessService = async (params: {
  business_id: number;
  limit: number;
  cursor: number;
}) => {
  const { business_id, limit, cursor } = params;

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where: { business_id },
      orderBy: { created_at: "desc" },
      skip: cursor,
      take: limit,
      select: {
        id_document: true,
        user_id: true,
        business_id: true,
        file_name: true,
        file_type: true,
        file_size: true,
        storage_path: true,
        source_type: true,
        visibility: true,
        is_processed: true,
        processed_at: true,
        created_at: true,
        updated_at: true,
      }
    }),

    prisma.document.count({ where: { business_id } }),
  ]);

  return {
    items,
    total,
    limit,
    cursor,
    next_cursor: cursor + items.length,
    has_more: cursor + items.length < total,
  };
};

/**
 * GET (by id)
 * Retourne le document complet (métadonnées)
 */
export const getDocumentByIdService = async (id_document: number) => {
  return prisma.document.findUnique({
    where: { id_document },
    select: {
      id_document: true,
      user_id: true,
      business_id: true,
      file_name: true,
      file_type: true,
      file_size: true,
      storage_path: true,
      source_type: true,
      visibility: true,
      ai_summary: true,
      is_processed: true,
      processed_at: true,
      created_at: true,
      updated_at: true,
    },
  });
};