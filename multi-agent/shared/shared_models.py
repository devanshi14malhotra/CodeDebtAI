from pydantic import BaseModel
from typing import Optional

class FileAnalysis(BaseModel):
    file_path: str
    complexity_score: float
    complexity_grade: str          # e.g. "A"-"F" from radon
    maintainability_index: float

class FileContext(FileAnalysis):
    priority_flag: bool
    priority_score: float          # complexity_score, capped at 100

class ReportItem(BaseModel):
    file_path: str
    priority_score: float
    complexity_grade: str
    reason: str                    # human-readable explanation

class ReportOutput(BaseModel):
    summary: str
    files: list[ReportItem]

class FixRequest(BaseModel):
    file_path: str
    issue_reason: str

class FixResponse(BaseModel):
    file_path: str
    original_code: str
    suggested_code: str
    diff: list[dict]               # line-by-line +/- structure for UI