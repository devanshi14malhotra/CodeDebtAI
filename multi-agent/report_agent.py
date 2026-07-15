from shared_models import FileContext, ReportItem, ReportOutput

def _build_reason(file_ctx: FileContext) -> str:
    """Human-readable explanation for why this file was flagged."""
    reasons = []

    if file_ctx.churn_score >= 10:
        reasons.append(f"changed {file_ctx.churn_score} times recently")
    if file_ctx.last_touched_days >= 180:
        reasons.append(f"untouched for {file_ctx.last_touched_days} days")

    reason_detail = " and ".join(reasons) if reasons else "flagged by priority rule"
    return f"High complexity ({file_ctx.complexity_grade}) — {reason_detail}"

def _build_summary(flagged_files: list[FileContext]) -> str:
    """Short overview line for the top of the dashboard report."""
    if not flagged_files:
        return "No high-priority technical debt found in this repository."

    count = len(flagged_files)
    top_file = flagged_files[0].file_path.split("/")[-1]
    return f"{count} file(s) flagged for review. Highest priority: {top_file}."

def build_report(flagged_files: list[FileContext]) -> ReportOutput:
    """Report Agent entry point - called by orchestrator."""
    report_items = [
        ReportItem(
            file_path=f.file_path,
            priority_score=f.priority_score,
            complexity_grade=f.complexity_grade,
            reason=_build_reason(f)
        )
        for f in flagged_files
    ]

    summary = _build_summary(flagged_files)

    return ReportOutput(summary=summary, files=report_items)