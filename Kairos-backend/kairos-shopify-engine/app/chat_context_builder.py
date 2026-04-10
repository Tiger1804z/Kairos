from app.models import ChatRequest


def build_context(req: ChatRequest) -> str:
    lines= []
    
    lines.append(f"=== DONNÉES DE PROFITABILITÉ (business_id: {req.business_id}) ===\n")
    
    
    for snap in req.snapshots:
        margin = f"{snap.gross_margin_pct:.1f}%" 
        profit = f"{snap.gross_profit:.2f}$"
        revenue = f"{snap.revenue:.2f}$"
        status = "aucun coût saisi" if not snap.has_cost else f"marge {margin}"
        
        lines.append(f"Produit: {snap.product_name}")
        lines.append(f"  - Revenue: {revenue} | Profit brut: {profit} | Marge: {margin} |  Unités vendues: {snap.units_sold} ")  
        lines.append(f"  - Statut cout: {status}")
        lines.append("")
        
    if req.insights:
        lines.append("=== ALERTES ET INSIGHTS ===\n")
        for insight in req.insights:
            severity_label = {
                "critical": "CRITIQUE",
                "warning": "ATTENTION",
                "info": "INFO",
            }.get(insight.severity, insight.severity.upper())
            
            lines.append(f"[{severity_label}] {insight.title}")
            lines.append(f"   {insight.description}")
            lines.append("")
            
    return "\n".join(lines)  
        