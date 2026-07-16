import subprocess
import os
import shutil
from config import TEMP_CLONE_DIR
from tool_execution import run_static_analysis
from context_agent import compute_priority
from report_agent import build_report
from shared_models import ReportOutput

import stat

def _remove_readonly(func, path, exc_info):
    """Clear read-only bit and retry deletion - needed for .git files on Windows."""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def clone_repo(repo_url: str) -> str:
    """Shallow clone repo to a temp folder, return local path."""
    repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
    local_path = os.path.join(TEMP_CLONE_DIR, repo_name)

    if os.path.exists(local_path):
        import sys
        if sys.version_info >= (3, 12):
            shutil.rmtree(local_path, onexc=_remove_readonly)
        else:
            shutil.rmtree(local_path, onerror=_remove_readonly)
    os.makedirs(TEMP_CLONE_DIR, exist_ok=True)

    subprocess.run(
        ["git", "clone", "--depth", "50", repo_url, local_path],
        check=True,
        capture_output=True,
        text=True
    )
    return local_path

def get_python_files(repo_path: str) -> list[str]:
    """Walk folder structure, return list of .py file paths."""
    py_files = []
    for root, _, files in os.walk(repo_path):
        if ".git" in root:
            continue
        for f in files:
            if f.endswith(".py"):
                py_files.append(os.path.join(root, f))
    return py_files

def run_pipeline(repo_url: str) -> tuple[ReportOutput, str]:
    """Main orchestrator entry point - called by backend on repo submission."""
    repo_path = clone_repo(repo_url)
    file_list = get_python_files(repo_path)

    analyzed_files = run_static_analysis(file_list)
    flagged_files = compute_priority(analyzed_files, repo_path)
    report = build_report(flagged_files)

    return report, repo_path