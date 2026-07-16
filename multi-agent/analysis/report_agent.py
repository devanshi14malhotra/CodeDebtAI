from shared.shared_models import FileContext, ReportItem, ReportOutput

def _build_reason(file_ctx: FileContext) -> str:
    """Human-readable explanation for why this file was flagged."""
    return f"High complexity ({file_ctx.complexity_grade}) — priority score {file_ctx.priority_score:.1f}"

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