import os
from dotenv import load_dotenv  # 👈 ajoute ça

# Charge les variables depuis le fichier .env
load_dotenv()

# Tu peux maintenant accéder à la clé comme ça :
openai_api_key = os.getenv("OPENAI_API_KEY")

from kairos.core.kairos_assistant import KairosAssistant
from kairos.core import document_handler as dh

def main():
    assistant = KairosAssistant(api_key=openai_api_key)  # 👈 passe-la ici si ton assistant en a besoin

    print("🌟 Welcome, I'm Kairos — your personal AI assistant 🌟")

    while True:
        print("\nWhat would you like to do?")
        print("1. Ask a question to GPT")
        print("2. Summarize a text")
        print("3. Read a document")
        print("4. Exit")

        choice = input("Select an option (1-4): ")

        if choice == "1":
            question = input("\nWhat is your question?\n> ")
            answer = assistant.ask("Answer the following question:", question)
            print(f"\n🧠 GPT-4 says:\n{answer}")

        elif choice == "2":
            text = input("\nEnter the text to summarize:\n> ")
            summary = assistant.summarize_text(text)
            print(f"\n📄 Summary:\n{summary}")

        elif choice == "3":
            file_path = input("Enter the path to the document:\n> ").strip().strip('"')
            try:
                reader = dh.FileReader(file_path)
                content = reader.read()
                print(f"\n📄 Document content:\n{content}")
            except Exception as e:
                print(f"❌ Error reading file: {e}")

        elif choice == "4":
            print("\n👋 Goodbye!")
            break

        else:
            print("❌ Invalid choice. Please enter 1, 2, 3 or 4.")

if __name__ == "__main__":
    main()
