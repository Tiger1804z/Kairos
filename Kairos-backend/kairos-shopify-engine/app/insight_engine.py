from app.models import InsightRequest

# Seuils configurables
LOW_MARGIN_THRESHOLD = 15.0   # % en dessous duquel on considère la marge faible
DISCOUNT_THRESHOLD = 0.05     # 5% de remise minimum pour compter comme "soldé"
REFUND_IMPACT_THRESHOLD = 0.1 # remboursements > 10% du revenue = impact significatif


def compute_insights(req: InsightRequest) -> list[dict]:
    insights = []

    insights += _true_top_product(req)
    insights += _negative_margin_alert(req)
    insights += _low_margin_warning(req)
    insights += _missing_cost_alert(req)
    insights += _refund_impact(req)
    insights += _discount_erosion(req)

    return insights


# -----------------------------------------------------------------------------
# 1. Meilleur produit en profit brut réel (pas juste en chiffre d'affaires)
# -----------------------------------------------------------------------------
def _true_top_product(req: InsightRequest) -> list[dict]:
    eligible = [s for s in req.snapshots if s.has_cost and s.gross_profit > 0]
    if not eligible:
        return []

    top = max(eligible, key=lambda s: s.gross_profit)

    return [{
        "type": "true_top_product",
        "product_id": top.product_id,
        "title": f"{top.product_name} est votre produit le plus rentable",
        "description": (
            f"Il génère {top.gross_profit:.2f} $ de profit brut "
            f"avec une marge de {top.gross_margin_pct:.1f} %."
        ),
        "severity": "info",
        "value": top.gross_profit,
    }]


# -----------------------------------------------------------------------------
# 2. Alerte marge négative — vous perdez de l'argent sur ce produit
# -----------------------------------------------------------------------------
def _negative_margin_alert(req: InsightRequest) -> list[dict]:
    results = []
    for s in req.snapshots:
        if s.has_cost and s.gross_margin_pct < 0:
            results.append({
                "type": "negative_margin_alert",
                "product_id": s.product_id,
                "title": f"Marge négative sur {s.product_name}",
                "description": (
                    f"Chaque vente vous coûte de l'argent : marge de "
                    f"{s.gross_margin_pct:.1f} % ({s.gross_profit:.2f} $ de perte)."
                ),
                "severity": "critical",
                "value": s.gross_margin_pct,
            })
    return results


# -----------------------------------------------------------------------------
# 3. Avertissement marge faible (entre 0 % et LOW_MARGIN_THRESHOLD)
# -----------------------------------------------------------------------------
def _low_margin_warning(req: InsightRequest) -> list[dict]:
    results = []
    for s in req.snapshots:
        if s.has_cost and 0 <= s.gross_margin_pct < LOW_MARGIN_THRESHOLD:
            results.append({
                "type": "low_margin_warning",
                "product_id": s.product_id,
                "title": f"Marge faible sur {s.product_name}",
                "description": (
                    f"La marge brute est de {s.gross_margin_pct:.1f} %, "
                    f"en dessous du seuil recommandé de {LOW_MARGIN_THRESHOLD:.0f} %."
                ),
                "severity": "warning",
                "value": s.gross_margin_pct,
            })
    return results


# -----------------------------------------------------------------------------
# 4. Produits vendus sans coût défini — profit inconnu
# -----------------------------------------------------------------------------
def _missing_cost_alert(req: InsightRequest) -> list[dict]:
    results = []
    for s in req.snapshots:
        if not s.has_cost and s.units_sold > 0:
            results.append({
                "type": "missing_cost_alert",
                "product_id": s.product_id,
                "title": f"Coût manquant pour {s.product_name}",
                "description": (
                    f"{s.units_sold} unités vendues pour {s.revenue:.2f} $ de CA, "
                    f"mais aucun coût enregistré — profit inconnu."
                ),
                "severity": "warning",
                "value": s.units_sold,
            })
    return results


# -----------------------------------------------------------------------------
# 5. Impact des remboursements sur la marge
# -----------------------------------------------------------------------------
def _refund_impact(req: InsightRequest) -> list[dict]:
    # Agréger les remboursements et le revenue par produit
    refund_map: dict[str, float] = {}
    revenue_map: dict[str, float] = {}

    for item in req.order_items:
        pid = item.product_id
        refund_map[pid] = refund_map.get(pid, 0.0) + item.refunded_amount
        revenue_map[pid] = revenue_map.get(pid, 0.0) + item.unit_price * item.quantity

    # Index des noms de produits depuis les snapshots
    name_map = {s.product_id: s.product_name for s in req.snapshots}

    results = []
    for pid, total_refund in refund_map.items():
        revenue = revenue_map.get(pid, 0.0)
        if revenue <= 0 or total_refund <= 0:
            continue
        refund_rate = total_refund / revenue
        if refund_rate >= REFUND_IMPACT_THRESHOLD:
            name = name_map.get(pid, pid)
            results.append({
                "type": "refund_impact",
                "product_id": pid,
                "title": f"Remboursements élevés sur {name}",
                "description": (
                    f"{total_refund:.2f} $ remboursés sur {revenue:.2f} $ de CA "
                    f"({refund_rate * 100:.1f} % du chiffre d'affaires)."
                ),
                "severity": "warning",
                "value": round(refund_rate * 100, 2),
            })
    return results


# -----------------------------------------------------------------------------
# 6. Érosion par les remises — prix réel << prix catalogue
# -----------------------------------------------------------------------------
def _discount_erosion(req: InsightRequest) -> list[dict]:
    # Agréger discount et revenue catalogue par produit
    discount_map: dict[str, float] = {}
    catalogue_revenue_map: dict[str, float] = {}

    for item in req.order_items:
        if item.original_price <= 0:
            continue
        pid = item.product_id
        catalogue_revenue = item.original_price * item.quantity
        actual_revenue = item.unit_price * item.quantity
        discount = catalogue_revenue - actual_revenue

        catalogue_revenue_map[pid] = catalogue_revenue_map.get(pid, 0.0) + catalogue_revenue
        discount_map[pid] = discount_map.get(pid, 0.0) + discount

    name_map = {s.product_id: s.product_name for s in req.snapshots}

    results = []
    for pid, total_discount in discount_map.items():
        catalogue_rev = catalogue_revenue_map.get(pid, 0.0)
        if catalogue_rev <= 0 or total_discount <= 0:
            continue
        discount_rate = total_discount / catalogue_rev
        if discount_rate >= DISCOUNT_THRESHOLD:
            name = name_map.get(pid, pid)
            results.append({
                "type": "discount_erosion",
                "product_id": pid,
                "title": f"Remises importantes sur {name}",
                "description": (
                    f"{total_discount:.2f} $ de marge perdue en remises "
                    f"({discount_rate * 100:.1f} % du prix catalogue)."
                ),
                "severity": "info",
                "value": round(discount_rate * 100, 2),
            })
    return results
