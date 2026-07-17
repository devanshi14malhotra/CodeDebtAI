'use client';

import React from 'react';
import { FlaggedFile, SeverityLevel } from '@/types/dashboard';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { cn } from '@/lib/utils';

interface FlaggedFilesTableProps {
  files: FlaggedFile[];
}

export function FlaggedFilesTable({ files }: FlaggedFilesTableProps) {
  // Severity sorting priority mapper
  const severityOrder: Record<SeverityLevel, number> = {
    'Critical': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1
  };

  // Sort rows first by Severity (Critical -> High -> Medium -> Low), and then by Priority Score (highest -> lowest)
  const sortedFiles = [...files].sort((a, b) => {
    const sevA = severityOrder[a.severity] || 0;
    const sevB = severityOrder[b.severity] || 0;
    if (sevB !== sevA) {
      return sevB - sevA;
    }
    return b.priority_score - a.priority_score;
  });

  const getSeverityStyle = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-950/20 text-rose-400 border-rose-900/30';
      case 'High':
        return 'bg-orange-950/20 text-orange-400 border-orange-900/30';
      case 'Medium':
        return 'bg-yellow-950/20 text-yellow-400 border-yellow-900/30';
      case 'Low':
        return 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30';
      default:
        return 'bg-slate-900/20 text-slate-400 border-slate-900/30';
    }
  };

  const getComplexityGradeStyle = (grade: string) => {
    const cleanGrade = grade.toUpperCase();
    if (cleanGrade === 'A' || cleanGrade === 'B') {
      return 'text-emerald-400 border-emerald-900/30 bg-emerald-950/10';
    }
    if (cleanGrade === 'C') {
      return 'text-yellow-400 border-yellow-900/30 bg-yellow-950/10';
    }
    return 'text-rose-400 border-rose-900/30 bg-rose-950/10';
  };

  const getMaintainabilityStyle = (index: number) => {
    if (index >= 70) return 'text-emerald-400';
    if (index >= 50) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const getPriorityStyle = (score: number) => {
    if (score >= 40) return 'text-rose-400 bg-rose-950/20 border-rose-900/30';
    if (score >= 25) return 'text-orange-400 bg-orange-950/20 border-orange-900/30';
    if (score >= 15) return 'text-yellow-400 bg-yellow-950/20 border-yellow-900/30';
    return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
  };

  // Reusable card container styles with hover lift (overflow is omitted to allow tooltips to overlay)
  const cardClassName = "rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl shadow-lg mt-6 overflow-visible transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-500/25 hover:bg-slate-900/60 hover:shadow-[0_12px_30px_rgba(139,92,246,0.06)] hover:brightness-105 group";

  return (
    <div className={cardClassName}>
      {/* Header section of Table card */}
      <div className="px-6 py-5 border-b border-slate-900 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Flagged Code Areas</h3>
          <InfoTooltip content="Table showing all repository issues flagged for technical debt reviews, prioritized by severity and priority scores." />
        </div>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
          {sortedFiles.length} Areas
        </span>
      </div>

      {/* Scrollbar affects only the table body - not the header, aligned with custom flex table columns */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1000px] flex flex-col">
          {/* Table Header block */}
          <div className="bg-slate-950/80 border-b border-slate-900 z-10 select-none flex w-full">
            <div className="px-5 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-center w-[6%] flex-shrink-0 flex items-center justify-center">
              Sr No <InfoTooltip content="Serial entry index number of flagged item." />
            </div>
            <div className="px-5 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider w-[14%] flex-shrink-0 flex items-center">
              Line Number <InfoTooltip content="Starting and ending line numbers where the issue has been detected." />
            </div>
            <div className="px-5 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider w-[18%] flex-shrink-0 flex items-center">
              File Path <InfoTooltip content="Path of the source code file containing the technical debt." />
            </div>
            <div className="px-5 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-center w-[12%] flex-shrink-0 flex items-center justify-center">
              Priority Score <InfoTooltip content="Higher score indicates higher urgency for refactoring." />
            </div>
            <div className="px-5 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-center w-[10%] flex-shrink-0 flex items-center justify-center">
              Severity <InfoTooltip content="Categorizes technical debt into Critical, High, Medium, or Low." />
            </div>
            <div className="px-5 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-center w-[12%] flex-shrink-0 flex items-center justify-center">
              Complexity Grade <InfoTooltip content="Radon complexity grade (A = simplest, F = most complex)." />
            </div>
            <div className="px-5 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-center w-[14%] flex-shrink-0 flex items-center justify-center">
              Maintainability Index <InfoTooltip content="Indicates how easy the code is to maintain. Higher is better." />
            </div>
            <div className="px-5 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider w-[14%] flex-shrink-0 flex items-center">
              Reason <InfoTooltip content="Explains why the file has been flagged." />
            </div>
          </div>

          {/* Scrollable Table Body list */}
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-slate-900/60 w-full flex flex-col">
            {sortedFiles.map((file, index) => (
              <div 
                key={`${file.file_path}-${index}`}
                className="flex w-full hover:bg-slate-900/20 odd:bg-slate-950/20 even:bg-slate-950/40 transition-colors duration-150 py-3.5"
              >
                {/* 1. Serial number */}
                <div className="px-5 text-center text-xs text-slate-500 font-mono w-[6%] flex-shrink-0 flex items-center justify-center">
                  {index + 1}
                </div>

                {/* 2. Lines from-to */}
                <div className="px-5 text-xs text-slate-350 font-mono w-[14%] flex-shrink-0 flex items-center">
                  {file.line_start} &ndash; {file.line_end}
                </div>

                {/* 3. File path */}
                <div className="px-5 text-xs font-mono text-white tracking-wide truncate w-[18%] flex-shrink-0 flex items-center" title={file.file_path}>
                  {file.file_path}
                </div>

                {/* 4. Priority score badge */}
                <div className="px-5 text-center w-[12%] flex-shrink-0 flex items-center justify-center">
                  <span className={cn(
                    "inline-flex items-center justify-center w-10 py-1 text-xs font-bold font-mono rounded border",
                    getPriorityStyle(file.priority_score)
                  )}>
                    {file.priority_score}
                  </span>
                </div>

                {/* 5. Severity badge */}
                <div className="px-5 text-center w-[10%] flex-shrink-0 flex items-center justify-center">
                  <span className={cn(
                    "inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border",
                    getSeverityStyle(file.severity)
                  )}>
                    {file.severity}
                  </span>
                </div>

                {/* 6. Complexity Grade letter badge */}
                <div className="px-5 text-center w-[12%] flex-shrink-0 flex items-center justify-center">
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded border",
                    getComplexityGradeStyle(file.complexity_grade)
                  )}>
                    {file.complexity_grade}
                  </span>
                </div>

                {/* 7. Maintainability Rating */}
                <div className={cn(
                  "px-5 text-center text-xs font-mono font-bold w-[14%] flex-shrink-0 flex items-center justify-center",
                  getMaintainabilityStyle(file.maintainability_index)
                )}>
                  {file.maintainability_index.toFixed(1)}
                </div>

                {/* 8. Flagging Reason text (Enabled wrapping as requested) */}
                <div className="px-5 text-xs text-slate-400 leading-relaxed whitespace-normal break-words w-[14%] flex-shrink-0 flex items-center" title={file.reason}>
                  {file.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Footer info indicators */}
      <div className="px-6 py-4 border-t border-slate-900 bg-slate-950/20 text-center text-[10px] text-slate-500 font-bold select-none">
        Showing {sortedFiles.length} {sortedFiles.length === 1 ? 'result' : 'results'}
      </div>
    </div>
  );
}
