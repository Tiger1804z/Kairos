from __future__ import annotations

from pathlib import Path
from typing import Optional, Literal
import csv
from pypdf import PdfReader

from app.detectors.finance import detect_finance_like

ExtractMode = Literal["auto", "text_only", "tables_only"]


def _extract_txt(file_path: Path, max_chars: int) -> tuple[str, list]:
    text = file_path.read_text(encoding="utf-8", errors="ignore")
    return text[:max_chars], []


def _extract_csv(file_path: Path, max_chars: int) -> tuple[str, list]:
    rows: list[list[str]] = []
    with file_path.open("r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i >= 200:
                break
            rows.append(row)

    if not rows:
        return "", []

    
    lines = [",".join(r) for r in rows[:80]]
    text = "\n".join(lines)[:max_chars]

    header = rows[0]
    data_rows = rows[1:11] if len(rows) > 1 else []

    table = {
        "name": "csv_data",
        "header": header,
        "rows": data_rows,
        "total_rows": len(rows),
    }

    return text, [table]


def _extract_pdf(file_path: Path, max_chars: int) -> tuple[str, list]:
    # PDF text-layer extraction (no OCR)

    reader = PdfReader(str(file_path))
    chunks: list[str] = []
    current_len = 0

    for page in reader.pages:
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""

        if not page_text:
            continue

        remaining = max_chars - current_len
        if remaining <= 0:
            break

        snippet = page_text[:remaining]
        chunks.append(snippet)
        current_len += len(snippet)

    text = "\n\n".join(chunks)
    return text, []


def extract_document(
    file_path: Path,
    file_type: Optional[str] = None,
    max_chars: int = 35_000,
    mode: ExtractMode = "auto",
) -> dict:
    # 1) Determine file_type
    if not file_type:
        file_type = file_path.suffix.lower().replace(".", "")
    else:
        file_type = file_type.lower().replace(".", "")

    if file_type not in {"txt", "csv", "pdf"}:
        raise ValueError(f"Unsupported file type (for now): {file_type}")

    # 2) Extract
    if file_type == "txt":
        text_sample, tables_preview = _extract_txt(file_path, max_chars)
    elif file_type == "csv":
        text_sample, tables_preview = _extract_csv(file_path, max_chars)
    else:
        text_sample, tables_preview = _extract_pdf(file_path, max_chars)

    # 3) Mode handling
    if mode == "text_only":
        tables_preview = []
    elif mode == "tables_only":
        text_sample = ""

    # 4) Meta detection
    finance_like, confidence, detected_keywords = detect_finance_like(text_sample)
    kind_guess = "finance" if finance_like else "general"
    if not text_sample.strip() and not tables_preview:
        kind_guess = "unknown"

    return {
        "file": {
            "type": file_type,
            "size_bytes": file_path.stat().st_size,
            "name": file_path.name,
        },
        "meta": {
            "kind_guess": kind_guess,
            "finance_like": finance_like,
            "confidence": confidence,
            "notes": [f"detected: {', '.join(detected_keywords)}"] if detected_keywords else [],
        },
        "text_sample": text_sample,
        "tables_preview": tables_preview,
        "limits": {
            "max_chars": max_chars,
            "truncated": len(text_sample) >= max_chars,
        },
    }