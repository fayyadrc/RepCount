"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PencilLine,
  History as HistoryIcon,
  User,
  Settings,
  BarChart2,
} from 'lucide-react';
import { ViewState } from '@/lib/types';

interface FloatingNavBarProps {
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  anomalyCount: number;
}

const NAV_ITEMS = [
  { id: 'quick-log', icon: PencilLine, label: 'New Session' },
  { id: 'history', icon: HistoryIcon, label: 'History' },
  { id: 'analytics', icon: BarChart2, label: 'Analytics' },
  { id: 'profile', icon: User, label: 'Profile' },
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
    setTimeout(() => setTappedId(null), 200);
  };

  return (
    <nav className="md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto flex items-center justify-around px-3 py-1.5 glass-nav w-[calc(100%-32px)] max-w-[380px] h-[64px] rounded-[32px]"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id || 
                           (item.id === 'history' && activeView === 'workout-details');

          return (
            <button
              key={item.id}
              onClick={() => handleTap(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 rounded-[20px] transition-all duration-300 relative min-w-[68px] btn-tap-scale",
                isActive ? "bg-secondary/80 text-foreground font-semibold" : "bg-transparent text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-[20px] h-[20px] transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[9px] font-bold tracking-wider transition-colors duration-200 uppercase font-mono",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label.split(' ')[0]} {/* Shorten labels if necessary */}
              </span>
              
              {item.id === 'profile' && anomalyCount > 0 && (
                <span className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full bg-destructive border border-background" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
