from openai import OpenAI
import os
from dotenv import load_dotenv
from docx import Document
import fitz  # PyMuPDF

# === FONCTIONS UTILITAIRES ===
def lire_txt(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def lire_pdf(path):
    texte = ""
    with fitz.open(path) as doc:
        for page in doc:
            texte += page.get_text()
    return texte

def lire_docx(path):
    doc = Document(path)
    return "\n".join([para.text for para in doc.paragraphs])

def lire_fichier(path):
    extension = path.split('.')[-1].lower()
    if extension == 'txt':
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    elif extension == 'pdf':
        return lire_pdf(path)
    elif extension == 'docx':
        return lire_docx(path)
    else:
        print("❌ Format non supporté. Utilise un fichier .txt, .pdf ou .docx")
        exit()

# === CONFIGURATION ===
load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print("❌ Clé API manquante. Vérifie ton fichier .env")
    exit()

client = OpenAI(api_key=api_key)

# === DEMANDE DE FICHIER ===
fichier = input("Nom du fichier (.txt, .pdf, .docx) à résumer : ")

if not os.path.exists(fichier):
    print(f"❌ Le fichier '{fichier}' est introuvable.")
    exit()

texte = lire_fichier(fichier)

# === APPEL À L'API OPENAI ===
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Tu es un assistant qui résume les textes de manière claire et concise."},
        {"role": "user", "content": f"Résume ce texte : {texte}"}
    ],
    temperature=0.5
)

# === AFFICHAGE ===
print("\n📌 Résumé :\n")
print(response.choices[0].message.content)
