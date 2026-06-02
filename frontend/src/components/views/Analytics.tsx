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
  ArrowLeft,
  ChevronDown,
  Search,
  X,
  Trophy,
  Flame,
  History,
  Sparkles,
  Plus
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

interface RecommendedExercise {
  name: string;
  defaultWeight: number;
  unit: string;
  reps: number;
  targetSets: number;
  type: 'Compound' | 'Isolation';
  muscle: string;
}

interface RecommendationResult {
  exercise: string;
  recommended_weight: number;
  unit: string;
  confidence: number;          // 0.0 – 1.0
  fatigue_state: 'new' | 'clear' | 'overreaching' | 'severe_fatigue';
  ewma_baseline: number;
  latest_e1rm: number;
  drop_pct: number;
  audit_trail: string;
  sessions_used: number;
  category: string;
}

const SPLIT_CONFIG: Record<'Push' | 'Pull' | 'Legs' | 'Upper' | 'Lower', RecommendedExercise[]> = {
  Push: [
    { name: "Bench Press", defaultWeight: 40, unit: "kg", reps: 8, targetSets: 4, type: "Compound", muscle: "Chest" },
    { name: "Incline Dumbbell Press", defaultWeight: 16, unit: "kg", reps: 10, targetSets: 3, type: "Compound", muscle: "Chest" },
    { name: "Dumbbell Shoulder Press", defaultWeight: 14, unit: "kg", reps: 10, targetSets: 3, type: "Compound", muscle: "Shoulders" },
    { name: "Lateral Raise", defaultWeight: 8, unit: "kg", reps: 12, targetSets: 4, type: "Isolation", muscle: "Shoulders" },
    { name: "Tricep Rope Pushdown", defaultWeight: 15, unit: "kg", reps: 12, targetSets: 3, type: "Isolation", muscle: "Triceps" },
  ],
  Pull: [
    { name: "Pullup", defaultWeight: 0, unit: "kg", reps: 8, targetSets: 3, type: "Compound", muscle: "Back" },
    { name: "Barbell Row", defaultWeight: 40, unit: "kg", reps: 10, targetSets: 4, type: "Compound", muscle: "Back" },
    { name: "Lat Pulldown", defaultWeight: 45, unit: "kg", reps: 10, targetSets: 3, type: "Compound", muscle: "Back" },
    { name: "Bicep Curl", defaultWeight: 12, unit: "kg", reps: 12, targetSets: 3, type: "Isolation", muscle: "Biceps" },
    { name: "Hammer Curl", defaultWeight: 12, unit: "kg", reps: 12, targetSets: 3, type: "Isolation", muscle: "Biceps" },
    { name: "Face Pull", defaultWeight: 17.5, unit: "kg", reps: 15, targetSets: 4, type: "Isolation", muscle: "Shoulders" },
  ],
  Legs: [
    { name: "Barbell Squat", defaultWeight: 60, unit: "kg", reps: 8, targetSets: 4, type: "Compound", muscle: "Quads" },
    { name: "Romanian Deadlift", defaultWeight: 50, unit: "kg", reps: 10, targetSets: 4, type: "Compound", muscle: "Hamstrings" },
    { name: "Leg Press", defaultWeight: 100, unit: "kg", reps: 10, targetSets: 3, type: "Compound", muscle: "Quads" },
    { name: "Leg Curl", defaultWeight: 30, unit: "kg", reps: 12, targetSets: 3, type: "Isolation", muscle: "Hamstrings" },
    { name: "Calf Raise", defaultWeight: 40, unit: "kg", reps: 15, targetSets: 4, type: "Isolation", muscle: "Calves" },
    { name: "Hip Thrust", defaultWeight: 80, unit: "kg", reps: 10, targetSets: 3, type: "Compound", muscle: "Glutes" },
  ],
  Upper: [
    { name: "Bench Press", defaultWeight: 40, unit: "kg", reps: 8, targetSets: 4, type: "Compound", muscle: "Chest" },
    { name: "Pullup", defaultWeight: 0, unit: "kg", reps: 8, targetSets: 3, type: "Compound", muscle: "Back" },
    { name: "Dumbbell Shoulder Press", defaultWeight: 14, unit: "kg", reps: 10, targetSets: 3, type: "Compound", muscle: "Shoulders" },
    { name: "Barbell Row", defaultWeight: 40, unit: "kg", reps: 10, targetSets: 3, type: "Compound", muscle: "Back" },
    { name: "Tricep Rope Pushdown", defaultWeight: 15, unit: "kg", reps: 12, targetSets: 3, type: "Isolation", muscle: "Triceps" },
    { name: "Bicep Curl", defaultWeight: 12, unit: "kg", reps: 12, targetSets: 3, type: "Isolation", muscle: "Biceps" },
  ],
  Lower: [
    { name: "Barbell Squat", defaultWeight: 60, unit: "kg", reps: 8, targetSets: 4, type: "Compound", muscle: "Quads" },
    { name: "Romanian Deadlift", defaultWeight: 50, unit: "kg", reps: 10, targetSets: 4, type: "Compound", muscle: "Hamstrings" },
    { name: "Bulgarian Split Squat", defaultWeight: 12, unit: "kg", reps: 10, targetSets: 3, type: "Compound", muscle: "Quads" },
    { name: "Calf Raise", defaultWeight: 40, unit: "kg", reps: 15, targetSets: 4, type: "Isolation", muscle: "Calves" },
    { name: "Hanging Leg Raise", defaultWeight: 0, unit: "kg", reps: 12, targetSets: 3, type: "Isolation", muscle: "Abs" },
  ]
};

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exercise Filter States
  const [selectedExercise, setSelectedExercise] = useState<ExerciseStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Recommended Workout States
  const [activeSection, setActiveSection] = useState<'general' | 'recommendations'>('general');
  const [activeSplit, setActiveSplit] = useState<'Push' | 'Pull' | 'Legs' | 'Upper' | 'Lower'>('Push');

  // Backend recommendation results, keyed by normalised exercise name
  const [recommendations, setRecommendations] = useState<Record<string, RecommendationResult>>({});
  const [recLoading, setRecLoading] = useState(false);

  // Lookup helper for historical exercise stats
  const findExerciseStats = (name: string): ExerciseStats | null => {
    if (!data?.exercises_by_muscle) return null;
    const searchName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const muscleGroup of Object.values(data.exercises_by_muscle)) {
      for (const stats of muscleGroup) {
        const statsName = stats.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (statsName === searchName || statsName.includes(searchName) || searchName.includes(statsName)) {
          return stats;
        }
      }
    }
    return null;
  };

  // Generate smart recommendations — backend-first, client-side fallback
  const getExerciseRecommendation = (ex: RecommendedExercise) => {
    // 1️⃣  Prefer the backend RecommendationResult if available
    const normalKey = ex.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const backendRec = Object.entries(recommendations).find(([k]) =>
      k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalKey
    )?.[1];

    if (backendRec) {
      const isNew = backendRec.fatigue_state === 'new';
      const weight = backendRec.recommended_weight;
      return {
        weight,
        unit: backendRec.unit,
        reps: ex.reps,
        isNew,
        fatigue_state: backendRec.fatigue_state,
        confidence: backendRec.confidence,
        sessions_used: backendRec.sessions_used,
        reason: backendRec.audit_trail,
        fromBackend: true,
      };
    }

    // 2️⃣  Client-side fallback — use exercise history max_weight if available
    const stats = findExerciseStats(ex.name);
    if (!stats) {
      return {
        weight: ex.defaultWeight,
        unit: ex.unit,
        reps: ex.reps,
        isNew: true,
        fatigue_state: 'new' as const,
        confidence: 0,
        sessions_used: 0,
        reason: `Starting weight calibrated for ${ex.name}. Start comfortable and adjust as needed.`,
        fromBackend: false,
      };
    }

    const isCompound = ex.type === 'Compound';
    const increment = isCompound ? 2.5 : 1.25;
    const recommendedWeight = stats.max_weight + increment;

    return {
      weight: recommendedWeight,
      unit: stats.unit,
      reps: ex.reps,
      isNew: false,
      fatigue_state: 'clear' as const,
      confidence: 0,
      sessions_used: 0,
      reason: `Based on your all-time best of ${stats.max_weight}${stats.unit}. Added +${increment}${stats.unit} for progressive overload.`,
      fromBackend: false,
    };
  };

  // Natural language formatter to link to QuickLog view
  const handleLogWorkout = (splitName: string, exercises: RecommendedExercise[]) => {
    const rawTextLines = [`${splitName} Workout - Recommended Split` ];
    
    exercises.forEach(ex => {
      const rec = getExerciseRecommendation(ex);
      if (rec.weight > 0) {
        rawTextLines.push(`${ex.name}: ${ex.targetSets} sets of ${rec.reps} reps at ${rec.weight}${rec.unit}`);
      } else {
        rawTextLines.push(`${ex.name}: ${ex.targetSets} sets of ${rec.reps} bodyweight reps`);
      }
    });

    const rawText = rawTextLines.join('\n');
    localStorage.setItem('gym_tracker_draft', rawText);
    (window as any).setActiveView?.('quick-log');
  };

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

    const fetchRecommendations = async () => {
      try {
        setRecLoading(true);
        // Collect every unique exercise across all 5 splits
        const allExercises = Array.from(
          new Set(
            Object.values(SPLIT_CONFIG).flatMap(split => split.map(ex => ex.name))
          )
        );
        const qs = encodeURIComponent(allExercises.join(','));
        const res = await fetch(`/api/recommendations?exercises=${qs}`);
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        const recs: RecommendationResult[] = await res.json();
        // Key by exercise name for O(1) lookup
        const map: Record<string, RecommendationResult> = {};
        recs.forEach(r => { map[r.exercise] = r; });
        setRecommendations(map);
      } catch (err) {
        console.warn('Recommendation fetch failed, falling back to heuristics:', err);
      } finally {
        setRecLoading(false);
      }
    };

    fetchAnalytics();
    fetchRecommendations();
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

  if (activeSection === 'recommendations') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 pt-2 pb-24"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setActiveSection('general')}
            className="flex items-center gap-2 px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground rounded-full text-xs font-bold font-heading border border-border hover:border-border/80 transition-all btn-tap-scale shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            Back
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue-bg rounded-full border border-accent-blue/10 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <Sparkles className="w-3.5 h-3.5 text-accent-blue fill-accent-blue/10" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-blue font-heading">AI Assistant</span>
          </div>
        </div>

        <div className="space-y-1.5 px-1 font-heading">
          <h2 className="text-3xl font-black tracking-tight text-foreground leading-tight">Recommended Routines</h2>
          <p className="text-muted-foreground text-sm font-semibold font-sans leading-relaxed">Select a split below. We have analyzed your lifting history to recommend target weights for progressive overload.</p>
        </div>

        {/* iOS-style Segmented Tab Controller */}
        <div className="px-1">
          <div className="bg-secondary/40 p-1.5 rounded-[22px] border border-border/80 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
            {(['Push', 'Pull', 'Legs', 'Upper', 'Lower'] as const).map((split) => {
              const isActive = activeSplit === split;
              const splitIcons = {
                Push: <Flame className="w-3.5 h-3.5" />,
                Pull: <Dumbbell className="w-3.5 h-3.5" />,
                Legs: <TrendingUp className="w-3.5 h-3.5" />,
                Upper: <Activity className="w-3.5 h-3.5" />,
                Lower: <Calendar className="w-3.5 h-3.5" />
              };
              
              return (
                <button
                  key={split}
                  onClick={() => setActiveSplit(split)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[18px] text-xs font-black font-heading transition-all whitespace-nowrap btn-tap-scale ${
                    isActive
                      ? 'bg-card text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {splitIcons[split]}
                  <span className="hidden sm:inline">{split} Split</span>
                  <span className="sm:hidden">{split}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercises in current split - Asymmetric Premium Cards */}
        <div className="space-y-6 px-1">
          {SPLIT_CONFIG[activeSplit].map((ex, index) => {
            const rec = getExerciseRecommendation(ex);

            // ── Fatigue badge config ──────────────────────────────────────
            const fatigueBadge: Record<string, { label: string; cls: string }> = {
              new:            { label: 'Calibrating',   cls: 'bg-accent-orange-bg text-accent-orange' },
              clear:          { label: 'Overload Ready', cls: 'bg-accent-green-bg text-accent-green' },
              overreaching:   { label: 'Scaled Load',   cls: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
              severe_fatigue: { label: 'Deload',        cls: 'bg-red-500/10 text-red-500' },
            };
            const badge = fatigueBadge[rec.fatigue_state] ?? fatigueBadge['clear'];

            // ── Confidence bar ─────────────────────────────────────────────
            const confidencePct = Math.round((rec.confidence ?? 0) * 100);
            const sessionsUsed = rec.sessions_used ?? 0;

            return (
              <motion.div
                key={ex.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-[28px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-300 group flex flex-col md:flex-row btn-tap-scale"
              >
                {/* Main panel (left/top) */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6 border-b md:border-b-0 md:border-r border-border/50">
                  {/* Category/Type Indicators */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="ios-badge bg-secondary text-muted-foreground uppercase text-[9px] py-0.5 tracking-wider">
                        {ex.muscle}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-mono">
                        {ex.type}
                      </span>
                    </div>

                    <span className={`ios-badge uppercase text-[9.5px] font-black ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Title & Large Metric Display */}
                  <div className="space-y-4">
                    <h4 className="text-2xl font-black text-foreground font-heading tracking-tight leading-tight group-hover:text-accent-blue transition-colors">
                      {ex.name}
                    </h4>

                    {/* Numeric target blocks */}
                    <div className="flex items-end gap-8 pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest font-mono">Target Weight</span>
                        <p className="text-3xl font-black text-foreground font-mono mt-0.5 leading-none tracking-tight">
                          {rec.weight > 0 ? (
                            <>
                              {rec.weight}{' '}
                              <span className="text-[11px] font-bold text-muted-foreground font-sans uppercase">kg</span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-muted-foreground font-sans">Bodyweight</span>
                          )}
                        </p>
                      </div>

                      <div className="h-10 w-px bg-border/80" />

                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest font-mono">Routine Sets</span>
                        <p className="text-3xl font-black text-foreground font-mono mt-0.5 leading-none tracking-tight">
                          {ex.targetSets}{' '}
                          <span className="text-[11px] font-bold text-muted-foreground font-sans uppercase">sets</span>
                        </p>
                      </div>

                      <div className="h-10 w-px bg-border/80" />

                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest font-mono">Target Reps</span>
                        <p className="text-3xl font-black text-foreground font-mono mt-0.5 leading-none tracking-tight">
                          {rec.reps}{' '}
                          <span className="text-[11px] font-bold text-muted-foreground font-sans uppercase">reps</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  {rec.fromBackend && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-black text-muted-foreground/50 tracking-widest font-mono">
                          Engine Confidence
                        </span>
                        <span className="text-[9px] font-black font-mono text-muted-foreground/70">
                          {sessionsUsed}/{12} sessions · {confidencePct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${confidencePct}%` }}
                          transition={{ duration: 0.6, delay: index * 0.05 + 0.2, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            confidencePct >= 80 ? 'bg-accent-green' :
                            confidencePct >= 40 ? 'bg-accent-blue' :
                            'bg-accent-orange'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit Trail / Reasoning Sidebar (right/bottom) */}
                <div className="p-6 md:w-[32%] bg-secondary/25 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/5 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center gap-1.5 mb-2 select-none">
                    <Sparkles className="w-3.5 h-3.5 text-accent-blue shrink-0" />
                    <span className="text-[9px] uppercase font-black text-accent-blue tracking-widest font-mono">
                      {rec.fromBackend ? 'Audit Trail' : 'AI Suggestion'}
                    </span>
                  </div>

                  {recLoading && !rec.fromBackend ? (
                    <div className="flex items-center gap-2 text-muted-foreground/60">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[11px] font-semibold">Analysing sessions…</span>
                    </div>
                  ) : (
                    <p className="text-[12px] font-semibold leading-relaxed text-muted-foreground/90 italic relative z-10">
                      &ldquo;{rec.reason}&rdquo;
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Log split */}
        <div className="pt-4 px-1">
          <button
            onClick={() => handleLogWorkout(activeSplit, SPLIT_CONFIG[activeSplit])}
            className="w-full py-4.5 bg-accent-blue hover:bg-accent-blue/90 text-white font-extrabold tracking-tight rounded-2xl shadow-lg shadow-accent-blue/10 hover:shadow-accent-blue/20 transition-all duration-300 text-sm tracking-wide text-center flex items-center justify-center gap-2 btn-tap-scale"
          >
            <Plus className="w-4 h-4 stroke-[3.5] text-white" />
            Log {activeSplit} Workout
          </button>
        </div>
      </motion.div>
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
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection('recommendations')}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-accent-blue-bg text-accent-blue border border-accent-blue/20 rounded-full hover:bg-accent-blue-bg/85 transition-all duration-250 shadow-[0_4px_12px_rgba(0,0,0,0.03)] btn-tap-scale text-xs font-extrabold font-heading"
            title="Recommended Workouts"
          >
            <Sparkles className="w-3.5 h-3.5 fill-accent-blue/10" />
            Routines
          </button>
          <button
            onClick={() => (window as any).setActiveView?.('ai-insights')}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-250 shadow-[0_4px_14px_rgba(0,0,0,0.1)] btn-tap-scale text-xs font-bold font-heading"
            title="AI Insights"
          >
            Insights
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
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
          {/* Recommended routines banner */}
          <div className="px-1">
            <button
              onClick={() => setActiveSection('recommendations')}
              className="w-full relative overflow-hidden bg-gradient-to-br from-accent-violet-bg via-accent-violet-bg/60 to-accent-blue-bg/40 border border-accent-violet/20 hover:border-accent-violet/30 rounded-[28px] p-6 text-left shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all group btn-tap-scale"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-accent-violet/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-accent-violet/15 transition-all" />
              <div className="absolute bottom-0 right-12 w-32 h-32 bg-accent-blue/5 rounded-full blur-2xl -mr-6 -mb-6" />
              
              <div className="flex items-start justify-between">
                <div className="space-y-2 max-w-[70%]">
                  <span className="ios-badge bg-accent-violet/15 text-accent-violet mb-1.5 inline-block">
                    AI Recommended Splits
                  </span>
                  <h3 className="text-xl font-extrabold text-foreground font-heading tracking-tight leading-tight">
                    Ready for your next session?
                  </h3>
                  <p className="text-muted-foreground text-xs font-semibold leading-relaxed mt-1">
                    View personalized workout recommendations for Push, Pull, Legs, Upper, and Lower splits computed using progressive overload.
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent-violet text-accent-violet-bg rounded-2xl flex items-center justify-center shadow-lg shadow-accent-violet/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 fill-accent-violet-bg/30" />
                </div>
              </div>
              
              <div className="flex items-center gap-1 mt-5 text-[11px] font-black text-accent-violet uppercase tracking-wider font-heading">
                View Recommendations
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

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
