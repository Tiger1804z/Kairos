from __future__ import annotations

import os
import time
import tempfile
import shutil
from pathlib import Path
from typing import Optional, Literal, Any, Dict

from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form
from pydantic import BaseModel, Field

from dotenv import load_dotenv
from app.security import verify_secret, is_path_allowed
from app.extractor import extract_document

load_dotenv()

# -----------------------------------------------------------------------------
# STORAGE ROOT
# -----------------------------------------------------------------------------
# Idée: KAIROS_STORAGE_ROOT = racine du repo Node (où se trouve /uploads)
# Ex: /Users/seb/Kairos-backend
#
# Si non défini, fallback sur repo_root auto via parents[2]
# (python-extractor/app/main.py -> parents[2] = racine repo)
repo_root_fallback = Path(__file__).resolve().parents[2]

STORAGE_ROOT = Path(os.getenv("KAIROS_STORAGE_ROOT", str(repo_root_fallback))).resolve()

# Par défaut, on allow seulement STORAGE_ROOT/uploads/**
UPLOADS_ROOT = (STORAGE_ROOT / "uploads").resolve()

DEBUG = os.getenv("EXTRACTOR_DEBUG", "0") == "1"

app = FastAPI(title="Kairos Extractor", version="0.2.0")


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class ExtractRequest(BaseModel):
    storage_path: str = Field(..., description="Chemin relatif ex: uploads/4/2026-01/test.csv")
    file_type: Optional[str] = Field(None, description="txt|csv|pdf| (xlsx plus tard)")
    max_chars: int = Field(35000, ge=1000, le=100000)
    mode: Literal["auto", "text_only", "tables_only"] = "auto"


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Kairos Extractor",
        "storage_root": str(STORAGE_ROOT),
        "uploads_root": str(UPLOADS_ROOT),
    }


def to_camel_response(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalise sla réponse en camelCase pour Node/TS.
    Supporte l'ancien format snake_case (text_sample, tables_preview).
    """
    text_sample = result.get("textSample")
    if text_sample is None:
        text_sample = result.get("text_sample", "")

    tables_preview = result.get("tablesPreview")
    if tables_preview is None:
        tables_preview = result.get("tables_preview", [])

    return {
        "file": result.get("file", {}),
        "meta": result.get("meta", {}),
        "textSample": text_sample,
        "tablesPreview": tables_preview,
        "limits": result.get("limits", {}),
    }


def _debug_print(*args: Any):
    if DEBUG:
        print(*args)





# -----------------------------------------------------------------------------
# B) Upload-based extract (Node stream -> Python)
# -----------------------------------------------------------------------------
@app.post("/extract-upload")
async def extract_upload_endpoint(
    file: UploadFile = File(...),
    max_chars: int = Form(35000),
    mode: str = Form("auto"),
    file_type: Optional[str] = Form(None),
    x_kairos_extractor_key: str = Header(..., alias="X-KAIROS-EXTRACTOR-KEY"),
):
    print("[PY] extract-upload called", file.filename, file.content_type)

    t0 = time.time()

    # 1) Secret
    if not verify_secret(x_kairos_extractor_key):
        raise HTTPException(status_code=403, detail="INVALID_SECRET")

    # 2) Save temp
    suffix = Path(file.filename or "").suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        raw_result = extract_document(
            file_path=tmp_path,
            file_type=file_type,
            max_chars=max_chars,
            mode=mode,  # "auto" | "text_only" | "tables_only"
        )

        result = to_camel_response(raw_result)

        ms = int((time.time() - t0) * 1000)
        return {
            "ok": True,
            "storage_path": None,
            "uploaded_file": {
                "name": file.filename,
                "type": (file_type or suffix.replace(".", "") or "unknown"),
                "size_bytes": tmp_path.stat().st_size,
            },
            **result,
            "processing_time_ms": ms,
        }

    finally:
        try:
            tmp_path.unlink()
        except Exception:
            pass
