/**
 * FILE STORAGE – CONFIGURATION UPLOAD (DEV)
 * -----------------------------------------
 * Responsabilité :
 * - Gérer l’upload de fichiers via multer
 * - Stocker les fichiers localement (mode développement)
 * - Appliquer des règles strictes de sécurité (taille, type, chemin)
 * - Produire des chemins exploitables pour la base de données
 *
 * IMPORTANT :
 * - Le fichier brut n’est JAMAIS stocké en base
 * - Seules les métadonnées sont persistées (via Prisma)
 *
 * FIX IMPORTANT (multer + form-data):
 * - Dans multipart/form-data, multer peut exécuter "destination()" avant
 *   que req.body soit fiable (ordre des parts).
 * - Solution robuste : accepter business_id via req.params (URL),
 *   avec fallback sur body/query.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import type { Request } from "express";

/**
 * Racine de stockage locale
 * Exemple final :
 * uploads/{business_id}/{YYYY-MM}/{uuid}.{ext}
 */
export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

/**
 * Limite de taille par fichier (10 MB)
 */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Mimetypes autorisés
 */
const allowedMime = new Set<string>([
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);

/**
 * Extensions autorisées
 */
const allowedExt = new Set<string>([
  "pdf",
  "csv",
  "xls",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
]);

/**
 * Crée un dossier s’il n’existe pas
 */
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Extraction robuste du business_id
 * Priorité (ordre stable et fiable) :
 * 1) req.params.business_id  ✅ recommandé (route: /documents/:business_id/upload)
 * 2) req.body.business_id    (form-data)
 * 3) req.query.business_id
 */
function extractBusinessId(req: Request): number {
  const raw =
    (req.params?.business_id ??
      req.body?.business_id ??
      req.query?.business_id) as string | undefined;

  const businessId = Number(raw);

  if (!businessId || Number.isNaN(businessId)) {
    throw new Error("BUSINESS_ID_REQUIRED");
  }

  return businessId;
}

/**
 * Extension du nom original
 */
function getOriginalExtension(filename: string): string {
  return path.extname(filename).toLowerCase().replace(".", "");
}

/**
 * Extension fiable pour stockage
 * - priorité: extension originale valide
 * - fallback: mapping mimetype
 */
function resolveSafeExtension(file: Express.Multer.File): string {
  const ext = getOriginalExtension(file.originalname);
  if (ext && allowedExt.has(ext)) return ext;

  const mimeToExt: Record<string, string> = {
    "application/pdf": "pdf",
    "text/csv": "csv",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "image/png": "png",
    "image/jpeg": "jpg",
  };

  return mimeToExt[file.mimetype] ?? "bin";
}

/**
 * Dossier mensuel courant: YYYY-MM
 */
function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Configuration multer – stockage disque
 * - Dossier dynamique par business
 * - Nom unique (UUID)
 */
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    try {
      ensureDir(UPLOADS_ROOT);

      const businessId = extractBusinessId(req);
      const folder = path.join(
        UPLOADS_ROOT,
        String(businessId),
        currentYearMonth()
      );

      ensureDir(folder);
      cb(null, folder);
    } catch (err) {
      cb(err as Error, "");
    }
  },

  filename(_req, file, cb) {
    const ext = resolveSafeExtension(file);

    const uuid =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex");

    cb(null, `${uuid}.${ext}`);
  },
});

/**
 * Filtrage des fichiers entrants
 * - Vérifie mimetype
 * - Vérifie extension (si extension fournie)
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ext = getOriginalExtension(file.originalname);
  const mimeOk = allowedMime.has(file.mimetype);
  const extOk = ext ? allowedExt.has(ext) : true;

  if (!mimeOk || !extOk) {
    return cb(new Error("UNSUPPORTED_FILE_TYPE"));
  }

  cb(null, true);
}

/**
 * Middleware multer prêt à l’emploi
 * Champ attendu : "file"
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single("file");

/**
 * Chemin absolu -> chemin relatif (stockage DB)
 * Exemple :
 * /app/uploads/4/2025-12/uuid.pdf
 * -> uploads/4/2025-12/uuid.pdf
 */
export function toRelativeStoragePath(absolutePath: string): string {
  const relative = path.relative(process.cwd(), absolutePath);
  return relative.split(path.sep).join("/");
}
