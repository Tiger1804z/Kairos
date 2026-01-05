import prisma from "../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";

import fs from "fs";
import path from "path";
import { extractTextSample } from "../utils/documentTextExtract";
import { askKairosFinanceFromDocument, askKairosFromDocument } from "./aiService";
import { extractViaPython } from "./extractorClient";

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
export const getDocumentByIdService = async (id_document: number, business_id: number) => {
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

/** Convertit le storage_path en chemin absolu (stocké relatif genre "uploads/...") */
function toAbsoluteDiskPath(storagePath: string): string {
  return path.join(process.cwd(), storagePath);
}

/** Supprime le fichier sur disque si présent */
async function safeUnlink(filePath: string): Promise<"deleted" | "missing" | "error"> {
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
export const deleteDocumentService = async (id_document: number, business_id: number) => {
  // 1) récupérer doc en validant l'appartenance au business
  const doc = await prisma.document.findFirst({
    where: { id_document, business_id },
  });
  if (!doc) return null;

  // ✅ Amélioration: tenter suppression disque AVANT delete DB
  const abs = toAbsoluteDiskPath(doc.storage_path);
  const disk = await safeUnlink(abs);

  // 2) supprimer DB ensuite (on garde la référence tant que pas supprimé)
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

  // 2) Extraction via Python (source of truth)
  const extracted = await extractViaPython({
    storage_path: doc.storage_path,
    ...(doc.file_type ? { file_type: doc.file_type } : {}),
    max_chars: 35000,
    mode: "auto",
  });
  console.log("doc.storage_path =", doc.storage_path);

    

  if (!extracted.ok) {
    // On peut aussi sauvegarder l'erreur dans la DB si tu veux
    throw new Error(`EXTRACTOR_FAILED: ${extracted.error} - ${extracted.message}`);
  }

  const textSample = (extracted.textSample ?? "").trim();
  const tablesPreview = extracted.tablesPreview ?? [];
  const extractMeta = extracted; // full payload (pratique à stocker)
  const extractorMeta = extracted.meta; // kind_guess, finance_like, confidence...

  // 3) Vérif: si pas assez de texte, on stop (pas d'hallucination)
  if (textSample.length < 50) {
    const updated = await prisma.document.update({
      where: { id_document: doc.id_document },
      data: {
        ai_summary: "Impossible de résumer : aucun texte extractible (scan/image ou format non supporté).",
        is_processed: false,
        processed_at: null,
        // Si tu as la colonne Json:
        // extract_meta: extractMeta as any,
      },
    });
    return updated;
  }

  // 4) Décider finance/general
  const mode = (params.mode ?? "auto").toString().toLowerCase();

  // Priorité: mode explicite -> sinon auto via extractor
  const useFinance =
    mode === "finance"
      ? true
      : mode === "general"
        ? false
        : Boolean(extractorMeta?.finance_like) || extractorMeta?.kind_guess === "finance";

  // 5) Appeler le LLM (avec textSample + meta + tablesPreview si tu veux l'inclure dans le prompt)
  // NOTE: tes fonctions actuelles prennent textSample; si tu veux utiliser tablesPreview aussi,
  // on pourra upgrader askKairosFromDocument/FinanceFromDocument plus tard.
  const { aiText } = useFinance
    ? await askKairosFinanceFromDocument({
        fileName: doc.file_name,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        textSample,
        // Option future: tablesPreview, meta: extractorMeta
      })
    : await askKairosFromDocument({
        fileName: doc.file_name,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        textSample,
        // Option future: tablesPreview, meta: extractorMeta
      });

  // 6) Sauvegarder en DB (succès)
  const updated = await prisma.document.update({
    where: { id_document: doc.id_document },
    data: {
      ai_summary: aiText,
      is_processed: true,
      processed_at: new Date(),
      // Si tu as la colonne Json:
      // extract_meta: extractMeta as any,
    },
  });

  return updated;
};