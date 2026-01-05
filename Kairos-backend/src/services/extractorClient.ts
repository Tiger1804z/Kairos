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

const EXTRACTOR_URL = process.env.EXTRACTOR_SERVICE_URL || "http://127.0.0.1:8001";
const EXTRACTOR_KEY = process.env.KAIROS_EXTRACTOR_KEY;
const TIMEOUT_MS = 20_000;


export const extractViaPython = async (request: ExtractRequest): Promise<ExtractResponse> => {
  if (!EXTRACTOR_KEY) {
    return {
      ok: false,
      error: "MISSING_KEY",
      message: "KAIROS_EXTRACTOR_KEY not set",
      storage_path: request.storage_path,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = `${EXTRACTOR_URL}/extract`;

  const payload = {
    storage_path: request.storage_path,
    file_type: request.file_type,
    max_chars: request.max_chars ?? 35000,
    mode: request.mode ?? "auto",
  };

  // Logs utiles
  console.log("EXTRACTOR_URL =", EXTRACTOR_URL);
  console.log("Calling =", url);
  console.log("Extractor payload =", payload);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KAIROS-EXTRACTOR-KEY": EXTRACTOR_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("Extractor HTTP status =", res.status);

    if (!res.ok) {
      // Important: lire le body pour voir le vrai détail (FastAPI renvoie souvent {"detail": "..."} )
      const errText = await res.text();
      console.log("Extractor error body =", errText);

      return {
        ok: false,
        error: "HTTP_ERROR",
        message: `Extractor returned ${res.status} - ${errText}`,
        storage_path: request.storage_path,
      };
    }

    return (await res.json()) as ExtractResponse;
  } catch (e: any) {
    clearTimeout(timeoutId);

    return {
      ok: false,
      error: e?.name === "AbortError" ? "TIMEOUT" : "FETCH_FAILED",
      message: e?.message ?? "Unknown error",
      storage_path: request.storage_path,
    };
  }
};