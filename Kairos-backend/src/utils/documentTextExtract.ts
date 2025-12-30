import fs from "fs";
import path from "path";

const toAbsoluteDiskPath = (storagePath: string) =>
  path.join(process.cwd(), storagePath);

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Lecture UTF-8 safe (limite en chars) :
 * - évite de charger un fichier texte énorme inutilement
 * - garde un extrait exploitable pour l'IA
 */
async function readUtf8Limited(absPath: string, maxChars: number) {
  const raw = await fs.promises.readFile(absPath, "utf8");
  return normalize(raw).slice(0, maxChars);
}

/**
 * Sampling tabulaire pour CSV (pas de parsing lourd) :
 * - prend header
 * - prend N lignes du début
 * - prend N lignes du milieu
 * - prend N lignes de fin
 * - concatène en un “mini dataset” lisible par l'IA
 *
 * Remarque:
 * - suffisant pour résumer un fichier financier
 * - évite d’envoyer le CSV complet
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

  return normalize(sample).slice(0, maxChars);
}

/**
 * Sampling XLSX (si lib dispo) :
 * - lit les noms de feuilles
 * - extrait header + quelques lignes de chaque feuille (max 2-3 feuilles)
 *
 * Fallback:
 * - si “xlsx” pas installé → retourne ""
 */
async function sampleXlsx(absPath: string, maxChars: number) {
  try {
    // npm i xlsx
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const xlsx = require("xlsx");

    const wb = xlsx.readFile(absPath, { cellDates: true });
    const sheetNames: string[] = wb.SheetNames ?? [];
    if (sheetNames.length === 0) return "";

    const picked = sheetNames.slice(0, 3); // limiter

    const parts: string[] = [];
    parts.push(`XLSX SAMPLE`);
    parts.push(`Sheets: ${sheetNames.join(", ")}`);

    for (const name of picked) {
      const ws = wb.Sheets[name];
      if (!ws) continue;

      // Convertit en array-of-arrays (AOA) : simple à sample
      const rows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });

      const nonEmpty = rows.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== ""));
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

    return normalize(parts.join("\n")).slice(0, maxChars);
  } catch {
    return "";
  }
}

/**
 * Extraction DOCX (si lib dispo):
 * - récupère le texte des paragraphes
 * Fallback si lib absente
 */
async function sampleDocx(absPath: string, maxChars: number) {
  try {
    // npm i mammoth
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require("mammoth");

    const result = await mammoth.extractRawText({ path: absPath });
    const text = normalize(String(result?.value ?? ""));
    return text.slice(0, maxChars);
  } catch {
    return "";
  }
}

/**
 * Extraction principale (multi types) :
 * - pdf / csv / xlsx / docx / txt / md / json
 * - maxChars default élevé (documents longs)
 */
export const extractTextSample = async (params: {
  storage_path: string;
  file_type?: string | null;
  maxChars?: number;
}) => {
  const maxChars = params.maxChars ?? 35000;
  const abs = toAbsoluteDiskPath(params.storage_path);

  // fichier absent -> throw (le service gère)
  await fs.promises.access(abs);

  const ext = (params.file_type ?? "").toLowerCase();

  // Text-like
  if (ext === "txt" || ext === "md" || ext === "json") {
    return await readUtf8Limited(abs, maxChars);
  }

  // CSV -> sample intelligent
  if (ext === "csv") {
    return await sampleCsv(abs, maxChars);
  }

  // PDF (si pdf-parse installé)
  if (ext === "pdf") {
    try {
      // npm i pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require("pdf-parse");
      const buf = await fs.promises.readFile(abs);
      const parsed = await pdfParse(buf);
      const text = normalize(String(parsed?.text ?? ""));
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

  // Fallback
  return "";
};
