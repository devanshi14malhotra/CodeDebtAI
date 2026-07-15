from orchestrator import run_pipeline
from code_fixing_agent import fix_file, apply_fix
from shared_models import FixRequest

def test_full_pipeline(repo_url: str):
    """Flow 1: automatic pipeline, runs once per repo submission."""
    print(f"Analyzing repo: {repo_url}")
    report, repo_path = run_pipeline(repo_url)

    print("\n--- Report Summary ---")
    print(report.summary)
    print("\n--- Flagged Files ---")
    for item in report.files:
        print(f"{item.file_path} | score={item.priority_score:.1f} | grade={item.complexity_grade}")
        print(f"  reason: {item.reason}")

    return report, repo_path

def test_code_fixing(repo_path: str, file_path: str, issue_reason: str):
    """Flow 2: on-demand, simulates a dropdown selection + fix request."""
    request = FixRequest(file_path=file_path, issue_reason=issue_reason)
    fix_response = fix_file(request, repo_path)

    print("\n--- Suggested Fix ---")
    print(fix_response.suggested_code)

    print("\n--- Diff ---")
    for line in fix_response.diff:
        prefix = "+" if line["type"] == "add" else "-" if line["type"] == "remove" else " "
        print(f"{prefix} {line['content']}")

    # Simulate user clicking "Apply changes"
    # apply_fix(repo_path, file_path, fix_response.suggested_code)

    return fix_response

if __name__ == "__main__":
    test_repo_url = "https://github.com/hbdz936/fit-auditor.git"
    report, repo_path = test_full_pipeline(test_repo_url)

    if report.files:
        first_flagged_file = report.files[0]
        test_code_fixing(repo_path, first_flagged_file.file_path, first_flagged_file.reason)