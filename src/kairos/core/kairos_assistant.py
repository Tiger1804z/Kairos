from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / '.env')

from openai import OpenAI
import os

from datetime import datetime
from kairos.core import search_engine



class KairosAssistant:
     def __init__(self, api_key: str = None):
        if not api_key:
            api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Missing OpenAI API key.")
        self.client = OpenAI(api_key=api_key)

     def generate_response(self, prompt: str) -> str:
      current_date = datetime.now().strftime("%B %d, %Y")  # Ex: July 25, 2025
      response = self.client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": f"You are GPT-4o and the current date is {current_date}."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
      return response.choices[0].message.content
    
     def summarize_text(self, text: str) -> str:
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": f"Please summarize the following text: {text}"
                }
            ]
        )
        return response.choices[0].message.content

     def ask_with_web_context(self,user_prompt:str) -> str:
        """first step web search"""
        search_results = search_engine.search_web(user_prompt)

        """second step :set actual date"""
        current_date = datetime.now().strftime("%B %d, %Y")
        
        """ third step : create enrich prompt"""
        system_prompt = (
            f"You are GPT-4o, the current date is {current_date}. "
            f"Here are the latest search results related to the user's question:\n\n{search_results}\n\n"
            "Based on these, provide the most accurate, helpful and up-to-date answer."
           
        )
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )

        return response.choices[0].message.content

                


         