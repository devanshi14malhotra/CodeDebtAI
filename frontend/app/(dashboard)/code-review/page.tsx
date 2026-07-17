'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Play, FileCode, CheckCircle2, ChevronDown, GitCommit, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardTelemetry } from '@/types/dashboard';

interface FileReviewData {
  file_path: string;
  suggested_lines: number[];
  flagged_lines: number[];
  original_code: string;
  suggested_code: string;
}

function CodeReviewContent() {
  const [dashboardData, setDashboardData] = useState<DashboardTelemetry | null>(null);
  const [fileKeys, setFileKeys] = useState<string[]>([]);
  const [selectedFileKey, setSelectedFileKey] = useState<string>('');
  const [activeReview, setActiveReview] = useState<FileReviewData | null>(null);
  const [isLoadingFix, setIsLoadingFix] = useState(false);

  // User-modified suggested code
  const [editedSuggestedCode, setEditedSuggestedCode] = useState<string>('');
  const [isPushed, setIsPushed] = useState(false);
  
  // GitHub Modal state
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [pushStatusMessage, setPushStatusMessage] = useState('');
  const [pushStatusUrl, setPushStatusUrl] = useState('');
  const [editorsMounted, setEditorsMounted] = useState<number>(0);

  // References to editor instances and Monaco libraries
  const leftEditorRef = useRef<any>(null);
  const rightEditorRef = useRef<any>(null);
  const leftDecorationsRef = useRef<any>(null);
  const rightDecorationsRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Sync scroll lock parameters to prevent infinite scrolling loops
  const isSyncingLeftRef = useRef<boolean>(false);
  const isSyncingRightRef = useRef<boolean>(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboardData");
    if (saved) {
      try {
        const data = JSON.parse(saved) as DashboardTelemetry;
        setDashboardData(data);
        const keys = data.files.map(f => f.file_path);
        setFileKeys(keys);
        if (keys.length > 0) setSelectedFileKey(keys[0]);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!selectedFileKey || !dashboardData) return;
    
    const fileMeta = dashboardData.files.find(f => f.file_path === selectedFileKey);
    const reason = fileMeta?.reason || "Optimize code";
    const repoUrl = sessionStorage.getItem("repoUrl") || "";

    setIsLoadingFix(true);
    setActiveReview(null);
    setEditedSuggestedCode('');

    fetch("http://localhost:8000/fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo_url: repoUrl,
        file_path: selectedFileKey,
        issue_reason: reason
      })
    })
    .then(res => res.json())
    .then(data => {
      setActiveReview(data);
      setEditedSuggestedCode(data.suggested_code);
      setIsLoadingFix(false);
    })
    .catch(err => {
      console.error(err);
      setIsLoadingFix(false);
    });
  }, [selectedFileKey, dashboardData]);

  // Synchronized scroll listeners
  const handleLeftMount = (editor: any, monaco: Monaco) => {
    leftEditorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidScrollChange((e: any) => {
      if (e.scrollTopChanged && rightEditorRef.current && !isSyncingRightRef.current) {
        isSyncingLeftRef.current = true;
        rightEditorRef.current.setScrollTop(e.scrollTop);
        isSyncingLeftRef.current = false;
      }
    });
    setEditorsMounted(prev => prev + 1);
  };

  const handleRightMount = (editor: any, monaco: Monaco) => {
    rightEditorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidScrollChange((e: any) => {
      if (e.scrollTopChanged && leftEditorRef.current && !isSyncingLeftRef.current) {
        isSyncingRightRef.current = true;
        leftEditorRef.current.setScrollTop(e.scrollTop);
        isSyncingRightRef.current = false;
      }
    });
    setEditorsMounted(prev => prev + 1);
  };

  // Re-apply layout decorations whenever selectedFile or Monaco mounts/reloads
  useEffect(() => {
    if (!monacoRef.current || !activeReview) return;
    const monaco = monacoRef.current;

    // Apply green highlighted decorations to Left Editor (Suggested Fixes)
    if (leftEditorRef.current) {
      if (leftDecorationsRef.current) {
        leftDecorationsRef.current.clear();
      }
      const suggestedLines = activeReview.suggested_lines || [];
      const decs = suggestedLines.map((line: number) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-line-added'
        }
      }));
      leftDecorationsRef.current = leftEditorRef.current.createDecorationsCollection(decs);
    }

    // Apply red highlighted decorations to Right Editor (Original Code)
    // Represents the flagged code segments that require optimization, supplied by backend analysis
    if (rightEditorRef.current) {
      if (rightDecorationsRef.current) {
        rightDecorationsRef.current.clear();
      }
      const flaggedLines = activeReview.flagged_lines || [];
      const decs = flaggedLines.map((line: number) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-line-deleted'
        }
      }));
      rightDecorationsRef.current = rightEditorRef.current.createDecorationsCollection(decs);
    }
  }, [activeReview, editorsMounted]);

  const handlePushFixes = () => {
    if (!activeReview) return;
    setIsTokenModalOpen(true);
  };

  const submitPushFix = () => {
    if (!activeReview) return;
    
    setIsPushed(false);
    setPushStatusMessage('Pushing...');
    setPushStatusUrl('');
    
    const repoUrl = sessionStorage.getItem("repoUrl") || "";
    fetch("http://localhost:8000/fix/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo_url: repoUrl,
        file_path: activeReview.file_path,
        suggested_code: editedSuggestedCode,
        github_token: githubToken.trim() || undefined
      })
    })
    .then(res => res.json())
    .then(data => {
      setIsPushed(true);
      setPushStatusMessage(data.message || 'Pushed changes successfully!');
      if (data.pr_url) setPushStatusUrl(data.pr_url);
      setIsTokenModalOpen(false);
      
      setTimeout(() => {
        setIsPushed(false);
      }, 10000);
    })
    .catch(err => {
      console.error(err);
      setIsPushed(false);
      setPushStatusMessage('Error pushing fixes.');
    });
  };

  const getLanguage = (path: string | undefined) => {
    if (!path) return 'javascript';
    return path.endsWith('.py') ? 'python' : 'javascript';
  };

  // Professional Monaco editor visual options
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 12.5,
    fontFamily: "var(--font-mono), monospace",
    lineNumbersMinChars: 3,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    cursorBlinking: 'smooth' as const,
    smoothScrolling: true,
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'all' as const
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full gap-5">
      {/* Header Selector Block */}
      <div className="rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl p-4 flex items-center justify-between flex-shrink-0">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current File</span>
          <div className="flex items-center gap-2 mt-1">
            <FileCode className="w-4 h-4 text-violet-400" />
            <span className="text-white text-xs font-mono tracking-wide">{activeReview?.file_path || selectedFileKey}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">Select File</label>
          <div className="relative">
            <select
              value={selectedFileKey}
              onChange={(e) => setSelectedFileKey(e.target.value)}
              className="bg-slate-900 hover:bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded-lg pl-3 pr-8 py-2.5 transition-all outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              {fileKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Code Editors Section (occupying available height) */}
      {fileKeys.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center rounded-xl border border-slate-900 bg-slate-950/60 backdrop-blur-xl min-h-0 w-full text-center p-8">
           <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-900/50 flex items-center justify-center mb-4">
             <CheckCircle2 className="w-6 h-6 text-emerald-400" />
           </div>
           <p className="text-lg font-bold text-slate-200">Repository is Clean</p>
           <p className="text-sm text-slate-500 mt-2 max-w-md">
             CodeDebtAI did not find any files with significant technical debt or high complexity that require refactoring. Great job!
           </p>
        </div>
      ) : isLoadingFix || !activeReview ? (
        <div className="flex-grow flex flex-col items-center justify-center rounded-xl border border-slate-900 bg-slate-950/60 backdrop-blur-xl min-h-0 w-full">
           <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
           <p className="text-sm font-bold text-slate-200">Generating AI Code Fix...</p>
           <p className="text-xs text-slate-500 mt-2">Groq LLM is analyzing and refactoring {selectedFileKey}.</p>
        </div>
      ) : (
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-5 min-h-0 w-full">
        {/* Left Editor: Suggested Fixes (Editable) */}
        <div className="flex flex-col h-full rounded-xl border border-slate-900 bg-slate-950/60 backdrop-blur-xl overflow-hidden relative">
          <div className="h-12 border-b border-slate-900 bg-slate-950/80 px-4 flex items-center justify-between flex-shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Suggested Fixes</span>
              <span className="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 px-1.5 py-0.5 rounded uppercase font-bold">
                Editable
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Suggested Fixes Editor</span>
          </div>

          <div className="flex-grow w-full min-h-0 bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={getLanguage(activeReview.file_path)}
              theme="vs-dark"
              value={editedSuggestedCode}
              onChange={(value) => setEditedSuggestedCode(value || '')}
              onMount={handleLeftMount}
              options={editorOptions}
              loading={
                <div className="flex h-full items-center justify-center text-slate-500 bg-slate-950/20">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            />
          </div>
        </div>

        {/* Right Editor: Original Code (Read-Only) */}
        <div className="flex flex-col h-full rounded-xl border border-slate-900 bg-slate-950/60 backdrop-blur-xl overflow-hidden relative">
          <div className="h-12 border-b border-slate-900 bg-slate-950/80 px-4 flex items-center justify-between flex-shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Original Code</span>
              <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-850 px-1.5 py-0.5 rounded uppercase font-bold">
                Read Only
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Original Code Editor</span>
          </div>

          <div className="flex-grow w-full min-h-0 bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={getLanguage(activeReview.file_path)}
              theme="vs-dark"
              value={activeReview.original_code}
              onMount={handleRightMount}
              options={{ ...editorOptions, readOnly: true }}
              loading={
                <div className="flex h-full items-center justify-center text-slate-500 bg-slate-950/20">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            />
          </div>
        </div>
      </div>
      )}

      {/* Bottom Center Actions Block */}
      <div className="flex flex-col items-center justify-center gap-3.5 flex-shrink-0">
        <button
          onClick={handlePushFixes}
          className="px-6 py-3 rounded-lg text-white font-bold text-xs tracking-wide bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border border-violet-500/20 shadow-[0_4px_25px_rgba(139,92,246,0.2)] hover:shadow-[0_4px_30px_rgba(139,92,246,0.45)] transition-all cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 select-none active:scale-[0.98] duration-200"
        >
          <GitCommit className="w-4 h-4" />
          <span>Push This File's Fixes to Repository</span>
        </button>

        <div className="text-[10px] font-medium text-slate-500 select-none min-h-[14px]">
          {isPushed ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" /> 
              {pushStatusMessage}
              {pushStatusUrl && (
                <a href={pushStatusUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300 transition-colors ml-2">
                  View Pull Request
                </a>
              )}
            </span>
          ) : (
            <span>This will commit and push the changes from the left editor to the repository.</span>
          )}
        </div>
      </div>

      {/* GitHub Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[450px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsTokenModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-semibold text-white mb-2">Push to GitHub</h3>
            <p className="text-xs text-slate-400 mb-6">
              Enter a GitHub Personal Access Token to automatically create a Pull Request with these fixes. If left blank, changes will only be applied to the local clone.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">GitHub Token (Optional)</label>
                <input 
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              
              <div className="flex gap-3 justify-end mt-8">
                <button 
                  onClick={() => setIsTokenModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitPushFix}
                  className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all"
                >
                  Confirm & Push
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CodeReview() {
  return (
    <Suspense fallback={
      <div className="flex h-[400px] items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider">Loading Monaco Editor Panels...</span>
        </div>
      </div>
    }>
      <CodeReviewContent />
    </Suspense>
  );
}
