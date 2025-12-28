import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { uploadSingle, toRelativeStoragePath } from "../utils/fileStorage";
import {
  createDocumentService,
  listDocumentsByBusinessService,
  getDocumentByIdService,
} from "../services/documentService";

/**
 * POST /documents/upload
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    await new Promise<void>((resolve, reject) => {
      uploadSingle(req, res, (err: any) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const userId = Number(req.body?.user_id);
    const businessId = Number(req.params.business_id ?? req.body?.business_id);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ error: "USER_ID_REQUIRED" });
    }
    if (!businessId || Number.isNaN(businessId)) {
      return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "FILE_REQUIRED" });
    }

    const visibilityRaw = (req.body?.visibility ?? "owner").toString();
    const visibility = ["owner", "admin", "all"].includes(visibilityRaw)
      ? (visibilityRaw as "owner" | "admin" | "all")
      : "owner";

    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const storagePath = toRelativeStoragePath(req.file.path);

    const ext = originalName.split(".").pop()?.toLowerCase();
    const fileType = ext && ext.length > 0 ? ext : undefined;

    // payload typé selon le service
    const payload: Parameters<typeof createDocumentService>[0] = {
      user_id: userId,
      business_id: businessId,
      file_name: originalName,
      file_size: fileSize,
      storage_path: storagePath,
      visibility,
      source_type: "upload",
    };

    if (fileType) payload.file_type = fileType;

    const doc = await createDocumentService(payload);

    return res.status(201).json({ document: doc });
  } catch (err: any) {
    const msg = err?.message ?? "SERVER_ERROR";

    if (msg === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "FILE_TOO_LARGE" });
    }
    if (msg === "UNSUPPORTED_FILE_TYPE") {
      return res.status(415).json({ error: "UNSUPPORTED_FILE_TYPE" });
    }
    if (msg === "BUSINESS_ID_REQUIRED") {
      return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });
    }

    return res.status(500).json({ error: "SERVER_ERROR", details: msg });
  }
};

/**
 * GET /documents?business_id=4&limit=20&cursor=0
 */
export const listDocuments = async (req: Request, res: Response) => {
  const businessId = Number(req.query.business_id);
  if (!businessId || Number.isNaN(businessId)) {
    return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });
  }

  const limitRaw = Number(req.query.limit ?? 20);
  const limit = Number.isNaN(limitRaw) ? 20 : Math.min(Math.max(limitRaw, 1), 50);

  const cursorRaw = Number(req.query.cursor ?? 0);
  const cursor = Number.isNaN(cursorRaw) ? 0 : Math.max(cursorRaw, 0);

  const result = await listDocumentsByBusinessService({
    business_id: businessId,
    limit,
    cursor,
  });

  return res.json({
    items: result.items,
    page: {
      total: result.total,
      limit,
      cursor,
      next_cursor: result.next_cursor,
      has_more: result.has_more,
    },
  });
};

/**
 * GET /documents/:id
 */
export const getDocumentById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: "INVALID_DOCUMENT_ID" });
  }

  const doc = await getDocumentByIdService(id);
  if (!doc) {
    return res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
  }

  return res.json({ document: doc });
};

/**
 * GET /documents/:id/download
 * - Télécharge le fichier depuis storage_path
 * - Nom de fichier = file_name (original)
 */
export const downloadDocument = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: "INVALID_DOCUMENT_ID" });
  }

  const doc = await getDocumentByIdService(id);
  if (!doc) {
    return res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
  }

  const absolutePath = path.join(process.cwd(), doc.storage_path);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: "FILE_NOT_FOUND_ON_DISK" });
  }

  return res.download(absolutePath, doc.file_name);
};
