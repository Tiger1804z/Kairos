from __future__ import annotations

import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

DEBUG = os.getenv("SHOPIFY_ENGINE_DEBUG", "0") == "1"

app = FastAPI(title="Kairos Shopify Engine", version="0.1.0")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Kairos Shopify Engine",
        "version": "0.1.0",
    }


# -----------------------------------------------------------------------------
# Profit calculation (stub — Semaine 3-4)
# -----------------------------------------------------------------------------
@app.post("/profit/compute")
def compute_profit():
    # TODO: calcul rentabilité réelle par produit (revenue - COGS - frais)
    return {"ok": False, "error": "NOT_IMPLEMENTED"}
