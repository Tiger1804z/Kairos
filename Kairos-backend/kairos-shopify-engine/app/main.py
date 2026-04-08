from __future__ import annotations

import os
from fastapi import FastAPI
from dotenv import load_dotenv
from app.models import ProfitabilityRequest

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
def compute_profit(request: ProfitabilityRequest):
    # Indexer le cout le plus recent par product_id
    cost_map: dict[str, float] = {}
    for c in request.product_costs:
        cost_map[c.product_id] = c.cost_per_unit
        
    # abreger revenue + COGS par produit
    revenue_map: dict[str, float] = {}
    cogs_map: dict[str, float] = {}
    units_map: dict[str, int] = {}
    
    for item in request.order_items:
        pid = item.product_id
        revenue_map[pid] = revenue_map.get(pid, 0.0) + item.unit_price * item.quantity
        units_map[pid] = units_map.get(pid, 0) + item.quantity
        cost = cost_map.get(pid)
        if cost is not None:
            cogs_map[pid] = cogs_map.get(pid, 0.0) + cost * item.quantity
    
    # construire les snapchots
    snapshots = []
    for pid ,revenue in revenue_map.items():
        cogs = cogs_map.get(pid, 0.0)
        gross_profit = revenue - cogs
        margin_pct = (gross_profit / revenue * 100) if revenue > 0 else 0.0
        snapshots.append({
            "product_id": pid,
            "period_start": request.period_start,
            "period_end": request.period_end,
            "revenue": round(revenue,2),
            "cogs": round(cogs,2),
            "gross_profit": round(gross_profit,2),
            "gross_margin_pct": round(margin_pct,2),
            "units_sold": units_map[pid],
            "has_cost": pid in cost_map
        })
    
    return {"business_id": request.business_id, "snapshots": snapshots}
            
            