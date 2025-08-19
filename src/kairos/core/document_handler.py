from abc import ABC, abstractmethod
from docx import Document
from kairos.core.kairos_assistant import KairosAssistant
import os
from datetime import datetime
from pathlib import Path
import pandas as pd
from dateutil import parser as dateparser
import re
import csv



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
     elif self.extension in ('csv', 'xlsx', 'xls'):
       return CsvExcelDocumentReader(self.file_path)

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


class CsvExcelDocumentReader(BaseReader):
    COLUMN_MAP = {
        "date": ["date", "transaction date", "posted date", "date opération", "date d'opération"],
        "description": ["description", "details", "memo", "libellé", "libelle"],
        "amount": ["amount", "montant", "debit", "debit amount", "crédit", "credit", "credit amount", "transaction amount"],
        "balance": ["balance", "solde", "running balance"]
    }

    def __init__(self, file_path: str, role: str = "user"):
        super().__init__(file_path)
        self.role = role

    def normalize_column(self, column: str) -> str:
        c = column.strip().lower()
        for key, variations in self.COLUMN_MAP.items():
            if c in variations:
                return key
        # heuristiques légères
        if re.search(r"balance|solde", c): return "balance"
        if re.search(r"amount|montant|debit|cr[ée]dit", c): return "amount"
        if re.search(r"\bdate\b", c): return "date"
        if re.search(r"desc|libell[ée]|memo|details", c): return "description"
        return c

    def _clean_amount(self, x):
        if pd.isna(x):
            return None
        s = str(x).strip().replace(",", ".")
        s = re.sub(r"[^\d\.\-\(\)]", "", s)
        if s.startswith("(") and s.endswith(")"):
            s = "-" + s[1:-1]
        try:
            return float(s)
        except:
            return None

    def _parse_date(self, x):
        if pd.isna(x):
            return None
        try:
            return dateparser.parse(str(x), dayfirst=False)
        except:
            return None

    def _detect_csv_settings(self, path: str):
    # Détecte séparateur et numéro de ligne du vrai header
     candidates = [",", ";", "\t", "|"]
     header_tokens = ("date", "transaction", "description", "amount", "debit", "credit", "balance")
     sample_lines = []
     # on lit un petit échantillon en tolérant les caractères bizarres
     with open(path, "r", encoding="utf-8-sig", errors="replace", newline="") as f:
        for i, line in enumerate(f):
            sample_lines.append(line.rstrip("\n"))
            if i >= 200:  # suffisant pour trouver le header
                break

     sample = "\n".join(sample_lines)
     # détecter le séparateur en comptant les occurrences
     delim_counts = {d: sample.count(d) for d in candidates}
     delim = max(delim_counts, key=delim_counts.get) or ","

     # trouver la ligne du header
     header_row = 0
     for idx, line in enumerate(sample_lines[:50]):
        low = line.lower()
        if any(tok in low for tok in header_tokens):
            header_row = idx
            break
     return delim, header_row

    def _read_any(self) -> pd.DataFrame:
     if self.extension in ("xlsx", "xls"):
        return pd.read_excel(self.file_path, engine="openpyxl")

     delim, header_row = self._detect_csv_settings(self.file_path)

     # tentative 1 : standard, tolérante
     try:
        return pd.read_csv(
            self.file_path,
            sep=delim,
            engine="python",
            skiprows=header_row,   # on saute ce qu’il y a avant le VRAI header
            encoding="utf-8-sig",
            quotechar='"',
            doublequote=True,
            escapechar="\\",
            skipinitialspace=True,
            on_bad_lines="warn"    # ne plante pas si une ligne est foireuse
        )
     except pd.errors.ParserError:
        # tentative 2 : encoding fallback
        try:
            return pd.read_csv(
                self.file_path,
                sep=delim,
                engine="python",
                skiprows=header_row,
                encoding="latin-1",
                quotechar='"',
                doublequote=True,
                escapechar="\\",
                skipinitialspace=True,
                on_bad_lines="skip"
            )
        except pd.errors.ParserError:
            # tentative 3 : ignorer complètement la sémantique des guillemets
            return pd.read_csv(
                self.file_path,
                sep=delim,
                engine="python",
                skiprows=header_row,
                encoding="utf-8-sig",
                quoting=csv.QUOTE_NONE,  # traite les " comme du texte brut
                escapechar="\\",
                skipinitialspace=True,
                on_bad_lines="skip"
            )


    def _compute_missing_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Essaie d'inférer amount/description/balance s'ils manquent."""
        # amount via colonnes debit/credit (withdrawal/deposit)
        if "amount" not in df.columns:
            debit_cols  = [c for c in df.columns if re.search(r"(debit|withdrawal)", c, re.I)]
            credit_cols = [c for c in df.columns if re.search(r"(credit|deposit)", c, re.I)]
            if debit_cols and credit_cols:
                dcol, ccol = debit_cols[0], credit_cols[0]
                df["_debit_raw"]  = df[dcol].map(self._clean_amount)
                df["_credit_raw"] = df[ccol].map(self._clean_amount)
                df["amount"] = df["_credit_raw"].fillna(0) - df["_debit_raw"].fillna(0)

        # description fallback: première/combinaison de colonnes texte
        if "description" not in df.columns:
            text_cols = [c for c in df.columns
                         if df[c].dtype == "object" and c not in ("date", "balance")]
            if text_cols:
                if len(text_cols) == 1:
                    df["description"] = df[text_cols[0]].astype(str)
                else:
                    df["description"] = df[text_cols].astype(str).agg(" - ".join, axis=1)

        # balance via balance-like colonnes
        if "balance" not in df.columns:
            bal_cand = [c for c in df.columns if re.search(r"balance", c, re.I)]
            if bal_cand:
                df["balance"] = df[bal_cand[0]].map(self._clean_amount)

        return df

    def read(self) -> str:

        # 1) lecture
        df = self._read_any()

        # 2) normalisation des colonnes (ajoute des synonymes fréquents)
        df.columns = [self.normalize_column(c) for c in df.columns]
        # ajuste quelques alias courants après normalisation
        rename_map = {}
        for c in list(df.columns):
            cl = c.lower()
            if cl in ("value date", "booking date", "posted date"): rename_map[c] = "date"
            if cl in ("transaction details", "narration", "merchant"): rename_map[c] = "description"
            if cl in ("withdrawal amt", "debit amt", "withdrawal amount", "debit amount"): rename_map[c] = "debit"
            if cl in ("deposit amt", "credit amt", "deposit amount", "credit amount"): rename_map[c] = "credit"
            if cl in ("balance amt", "closing balance", "available balance", "running balance"): rename_map[c] = "balance"
        if rename_map:
            df = df.rename(columns=rename_map)

        # 3) nettoyage des colonnes normalisées connues
        if "date" in df.columns:
            df["date"] = df["date"].map(self._parse_date)
        if "amount" in df.columns:
            df["amount"] = df["amount"].map(self._clean_amount)
        # compute missing fields (amount/description/balance) si besoin
        df = self._compute_missing_fields(df)

        # 4) ordonner (place les colonnes clés devant si elles existent)
        ordered = [c for c in ["date", "description", "amount", "balance"] if c in df.columns]
        df = df[ordered + [c for c in df.columns if c not in ordered]]

        # 5) si dataframe vide → message explicite
        if df.empty:
            return "No rows parsed from the sheet."

        # 6) conversion en texte — garantit du contenu non vide
        lines = []
        for _, row in df.iterrows():
            d = row.get("date", "")
            date_str = d.date().isoformat() if pd.notna(d) and hasattr(d, "date") else (str(d) if pd.notna(d) else "")
            desc = "" if pd.isna(row.get("description", "")) else str(row.get("description", ""))
            amt = row.get("amount", "")
            bal = row.get("balance", "")

            parts = [date_str or "" , desc or ""]
            parts.append("" if (pd.isna(amt) or amt is None) else str(amt))
            if "balance" in df.columns:
                parts.append("" if (pd.isna(bal) or bal is None) else str(bal))

            # si toujours vide, concatène toute la ligne brute pour éviter une chaîne vide
            line = " | ".join(parts).strip()
            if not line or line == "||" or line.replace("|","").strip()=="":
                line = " | ".join([str(row.get(c, "")) for c in df.columns if pd.notna(row.get(c, ""))])

            if line.strip():
                lines.append(line)

        # si malgré tout on n’a rien, renvoie au moins l’aperçu du head()
        if not lines:
            preview = df.head(10).to_csv(index=False)
            return f"TABLE PREVIEW:\n{preview}"

        return "\n".join(lines)



