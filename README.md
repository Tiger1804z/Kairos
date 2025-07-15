# Kairos AI Assistant

Kairos is a Python-based assistant capable of processing `.docx` and `.pdf` documents, using the OpenAI API to analyze, summarize, or transform content. It supports `.env` configuration and runs locally via command line.

---

## 🚀 Features

- 🧠 Uses OpenAI's GPT models for advanced text processing
- 📄 Reads `.docx` files using `python-docx`
- 📚 Parses `.pdf` files using `PyMuPDF` (fitz)
- 🔐 Secure API key loading via `.env` file
- 💡 Easily extensible for different types of document analysis

---

## 🧰 Technologies

- `openai`
- `python-dotenv`
- `python-docx`
- `PyMuPDF` (`fitz`)

---

## 📦 Installation

1. Clone the project or download the code.
2. Create a virtual environment (optional but recommended):

```bash
python -m venv .venv
.\.venv\Scripts\activate
