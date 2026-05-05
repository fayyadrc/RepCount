"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PencilLine,
  History as HistoryIcon,
  User,
  Settings,
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
    <nav className="md:hidden fixed bottom-5 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto flex items-center justify-around px-2 py-1.5 bg-white/90 backdrop-blur-xl border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        style={{
          borderRadius: '32px',
          width: 'calc(100% - 32px)',
          maxWidth: '400px',
          height: '62px',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id || 
                           (item.id === 'history' && activeView === 'workout-details');
          const isTapped = tappedId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTap(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-[24px] transition-all duration-300 relative min-w-[72px]",
                isActive ? "bg-[#F2F2F7]" : "bg-transparent",
                isTapped && "scale-95"
              )}
            >
              <Icon
                className={cn(
                  "w-[21px] h-[21px] transition-colors duration-200",
                  isActive ? "text-black" : "text-[#8E8E93]"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[9px] font-bold tracking-tight transition-colors duration-200 uppercase",
                  isActive ? "text-black" : "text-[#8E8E93]"
                )}
              >
                {item.label}
              </span>
              
              {item.id === 'data-health' && anomalyCount > 0 && (
                <span className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full bg-red-500 border border-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
