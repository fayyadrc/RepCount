import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Brain, Zap, AlertTriangle, Loader2 } from 'lucide-react';

interface AIInsightsProps {
  onBack: () => void;
}

interface Insight {
  type: string;
  icon: string;
  color: string;
  text: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ onBack }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ai/insights');
        if (!res.ok) throw new Error('Failed to fetch AI insights');
        const data = await res.json();
        setInsights(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const getIcon = (iconName: string, color: string) => {
    const props = { className: `w-5 h-5` };
    if (color === 'yellow') props.className += ' text-yellow-400';
    else if (color === 'red') props.className += ' text-red-500';
    else props.className += ' text-black';

    switch (iconName) {
      case 'Zap': return <Zap {...props} />;
      case 'Brain': return <Brain {...props} />;
      case 'AlertTriangle': return <AlertTriangle {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pt-4 pb-24"
    >
      <header className="flex items-center gap-4 shrink-0">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight flex items-center gap-2">
            AI Coach <Sparkles className="w-5 h-5 text-black" />
          </h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Smarter training with your data</p>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
          <p className="text-gray-400 font-medium">Generating personalized insights...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="font-bold text-red-700">Failed to load insights</h3>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Insights Cards */}
      {!loading && !error && (
        <div className="flex flex-col gap-4">
          {insights.map((insight, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-full p-6 rounded-3xl space-y-3 ${
                insight.color === 'yellow' ? 'bg-black text-white shadow-lg' : 'bg-[#F2F2F7] border border-gray-100 text-black'
              }`}
            >
              <div className="flex items-center gap-2">
                {getIcon(insight.icon, insight.color)}
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  insight.color === 'yellow' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {insight.type}
                </span>
              </div>
              <p className="font-medium text-base leading-relaxed">
                {insight.text}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
