from __future__ import annotations

import os
from pathlib import Path


def verify_secret(provided: str) -> bool:
    expected = os.getenv("KAIROS_EXTRACTOR_KEY")
    if not expected:
        raise RuntimeError("KAIROS_EXTRACTOR_KEY not set in environment")
    return provided == expected


def is_path_allowed(full_path: Path, repo_root: Path) -> bool:
    try:
        full_path = full_path.resolve()
        allowed_dir = (repo_root / "uploads").resolve()
        return str(full_path).startswith(str(allowed_dir))
    except Exception:
        return False
