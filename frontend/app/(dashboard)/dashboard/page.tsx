'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Metrics } from '@/components/dashboard/metrics';
import { AnalyticsSection } from '@/components/dashboard/analytics-section';
import { FlaggedFilesTable } from '@/components/dashboard/flagged-files-table';
import { DashboardTelemetry } from '@/types/dashboard';

// Framer Motion entry stagger animation definitions
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 85, 
      damping: 14 
    } 
  }
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardTelemetry | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboardData");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse dashboard data");
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-4">
        <p>Loading dashboard data...</p>
        <p className="text-sm opacity-50">If you haven't run an analysis, please go back to the home page.</p>
      </div>
    );
  }

  const { 
    health_score, 
    total_debt_score, 
    files_scanned, 
    severity_distribution, 
    summary, 
    files 
  } = data;

  // The total flagged files count equals the cumulative severity breakdown total
  const flaggedFilesCount = severity_distribution.critical + 
                            severity_distribution.high + 
                            severity_distribution.medium + 
                            severity_distribution.low;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1600px] mx-auto w-full pb-8"
    >
      {/* 1. Metrics Cards Grid (4 columns) */}
      <motion.div variants={itemVariants}>
        <Metrics 
          healthScore={health_score}
          totalDebtScore={total_debt_score}
          flaggedFilesCount={flaggedFilesCount}
          filesScannedCount={files_scanned}
        />
      </motion.div>

      {/* 2. Analytics Section (Severity Donut Chart & Context Summary) */}
      <motion.div variants={itemVariants}>
        <AnalyticsSection 
          severityDistribution={severity_distribution}
          summary={summary}
        />
      </motion.div>

      {/* 3. Flagged Files Data Table */}
      <motion.div variants={itemVariants}>
        {files && files.length > 0 ? (
          <FlaggedFilesTable files={files} />
        ) : (
          <div className="p-8 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 text-center shadow-lg shadow-emerald-900/5">
            <h3 className="text-xl font-bold text-emerald-400 mb-2">Clean Repository!</h3>
            <p className="text-emerald-500/80">No high-priority technical debt was found in this codebase.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
