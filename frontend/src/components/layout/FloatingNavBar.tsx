"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PlusCircle,
  Calendar,
  BarChart3,
  History,
  ShieldCheck,
} from 'lucide-react';
import { ViewState } from '@/lib/types';

interface FloatingNavBarProps {
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  anomalyCount: number;
}

const NAV_ITEMS = [
  { id: 'quick-log', icon: PlusCircle, label: 'Quick Log' },
  { id: 'next-session', icon: Calendar, label: 'Next' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'data-health', icon: ShieldCheck, label: 'Health' },
] as const;

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  activeView,
  setActiveView,
  anomalyCount,
}) => {
  const [tappedId, setTappedId] = useState<string | null>(null);

  const handleTap = (id: string) => {
    setTappedId(id);
    setActiveView(id as ViewState);
    // Reset tap animation
    setTimeout(() => setTappedId(null), 200);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
         style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}>
      <div
        className="glass-nav pointer-events-auto flex items-center justify-around px-3 py-2"
        style={{
          borderRadius: '999px',
          maxWidth: '360px',
          width: 'calc(100% - 40px)',
          height: '64px',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isTapped = tappedId === item.id;
          const isHealth = item.id === 'data-health';

          return (
            <button
              key={item.id}
              onClick={() => handleTap(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 min-w-[52px] relative",
                "active:scale-[0.92]",
                isTapped && "animate-tap",
              )}
              style={{
                transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-[22px] h-[22px] transition-all duration-200",
                    isActive
                      ? "text-white"
                      : "text-white/45"
                  )}
                  style={isActive ? {
                    filter: 'drop-shadow(0 0 6px rgba(151, 192, 203, 0.5))',
                  } : undefined}
                />
                {/* Anomaly indicator dot */}
                {isHealth && anomalyCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-red-500"
                    style={{
                      boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
                    }}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none tracking-tight transition-all duration-200",
                  isActive
                    ? "text-white font-semibold"
                    : "text-white/45"
                )}
              >
                {item.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                  style={{
                    background: 'hsl(var(--accent))',
                    boxShadow: '0 0 6px var(--nav-glow)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
