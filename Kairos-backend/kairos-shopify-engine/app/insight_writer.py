"""
Insight Writer — Hybrid layer between detection and storage.

Flow:
  raw_facts (from insight_engine.py)
    → _build_prompt(facts)
    → OpenAI → { title, message, action }
    → fallback if LLM fails → _fallback(facts)
    → returns final enriched insight dict
"""

import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

_SYSTEM_PROMPT = """\
You are Kairos, a profit intelligence copilot for Shopify store owners.
Your job is to write short, direct, premium business insights.

Rules:
- title: max 10 words, strong and specific (mention the product name)
- message: max 25 words, include the key metric, no jargon
- action: exactly 1 sentence, decision-oriented, concrete (start with a verb)
- Language: English
- Tone: direct, premium, no fluff

Respond with valid JSON only:
{"title": "...", "message": "...", "action": "..."}
"""


def write_insight(raw_facts: dict) -> dict:
    """
    Takes raw_facts produced by insight_engine.py.
    Returns the full enriched insight dict ready for storage.
    """
    try:
        prompt = _build_prompt(raw_facts)
        response = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.4,
            max_tokens=150,
        )
        raw = response.choices[0].message.content or ""
        parsed = json.loads(raw)
        title   = str(parsed.get("title",   "")).strip()
        message = str(parsed.get("message", "")).strip()
        action  = str(parsed.get("action",  "")).strip()

        if not title or not message or not action:
            raise ValueError("Incomplete LLM response")

    except Exception:
        title, message, action = _fallback(raw_facts)

    return {
        "type":        raw_facts["type"],
        "product_id":  raw_facts["product_id"],
        "severity":    raw_facts["severity"],
        "value":       raw_facts["value"],
        "title":       title,
        "description": message,
        "action":      action,
    }


# -----------------------------------------------------------------------------
# Prompt builder — one prompt format per insight type
# -----------------------------------------------------------------------------

def _build_prompt(f: dict) -> str:
    t    = f["type"]
    name = f["product_name"]
    d    = f["facts"]

    if t == "true_top_product":
        return (
            f"Product: {name}\n"
            f"Situation: highest real profit this period\n"
            f"Gross profit: ${d['gross_profit']} | Margin: {d['gross_margin_pct']}% | Units sold: {d['units_sold']}\n"
            f"Write an insight celebrating this product and recommending to scale it."
        )

    if t == "negative_margin_alert":
        return (
            f"Product: {name}\n"
            f"Situation: negative gross margin — losing money on every sale\n"
            f"Margin: {d['margin_percent']}% | Loss per unit: ${d['loss_per_unit']} | "
            f"Total loss: ${d['total_loss']} | Units sold: {d['units_sold']}\n"
            f"Write a critical insight urging immediate action."
        )

    if t == "low_margin_warning":
        return (
            f"Product: {name}\n"
            f"Situation: low gross margin, below {d['threshold']}% threshold\n"
            f"Margin: {d['margin_percent']}% | Gross profit: ${d['gross_profit']} | Units sold: {d['units_sold']}\n"
            f"Write a warning insight recommending margin improvement."
        )

    if t == "missing_cost_alert":
        return (
            f"Product: {name}\n"
            f"Situation: sold with no cost entered — real profit unknown\n"
            f"Units sold: {d['units_sold']} | Revenue: ${d['revenue']}\n"
            f"Write a warning insight urging the merchant to enter a cost."
        )

    if t == "refund_impact":
        return (
            f"Product: {name}\n"
            f"Situation: high refund rate impacting margin\n"
            f"Refunds: ${d['total_refund']} on ${d['revenue']} revenue ({d['refund_rate']}% refund rate)\n"
            f"Write a warning insight recommending investigation of return causes."
        )

    if t == "discount_erosion":
        return (
            f"Product: {name}\n"
            f"Situation: heavy discounting eroding catalogue revenue\n"
            f"Discounts: ${d['total_discount']} on ${d['catalogue_rev']} catalogue revenue ({d['discount_rate']}% erosion)\n"
            f"Write an insight recommending a review of the discount strategy."
        )

    # Generic fallback prompt for unknown types
    return (
        f"Product: {name}\n"
        f"Situation: {t}\n"
        f"Data: {json.dumps(d)}\n"
        f"Write a short business insight with a clear recommended action."
    )


# -----------------------------------------------------------------------------
# Fallback templates — activated when LLM is unavailable
# -----------------------------------------------------------------------------

def _fallback(f: dict) -> tuple[str, str, str]:
    t    = f["type"]
    name = f["product_name"]
    d    = f["facts"]

    if t == "true_top_product":
        return (
            f"{name} is your most profitable product",
            f"It generates ${d['gross_profit']} gross profit at a {d['gross_margin_pct']}% margin.",
            "Scale this product — increase ad spend or expand its variants.",
        )

    if t == "negative_margin_alert":
        return (
            f"You're losing money on every sale of {name}",
            f"Margin is {d['margin_percent']}% — a loss of ${d['loss_per_unit']} per unit, ${d['total_loss']} total.",
            "Increase the price or pause this product immediately.",
        )

    if t == "low_margin_warning":
        return (
            f"{name} has a dangerously low margin",
            f"At {d['margin_percent']}%, you're below the {d['threshold']}% minimum viable threshold.",
            "Review your pricing or negotiate better supplier costs.",
        )

    if t == "missing_cost_alert":
        return (
            f"Real profit unknown for {name}",
            f"{d['units_sold']} units sold for ${d['revenue']} revenue, but no cost is recorded.",
            "Add a product cost to unlock real profit data.",
        )

    if t == "refund_impact":
        return (
            f"High refund rate on {name}",
            f"${d['total_refund']} refunded out of ${d['revenue']} revenue ({d['refund_rate']}%).",
            "Investigate return causes and reduce refund risk.",
        )

    if t == "discount_erosion":
        return (
            f"Discounts are eroding {name}'s margin",
            f"${d['total_discount']} lost to discounts — {d['discount_rate']}% of catalogue revenue.",
            "Review your discount strategy for this product.",
        )

    return (
        f"Insight on {name}",
        f"Type: {t}.",
        "Review this product's performance.",
    )
