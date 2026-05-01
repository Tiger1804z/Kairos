"""
Insight Writer — Hybrid layer between detection and storage.

Flow:
  raw_facts (from insight_engine.py)
    -> _build_prompt(facts)
    -> OpenAI -> { title, message, action, next_step }
    -> fallback if LLM fails -> _fallback(facts)
    -> returns final enriched insight dict
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
- message: max 25 words, include the key metric AND a dollar impact (e.g. "losing ~$X/month")
- action: exactly 1 sentence, decision-oriented, concrete (start with a verb)
- next_step: exactly 1 sentence, what to do AFTER the action (the follow-up within 7 days)
- Language: English
- Tone: direct, premium, no fluff

Respond with valid JSON only:
{"title": "...", "message": "...", "action": "...", "next_step": "..."}
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
            max_tokens=180,
        )
        raw = response.choices[0].message.content or ""
        parsed = json.loads(raw)
        title     = str(parsed.get("title",     "")).strip()
        message   = str(parsed.get("message",   "")).strip()
        action    = str(parsed.get("action",    "")).strip()
        next_step = str(parsed.get("next_step", "")).strip()

        if not title or not message or not action:
            raise ValueError("Incomplete LLM response")

    except Exception:
        title, message, action, next_step = _fallback(raw_facts)

    return {
        "type":        raw_facts["type"],
        "product_id":  raw_facts["product_id"],
        "severity":    raw_facts["severity"],
        "value":       raw_facts["value"],
        "title":       title,
        "description": message,
        "action":      action,
        "next_step":   next_step,
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
            f"Write an insight celebrating this product, quantifying the monthly revenue opportunity, and recommending to scale it with a concrete next step."
        )

    if t == "negative_margin_alert":
        return (
            f"Product: {name}\n"
            f"Situation: negative gross margin — losing money on every sale\n"
            f"Margin: {d['margin_percent']}% | Loss per unit: ${d['loss_per_unit']} | "
            f"Total loss this period: ${d['total_loss']} | Units sold: {d['units_sold']}\n"
            f"Write a critical insight with the dollar impact and a next step after pausing (e.g. reprice or find replacement product)."
        )

    if t == "low_margin_warning":
        return (
            f"Product: {name}\n"
            f"Situation: low gross margin, below {d['threshold']}% threshold\n"
            f"Margin: {d['margin_percent']}% | Gross profit: ${d['gross_profit']} | Units sold: {d['units_sold']}\n"
            f"Write a warning insight with the dollar profit at stake and a next step after improving margin (e.g. verify price change impact after 7 days)."
        )

    if t == "missing_cost_alert":
        return (
            f"Product: {name}\n"
            f"Situation: sold with no cost entered — real profit unknown\n"
            f"Units sold: {d['units_sold']} | Revenue: ${d['revenue']}\n"
            f"Write a warning insight showing how much revenue is unanalyzed and a next step after adding the cost (e.g. re-run profitability analysis)."
        )

    if t == "refund_impact":
        return (
            f"Product: {name}\n"
            f"Situation: high refund rate impacting margin\n"
            f"Refunds: ${d['total_refund']} on ${d['revenue']} revenue ({d['refund_rate']}% refund rate)\n"
            f"Write a warning insight with the dollar loss from refunds and a next step after investigating (e.g. check product reviews or supplier quality)."
        )

    if t == "discount_erosion":
        return (
            f"Product: {name}\n"
            f"Situation: heavy discounting eroding catalogue revenue\n"
            f"Discounts: ${d['total_discount']} on ${d['catalogue_rev']} catalogue revenue ({d['discount_rate']}% erosion)\n"
            f"Write an insight with the dollar impact of discounts and a next step after reviewing the strategy (e.g. test removing discounts for 14 days)."
        )

    # Generic fallback prompt for unknown types
    return (
        f"Product: {name}\n"
        f"Situation: {t}\n"
        f"Data: {json.dumps(d)}\n"
        f"Write a short business insight with a dollar impact, a clear recommended action, and a concrete next step."
    )


# -----------------------------------------------------------------------------
# Fallback templates — activated when LLM is unavailable
# -----------------------------------------------------------------------------

def _fallback(f: dict) -> tuple[str, str, str, str]:
    t    = f["type"]
    name = f["product_name"]
    d    = f["facts"]

    if t == "true_top_product":
        return (
            f"{name} is your most profitable product",
            f"It generates ${d['gross_profit']} gross profit at a {d['gross_margin_pct']}% margin.",
            "Scale this product — increase ad spend or expand its variants.",
            "Track weekly units sold to confirm the scaling trend holds.",
        )

    if t == "negative_margin_alert":
        return (
            f"You're losing money on every sale of {name}",
            f"Margin is {d['margin_percent']}% — a loss of ${d['loss_per_unit']} per unit, ${d['total_loss']} total.",
            "Pause or remove this product immediately.",
            "Replace it with your highest-margin product or reprice before relisting.",
        )

    if t == "low_margin_warning":
        return (
            f"{name} has a dangerously low margin",
            f"At {d['margin_percent']}%, you're below the {d['threshold']}% minimum viable threshold.",
            "Raise the price or renegotiate supplier costs.",
            "Check sales volume after 7 days to confirm the price increase didn't kill demand.",
        )

    if t == "missing_cost_alert":
        return (
            f"Real profit unknown for {name}",
            f"{d['units_sold']} units sold for ${d['revenue']} revenue, but no cost is recorded.",
            "Add a product cost to unlock real profit data.",
            "Once cost is entered, re-run profitability analysis to confirm margin is viable.",
        )

    if t == "refund_impact":
        return (
            f"High refund rate on {name}",
            f"${d['total_refund']} refunded out of ${d['revenue']} revenue ({d['refund_rate']}%).",
            "Investigate return causes — check reviews and contact recent refund customers.",
            "If quality is the issue, pause the product and negotiate with your supplier.",
        )

    if t == "discount_erosion":
        return (
            f"Discounts are eroding {name}'s margin",
            f"${d['total_discount']} lost to discounts — {d['discount_rate']}% of catalogue revenue.",
            "Review and reduce your discount strategy for this product.",
            "Test removing discounts for 14 days and compare conversion rate.",
        )

    return (
        f"Insight on {name}",
        f"Type: {t}.",
        "Review this product's performance.",
        "Follow up in 7 days after taking action.",
    )
