import React from 'react';
import { Info, Code2, Activity, Scale, ShieldAlert } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-[1200px] mx-auto w-full pb-8 space-y-6">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-900 pb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-950/50 border border-violet-900/50 flex items-center justify-center">
          <Info className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">About Metrics & Formulas</h1>
          <p className="text-sm text-slate-400">How CodeDebtAI analyzes your repository.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Analysis Tools */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-200">Static Analysis Engine</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The backend uses the <strong>Radon</strong> Python library to compute source code metrics statically without executing the code. We scan every python file (excluding tests and virtual environments) to extract raw data.
          </p>
          <ul className="space-y-3 text-sm text-slate-300">
            <li><strong className="text-white">Cyclomatic Complexity:</strong> Measures the number of linearly independent paths through the source code. A high number means the code has too many branches (if/else/loops).</li>
            <li><strong className="text-white">Maintainability Index (MI):</strong> A 0-100 score calculated based on Halstead Volume, Cyclomatic Complexity, and Lines of Code. Higher is better.</li>
          </ul>
        </div>

        {/* Priority Score Formula */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-200">Priority Score Formula</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The Priority Score (0-100) dictates how urgently a file needs refactoring. It combines complexity and maintainability into a single metric.
          </p>
          <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-emerald-300 mb-4 border border-slate-800">
            Base = (100.0 - Maintainability Index) + Complexity Score<br/><br/>
            Priority Score = min(max(Base, 0.0), 100.0)
          </div>
          <p className="text-sm text-slate-400">
            A low maintainability index and a high complexity score both push the priority score up towards 100.
          </p>
        </div>

        {/* Health Score Formula */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-slate-200">Global Health Score</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The Health Score is the overall grade of your repository shown on the dashboard.
          </p>
          <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-violet-300 mb-4 border border-slate-800">
            Average Debt = Total Priority Score of all flagged files / Total Files Scanned<br/><br/>
            Health Score = max(0, 100 - Average Debt)
          </div>
          <p className="text-sm text-slate-400">
            This means even if you have a few highly complex files, a large repository with otherwise clean code will still maintain a good health score.
          </p>
        </div>

        {/* Severity Tiers */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-slate-200">Severity Tiers</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Files are grouped into Severity buckets based on their final Priority Score.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-4 border-b border-slate-900/50 pb-2">
              <span className="text-rose-400 font-bold w-20">Critical</span>
              <span className="text-slate-400">Priority Score ≥ 80</span>
            </li>
            <li className="flex items-center gap-4 border-b border-slate-900/50 pb-2">
              <span className="text-orange-400 font-bold w-20">High</span>
              <span className="text-slate-400">Priority Score ≥ 60</span>
            </li>
            <li className="flex items-center gap-4 border-b border-slate-900/50 pb-2">
              <span className="text-yellow-400 font-bold w-20">Medium</span>
              <span className="text-slate-400">Priority Score ≥ 40</span>
            </li>
            <li className="flex items-center gap-4 pb-2">
              <span className="text-emerald-400 font-bold w-20">Low</span>
              <span className="text-slate-400">Priority Score &lt; 40 (Rarely Flagged)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
