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
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import type { Request } from "express";

// ------------------------------------------------------------
// ✅ ROOTS STABLES (NE PAS dépendre de process.cwd())
// ------------------------------------------------------------

// Racine du backend = dossier parent de /src (car ce fichier est typiquement /src/utils/fileStorage.ts)
const BACKEND_ROOT = path.resolve(__dirname, "..", "..");

// Permet override via .env (super utile si tu changes l’emplacement)
const UPLOADS_ROOT_ENV = process.env.KAIROS_UPLOADS_ROOT;

// Racine uploads stable
export const UPLOADS_ROOT = path.resolve(UPLOADS_ROOT_ENV ?? path.join(BACKEND_ROOT, "uploads"));

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------

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
  "text/plain",
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
  "txt",
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
 * Chemin absolu -> chemin relatif (stockage DB)
 * Exemple :
 *   C:\...\Kairos-backend\uploads\4\2026-01\uuid.csv
 * -> uploads/4/2026-01/uuid.csv
 */
export function toRelativeStoragePath(absolutePath: string): string {
  const abs = path.resolve(absolutePath);
  const relFromUploads = path.relative(UPLOADS_ROOT, abs);
  return ["uploads", ...relFromUploads.split(path.sep)].join("/");
}

/**
 * Chemin DB (uploads/...) -> chemin absolu disque
 */
export function toAbsoluteDiskPath(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, "/").replace(/^uploads\//, "");
  // empêche path traversal
  const safe = normalized.replace(/\.\.\//g, "");
  return path.resolve(UPLOADS_ROOT, safe);
}

