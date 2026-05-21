"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Brain, Cpu, Wand2 } from 'lucide-react';

interface AIInsightsProps {
  onBack: () => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pt-2 pb-24"
    >
      <header className="flex items-center gap-4 px-1">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-secondary rounded-full transition-all duration-200 text-foreground btn-tap-scale border border-transparent hover:border-border"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight font-heading">AI Insights</h2>
          <p className="text-muted-foreground text-sm font-medium">Smarter training with AI</p>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card border border-border shadow-sm rounded-[28px] space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow in background */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-accent-violet-bg/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-accent-blue-bg/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-accent-violet-bg text-accent-violet rounded-[24px] flex items-center justify-center shadow-md relative z-10 border border-accent-violet/10 animate-pulse">
          <Sparkles className="w-10 h-10 stroke-[1.8]" />
        </div>
        
        <div className="space-y-3.5 relative z-10 max-w-sm">
          <h3 className="text-2xl font-black text-foreground font-heading tracking-tight leading-tight">Intelligent Analytics</h3>
          <span className="ios-badge bg-accent-violet-bg text-accent-violet inline-block uppercase mb-1">
            Coming Soon
          </span>
          <p className="text-muted-foreground text-[14.5px] font-medium leading-relaxed">
            We are engineering custom models to fuse your <span className="text-foreground font-semibold">RepCount</span> gym logs and Strava activities. Expect deep performance clustering, fatigue predictions, and load advice.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center relative z-10 pt-2">
          {[
            { label: 'Deep Analysis', icon: <Brain className="w-3 h-3" />, color: 'bg-accent-blue-bg text-accent-blue border-accent-blue/10' },
            { label: 'Fatigue Model', icon: <Cpu className="w-3 h-3" />, color: 'bg-accent-orange-bg text-accent-orange border-accent-orange/10' },
            { label: 'Optimization', icon: <Wand2 className="w-3 h-3" />, color: 'bg-accent-green-bg text-accent-green border-accent-green/10' }
          ].map((tag) => (
            <span 
              key={tag.label} 
              className={`ios-badge flex items-center gap-1.5 px-3.5 py-1.5 border rounded-full text-[10px] font-extrabold uppercase tracking-wider ${tag.color}`}
            >
              {tag.icon}
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
