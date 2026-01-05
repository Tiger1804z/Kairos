from __future__ import annotations 

FINANCE_KEYWORDS = {
    "strong": [
        "invoice", "facture", "tps", "tvq", "gst", "hst", "qst",
        "payment", "paiement", "total", "subtotal", "balance",
        "debit", "credit", "débit", "crédit", "account", "compte",
        "revenue", "revenu", "expense", "dépense", "depense", "profit", "bénéfice", "benefice",
    ],
    "medium": [
        "date", "amount", "montant", "quantity", "quantité",
        "price", "prix", "tax", "taxe", "discount", "rabais",
        "category", "catégorie", "categorie",
    ],
}

def detect_finance_like(text: str) -> tuple[bool, float,list[str]]:
    t =(text or "").lower()
    strong_hits =[kw for kw in FINANCE_KEYWORDS["strong"] if kw in t]
    medium_hits =[kw for kw in FINANCE_KEYWORDS["medium"] if kw in t]
    
    score = len(strong_hits) * 3+ len(medium_hits) *1
    confidence = min(score / 10.0, 1.0)
    
    is_finance = confidence >= 0.3
    detected = (strong_hits[:3] + medium_hits[:2])[:5]
    
    return is_finance, round(confidence, 2), detected