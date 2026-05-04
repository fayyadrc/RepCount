"use client";

import React from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const Analytics: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 animate-fade-up pt-4"
    >
      <header>
        <h2 className="text-[34px] font-bold tracking-tight text-black leading-tight">
          Progress
        </h2>
      </header>

      {/* Body Stats Card */}
      <div className="bg-[#F2F2F7]/50 rounded-[24px] p-6 space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.05em]">Body Stats</span>
          <button className="text-[#8E8E93] text-[15px] font-medium">Edit</button>
        </div>

        <div className="flex justify-between items-end px-2">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-black">73.5</span>
              <span className="text-[15px] font-semibold text-[#8E8E93]">kg</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              Weight <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1 text-center">
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-3xl font-bold text-black">170</span>
              <span className="text-[15px] font-semibold text-[#8E8E93]">cm</span>
            </div>
            <div className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              Height
            </div>
          </div>

          <div className="space-y-1 text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-3xl font-bold text-black">25.4</span>
            </div>
            <div className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              BMI
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <div className="ios-pill bg-white/60 border border-black/5">MALE</div>
          <div className="ios-pill bg-white/60 border border-black/5">METRIC</div>
        </div>
      </div>

      <div className="h-[2px] bg-gray-50 mx-2" />

      {/* Empty State / Select Exercise */}
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <TrendingUp className="w-20 h-20 text-gray-100" strokeWidth={1} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-black">Select an exercise</h3>
          <p className="text-gray-400 text-[15px] max-w-[260px] mx-auto leading-relaxed">
            Choose an exercise above to view your progress over time.
          </p>
        </div>
      </div>
    </motion.div>
  );
};