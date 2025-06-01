import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load API key from .env (ensure this is configured)
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Available Gemini Models:")
for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(f"- {m.name} (Display Name: {m.display_name})")
