import prisma from "../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";

import fs from "fs";

import { askKairosFinanceFromDocument, askKairosFromDocument } from "./aiService";
import { extractUploadViaPython } from "./extractorClient";

// ✅ IMPORTANT: utiliser la version stable basée sur UPLOADS_ROOT
import { toAbsoluteDiskPath } from "../utils/fileStorage";

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
  const prismaData: Prisma.DocumentCreateInput = {
    file_name: data.file_name,
    storage_path: data.storage_path,
    visibility: data.visibility,
    source_type: data.source_type,
    user: { connect: { id_user: data.user_id } },
    business: { connect: { id_business: data.business_id } },
  };

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
      },
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
export const getDocumentByIdService = async (
  id_document: number,
  business_id: number
) => {
  return prisma.document.findFirst({
    where: {
      id_document,
      business_id,
    },
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

/** Supprime le fichier sur disque si présent */
async function safeUnlink(
  filePath: string
): Promise<"deleted" | "missing" | "error"> {
  try {
    await fs.promises.unlink(filePath);
    return "deleted";
  } catch (err: any) {
    if (err?.code === "ENOENT") return "missing";
    return "error";
  }
}

/**
 * Delete DB + disk
 * - Vérifie business_id (anti delete cross-tenant)
 * - Retourne le doc supprimé + statut suppression fichier
 */
export const deleteDocumentService = async (
  id_document: number,
  business_id: number
) => {
  // 1) récupérer doc en validant l'appartenance au business
  const doc = await prisma.document.findFirst({
    where: { id_document, business_id },
  });
  if (!doc) return null;

  // ✅ Suppression disque AVANT delete DB (on garde la référence tant que pas supprimé)
  const abs = toAbsoluteDiskPath(doc.storage_path);
  const disk = await safeUnlink(abs);

  // 2) supprimer DB ensuite
  const deleted = await prisma.document.delete({
    where: { id_document },
  });

  return { deleted, disk };
};

// ------------------------------------------------------
// PROCESS DOCUMENT (extract -> AI -> update DB)
// ------------------------------------------------------
export const processDocumentByIdService = async (params: {
  id_document: number;
  business_id: number;
  mode?: "auto" | "finance" | "general" | string;
}) => {
  // 1) Charger le document (tenant safe)
  const doc = await prisma.document.findFirst({
    where: {
      id_document: params.id_document,
      business_id: params.business_id,
    },
  });

  if (!doc) return null;

  // 2) Résoudre le chemin absolu de façon stable
  const absPath = toAbsoluteDiskPath(doc.storage_path);

  console.log("[processDocument] doc.storage_path =", doc.storage_path);
  console.log("[processDocument] absPath =", absPath);

  // Guard: fichier doit exister
  const exists = fs.existsSync(absPath);
  console.log("[processDocument] exists? =", exists);

  if (!exists) {
    throw new Error(
      `FILE_NOT_FOUND: ${absPath} (storage_path=${doc.storage_path})`
    );
  }

  // 3) Extraction via Python (source of truth)
  console.log("[processDocument] Sending file to extractor:", {
    absPath,
    original: doc.file_name,
    file_type: doc.file_type,
  });

  const extracted = await extractUploadViaPython({
    file_path: absPath,
    original_name: doc.file_name,
    max_chars: 35000,
    mode: "auto",
    ...(doc.file_type ? { file_type: doc.file_type } : {}),
  });

  if (!extracted.ok) {
    throw new Error(`EXTRACTOR_FAILED: ${extracted.error} - ${extracted.message}`);
  }

  const textSample = (extracted.textSample ?? "").trim();
  const extractorMeta = extracted.meta; // kind_guess, finance_like, confidence...
  // const tablesPreview = extracted.tablesPreview ?? []; // future si tu veux l'inclure

  // 4) Vérif: si pas assez de texte, on stop (pas d'hallucination)
  if (textSample.length < 50) {
    const updated = await prisma.document.update({
      where: { id_document: doc.id_document },
      data: {
        ai_summary:
          "Impossible de résumer : aucun texte extractible (scan/image ou format non supporté).",
        is_processed: false,
        processed_at: null,
        // Option future si tu as une colonne JSON:
        // extract_meta: extracted as any,
      },
    });
    return updated;
  }

  // 5) Décider finance/general
  const mode = (params.mode ?? "auto").toString().toLowerCase();

  const useFinance =
    mode === "finance"
      ? true
      : mode === "general"
      ? false
      : Boolean(extractorMeta?.finance_like) ||
        extractorMeta?.kind_guess === "finance";

  // 6) Appeler le LLM
  const { aiText } = useFinance
    ? await askKairosFinanceFromDocument({
        fileName: doc.file_name,
        fileType: doc.file_type ?? null,
        fileSize: doc.file_size ?? null,
        textSample,
      })
    : await askKairosFromDocument({
        fileName: doc.file_name,
        fileType: doc.file_type ?? null,
        fileSize: doc.file_size ?? null,
        textSample,
      });

  // 7) Sauvegarder en DB (succès)
  const updated = await prisma.document.update({
    where: { id_document: doc.id_document },
    data: {
      ai_summary: aiText,
      is_processed: true,
      processed_at: new Date(),
      // Option future si tu as une colonne JSON:
      // extract_meta: extracted as any,
    },
  });

  return updated;
};