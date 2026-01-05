from __future__ import annotations

import time
from pathlib import Path
from typing import Optional, Literal, Any, Dict, List

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field

from app.security import verify_secret, is_path_allowed
from app.extractor import extract_document

from dotenv import load_dotenv
load_dotenv()


app = FastAPI(title="Kairos Extractor", version="0.1.0")


class ExtractRequest(BaseModel):
    storage_path: str = Field(..., description="Chemin relatif ex: uploads/4/2026-01/test.csv")
    file_type: Optional[str] = Field(None, description="txt|csv (pdf/xlsx plus tard)")
    max_chars: int = Field(35000, ge=1000, le=100000)
    mode: Literal["auto", "text_only", "tables_only"] = "auto"


@app.get("/health")
def health():
    return {"status": "ok", "service": "Kairos Extractor"}


def to_camel_response(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalise la réponse en camelCase pour Node/TS.
    Supporte l'ancien format snake_case (text_sample, tables_preview).
    """
    # Text sample
    text_sample = result.get("textSample")
    if text_sample is None:
        text_sample = result.get("text_sample", "")

    # Tables preview
    tables_preview = result.get("tablesPreview")
    if tables_preview is None:
        tables_preview = result.get("tables_preview", [])

    # Limits
    limits = result.get("limits", {})
    # File
    file_info = result.get("file", {})
    # Meta
    meta = result.get("meta", {})

    return {
        "file": file_info,
        "meta": meta,
        "textSample": text_sample,
        "tablesPreview": tables_preview,
        "limits": limits,
    }


@app.post("/extract")
def extract_endpoint(
    req: ExtractRequest,
    x_kairos_extractor_key: str = Header(..., alias="X-KAIROS-EXTRACTOR-KEY"),
):
    t0 = time.time()

    # 1) Secret
    if not verify_secret(x_kairos_extractor_key):
        raise HTTPException(status_code=403, detail="INVALID_SECRET")

    # 2) Repo root = Kairos-backend (python-extractor/app/main.py -> parents[2])
    repo_root = Path(__file__).resolve().parents[2]
    full_path = (repo_root / req.storage_path).resolve()

    # 3) Path allowlist
    if not is_path_allowed(full_path, repo_root):
        raise HTTPException(status_code=403, detail="PATH_NOT_ALLOWED")

    # 4) File exists
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="FILE_NOT_FOUND")

    # 5) Extract
    raw_result = extract_document(
        file_path=full_path,
        file_type=req.file_type,
        max_chars=req.max_chars,
        mode=req.mode,
    )

    # 6) Normalize response keys to camelCase
    result = to_camel_response(raw_result)

    ms = int((time.time() - t0) * 1000)

    return {
        "ok": True,
        "storage_path": req.storage_path,
        **result,
        "processing_time_ms": ms,
    }
