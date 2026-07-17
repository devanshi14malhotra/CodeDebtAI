'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Link2, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Workflow steps array
const workflowSteps = [
  'Validating Repository',       // Group 1
  'Cloning Repository',          // Group 1
  'Discovering Project Files',   // Group 1
  'Running Static Analysis',      // Group 2
  'Calculating Complexity Metrics',// Group 2
  'Analyzing Git History',       // Group 3
  'Measuring Code Churn',        // Group 3
  'Prioritizing Technical Debt', // Group 3
  'Generating Analysis Report',  // Group 4
  'Preparing Code Review',       // Group 5
  'Analysis Complete'            // Group 6
];

export default function Home() {
  const router = useRouter();

  // Screen states
  const [isPinned, setIsPinned] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Loading Screen States
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [traceMessages, setTraceMessages] = useState<string[]>([]);

  // Group classification based on step index
  const getActiveGroup = (index: number) => {
    if (index === -1) return 1;
    if (index <= 2) return 1;
    if (index === 3 || index === 4) return 2;
    if (index >= 5 && index <= 7) return 3;
    if (index === 8) return 4;
    if (index === 9) return 5;
    return 6; // Analysis Complete
  };

  const activeGroup = getActiveGroup(currentStepIndex);

  // Map step index to visual progress bar percentage
  const getProgressPercentage = (index: number) => {
    if (index === -1) return 0;
    if (index === 0) return 8;
    if (index === 1) return 16;
    if (index === 2) return 25;
    if (index === 3) return 35;
    if (index === 4) return 45;
    if (index === 5) return 55;
    if (index === 6) return 65;
    if (index === 7) return 75;
    if (index === 8) return 88;
    if (index === 9) return 95;
    return 100; // Analysis Complete
  };

  const progress = getProgressPercentage(currentStepIndex);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    // Simulate brief pre-flight delay before pinning the card to the top
    setTimeout(() => {
      setIsPinned(true);
      setLoading(false);
      setCurrentStepIndex(0);
      setTraceMessages(["Initializing LangGraph pipeline..."]);

      // Connect to the Backend WebSocket
      const analysisId = crypto.randomUUID();
      const wsUrl = `ws://localhost:8000/analysis/${analysisId}/events?repo_url=${encodeURIComponent(repoUrl)}`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === "progress_update") {
            const stepName = data.payload.step;
            const newTrace = data.payload.trace;
            
            if (newTrace && newTrace.length > 0) {
              setTraceMessages(newTrace);
            } else if (data.payload.message) {
              setTraceMessages(prev => [...prev, data.payload.message]);
            }

            // Map the backend's LangGraph node to the UI's visual steps
            if (stepName === "clone_node") setCurrentStepIndex(2);
            else if (stepName === "analyze_node") setCurrentStepIndex(4);
            else if (stepName === "contextualize_node") setCurrentStepIndex(7);
            else if (stepName === "report_node") setCurrentStepIndex(9);
          } else if (data.event === "analysis_completed") {
            setCurrentStepIndex(workflowSteps.length - 1);
            setTraceMessages(prev => [...prev, "Analysis successfully completed."]);
            
            // Save the real agentic payload for the dashboard to use!
            sessionStorage.setItem("dashboardData", JSON.stringify(data.payload.dashboard));
            sessionStorage.setItem("repoUrl", repoUrl);
            
            setTimeout(() => {
              router.push('/dashboard');
            }, 1200);
          } else if (data.event === "analysis_failed") {
            setTraceMessages(prev => [...prev, `ERROR: ${data.payload.error_message}`]);
            alert("Analysis failed: " + data.payload.error_message);
            handleCancelScan();
          }
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      ws.onerror = () => {
        alert("Failed to connect to the backend analysis engine.");
        handleCancelScan();
      };
    }, 600);
  };

  const handleCancelScan = () => {
    setIsPinned(false);
    setRepoUrl('');
    setCurrentStepIndex(-1);
    setTraceMessages([]);
  };

  // Helper lists to display active steps for the current group
  const getGroupSteps = (groupNum: number) => {
    switch (groupNum) {
      case 1:
        return workflowSteps.slice(0, 3);
      case 2:
        return workflowSteps.slice(3, 5);
      case 3:
        return workflowSteps.slice(5, 8);
      case 4:
        return [workflowSteps[8]];
      case 5:
        return [workflowSteps[9]];
      default:
        return [workflowSteps[10]];
    }
  };

  const currentGroupSteps = getGroupSteps(activeGroup);

  return (
    <div
      className={cn(
        "relative min-h-screen bg-[#05070c] overflow-hidden flex flex-col items-center px-4 transition-all duration-1000 ease-out",
        isPinned ? "justify-start pt-12 pb-24" : "justify-center"
      )}
    >
      {/* Outer Space Background Glows */}
      <div className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full bg-violet-950/20 filter blur-[120px] pointer-events-none translate-x-[-20%] translate-y-[-20%]" />
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-fuchsia-950/15 filter blur-[120px] pointer-events-none translate-x-[20%] translate-y-[-20%]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-950/15 filter blur-[140px] pointer-events-none translate-x-[-30%] translate-y-[30%]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-950/20 filter blur-[120px] pointer-events-none translate-x-[30%] translate-y-[30%]" />

      {/* Grid mask overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#131625_1px,transparent_1px),linear-gradient(to_bottom,#131625_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.06] pointer-events-none" />

      {/* Screen 1 - Landing Header text (fades away when card is pinned) */}
      {!isPinned && (
        <motion.div
          animate={isPinned ? { opacity: 0, y: -80, height: 0, marginBottom: 0 } : { opacity: 1, y: 0, marginBottom: 48 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center max-w-[900px] z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/30 border border-violet-850/40 text-[11px] font-black text-violet-400 uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Static Analyzer</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Find, Prioritize & Eliminate
            <span className="block mt-2 bg-gradient-to-r from-violet-200 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent pb-1">
              Technical Debt with AI
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="max-w-[700px] text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed mt-6 font-medium"
          >
            Turn technical debt into actionable insights with AI-powered analysis, prioritization, and intelligent code fixes.
          </motion.p>
        </motion.div>
      )}

      {/* Pinned Repository Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 20 }}
        className="w-full max-w-[720px] z-10"
      >
        <div className="rounded-2xl border border-slate-800/40 bg-slate-950/60 backdrop-blur-xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] shadow-violet-950/5 relative overflow-hidden group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

          {/* Card Header details */}
          <div className="mb-6 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">GitHub Repository Link</h3>
              <p className="text-xs text-slate-500 mt-1">
                Paste the URL of the GitHub repository you want to analyze.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  required
                  disabled={isPinned}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository-name"
                  className={cn(
                    "w-full bg-slate-900/60 focus:bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 pl-11 pr-4 py-3.5 transition-all text-sm font-mono tracking-wide",
                    isPinned ? "opacity-60 cursor-not-allowed border-slate-850" : "hover:bg-slate-900/80 hover:border-slate-750"
                  )}
                />
              </div>

              <motion.button
                whileHover={isPinned ? {} : { scale: 1.02, y: -1 }}
                whileTap={isPinned ? {} : { scale: 0.98 }}
                type="submit"
                disabled={isPinned || loading}
                className={cn(
                  "px-6 py-3.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2",
                  isPinned
                    ? "bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed shadow-none"
                    : loading
                    ? "bg-slate-900 text-slate-500 cursor-wait animate-pulse border border-slate-850"
                    : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border border-violet-500/20 shadow-[0_4px_20px_rgba(139,92,246,0.2)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.45)] cursor-pointer"
                )}
              >
                {isPinned ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Screen 2 - AI Analysis Loading Experience */}
      {isPinned && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-[650px] z-10 flex flex-col items-center mt-12 space-y-8"
        >
          {/* Header Caption */}
          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-200 tracking-wider uppercase">
              {activeGroup === 6 ? 'Analysis Complete' : 'Analyzing your repository...'}
            </h2>
          </div>

          {/* Progress Bar (Spring animated width based on current step index) */}
          <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 rounded-full"
            />
          </div>

          {/* Subtitle Caption */}
          <div className="text-center text-xs text-slate-500 select-none">
            {activeGroup === 6 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center">
                <CheckCircle2 className="w-4 h-4" /> Redirecting to Dashboard...
              </span>
            ) : (
              <span>Please wait while we scan and analyze your codebase</span>
            )}
          </div>

          {/* Active scan message block (displays current running group step with crossfades) */}
          <div className="w-full min-h-[140px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeGroup}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="w-full space-y-3.5"
              >
                {currentGroupSteps.map((step) => {
                  const stepIndex = workflowSteps.indexOf(step);
                  const isCompleted = stepIndex < currentStepIndex;
                  const isCurrent = stepIndex === currentStepIndex;
                  const isPending = stepIndex > currentStepIndex;

                  if (isPending) return null;

                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={cn(
                        "flex items-center gap-3.5 text-sm py-1.5 px-4 rounded-lg border transition-all duration-200",
                        isCompleted
                          ? "text-slate-500 bg-slate-950/20 border-transparent opacity-65"
                          : isCurrent
                          ? "text-slate-100 bg-slate-900/40 border-slate-900 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                          : "text-slate-650 opacity-40 border-transparent"
                      )}
                    >
                      {/* Left indicator state */}
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-emerald-400">
                            <span className="text-[10px]">✓</span>
                          </div>
                        ) : isCurrent ? (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-800" />
                        )}
                      </div>

                      {/* Step text */}
                      <span className={cn(
                        "font-medium tracking-wide",
                        isCurrent ? "font-bold text-white" : ""
                      )}>
                        {step}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Real-time Agent Thoughts */}
          <div className="w-full mt-4 bg-slate-950/80 border border-slate-800/60 rounded-xl p-4 font-mono text-xs text-slate-400 max-h-[140px] overflow-y-auto">
             <div className="flex items-center gap-2 mb-3 text-[10px] uppercase font-bold text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Agent Chain of Thought
             </div>
             {traceMessages.map((msg, i) => (
                <div key={i} className="flex gap-2.5 mb-1.5 items-start">
                   <span className="text-violet-500/50 flex-shrink-0">[{new Date().toLocaleTimeString()}]</span>
                   <span className="text-slate-300 leading-relaxed">{msg}</span>
                </div>
             ))}
             {traceMessages.length === 0 && (
                <div className="text-slate-600 italic">Waiting for agent to begin reasoning...</div>
             )}
          </div>

          {/* Control Reset */}
          <div className="pt-6 border-t border-slate-900 w-full flex justify-center gap-4 select-none">
            <button
              type="button"
              onClick={handleCancelScan}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-400 border border-slate-900 hover:border-slate-800 px-3 py-1.5 rounded transition-colors cursor-pointer"
            >
              Cancel Scan
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
