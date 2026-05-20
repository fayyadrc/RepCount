"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
  PencilLine,
  History,
  User,
  Settings,
  BarChart2,
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
  { id: 'analytics', icon: BarChart2, label: 'Analytics' },
  { id: 'profile', icon: User, label: 'Profile' },
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
      <aside className="hidden md:flex md:w-20 lg:w-64 bg-card border-r border-border flex-col items-center lg:items-stretch transition-all duration-300 shrink-0">
        {/* Brand */}
        <div className="px-6 py-8 hidden lg:block border-b border-border/50">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">RepCount</h1>
          <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-bold font-mono mt-1">AI Gym Intelligence</p>
        </div>

        {/* Spacer for icon-only mode */}
        <div className="py-4 lg:hidden" />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewState)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group btn-tap-scale",
                  isActive
                    ? "bg-foreground text-background shadow-md shadow-foreground/5 font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105", isActive ? "stroke-[2.5]" : "stroke-2")} />
                <span className="hidden lg:block text-[14px] tracking-tight">{item.label}</span>
                {item.id === 'profile' && anomalyCount > 0 && (
                  <span className={cn(
                    "w-2 h-2 rounded-full ml-auto shrink-0 transition-all duration-200",
                    isActive ? "bg-background shadow-sm" : "bg-destructive"
                  )} />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 h-full overflow-y-auto premium-dot-grid bg-background/40">
        <div className="max-w-4xl mx-auto px-4 py-8 md:px-12 md:py-12 pb-32 md:pb-12 safe-bottom">
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