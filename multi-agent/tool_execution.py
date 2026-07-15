import subprocess
import json
from shared_models import FileAnalysis
from config import HIGH_COMPLEXITY_THRESHOLD

import sys

def run_radon_cc(file_paths: list[str]) -> dict:
    result = subprocess.run(
        [sys.executable, "-m", "radon", "cc", "-j"] + file_paths,
        capture_output=True,
        text=True
    )
    if result.returncode != 0 and not result.stdout:
        return {}
    return json.loads(result.stdout) if result.stdout else {}

def run_radon_mi(file_paths: list[str]) -> dict:
    result = subprocess.run(
        [sys.executable, "-m", "radon", "mi", "-j"] + file_paths,
        capture_output=True,
        text=True
    )
    if result.returncode != 0 and not result.stdout:
        return {}
    return json.loads(result.stdout) if result.stdout else {}

def _average_complexity(cc_blocks: list[dict]) -> tuple[float, str]:
    """Given radon cc output for one file, return avg complexity score + worst grade."""
    if not cc_blocks:
        return 0.0, "A"
    scores = [block["complexity"] for block in cc_blocks]
    grades = [block["rank"] for block in cc_blocks]
    avg_score = sum(scores) / len(scores)
    worst_grade = max(grades)  # radon ranks are alphabetic strings A-F, "F" is worst
    return avg_score, worst_grade

def run_static_analysis(file_paths: list[str]) -> list[FileAnalysis]:
    """Tool Execution Agent entry point - called by orchestrator."""
    cc_data = run_radon_cc(file_paths)
    mi_data = run_radon_mi(file_paths)

    analyzed = []
    for file_path in file_paths:
        cc_blocks = cc_data.get(file_path, [])
        avg_complexity, worst_grade = _average_complexity(cc_blocks)
        mi_entry = mi_data.get(file_path, {})
        mi_score = mi_entry.get("mi", 100.0) if isinstance(mi_entry, dict) else 100.0

        analyzed.append(FileAnalysis(
            file_path=file_path,
            complexity_score=avg_complexity,
            complexity_grade=worst_grade,
            maintainability_index=mi_score
        ))

    return analyzed