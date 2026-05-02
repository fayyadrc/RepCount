"use client";

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Activity,
  Target,
  Zap,
  Info,
  BarChart3
} from 'lucide-react';
import {
  useWorkoutStore,
} from '@/lib/workout-store';

// ─── Sample data shown when user has no sessions ───

const SAMPLE_VOLUME_DATA = [
  { name: 'Mon', volume: 4500 },
  { name: 'Tue', volume: 5200 },
  { name: 'Wed', volume: 0 },
  { name: 'Thu', volume: 6100 },
  { name: 'Fri', volume: 4800 },
  { name: 'Sat', volume: 3200 },
  { name: 'Sun', volume: 0 },
];

const SAMPLE_PROGRESSION_DATA = [
  { date: 'Sep 1', weight: 90 },
  { date: 'Sep 15', weight: 92.5 },
  { date: 'Oct 1', weight: 95 },
  { date: 'Oct 15', weight: 97.5 },
  { date: 'Oct 28', weight: 102 },
];

export const Analytics: React.FC = () => {
  const { sessions, loading: sessionsLoading } = useWorkoutStore();
  const [statsData, setStatsData] = React.useState<any>(null);
  const [weeklyVolume, setWeeklyVolume] = React.useState<any[]>([]);
  const [progression, setProgression] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const hasRealData = sessions.length > 0;

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [statsRes, volumeRes] = await Promise.all([
          fetch('http://localhost:8002/api/workouts/stats'),
          fetch('http://localhost:8002/api/workouts/weekly-volume')
        ]);
        
        const stats = await statsRes.json();
        const volume = await volumeRes.json();
        
        setStatsData(stats);
        setWeeklyVolume(volume);

        // Fetch progression for top exercise
        if (hasRealData) {
          const exerciseCounts: Record<string, number> = {};
          sessions.forEach(s => s.entries.forEach(e => {
            const name = e.exercise.toLowerCase();
            exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
          }));
          const topExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
          
          const progRes = await fetch(`http://localhost:8002/api/workouts/progression?exercise=${encodeURIComponent(topExercise)}`);
          const prog = await progRes.json();
          setProgression(prog);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sessions, hasRealData]);

  // ─── Computed metrics ───

  const volumeData = React.useMemo(() => {
    if (!hasRealData || loading) return SAMPLE_VOLUME_DATA;
    return weeklyVolume;
  }, [weeklyVolume, hasRealData, loading]);

  const progressionData = React.useMemo(() => {
    if (!hasRealData || loading || progression.length < 2) return SAMPLE_PROGRESSION_DATA;
    return progression;
  }, [progression, hasRealData, loading]);

  const topExerciseName = React.useMemo(() => {
    if (!hasRealData) return 'Bench Press';
    const exerciseCounts: Record<string, { count: number; name: string }> = {};
    sessions.forEach(s => s.entries.forEach(e => {
      const key = e.exercise.toLowerCase();
      if (!exerciseCounts[key]) exerciseCounts[key] = { count: 0, name: e.exercise };
      exerciseCounts[key].count++;
    }));
    const top = Object.values(exerciseCounts).sort((a, b) => b.count - a.count)[0];
    return top?.name || 'Bench Press';
  }, [sessions, hasRealData]);

  const stats = React.useMemo(() => {
    if (!hasRealData || !statsData) {
      return [
        { label: 'Estimated 1RM', value: '—', detail: 'Log workouts to calculate', icon: TrendingUp },
        { label: 'Total Volume', value: '—', detail: 'No data yet', icon: Activity },
        { label: 'Session Frequency', value: '—', detail: 'Per week', icon: Target },
        { label: 'Sessions Logged', value: '0', detail: 'Get started!', icon: Zap },
      ];
    }

    return [
      {
        label: 'Estimated 1RM',
        value: statsData.estimatedOneRepMax ? `${statsData.estimatedOneRepMax}kg` : '—',
        detail: statsData.estimatedOneRepMax ? 'Epley formula' : 'Insufficient data',
        icon: TrendingUp,
      },
      {
        label: 'Total Volume',
        value: `${statsData.totalVolume.toLocaleString()}kg`,
        detail: `Across ${sessions.length} sessions`,
        icon: Activity,
      },
      {
        label: 'Session Frequency',
        value: `${statsData.sessionFrequency}`,
        detail: 'Avg per week',
        icon: Target,
      },
      {
        label: 'Sessions Logged',
        value: `${sessions.length}`,
        detail: sessions.length >= 5 ? 'Consistent training!' : 'Keep going!',
        icon: Zap,
      },
    ];
  }, [sessions, statsData, hasRealData]);

  return (
    <div className="space-y-10 animate-fade-up">
      <header className="space-y-2">
        <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-primary">Intelligence</h2>
        <p className="text-muted-foreground text-sm">
          {hasRealData
            ? 'Performance trends computed from your logged sessions.'
            : 'Log workouts to see your real data here.'
          }
        </p>
      </header>

      {!hasRealData && (
        <Badge variant="secondary" className="glass-surface border-white/30 text-amber-700">
          <BarChart3 className="w-3 h-3 mr-1" />
          Showing sample data — log a workout to see your own analytics
        </Badge>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`glass-surface rounded-2xl p-5 hover:shadow-lg transition-all duration-300 animate-slide-up stagger-${Math.min(i + 1, 5)}`}
          >
            <div className="flex justify-between items-start mb-4">
              <stat.icon className="w-5 h-5 text-accent" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{stat.label}</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-primary tracking-tight">{stat.value}</p>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                {hasRealData && <TrendingUp className="w-3 h-3" />}
                {stat.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <div className="glass-surface rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Weekly Volume {!hasRealData && '(Sample)'}
            </h3>
            <Info className="w-4 h-4 text-muted-foreground/40 cursor-help" />
          </div>
          <div className="p-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(151, 192, 203, 0.1)' }}
                    contentStyle={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.85)' }}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Progression Chart */}
        <div className="glass-surface rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Progression: {topExerciseName} {!hasRealData && '(Sample)'}
            </h3>
            <Info className="w-4 h-4 text-muted-foreground/40 cursor-help" />
          </div>
          <div className="p-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888' }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.85)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'white', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};