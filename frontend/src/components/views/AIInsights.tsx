
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface AIInsightsProps {
  onBack: () => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pt-4 pb-24"
    >
      <header className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight">AI Insights</h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Smarter training with AI</p>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
        <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-xl mb-4">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-black">Coming Soon</h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            We're building advanced AI models to analyze your gym data and Strava activities for personalized training advice.
          </p>
        </div>

        <div className="flex gap-2">
          {['Analysis', 'Predictions', 'Optimization'].map((tag) => (
            <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
