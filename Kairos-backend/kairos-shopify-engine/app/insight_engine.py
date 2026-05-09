from concurrent.futures import ThreadPoolExecutor, as_completed
from app.models import InsightRequest
from app.insight_writer import write_insight

# Seuils configurables
LOW_MARGIN_THRESHOLD = 15.0   # % en dessous duquel on considère la marge faible
DISCOUNT_THRESHOLD = 0.05     # 5% de remise minimum pour compter comme "soldé"
REFUND_IMPACT_THRESHOLD = 0.1 # remboursements > 10% du revenue = impact significatif


def compute_insights(req: InsightRequest) -> list[dict]:
    raw_facts_list = []

    raw_facts_list += _true_top_product(req)
    raw_facts_list += _negative_margin_alert(req)
    raw_facts_list += _low_margin_warning(req)
    raw_facts_list += _missing_cost_alert(req)
    raw_facts_list += _refund_impact(req)
    raw_facts_list += _discount_erosion(req)

    # Enrichissement : appels LLM en parallèle (1 thread par insight)
    results = [None] * len(raw_facts_list)
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(write_insight, facts): i for i, facts in enumerate(raw_facts_list)}
        for future in as_completed(futures):
            results[futures[future]] = future.result()
    return results


# -----------------------------------------------------------------------------
# 1. Meilleur produit en profit brut réel
# -----------------------------------------------------------------------------
def _true_top_product(req: InsightRequest) -> list[dict]:
    eligible = [s for s in req.snapshots if s.has_cost and s.gross_profit > 0]
    if not eligible:
        return []

    top = max(eligible, key=lambda s: s.gross_profit)

    return [{
        "type":         "true_top_product",
        "product_id":   top.product_id,
        "product_name": top.product_name,
        "severity":     "info",
        "value":        top.gross_profit,
        "facts": {
            "gross_profit":     round(top.gross_profit, 2),
            "gross_margin_pct": round(top.gross_margin_pct, 1),
            "units_sold":       top.units_sold,
        },
    }]


# -----------------------------------------------------------------------------
# 2. Alerte marge négative
# -----------------------------------------------------------------------------
def _negative_margin_alert(req: InsightRequest) -> list[dict]:
    results = []
    for s in req.snapshots:
        if s.has_cost and s.gross_margin_pct < 0:
            loss_per_unit = round(-s.gross_profit / s.units_sold, 2) if s.units_sold > 0 else 0
            results.append({
                "type":         "negative_margin_alert",
                "product_id":   s.product_id,
                "product_name": s.product_name,
                "severity":     "critical",
                "value":        round(s.gross_margin_pct, 1),
                "facts": {
                    "margin_percent": round(s.gross_margin_pct, 1),
                    "total_loss":     round(-s.gross_profit, 2),
                    "loss_per_unit":  loss_per_unit,
                    "units_sold":     s.units_sold,
                },
            })
    return results


# -----------------------------------------------------------------------------
# 3. Avertissement marge faible
# -----------------------------------------------------------------------------
def _low_margin_warning(req: InsightRequest) -> list[dict]:
    results = []
    for s in req.snapshots:
        if s.has_cost and 0 <= s.gross_margin_pct < LOW_MARGIN_THRESHOLD:
            results.append({
                "type":         "low_margin_warning",
                "product_id":   s.product_id,
                "product_name": s.product_name,
                "severity":     "warning",
                "value":        round(s.gross_margin_pct, 1),
                "facts": {
                    "margin_percent":   round(s.gross_margin_pct, 1),
                    "gross_profit":     round(s.gross_profit, 2),
                    "threshold":        LOW_MARGIN_THRESHOLD,
                    "units_sold":       s.units_sold,
                },
            })
    return results


# -----------------------------------------------------------------------------
# 4. Produits sans coût défini
# -----------------------------------------------------------------------------
def _missing_cost_alert(req: InsightRequest) -> list[dict]:
    results = []
    for s in req.snapshots:
        if not s.has_cost and s.units_sold > 0:
            results.append({
                "type":         "missing_cost_alert",
                "product_id":   s.product_id,
                "product_name": s.product_name,
                "severity":     "warning",
                "value":        s.units_sold,
                "facts": {
                    "units_sold": s.units_sold,
                    "revenue":    round(s.revenue, 2),
                },
            })
    return results


# -----------------------------------------------------------------------------
# 5. Impact des remboursements
# -----------------------------------------------------------------------------
def _refund_impact(req: InsightRequest) -> list[dict]:
    refund_map: dict[str, float] = {}
    revenue_map: dict[str, float] = {}

    for item in req.order_items:
        pid = item.product_id
        refund_map[pid]  = refund_map.get(pid, 0.0)  + item.refunded_amount
        revenue_map[pid] = revenue_map.get(pid, 0.0) + item.unit_price * item.quantity

    name_map = {s.product_id: s.product_name for s in req.snapshots}

    results = []
    for pid, total_refund in refund_map.items():
        revenue = revenue_map.get(pid, 0.0)
        if revenue <= 0 or total_refund <= 0:
            continue
        refund_rate = total_refund / revenue
        if refund_rate >= REFUND_IMPACT_THRESHOLD:
            results.append({
                "type":         "refund_impact",
                "product_id":   pid,
                "product_name": name_map.get(pid, pid),
                "severity":     "warning",
                "value":        round(refund_rate * 100, 2),
                "facts": {
                    "total_refund": round(total_refund, 2),
                    "revenue":      round(revenue, 2),
                    "refund_rate":  round(refund_rate * 100, 1),
                },
            })
    return results


# -----------------------------------------------------------------------------
# 6. Érosion par les remises
# -----------------------------------------------------------------------------
def _discount_erosion(req: InsightRequest) -> list[dict]:
    discount_map: dict[str, float] = {}
    catalogue_revenue_map: dict[str, float] = {}

    for item in req.order_items:
        if item.original_price <= 0:
            continue
        pid = item.product_id
        catalogue_revenue = item.original_price * item.quantity
        actual_revenue    = item.unit_price     * item.quantity
        discount          = catalogue_revenue - actual_revenue

        catalogue_revenue_map[pid] = catalogue_revenue_map.get(pid, 0.0) + catalogue_revenue
        discount_map[pid]          = discount_map.get(pid, 0.0)          + discount

    name_map = {s.product_id: s.product_name for s in req.snapshots}

    results = []
    for pid, total_discount in discount_map.items():
        catalogue_rev = catalogue_revenue_map.get(pid, 0.0)
        if catalogue_rev <= 0 or total_discount <= 0:
            continue
        discount_rate = total_discount / catalogue_rev
        if discount_rate >= DISCOUNT_THRESHOLD:
            results.append({
                "type":         "discount_erosion",
                "product_id":   pid,
                "product_name": name_map.get(pid, pid),
                "severity":     "info",
                "value":        round(discount_rate * 100, 2),
                "facts": {
                    "total_discount": round(total_discount, 2),
                    "catalogue_rev":  round(catalogue_rev, 2),
                    "discount_rate":  round(discount_rate * 100, 1),
                },
            })
    return results
