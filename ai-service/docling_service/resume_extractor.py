import os
import tempfile
from pathlib import Path

from docling.document_converter import DocumentConverter

from .config import REQUIRED_RESUME_FIELDS
from .json_completion import request_json


converter = DocumentConverter()


def extract_resume_data(markdown: str) -> dict:
    prompt = f'''You are a resume parsing engine. Extract ONLY factual information from the resume below.
Do not evaluate, score, rank, or recommend the candidate.

RESUME EXTRACTED BY DOCLING:
{markdown}

Return ONLY valid JSON with exactly this shape:
{{
  "candidateName": "",
  "email": "",
  "phone": "",
  "technicalSkills": [],
  "softSkills": [],
  "experience": [],
  "education": [],
  "projects": [],
  "certifications": []
}}

Use empty strings or arrays when information is unavailable.'''

    resume = request_json(prompt)
    missing_fields = [field for field in REQUIRED_RESUME_FIELDS if field not in resume]
    if missing_fields:
        raise ValueError(f'Champs CV manquants : {", ".join(missing_fields)}')

    return resume


def convert_pdf(uploaded_file: object) -> dict:
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temporary_file:
            uploaded_file.save(temporary_file)
            temporary_path = temporary_file.name

        result = converter.convert(temporary_path)
        document = result.document
        markdown = document.export_to_markdown()

        return {
            'markdown': markdown,
            'document': document.export_to_dict(),
            'resume': extract_resume_data(markdown),
        }
    finally:
        if temporary_path:
            try:
                os.unlink(temporary_path)
            except OSError:
                pass


def validate_pdf_filename(filename: str) -> bool:
    return bool(filename) and Path(filename).suffix.lower() == '.pdf'
