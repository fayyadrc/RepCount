"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
  PlusCircle,
  Calendar,
  BarChart3,
  History,
  ShieldCheck,
} from 'lucide-react';
import { ViewState } from '@/lib/types';
import { FloatingNavBar } from './FloatingNavBar';

interface ShellProps {
  children: React.ReactNode;
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  anomalyCount: number;
}

const NAV_ITEMS = [
  { id: 'quick-log', icon: PlusCircle, label: 'Quick Log' },
  { id: 'next-session', icon: Calendar, label: 'Next Session' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'history', icon: History, label: 'History' },
] as const;

export const Shell: React.FC<ShellProps> = ({
  children,
  activeView,
  setActiveView,
  anomalyCount
}) => {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden selection:bg-accent/30">
      {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
      <aside className="hidden md:flex md:w-20 lg:w-64 glass-surface-strong border-r border-white/20 flex-col items-center lg:items-stretch transition-all duration-300 shrink-0">
        {/* Brand */}
        <div className="px-6 py-6 hidden lg:block">
          <h1 className="text-xl font-bold tracking-tight text-primary">Synapse Lift</h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">AI Gym Intelligence</p>
        </div>

        {/* Spacer for icon-only mode */}
        <div className="py-4 lg:hidden" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewState)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                <span className="hidden lg:block text-sm font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Pinned — Data Health */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setActiveView('data-health')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
              activeView === 'data-health'
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
            )}
          >
            <ShieldCheck className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", activeView === 'data-health' && "text-primary")} />
            <span className="hidden lg:block text-sm font-medium tracking-tight">Data Health</span>
            {anomalyCount > 0 && (
              <span className="absolute top-2 right-2 lg:static lg:ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {anomalyCount}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 h-full overflow-y-auto pb-28 md:pb-0">
        <div className="max-w-5xl mx-auto px-5 py-8 md:px-12 md:py-12 lg:px-20 h-full">
          {children}
        </div>
      </main>

      {/* ─── Mobile Floating Pill Navigation (hidden on desktop) ─── */}
      <FloatingNavBar
        activeView={activeView}
        setActiveView={setActiveView}
        anomalyCount={anomalyCount}
      />
    </div>
  );
};