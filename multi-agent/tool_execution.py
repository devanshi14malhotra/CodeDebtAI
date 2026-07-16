import subprocess
import json
import os
import sys
from shared_models import FileAnalysis
from config import HIGH_COMPLEXITY_THRESHOLD

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
    cc_data = run_radon_cc(file_paths)
    mi_data = run_radon_mi(file_paths)
    results = []
    
    # Normalize keys to handle Windows drive letter case differences
    normalized_cc_data = {os.path.normcase(os.path.abspath(k)): v for k, v in cc_data.items()}
    normalized_mi_data = {os.path.normcase(os.path.abspath(k)): v for k, v in mi_data.items()}
    
    for file_path in file_paths:
        normalized_path = os.path.normcase(os.path.abspath(file_path))
        cc_blocks = normalized_cc_data.get(normalized_path, [])
        
        # Radon returns a dict (not a list) if a file has a syntax error
        if isinstance(cc_blocks, dict) and "error" in cc_blocks:
            continue
            
        avg_complexity, worst_grade = _average_complexity(cc_blocks)
        
        mi_entry = normalized_mi_data.get(normalized_path, {})
        mi_score = mi_entry.get("mi", 100.0) if isinstance(mi_entry, dict) else 100.0
        
        # Only include if we found valid data
        if cc_blocks:
            results.append(FileAnalysis(
                file_path=file_path,
                complexity_score=avg_complexity,
                complexity_grade=worst_grade,
                maintainability_index=mi_score
            ))
            
    return results