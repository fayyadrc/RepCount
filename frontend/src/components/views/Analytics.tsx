
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Calendar, 
  Dumbbell,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';

interface AnalyticsData {
  total_workouts: number;
  workouts_this_week: number;
  volume_per_muscle: { muscle: string; volume: number }[];
  most_trained: string;
  least_trained: string;
  gym_session_count: number;
  strava_activity_count: number;
}

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#E5E5E5'];

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <p className="text-gray-400 font-medium">Analyzing your progress...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div>
          <h3 className="text-xl font-bold text-black">Analytics Unavailable</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
            {error || 'We couldn\'t load your analytics data at this time.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pt-4 pb-24"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight">Analytics</h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Your performance at a glance</p>
        </div>
        <button 
          onClick={() => (window as any).setActiveView?.('ai-insights')}
          className="p-3 bg-black text-white rounded-full hover:bg-black/80 transition-colors shadow-lg"
          title="AI Insights"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<TrendingUp className="w-4 h-4" />}
          label="Active Days"
          value={data.total_workouts}
          subtext={`${data.gym_session_count} Gym • ${data.strava_activity_count} Strava`}
        />
        <StatCard 
          icon={<Calendar className="w-4 h-4" />}
          label="This Week"
          value={data.workouts_this_week}
          subtext="Activities"
        />
      </div>

      {/* Focus Insights */}
      <div className="bg-[#F2F2F7]/50 rounded-[24px] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-black" />
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.05em]">Focus Distribution</span>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase">Most Trained</p>
            <p className="text-xl font-bold text-black">{data.most_trained}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase">Least Trained</p>
            <p className="text-xl font-bold text-black">{data.least_trained}</p>
          </div>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-black" />
            <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.05em]">Volume by Muscle Group</span>
          </div>
          <span className="text-[10px] font-bold text-[#8E8E93] uppercase">kg • ALL TIME</span>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.volume_per_muscle} layout="vertical" margin={{ left: -20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="muscle" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 600, fill: '#000' }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: '#F2F2F7' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar 
                dataKey="volume" 
                fill="#000000" 
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {data.volume_per_muscle.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </motion.div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number | string, subtext: string }> = ({ icon, label, value, subtext }) => (
  <div className="bg-[#F2F2F7]/50 rounded-[24px] p-5 space-y-3">
    <div className="flex items-center gap-2">
      <div className="text-black">{icon}</div>
      <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">{label}</span>
    </div>
    <div>
      <div className="text-3xl font-bold text-black">{value}</div>
      <p className="text-[10px] font-semibold text-gray-400 mt-1">{subtext}</p>
    </div>
  </div>
);
