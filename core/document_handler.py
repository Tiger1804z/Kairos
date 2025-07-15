from abc import ABC, abstractmethod
from docx import Document

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

print("✅ document_handler loaded")
