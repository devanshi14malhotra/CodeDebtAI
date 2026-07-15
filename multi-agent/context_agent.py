import subprocess
from datetime import datetime, timedelta
from shared_models import FileAnalysis, FileContext
from config import (
    CHURN_LOOKBACK_MONTHS,
    HIGH_COMPLEXITY_THRESHOLD,
    HIGH_CHURN_THRESHOLD,
    UNTOUCHED_DAYS_THRESHOLD,
    TOP_N_FILES
)

def get_churn_count(repo_path: str, file_path: str) -> int:
    """Count commits touching this file in the lookback period."""
    since_date = (datetime.now() - timedelta(days=CHURN_LOOKBACK_MONTHS * 30)).strftime("%Y-%m-%d")
    relative_path = file_path.replace(repo_path + "/", "").replace(repo_path + "\\", "")

    result = subprocess.run(
        ["git", "-C", repo_path, "log", f"--since={since_date}", "--oneline", "--", relative_path],
        capture_output=True,
        text=True
    )
    lines = [l for l in result.stdout.splitlines() if l.strip()]
    return len(lines)

def get_last_touched_days(repo_path: str, file_path: str) -> int:
    """Days since the last commit that touched this file."""
    relative_path = file_path.replace(repo_path + "/", "").replace(repo_path + "\\", "")

    result = subprocess.run(
        ["git", "-C", repo_path, "log", "-1", "--format=%ct", "--", relative_path],
        capture_output=True,
        text=True
    )
    timestamp_str = result.stdout.strip()
    if not timestamp_str:
        return UNTOUCHED_DAYS_THRESHOLD + 1  # treat as untouched if no history found

    last_commit_time = datetime.fromtimestamp(int(timestamp_str))
    return (datetime.now() - last_commit_time).days

def _grade_is_high(grade: str) -> bool:
    """A-F scale, C or worse counts as high complexity."""
    return grade >= HIGH_COMPLEXITY_THRESHOLD

def apply_priority_rule(file_analysis: FileAnalysis, churn: int, last_touched_days: int) -> tuple[bool, float]:
    """Your rule: (high complexity + high churn) OR (high complexity + long untouched)."""
    high_complexity = _grade_is_high(file_analysis.complexity_grade)
    high_churn = churn >= HIGH_CHURN_THRESHOLD
    long_untouched = last_touched_days >= UNTOUCHED_DAYS_THRESHOLD

    flagged = high_complexity and (high_churn or long_untouched)

    # Priority score: normalize complexity_score * churn to 0-100 range
    raw_score = file_analysis.complexity_score * max(churn, 1)
    priority_score = min(raw_score, 100.0)

    return flagged, priority_score

def compute_priority(analyzed_files: list[FileAnalysis], repo_path: str) -> list[FileContext]:
    """Context Agent entry point - called by orchestrator."""
    contextualized = []

    for file_analysis in analyzed_files:
        churn = get_churn_count(repo_path, file_analysis.file_path)
        last_touched = get_last_touched_days(repo_path, file_analysis.file_path)
        flagged, priority_score = apply_priority_rule(file_analysis, churn, last_touched)

        contextualized.append(FileContext(
            **file_analysis.model_dump(),
            churn_score=churn,
            last_touched_days=last_touched,
            priority_flag=flagged,
            priority_score=priority_score
        ))

    # Only return flagged files, sorted by priority, capped at TOP_N_FILES
    flagged_only = [f for f in contextualized if f.priority_flag]
    flagged_only.sort(key=lambda f: f.priority_score, reverse=True)
    return flagged_only[:TOP_N_FILES]