import fs from "fs";
import axios from "axios";
import FormData from "form-data";

export type ExtractMode = "auto" | "text_only" | "tables_only";

export type ExtractRequest = {
  storage_path: string;
  file_type?: string;
  max_chars?: number;
  mode?: ExtractMode;
};

export type ExtractResponseOk = {
  ok: true;
  storage_path: string;

  file: {
    type: string;
    size_bytes: number;
    name?: string;
  };

  meta: {
    kind_guess?: "finance" | "general" | "unknown";
    finance_like?: boolean;
    confidence?: number;
    notes?: string[];
  };

  textSample: string;
  tablesPreview: Array<{
    name: string;
    header: string[];
    rows: string[][];
    total_rows?: number;
  }>;

  limits: {
    max_chars: number;
    truncated: boolean;
  };

  processing_time_ms?: number;
};

export type ExtractResponseError = {
  ok: false;
  error: string;
  message: string;
  storage_path?: string;
};

export type ExtractResponse = ExtractResponseOk | ExtractResponseError;

const EXTRACTOR_URL =
  process.env.EXTRACTOR_SERVICE_URL || "http://127.0.0.1:8001";
const EXTRACTOR_KEY = process.env.KAIROS_EXTRACTOR_KEY;
const TIMEOUT_MS = 20_000;



export type ExtractUploadRequest = {
  file_path: string;
  original_name: string;
  file_type?: string; // optionnel
  max_chars?: number;
  mode?: ExtractMode;
  mime_type?: string;
};

/**
 * Upload mode: Node stream -> Python (/extract-upload)
 */
export const extractUploadViaPython = async (
  req: ExtractUploadRequest
): Promise<ExtractResponse> => {
  if (!EXTRACTOR_KEY) {
    return {
      ok: false,
      error: "MISSING_KEY",
      message: "KAIROS_EXTRACTOR_KEY not set",
    };
  }

  const url = `${EXTRACTOR_URL}/extract-upload`;

  const form = new FormData();
  form.append("file", fs.createReadStream(req.file_path), {
    filename: req.original_name,
    contentType: req.mime_type ?? "application/octet-stream",
  });

  form.append("max_chars", String(req.max_chars ?? 35000));
  form.append("mode", req.mode ?? "auto");
  if (req.file_type) form.append("file_type", req.file_type);

  console.log("[extractUploadViaPython] URL =", url);
  console.log("[extractUploadViaPython] file_path =", req.file_path);
  console.log("[extractUploadViaPython] original_name =", req.original_name);
  console.log("[extractUploadViaPython] file_type =", req.file_type);
  console.log("[extractUploadViaPython] mode =", req.mode ?? "auto");

  try {
    const res = await axios.post(url, form, {
      headers: {
        "X-KAIROS-EXTRACTOR-KEY": EXTRACTOR_KEY,
        ...form.getHeaders(),
      },
      timeout: TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    });

    console.log("[extractUploadViaPython] status =", res.status);

    if (res.status < 200 || res.status >= 300) {
      return {
        ok: false,
        error: "HTTP_ERROR",
        message: `Extractor ${res.status} - ${JSON.stringify(res.data)}`,
      };
    }

    return res.data as ExtractResponse;
  } catch (e: any) {
    const msg = e?.code === "ECONNABORTED" ? "Request timeout" : e?.message;
    return {
      ok: false,
      error: "REQUEST_FAILED",
      message: msg ?? "Unknown error",
    };
  }
};
