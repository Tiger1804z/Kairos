import fs from "fs";
import path from "path";

const toAbsoluteDiskPath = (storagePath: string) =>
  path.join(process.cwd(), storagePath);

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

export const extractTextSample = async (params: {
  storage_path: string;
  file_type?: string | null;
  maxChars?: number;
}) => {
  const maxChars = params.maxChars ?? 2500;
  const abs = toAbsoluteDiskPath(params.storage_path);

  // fichier absent => sample vide (le controller/service gère ça)
  await fs.promises.access(abs);

  const ext = (params.file_type ?? "").toLowerCase();

  // CSV/TXT: lecture simple et safe
  if (ext === "csv" || ext === "txt") {
    const raw = await fs.promises.readFile(abs, "utf8");
    return normalize(raw).slice(0, maxChars);
  }

  // PDF: si pdf-parse est installé, sinon fallback minimal
  if (ext === "pdf") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require("pdf-parse");
      const buf = await fs.promises.readFile(abs);
      const parsed = await pdfParse(buf);
      const text = normalize(String(parsed?.text ?? ""));
      return text.slice(0, maxChars);
    } catch {
      // Fallback: pas de texte extractible sans lib
      return "";
    }
  }

  // XLS/XLSX: fallback (à améliorer plus tard avec lib xlsx)
  if (ext === "xls" || ext === "xlsx") {
    return "";
  }

  return "";
};
