import fs from "fs";
import path from "path";

const toAbsoluteDiskPath = (storagePath: string) => path.join(process.cwd(), storagePath);

// Soft normalize: garde les retours de ligne, nettoie juste espaces/tabs répétées
const normalizeSoftKeepLines = (s: string) =>
  s
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Hard normalize: pour texte “plain” (pas tabulaire)
const normalizeHard = (s: string) => s.replace(/\s+/g, " ").trim();

function getExtFromStoragePath(storagePath: string): string {
  const ext = path.extname(storagePath).toLowerCase().replace(".", "");
  return ext;
}

function inferExt(file_type?: string | null, storage_path?: string) {
  const ft = (file_type ?? "").toLowerCase().trim();

  // 1) si ft ressemble déjà à une extension
  if (ft && /^[a-z0-9]{2,5}$/.test(ft)) return ft;

  // 2) si ft est un mimetype connu
  const mimeToExt: Record<string, string> = {
    "application/pdf": "pdf",
    "text/csv": "csv",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "image/png": "png",
    "image/jpeg": "jpg",
    "text/plain": "txt",
    "application/json": "json",
  };
  if (ft && mimeToExt[ft]) return mimeToExt[ft];

  // 3) fallback: extension dans storage_path
  if (storage_path) return getExtFromStoragePath(storage_path);

  return "";
}

/**
 * Lecture UTF-8 safe (limite en chars)
 */
async function readUtf8Limited(absPath: string, maxChars: number) {
  const raw = await fs.promises.readFile(absPath, "utf8");
  return normalizeHard(raw).slice(0, maxChars);
}

/**
 * Sampling tabulaire CSV
 */
async function sampleCsv(absPath: string, maxChars: number) {
  const raw = await fs.promises.readFile(absPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return "";

  const header = lines[0];
  const body = lines.slice(1);

  const take = (arr: string[], n: number) => arr.slice(0, n);
  const takeLast = (arr: string[], n: number) => arr.slice(Math.max(arr.length - n, 0));
  const takeMid = (arr: string[], n: number) => {
    if (arr.length <= n) return arr;
    const start = Math.floor(arr.length / 2) - Math.floor(n / 2);
    return arr.slice(Math.max(start, 0), Math.max(start, 0) + n);
  };

  const headRows = take(body, 25);
  const midRows = takeMid(body, 25);
  const tailRows = takeLast(body, 25);

  const sample = [
    `CSV SAMPLE`,
    `Total lines (incl header): ${lines.length}`,
    `Header:`,
    header,
    ``,
    `First rows:`,
    ...headRows,
    ``,
    `Middle rows:`,
    ...midRows,
    ``,
    `Last rows:`,
    ...tailRows,
  ].join("\n");

  // ✅ on garde les lignes
  return normalizeSoftKeepLines(sample).slice(0, maxChars);
}

/**
 * Sampling XLSX (si lib dispo)
 */
async function sampleXlsx(absPath: string, maxChars: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const xlsx = require("xlsx");

    const wb = xlsx.readFile(absPath, { cellDates: true });
    const sheetNames: string[] = wb.SheetNames ?? [];
    if (sheetNames.length === 0) return "";

    const picked = sheetNames.slice(0, 3);

    const parts: string[] = [];
    parts.push(`XLSX SAMPLE`);
    parts.push(`Sheets: ${sheetNames.join(", ")}`);

    for (const name of picked) {
      const ws = wb.Sheets[name];
      if (!ws) continue;

      const rows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });

      const nonEmpty = rows.filter(
        (r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== "")
      );
      if (nonEmpty.length === 0) continue;

      const header = nonEmpty[0];
      if (!header) continue;
      const body = nonEmpty.slice(1);

      const headRows = body.slice(0, 20);
      const tailRows = body.slice(Math.max(body.length - 20, 0));

      parts.push(``);
      parts.push(`Sheet: ${name}`);
      parts.push(`Rows (approx): ${nonEmpty.length}`);
      parts.push(`Header: ${header.join(" | ")}`);
      parts.push(`First rows:`);
      for (const r of headRows) parts.push(r.join(" | "));
      parts.push(`Last rows:`);
      for (const r of tailRows) parts.push(r.join(" | "));
    }

    return normalizeSoftKeepLines(parts.join("\n")).slice(0, maxChars);
  } catch {
    return "";
  }
}

/**
 * Extraction DOCX (si lib dispo)
 */
async function sampleDocx(absPath: string, maxChars: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require("mammoth");

    const result = await mammoth.extractRawText({ path: absPath });
    const text = normalizeHard(String(result?.value ?? ""));
    return text.slice(0, maxChars);
  } catch {
    return "";
  }
}

/**
 * Extraction principale
 */
export const extractTextSample = async (params: {
  storage_path: string;
  file_type?: string | null;
  maxChars?: number;
}) => {
  const maxChars = params.maxChars ?? 35000;
  const abs = toAbsoluteDiskPath(params.storage_path);

  await fs.promises.access(abs);

  // ✅ déduction robuste
  const ext = inferExt(params.file_type, params.storage_path);

  // Text-like
  if (ext === "txt" || ext === "md" || ext === "json") {
    return await readUtf8Limited(abs, maxChars);
  }

  // CSV
  if (ext === "csv") {
    return await sampleCsv(abs, maxChars);
  }

  // PDF
  if (ext === "pdf") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require("pdf-parse");
      const buf = await fs.promises.readFile(abs);
      const parsed = await pdfParse(buf);
      const text = normalizeSoftKeepLines(String(parsed?.text ?? ""));
      return text.slice(0, maxChars);
    } catch {
      return "";
    }
  }

  // Excel
  if (ext === "xls" || ext === "xlsx") {
    return await sampleXlsx(abs, maxChars);
  }

  // Word
  if (ext === "docx") {
    return await sampleDocx(abs, maxChars);
  }

  return "";
};
