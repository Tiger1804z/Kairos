"""
Intent classifier for Kairos chat — Phase B observability.

Classifies a user question into one of the 4 intent families using
keyword matching. Returns (intent_family, routing_status).

intent_family : DÉCISION | SYNTHÈSE | FIABILITÉ | OPPORTUNITÉ | unknown
routing_status: clear | ambiguous | unknown
"""

INTENT_KEYWORDS: dict[str, list[str]] = {
    "DÉCISION": [
        "faut-il", "faut il", "dois-je", "doit-on", "devrais-je",
        "est-ce rentable", "est-il rentable", "vaut-il", "vaut il",
        "peut-on", "peut on", "est-ce que je dois",
        "arrêter", "arrête", "couper", "supprimer", "garder",
        "continuer", "relancer", "changer", "modifier",
        "augmenter le prix", "baisser le prix",
    ],
    "SYNTHÈSE": [
        "bilan", "résumé", "résume", "résumer",
        "état général", "état de", "aperçu",
        "top produit", "top 3", "les plus", "quels sont",
        "donne-moi", "donne moi", "montre-moi", "montre moi",
        "liste", "liste-moi", "global", "ensemble",
        "tous les produits", "mes produits",
    ],
    "FIABILITÉ": [
        "fiable", "fiabilité", "mes données", "les données",
        "manquant", "manque", "incomplet", "incomplète",
        "est-ce que mes", "est ce que mes",
        "peut-on se fier", "peut on se fier",
        "certitude", "incertain", "sûr", "confiance",
        "mes chiffres", "les chiffres",
    ],
    "OPPORTUNITÉ": [
        "améliorer", "optimiser", "amélioration", "optimisation",
        "opportunité", "croissance", "potentiel",
        "pousser", "développer", "exploiter", "levier",
        "où est-ce que", "où est ce que",
        "quoi améliorer", "comment améliorer",
        "gagner plus", "augmenter ma rentabilité", "rentabilité",
    ],
}


def classify_intent(question: str) -> tuple[str, str]:
    """
    Returns (intent_family, routing_status).

    routing_status:
      - "clear"     : exactement 1 famille détectée
      - "ambiguous" : 2+ familles avec le même score
      - "unknown"   : aucun mot-clé trouvé
    """
    q = question.lower()

    scores: dict[str, int] = {
        family: sum(1 for kw in keywords if kw in q)
        for family, keywords in INTENT_KEYWORDS.items()
    }

    max_score = max(scores.values())

    if max_score == 0:
        return "unknown", "unknown"

    top = [family for family, score in scores.items() if score == max_score]

    if len(top) > 1:
        return ",".join(top), "ambiguous"

    return top[0], "clear"
