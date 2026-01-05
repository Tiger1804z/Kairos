from __future__ import annotations

import os
from pathlib import Path
import dotenv

dotenv.load_dotenv()

# Racine du repo (Kairos-backend)
STORAGE_ROOT = Path(os.getenv("KAIROS_STORAGE_ROOT")).resolve()

# Dossier autorisé
UPLOADS_ROOT = (STORAGE_ROOT / "uploads").resolve()


def verify_secret(provided: str) -> bool:
    expected = os.getenv("KAIROS_EXTRACTOR_KEY")
    if not expected:
        raise RuntimeError("KAIROS_EXTRACTOR_KEY not set in environment")
    return provided == expected


def is_path_allowed(full_path: Path) -> bool:
    """
    Autorise uniquement les fichiers sous:
    $KAIROS_STORAGE_ROOT/uploads/**
    """
    try:
        full_path = full_path.resolve()
        return full_path.is_relative_to(UPLOADS_ROOT)
    except Exception:
        return False
