/**
 * csvUpload.ts — Upload CSV multer partagé avec limite de taille (GATE-A-REM-06).
 *
 * Avant ce ticket, les deux instances multer (import + costs) utilisaient
 * memoryStorage() SANS limits.fileSize : un fichier arbitrairement gros était
 * bufferisé entier en RAM (DoS mémoire possible par user authentifié).
 *
 * Avec limits.fileSize, multer coupe le stream dès que la limite est dépassée
 * (le fichier n'est PAS lu en entier) et émet une MulterError LIMIT_FILE_SIZE,
 * convertie ici en 413 JSON safe — jamais de stacktrace ni de détail interne.
 */
import type { Request, Response, NextFunction, RequestHandler } from "express";
import multer from "multer";

/** 5 MB — largement suffisant pour un CSV beta (~50 000+ lignes). */
export const CSV_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CSV_MAX_FILE_SIZE_BYTES },
});

const uploadSingleFile = upload.single("file");

/**
 * Middleware unique : upload du champ "file" + conversion des erreurs multer
 * en réponses JSON claires. On intercepte l'erreur dans le callback plutôt que
 * via un error-middleware Express pour garder l'ordre de montage trivial.
 */
export const csvUploadSingle: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  uploadSingleFile(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "FILE_TOO_LARGE",
        message: `Fichier trop volumineux. Taille maximale : ${CSV_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
      });
    }

    if (err instanceof multer.MulterError) {
      // Autre erreur multer (champ inattendu, trop de fichiers...) : 400 générique,
      // code multer seulement — jamais de stacktrace.
      return res.status(400).json({ error: "UPLOAD_ERROR", code: err.code });
    }

    return res.status(400).json({ error: "UPLOAD_ERROR" });
  });
};
