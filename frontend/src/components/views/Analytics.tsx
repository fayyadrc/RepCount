import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Calendar,
  Dumbbell,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronDown,
  Search,
  X,
  Trophy,
  Flame,
  History
} from 'lucide-react';

interface ExerciseHistoryPoint {
  date: string;
  weight: number;
  reps: number;
  volume: number;
  est_1rm: number;
}

interface ExerciseStats {
  name: string;
  max_weight: number;
  unit: string;
  total_sets: number;
  total_reps: number;
  total_volume: number;
  history: ExerciseHistoryPoint[];
}

type ExercisesByMuscle = Record<string, ExerciseStats[]>;

interface AnalyticsData {
  total_workouts: number;
  workouts_this_week: number;
  volume_per_muscle: { muscle: string; volume: number }[];
  most_trained: string;
  least_trained: string;
  gym_session_count: number;
  strava_activity_count: number;
  exercises_by_muscle?: ExercisesByMuscle;
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

  // Exercise Filter States
  const [selectedExercise, setSelectedExercise] = useState<ExerciseStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

      {/* Exercise Filter Dropdown */}
      {data.exercises_by_muscle && Object.keys(data.exercises_by_muscle).length > 0 && (
        <div className="relative z-50 px-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest font-heading">
              Filter by Exercise
            </span>
            {selectedExercise && (
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-[10.5px] font-bold text-accent-blue hover:text-accent-blue/80 flex items-center gap-0.5 transition-colors font-heading"
              >
                Clear Filter
              </button>
            )}
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full mt-2 flex items-center justify-between px-5 py-4 ios-card bg-card border border-border hover:border-border/80 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent-blue-bg text-accent-blue shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Active Selection</p>
                <p className="text-sm font-black text-foreground font-heading mt-0.5">
                  {selectedExercise ? selectedExercise.name : "All Exercises"}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-250 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/5"
                  onClick={() => setIsDropdownOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.99 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 mt-2 p-3 bg-card border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-md z-50 max-h-[380px] overflow-y-auto space-y-3"
                >
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-secondary text-foreground text-xs font-semibold rounded-xl border border-transparent focus:border-accent-blue/30 focus:outline-none transition-all"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Exercises Options */}
                  <div className="space-y-4 overflow-y-auto max-h-[260px] pr-1">
                    {(!searchQuery || "all exercises general dashboard".includes(searchQuery.toLowerCase())) && (
                      <button
                        onClick={() => {
                          setSelectedExercise(null);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all text-xs font-bold font-heading ${selectedExercise === null
                          ? 'bg-accent-blue-bg text-accent-blue'
                          : 'hover:bg-secondary text-foreground'
                          }`}
                      >
                        <span>General</span>
                      </button>
                    )}

                    {Object.entries(data.exercises_by_muscle || {}).map(([muscle, exercises]) => {
                      const filtered = exercises.filter(ex =>
                        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) return null;

                      return (
                        <div key={muscle} className="space-y-1.5">
                          <div className="px-2 py-0.5 text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest font-heading border-b border-border/40">
                            {muscle}
                          </div>
                          <div className="space-y-1">
                            {filtered.map((ex) => (
                              <button
                                key={ex.name}
                                onClick={() => {
                                  // Find current stats
                                  setSelectedExercise(ex);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${selectedExercise?.name === ex.name
                                  ? 'bg-accent-blue-bg text-accent-blue'
                                  : 'hover:bg-secondary text-foreground'
                                  }`}
                              >
                                <span className="text-xs font-bold font-heading truncate max-w-[190px]">
                                  {ex.name}
                                </span>
                                <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-card/60 rounded-md border border-border/30 text-muted-foreground/90 shrink-0">
                                  Max: {ex.max_weight} {ex.unit}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Dynamic Views Rendering */}
      {selectedExercise ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Trophy className="w-4 h-4" />}
              label="All-Time Best"
              value={selectedExercise.max_weight}
              subtext={`Lifting unit: ${selectedExercise.unit}`}
              accent="orange"
            />
            <StatCard
              icon={<Flame className="w-4 h-4" />}
              label="Total Sets"
              value={selectedExercise.total_sets}
              subtext={`${selectedExercise.total_reps} reps logged`}
              accent="violet"
            />
          </div>

          {/* Volume Insights */}
          <div className="ios-card bg-card border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-accent-green-bg text-accent-green shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest font-heading">Total Load Moved</span>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-1">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Exercise Volume</p>
                <p className="text-2xl font-black text-foreground font-heading tracking-tight leading-tight">
                  {selectedExercise.total_volume.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">{selectedExercise.unit}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Avg Reps / Set</p>
                <p className="text-2xl font-black text-foreground font-heading tracking-tight leading-tight">
                  {selectedExercise.total_sets > 0 ? (selectedExercise.total_reps / selectedExercise.total_sets).toFixed(1) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Strength Progression Chart */}
          <div className="ios-card bg-card p-6 border border-border space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent-blue-bg text-accent-blue shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest font-heading">Strength Progression</span>
              </div>
              <span className="ios-badge bg-secondary text-muted-foreground font-mono uppercase text-[9px] font-bold">
                Chronological • {selectedExercise.unit}
              </span>
            </div>

            <div className="h-[250px] w-full pr-2">
              {selectedExercise.history && selectedExercise.history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedExercise.history} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fontWeight: 600, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-heading)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(str) => {
                        try {
                          const dateObj = new Date(str);
                          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        } catch {
                          return str;
                        }
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--card))',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                        fontSize: '12px'
                      }}
                      labelFormatter={(str) => `Date: ${new Date(str).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--accent-blue))"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: 'hsl(var(--accent-blue))', strokeWidth: 2, fill: 'hsl(var(--card))' }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--accent-blue))', strokeWidth: 2, fill: 'hsl(var(--accent-blue))' }}
                      name="Max Weight"
                    />
                    {selectedExercise.unit === "kg" && (
                      <Line
                        type="monotone"
                        dataKey="est_1rm"
                        stroke="hsl(var(--accent-violet))"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, stroke: 'hsl(var(--accent-violet))', strokeWidth: 1, fill: 'hsl(var(--card))' }}
                        activeDot={{ r: 5 }}
                        name="Est. 1RM"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">
                  No history data available for this exercise.
                </div>
              )}
            </div>

            {selectedExercise.unit === "kg" && (
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-semibold justify-center pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-accent-blue inline-block rounded-full" />
                  <span>Max Weight</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-accent-violet border-dashed border-t-2 inline-block" />
                  <span>Est. 1-Rep Max (1RM)</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedExercise(null)}
            className="w-full py-4 text-xs font-bold font-heading text-accent-blue bg-accent-blue-bg border border-accent-blue/20 rounded-2xl hover:bg-accent-blue-bg/85 transition-all text-center flex items-center justify-center gap-1.5"
          >
            Show General Analytics Overview
          </button>
        </motion.div>
      ) : (
        /* General Overview Dashboard */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
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
      )}
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
