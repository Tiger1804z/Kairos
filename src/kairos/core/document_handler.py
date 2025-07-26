from abc import ABC, abstractmethod
from docx import Document
from kairos.core.kairos_assistant import KairosAssistant
import os
from datetime import datetime
from pathlib import Path

import fitz

class BaseReader(ABC):
    def __init__(self , file_path: str):
        if not file_path:
            raise ValueError("File path cannot be empty.")
        self.file_path = file_path
        self.extension = file_path.split('.')[-1].lower()

    @abstractmethod
    def read(self):
        raise NotImplementedError("Subclasses should implement this method.")

class PDFDocumentReader(BaseReader):
    def __init__(self, file_path: str, role: str = "user"):
        super().__init__(file_path)
        self.role = role

    def read(self):
        texte = ""
        with fitz.open(self.file_path) as doc:
            for page in doc:
                texte += page.get_text()
        return texte


class WordDocumentReader(BaseReader):
    def __init__(self, file_path: str , role: str = "user"):
        super().__init__(file_path)
        self.role = role

    def read(self):
        doc = Document(self.file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    
class TextDocumentReader(BaseReader):
    def __init__(self, file_path: str, role: str = "user"):
        super().__init__(file_path)
        self.role = role

    def read(self):
        with open(self.file_path, 'r', encoding='utf-8') as f:
            return f.read()
        
class FileReader:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.extension = file_path.split('.')[-1].lower()
        self.reader = self._get_reader()

    def _get_reader(self):
     if self.extension == 'pdf':
        return PDFDocumentReader(self.file_path)
     elif self.extension == 'docx':
        return WordDocumentReader(self.file_path)  # <- ICI
     elif self.extension == 'txt':
        return TextDocumentReader(self.file_path)
     else:
        raise ValueError("Unsupported file format. Use .txt, .pdf, or .docx")

    def read(self):
        return self.reader.read()


class DocumentSummarizer:
    def __init__(self,  file_path: str):
        self.file_reader = FileReader(file_path)
        self.content = self.file_reader.read()
        self.file_path = file_path
    
    def summarize_doc(self) -> str:
        assistant = KairosAssistant()
        summary = assistant.summarize_text(self.content)
        return summary
    def save_summary_to_file(self, summary: str):
        # 1. Create base directory
        base_dir = Path("KairosSummarySaves")
        base_dir.mkdir(exist_ok=True)

        # 2. Get file extension (without .)
        extension = self.file_path.split('.')[-1].lower()
        ext_folder = base_dir / extension
        ext_folder.mkdir(exist_ok=True)

        # 3. Generate summary filename
        original_name = Path(self.file_path).stem
        date_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"{original_name}__summary__{date_str}.txt"
        full_path = ext_folder / filename

        # 4. Write summary to file
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(f"🗓️ Summary generated on {date_str}\n\n")
            f.write(summary)

        print(f"✅ Summary saved to: {full_path.resolve()}")
        try:
          os.startfile(full_path)
        except Exception as e:
         print(f"⚠️ Unable to open file automatically: {e}")
