from __future__ import annotations

from pathlib import Path
from typing import Optional,Literal
import csv

from app.detectors.finance import detect_finance_like

ExtractMode = Literal["auto", "text_only", "table_only"]

def _extract_txt(file_path: Path, max_chars: int) -> tuple[str,list]:
    text = file_path.read_text(encoding="utf-8", errors="ignore")
    return text[:max_chars], []

def _extract_csv(file_path: Path, max_chars: int) -> tuple[str,list]:
    rows:list[list[str]] = []
    with file_path.open("r", encoding="utf-8", errors="ignore",newline="") as f :
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i >= 100:
                break
            rows.append(row)
            
    if not rows:
        return "", []
    
    # text sample (first 50 lines)
    lines = [",".join(r) for r in rows[:50]]
    text = "\n".join(lines)
    text = text[:max_chars]

    header = rows[0]
    data_rows = rows[1:11] if len(rows) > 1 else []

    table = {
        "name": "csv_data",
        "header": header,
        "rows": data_rows,
        "total_rows": len(rows),
    }

    return text, [table]

def extract_document(
    file_path: Path,
    file_type: Optional[str] = None,
    max_chars: int = 35_000,
    mode: ExtractMode = "auto",
)-> dict:
    if not file_type:
        file_type = file_path.suffix.lower().replace(".", "")
        
        if file_type not in {"txt", "csv"}:
            raise ValueError(f"Unsupported file type (for now): {file_type}")
        
        if file_type == "txt":
            text_sample , tables_preview = _extract_txt(file_path, max_chars)
        
        else:
            text_sample , tables_preview = _extract_csv(file_path, max_chars)
            
        # mode handling 
        if mode == "text_only":
            tables_preview = []
        elif mode == "table_only":
            text_sample = ""
        
        finance_like, confidence, detected_keywords = detect_finance_like(text_sample)
        
        kind_guess = "finance" if finance_like else "general"
        if not text_sample.strip() and not tables_preview:
            kind_guess = "unknown"
            
        return{
            "file":{
                "type": file_type,
                "size_bytes": file_path.stat().st_size,
                "name": file_path.name,
            },
            "meta":{
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
        
        
              