from shared.shared_models import FileAnalysis, FileContext
from shared.config import (
    HIGH_COMPLEXITY_THRESHOLD,
    TOP_N_FILES
)

def _grade_is_high(grade: str) -> bool:
    """A-F scale, C or worse counts as high complexity."""
    return grade >= HIGH_COMPLEXITY_THRESHOLD

def apply_priority_rule(file_analysis: FileAnalysis) -> tuple[bool, float]:
    """Flag files based on complexity alone."""
    flagged = _grade_is_high(file_analysis.complexity_grade)

    # Priority score: just use the raw complexity score, capped at 100
    priority_score = min(file_analysis.complexity_score, 100.0)

    return flagged, priority_score

def compute_priority(analyzed_files: list[FileAnalysis], repo_path: str) -> list[FileContext]:
    """Context Agent entry point - called by orchestrator."""
    contextualized = []

    for file_analysis in analyzed_files:
        flagged, priority_score = apply_priority_rule(file_analysis)

        contextualized.append(FileContext(
            **file_analysis.model_dump(),
            priority_flag=flagged,
            priority_score=priority_score
        ))

    flagged_only = [f for f in contextualized if f.priority_flag]
    flagged_only.sort(key=lambda f: f.priority_score, reverse=True)
    return flagged_only[:TOP_N_FILES]