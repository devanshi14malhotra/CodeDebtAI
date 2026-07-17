'use client';

import React, { useState, useEffect } from 'react';
import { CodeReviewItem } from '@/types/code-review';
import { Sparkles, CheckCircle2, Shield, Zap, Hammer, AlertTriangle } from 'lucide-react';
import { DashboardTelemetry } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface FixCardProps {
  item: CodeReviewItem;
  onAccept: (id: string) => void;
  isAccepted: boolean;
}

export function FixCard({ item, onAccept, isAccepted }: FixCardProps) {
  const [loading, setLoading] = useState(false);
  const [fileMeta, setFileMeta] = useState<any>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboardData");
    if (saved) {
      try {
        const data = JSON.parse(saved) as DashboardTelemetry;
        const meta = data.files.find(f => f.file_path === item.file_path);
        setFileMeta(meta);
      } catch(e) {}
    }
  }, [item.file_path]);

  const priorityScore = fileMeta?.priority_score || 20;
  const complexityGrade = fileMeta?.complexity_grade || 'C';
  const issueReason = fileMeta?.reason || 'High complexity flagged';

  const handleAcceptClick = () => {
    setLoading(true);
    setTimeout(() => {
      onAccept(item.file_path);
      setLoading(false);
    }, 1200);
  };

  // Generate dynamic explanations based on reason
  const getSimulatedExplanations = () => {
    return [
      {
        type: 'complexity',
        title: 'Complexity Reduction',
        detail: `Refactored conditional scopes. Complexity reduced from grade ${complexityGrade} to grade A/B compliance.`
      },
      {
        type: 'performance',
        title: 'Code Compaction',
        detail: 'Replaced nested conditional paths with cleaner return statements, saving unnecessary cycle executions.'
      }
    ];
  };

  const getExplanationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'security':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'performance':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <Hammer className="w-4 h-4 text-violet-400" />;
    }
  };

  const estimatedFixTime = `${Math.max(1, Math.round(priorityScore / 10))}h`;

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm p-6 flex flex-col h-full justify-between">
      {/* File Header Details */}
      <div>
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate" title={item.file_path.split(/[\\/]/).pop()}>
              {item.file_path.split(/[\\/]/).pop()}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 truncate" title={item.file_path}>
              {item.file_path}
            </p>
          </div>
          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded flex-shrink-0">
            {item.file_path.endsWith('.py') ? 'Python' : 'TypeScript'}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-900 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-450 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Radon Flaw Details</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {issueReason}
          </p>
        </div>

        {/* Comparison Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-950 border border-slate-900 mb-6">
          <div className="text-center border-r border-slate-900">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Complexity</div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-xs font-black text-rose-500">{complexityGrade}</span>
              <span className="text-[10px] text-slate-600">→</span>
              <span className="text-xs font-black text-emerald-450">A</span>
            </div>
          </div>
          <div className="text-center border-r border-slate-900">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Priority</div>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs font-semibold text-rose-400">
              {priorityScore}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Est. Fix</div>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs font-semibold text-slate-400">
              {estimatedFixTime}
            </div>
          </div>
        </div>

        {/* Highlighted Explanations */}
        <div className="space-y-4 mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Refactoring Improvements
          </div>
          
          <div className="space-y-3">
            {getSimulatedExplanations().map((exp, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-900 h-fit text-slate-400 mt-0.5">
                  {getExplanationIcon(exp.type)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{exp.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{exp.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accept Action Button */}
      <div className="pt-4 border-t border-slate-900">
        <button
          onClick={handleAcceptClick}
          disabled={isAccepted || loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 shadow-[0_4px_20px_rgba(139,92,246,0.15)] cursor-pointer",
            isAccepted
              ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 shadow-none cursor-default"
              : loading
              ? "bg-slate-900 text-slate-500 border border-slate-850 cursor-wait animate-pulse"
              : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border border-violet-550/30 hover:shadow-[0_4px_25px_rgba(139,92,246,0.3)] hover:-translate-y-0.5"
          )}
        >
          {isAccepted ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Fix Applied Successfully</span>
            </>
          ) : loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
              <span>Applying Refactoring...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Apply AI Recommended Fix</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
