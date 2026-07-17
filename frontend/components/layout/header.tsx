'use client';

import React, { useEffect, useState } from 'react';
import { Download, Folder } from 'lucide-react';
import { DashboardTelemetry } from '@/types/dashboard';

export function Header() {
  const [dashboardData, setDashboardData] = useState<DashboardTelemetry | null>(null);
  const [repoName, setRepoName] = useState<string>("Repository");

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboardData");
    if (saved) {
      try {
        const data = JSON.parse(saved) as DashboardTelemetry;
        setDashboardData(data);
        
        const repoUrl = sessionStorage.getItem("repoUrl");
        if (repoUrl) {
          const parts = repoUrl.replace(/\/$/, '').split('/');
          const name = parts[parts.length - 1].replace('.git', '');
          setRepoName(name || "Scanned Repository");
        } else {
          setRepoName("Scanned Repository");
        }
      } catch (e) {
        console.error("Failed to parse dashboard data for header", e);
      }
    }
  }, []);

  const handleDownloadReport = () => {
    if (!dashboardData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dashboardData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${repoName}-analysis-report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <header className="h-16 border-b border-slate-900 bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 w-full select-none">
      {/* Left section: Active repository title (Hamburger completely removed) */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded bg-slate-900 border border-slate-850 text-slate-400">
          <Folder className="w-4.5 h-4.5" />
        </div>
        <span className="text-white font-bold text-sm tracking-wide">{repoName}</span>
      </div>

      {/* Right section: Prominent Download Report button */}
      <div>
        <button
          onClick={handleDownloadReport}
          className="px-4 py-2 rounded-lg text-white font-bold text-xs tracking-wide bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border border-violet-500/20 shadow-[0_4px_20px_rgba(139,92,246,0.15)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.35)] transition-all cursor-pointer flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Report</span>
        </button>
      </div>
    </header>
  );
}
