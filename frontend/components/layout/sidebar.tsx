'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CodeXml, PlusCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  // Core navigation items only
  const navigation = [
    { name: 'New Analysis', href: '/', icon: PlusCircle },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Code Review', href: '/code-review', icon: CodeXml },
    { name: 'About Metrics', href: '/about', icon: Info },
  ];

  return (
    <aside className="w-64 border-r border-slate-900 bg-[#0B0F19] text-slate-400 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-900">
        <Link href="/" className="flex items-center gap-2 font-bold text-white tracking-tight">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center text-xs font-black">
            CD
          </div>
          <span>CodeDebt<span className="text-violet-500">AI</span></span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow px-4 py-6 space-y-8 overflow-y-auto">
        <div>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">
            Core Analyzer
          </div>
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-slate-900/60 text-white border border-slate-800 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "hover:bg-slate-950 hover:text-slate-200 border border-transparent"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-violet-400" : "text-slate-500")} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer promotion card */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/40">
        <div className="px-4 py-4 rounded-xl border border-slate-900 bg-slate-950/60">
          <div className="w-8 h-8 rounded-lg bg-violet-950/50 border border-violet-850/40 flex items-center justify-center mb-3">
            <LayoutDashboard className="w-4 h-4 text-violet-400" />
          </div>
          <h4 className="text-[10px] font-bold text-white tracking-wide uppercase">Code, Cleaner Tomorrow</h4>
          <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
            Reduce debt. Improve quality. Ship better.
          </p>
        </div>
      </div>
    </aside>
  );
}
