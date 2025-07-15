
from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()

class KairosAssistant:
     def __init__(self, api_key: str = None):
        if not api_key:
            api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Missing OpenAI API key.")
        self.client = OpenAI(api_key=api_key)

     def generate_response(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        return response.choices[0].message.content
    
     def summarize_text(self, text: str) -> str:
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "user",
                    "content": f"Please summarize the following text: {text}"
                }
            ]
        )
        return response.choices[0].message.content

     def ask(self, instruction: str, content: str) -> str:
        prompt = f"{instruction}\n\n{content}"
        return self.generate_response(prompt)