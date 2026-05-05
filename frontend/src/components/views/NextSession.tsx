"use client";

import React, { useMemo } from 'react';
import { AISuggestion } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Dumbbell, PlusCircle } from 'lucide-react';
import { useWorkoutStore } from '@/lib/workout-store';

/**
 * Generate mock suggestions based on the user's logged sessions.
 * Applies simple progressive overload logic (add 2.5kg or 1-2 reps).
 */
function generateMockSuggestions(sessions: { entries: { exercise: string; weight: number; reps: number; sets: number }[] }[]): AISuggestion[] {
  if (sessions.length === 0) return [];

  // Gather unique exercises with their latest weight/reps
  const exerciseMap = new Map<string, { weight: number; reps: number }>();

  // Go oldest→newest so the map ends up with the most recent values
  [...sessions].reverse().forEach(session => {
    session.entries.forEach(entry => {
      exerciseMap.set(entry.exercise.toLowerCase(), {
        weight: entry.weight,
        reps: entry.reps,
      });
    });
  });

  const suggestions: AISuggestion[] = [];
  let idx = 0;

  exerciseMap.forEach((latest, exerciseName) => {
    if (idx >= 5) return; // Max 5 suggestions

    // Simple progressive overload: bump weight by 2.5kg or reps by 1-2
    const bumpWeight = idx % 2 === 0;
    const newWeight = bumpWeight ? latest.weight + 2.5 : latest.weight;
    const newReps = bumpWeight ? latest.reps : Math.min(latest.reps + 2, 20);

    suggestions.push({
      id: `suggestion-${idx + 1}`,
      exercise: exerciseName.replace(/\b\w/g, c => c.toUpperCase()),
      weight: newWeight,
      reps: newReps,
      reason: bumpWeight
        ? `You hit ${latest.weight}kg for ${latest.reps} reps last time. Bumping to ${newWeight}kg for progressive overload while maintaining rep count.`
        : `Maintaining ${latest.weight}kg but increasing to ${newReps} reps to build endurance before adding more weight.`,
    });
    idx++;
  });

  return suggestions;
}

export const NextSession: React.FC = () => {
  const { sessions } = useWorkoutStore();

  const suggestions = useMemo(() => generateMockSuggestions(sessions), [sessions]);

  // Compute a realistic "next session" date
  const nextSessionDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // ─── Empty state: no logged sessions ───
  if (sessions.length === 0) {
    return (
      <div className="space-y-10 animate-fade-up">
        <header className="space-y-2">
          <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-primary">Next Session</h2>
          <p className="text-muted-foreground text-sm">Suggestions based on your training history.</p>
        </header>
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 glass-surface rounded-full flex items-center justify-center">
            <PlusCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Log Your First Workout</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Head to Quick Log and record a session. RepCount will then generate
              personalized suggestions for your next workout.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-up">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <Badge
            variant="secondary"
            className="glass-surface border-white/30 text-primary mb-2"
          >
            Progressive Overload
          </Badge>
          <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-primary">Next Session</h2>
          <p className="text-muted-foreground text-sm">
            Based on {sessions.length} logged session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Suggested Date</p>
          <p className="text-lg font-bold">{nextSessionDate}</p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary/70 mb-2">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Suggestions</h3>
        </div>

        <div className="grid gap-4">
          {suggestions.map((s, idx) => (
            <div
              key={s.id}
              className={`glass-surface rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group animate-slide-up stagger-${Math.min(idx + 1, 5)}`}
            >
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 glass-surface rounded-xl">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="text-xl font-bold text-primary capitalize tracking-tight">
                      {s.exercise}
                    </h4>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Weight</p>
                      <p className="text-2xl font-black text-primary">{s.weight} <span className="text-sm font-medium">kg</span></p>
                    </div>
                    <div className="h-8 w-px bg-black/10" />
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Reps</p>
                      <p className="text-2xl font-black text-primary">{s.reps} <span className="text-sm font-medium">reps</span></p>
                    </div>
                    <div className="ml-auto">
                      <div className="p-2 rounded-full glass-surface group-hover:bg-white/40 transition-all duration-200">
                        <ArrowRight className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:w-1/3 bg-black/[0.02]">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Reasoning</p>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    {s.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};