from app.models import ChatRequest, SnapshotInput


def _priority_key(s: SnapshotInput) -> tuple:
    """
    Trie les produits par ordre de priorité décisionnelle :
    1. Marge négative (perte directe) — le plus urgent
    2. Marge faible 0-15% — risque
    3. Coût manquant — marge inconnue
    4. Marge saine — OK
    """
    if s.has_cost and s.gross_margin_pct < 0:
        return (0, s.gross_margin_pct)        # plus négatif = plus urgent
    elif s.has_cost and s.gross_margin_pct < 15:
        return (1, s.gross_margin_pct)        # marge risquée
    elif not s.has_cost:
        return (2, 0)                          # donnée manquante
    else:
        return (3, -s.gross_margin_pct)        # sain : plus rentable en premier


def _profit_per_unit(s: SnapshotInput) -> float | None:
    if s.units_sold > 0:
        return round(s.gross_profit / s.units_sold, 2)
    return None


def build_context(req: ChatRequest) -> str:
    lines = []

    # --- Signaux prioritaires (pré-calculés pour guider le LLM) ---
    problems = [s for s in req.snapshots if s.has_cost and s.gross_margin_pct < 0]
    risky = [s for s in req.snapshots if s.has_cost and 0 <= s.gross_margin_pct < 15]
    missing_cost = [s for s in req.snapshots if not s.has_cost]
    healthy = [s for s in req.snapshots if s.has_cost and s.gross_margin_pct >= 15]

    high_refund = [i for i in req.insights if "remboursement" in i.title.lower() or "refund" in i.type.lower()]

    lines.append("=== SIGNAUX PRIORITAIRES ===")
    if problems:
        names = ", ".join(f"{s.product_name} ({s.gross_margin_pct:.1f}%)" for s in problems)
        lines.append(f"MARGE NEGATIVE ({len(problems)} produit(s)) : {names}")
    if high_refund:
        lines.append(f"REMBOURSEMENTS ELEVES : {len(high_refund)} alerte(s) détectée(s)")
    if missing_cost:
        names = ", ".join(s.product_name for s in missing_cost)
        lines.append(f"COUT MANQUANT ({len(missing_cost)} produit(s)) : {names} — marge non fiable")
    if risky:
        names = ", ".join(f"{s.product_name} ({s.gross_margin_pct:.1f}%)" for s in risky)
        lines.append(f"MARGE FAIBLE ({len(risky)} produit(s)) : {names}")
    if healthy:
        best = max(healthy, key=lambda s: s.gross_profit)
        lines.append(f"PRODUIT LE PLUS RENTABLE : {best.product_name} ({best.gross_margin_pct:.1f}%, profit {best.gross_profit:.0f}$)")
    lines.append("")

    # --- Données produits triées par priorité ---
    lines.append(f"=== DONNÉES PRODUITS (business_id: {req.business_id}) ===")

    sorted_snaps = sorted(req.snapshots, key=_priority_key)

    for snap in sorted_snaps:
        ppu = _profit_per_unit(snap)
        ppu_str = f"{ppu:+.2f}$ par unité" if ppu is not None else "inconnu"

        if not snap.has_cost:
            status = "COÛT NON SAISI — marge non calculable"
        elif snap.gross_margin_pct < 0:
            status = f"PERTE — marge {snap.gross_margin_pct:.1f}%"
        elif snap.gross_margin_pct < 15:
            status = f"RISQUE — marge {snap.gross_margin_pct:.1f}%"
        else:
            status = f"OK — marge {snap.gross_margin_pct:.1f}%"

        lines.append(f"Produit : {snap.product_name}")
        lines.append(f"  Statut : {status}")
        lines.append(f"  Revenue : {snap.revenue:.2f}$ | Profit brut : {snap.gross_profit:.2f}$ | Unités : {snap.units_sold} | Profit/unité : {ppu_str}")
        lines.append("")

    # --- Insights triés par sévérité ---
    if req.insights:
        lines.append("=== ALERTES ET INSIGHTS ===")
        severity_order = {"critical": 0, "warning": 1, "info": 2}
        sorted_insights = sorted(req.insights, key=lambda i: severity_order.get(i.severity, 9))

        for insight in sorted_insights:
            label = {"critical": "CRITIQUE", "warning": "ATTENTION", "info": "INFO"}.get(insight.severity, insight.severity.upper())
            lines.append(f"[{label}] {insight.title}")
            lines.append(f"   {insight.description}")
            lines.append("")

    return "\n".join(lines)
