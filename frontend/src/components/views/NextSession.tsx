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
      <div className="space-y-8 pt-2 pb-24">
        <header className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground font-heading">Next Session</h2>
          <p className="text-muted-foreground text-[14px] font-medium leading-relaxed">Suggestions based on your training history.</p>
        </header>
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-card border border-border shadow-sm rounded-[28px] p-8">
          <div className="w-16 h-16 bg-secondary rounded-[20px] flex items-center justify-center">
            <PlusCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground font-heading">Log Your First Workout</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Head to <span className="font-semibold text-foreground">New Session</span> and record a session. RepCount will then generate
              personalized suggestions for your next workout.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-2 pb-24">
      <header className="flex justify-between items-end px-1">
        <div className="space-y-1">
          <span className="ios-badge bg-accent-violet-bg text-accent-violet mb-2 inline-block">
            Progressive Overload
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground font-heading">Next Session</h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Based on {sessions.length} logged session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold font-mono">Suggested Date</p>
          <p className="text-md font-extrabold mt-1 font-heading text-accent-violet">{nextSessionDate}</p>
        </div>
      </header>

      <div className="space-y-5">
        <div className="flex items-center gap-2 text-muted-foreground px-1">
          <Sparkles className="w-4 h-4 text-accent-orange" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] font-mono">Suggestions</h3>
        </div>

        <div className="grid gap-4.5">
          {suggestions.map((s, idx) => (
            <div
              key={s.id}
              className="bg-card border border-border shadow-[0_2px_12px_rgba(0,0,0,0.015)] rounded-[24px] overflow-hidden hover:shadow-md transition-all duration-300 group btn-tap-scale"
            >
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border/50">
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-secondary/80 text-foreground flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <h4 className="text-xl font-extrabold text-foreground capitalize font-heading tracking-tight leading-tight">
                      {s.exercise}
                    </h4>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest font-mono">Weight</p>
                      <p className="text-2xl font-black text-foreground font-mono mt-0.5">{s.weight} <span className="text-xs text-muted-foreground font-sans font-medium uppercase">kg</span></p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest font-mono">Reps</p>
                      <p className="text-2xl font-black text-foreground font-mono mt-0.5">{s.reps} <span className="text-xs text-muted-foreground font-sans font-medium uppercase">reps</span></p>
                    </div>
                    <div className="ml-auto">
                      <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center border border-border/40 group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-4 h-4 text-foreground stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:w-1/3 bg-secondary/25 flex flex-col justify-center">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest font-mono mb-2">Reasoning</p>
                  <p className="text-[12px] font-semibold leading-relaxed text-muted-foreground/90 italic">
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