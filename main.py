

from core.kairos_assistant import KairosAssistant
          


def main():
    assistant = KairosAssistant()
    
    print("🌟 Welcome, I'm Kairos — your personal AI assistant 🌟")

    while True:
        print("\nWhat would you like to do?")
        print("1. Ask a question to GPT")
        print("2. Summarize a text")
        print("3. Exit")

        choice = input("Select an option (1-3): ")

        if choice == "1":
            question = input("\nWhat is your question?\n> ")
            answer = assistant.ask("Answer the following question:", question)
            print(f"\n🧠 GPT-4 says:\n{answer}")

        elif choice == "2":
            text = input("\nEnter the text to summarize:\n> ")
            summary = assistant.summarize_text(text)
            print(f"\n📄 Summary:\n{summary}")

        elif choice == "3":
            print("\n👋 Goodbye!")
            break

        else:
            print("❌ Invalid choice. Please enter 1, 2 or 3.")

if __name__ == "__main__":
    main()
