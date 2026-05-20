
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

const COLORS = [
  'hsl(var(--accent-blue))',
  'hsl(var(--accent-orange))',
  'hsl(var(--accent-violet))',
  'hsl(var(--accent-green))',
];

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
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
        <p className="text-muted-foreground font-semibold font-heading text-sm">Analyzing your progress...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <div>
          <h3 className="text-xl font-bold text-foreground font-heading">Analytics Unavailable</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
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
      className="space-y-8 pt-2 pb-24"
    >
      <header className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground font-heading">Analytics</h2>
          <p className="text-muted-foreground text-sm font-medium">Your performance at a glance</p>
        </div>
        <button 
          onClick={() => (window as any).setActiveView?.('ai-insights')}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-250 shadow-[0_4px_14px_rgba(0,0,0,0.1)] btn-tap-scale text-xs font-bold font-heading"
          title="AI Insights"
        >
          AI Insights
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<TrendingUp className="w-4 h-4" />}
          label="Active Days"
          value={data.total_workouts}
          subtext={`${data.gym_session_count} Gym • ${data.strava_activity_count} Strava`}
          accent="blue"
        />
        <StatCard 
          icon={<Calendar className="w-4 h-4" />}
          label="This Week"
          value={data.workouts_this_week}
          subtext="Activities"
          accent="violet"
        />
      </div>

      {/* Focus Insights */}
      <div className="ios-card bg-card border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-accent-orange-bg text-accent-orange shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest font-heading">Focus Distribution</span>
        </div>
        
        <div className="grid grid-cols-2 gap-8 pt-1">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Most Trained</p>
            <p className="text-2xl font-black text-foreground font-heading tracking-tight leading-tight">{data.most_trained}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Least Trained</p>
            <p className="text-2xl font-black text-foreground font-heading tracking-tight leading-tight">{data.least_trained}</p>
          </div>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="ios-card bg-card p-6 border border-border space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent-green-bg text-accent-green shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest font-heading">Volume by Muscle Group</span>
          </div>
          <span className="ios-badge bg-secondary text-muted-foreground font-mono">kg • ALL TIME</span>
        </div>

        <div className="h-[250px] w-full pr-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.volume_per_muscle} layout="vertical" margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="muscle" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-heading)' }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--secondary) / 0.4)', radius: 6 }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: '1px solid hsl(var(--border))', 
                  background: 'hsl(var(--card))',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px'
                }}
                labelStyle={{ fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                itemStyle={{ fontWeight: '600', color: 'hsl(var(--accent-blue))' }}
              />
              <Bar 
                dataKey="volume" 
                fill="hsl(var(--foreground))" 
                radius={[0, 6, 6, 0]}
                barSize={18}
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext: string;
  accent?: 'blue' | 'orange' | 'violet' | 'green';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, accent = 'blue' }) => {
  const accentColors = {
    blue: 'bg-accent-blue-bg text-accent-blue',
    orange: 'bg-accent-orange-bg text-accent-orange',
    violet: 'bg-accent-violet-bg text-accent-violet',
    green: 'bg-accent-green-bg text-accent-green',
  };

  return (
    <div className="ios-card bg-card border border-border p-5 space-y-3 btn-tap-scale">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-xl shrink-0 ${accentColors[accent]}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-heading">{label}</span>
      </div>
      <div>
        <div className="text-3xl font-black text-foreground font-mono tracking-tight">{value}</div>
        <p className="text-[10.5px] font-semibold text-muted-foreground/80 mt-1 leading-relaxed">{subtext}</p>
      </div>
    </div>
  );
};
