"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
  PencilLine,
  History,
  TrendingUp,
  Settings,
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
  { id: 'quick-log', icon: PencilLine, label: 'New Session' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'analytics', icon: TrendingUp, label: 'Progress' },
  { id: 'data-health', icon: Settings, label: 'Settings' },
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
      <aside className="hidden md:flex md:w-20 lg:w-64 bg-white border-r border-gray-100 flex-col items-center lg:items-stretch transition-all duration-300 shrink-0">
        {/* Brand */}
        <div className="px-6 py-6 hidden lg:block">
          <h1 className="text-xl font-bold tracking-tight text-black">Synapse</h1>
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
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-400 hover:bg-black/5 hover:text-black"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110")} />
                <span className="hidden lg:block text-sm font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Remove Data Health from footer as it's now in main nav as Settings */}
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 py-8 md:px-12 md:py-12 lg:px-20 pb-32 md:pb-12 safe-bottom">
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