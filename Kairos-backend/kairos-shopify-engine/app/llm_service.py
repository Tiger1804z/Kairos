import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_llm(context: str, question: str) -> str:
    system_prompt = (
        "Tu es Kairos, un copilot de rentabilité pour boutiques Shopify. "
        "Tu analyses les données de profit réel par produit. "
        "Tu réponds uniquement à partir des données fournies, en français, "
        "sans markdown, sans puces *, sans inventer de chiffres. "
        "Maximum 3 courts paragraphes."
    )

    user_message = (
        f"{context}\n"
        f"=== QUESTION ===\n"
        f"{question}"
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content or "Aucune réponse générée."