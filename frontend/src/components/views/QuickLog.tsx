"use client";

import React, { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkoutStore } from '@/lib/workout-store';
import { NotesInput } from '@/components/layout/NotesInput';
import type { WorkoutEntry } from '@/lib/types';

/**
 * Simple mock parser: extracts exercises from natural language input.
 * Looks for common patterns like "80kg bench press 3x8" or "bench press 80kg for 3 sets of 8".
 * Falls back to a sensible mock if parsing fails.
 */
function parseMockWorkout(input: string): WorkoutEntry[] {
  const lines = input.split(/[.\n]+/).map(l => l.trim()).filter(Boolean);
  const entries: WorkoutEntry[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Try to extract weight (number followed by kg/lbs)
    const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(kg|lbs?)/);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
    const weightUnit = weightMatch ? (weightMatch[2] === 'lb' || weightMatch[2] === 'lbs' ? 'lbs' : 'kg') : 'kg';

    // Try to extract sets x reps patterns
    const setsRepsMatch = lower.match(/(\d+)\s*(?:sets?\s*(?:of|x|×)\s*(\d+)|x\s*(\d+))/);
    const sets = setsRepsMatch ? parseInt(setsRepsMatch[1]) : 3;
    const reps = setsRepsMatch ? parseInt(setsRepsMatch[2] || setsRepsMatch[3]) : 10;

    // Also try "for X reps" pattern
    const repsOnlyMatch = !setsRepsMatch ? lower.match(/(\d+)\s*reps/) : null;
    const finalReps = repsOnlyMatch ? parseInt(repsOnlyMatch[1]) : reps;

    // Extract exercise name: remove numbers, units, and common filler words
    let exercise = line
      .replace(/\d+(?:\.\d+)?\s*(kg|lbs?|reps?|sets?)/gi, '')
      .replace(/\b(for|of|x|×|with|felt|did|hit|on)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove trailing/leading punctuation
    exercise = exercise.replace(/^[,.\-–—]+|[,.\-–—]+$/g, '').trim();

    if (!exercise || exercise.length < 2) {
      exercise = 'General Exercise';
    }

    // Capitalize first letter of each word
    exercise = exercise.replace(/\b\w/g, c => c.toUpperCase());

    if (weight > 0 || exercise !== 'General Exercise') {
      entries.push({
        exercise,
        weight: weight || 20,
        weightUnit,
        sets,
        reps: finalReps,
        notes: line.length > 40 ? line.slice(0, 80) + '...' : undefined,
      });
    }
  }

  // If nothing was parsed, return a fallback based on the input
  if (entries.length === 0) {
    entries.push({
      exercise: 'Workout Entry',
      weight: 20,
      weightUnit: 'kg',
      sets: 3,
      reps: 10,
      notes: input.slice(0, 80),
    });
  }

  return entries;
}

export const QuickLog: React.FC = () => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastLogged, setLastLogged] = useState<WorkoutEntry[] | null>(null);
  const { toast } = useToast();
  const { addSession, sessions } = useWorkoutStore();

  // Generate stable IDs for display that don't change on re-render
  const entryDisplayIds = useMemo(() => {
    if (!lastLogged) return [];
    return lastLogged.map((_, idx) => `entry-${Date.now()}-${idx}`);
  }, [lastLogged]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsSubmitting(true);

    // Simulate a brief processing delay
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const result = parseMockWorkout(input);

      // Persist to store
      addSession(result, input);

      setLastLogged(result);
      setInput('');
      toast({
        title: "Workout Processed",
        description: `Successfully logged ${result.length} exercise${result.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Failed to log workout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your workout. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Header */}
      <header className="space-y-2">
        <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-primary">
          New Session
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Tell Synapse about your performance. We&apos;ll handle the numbers.
          {sessions.length > 0 && (
            <span className="ml-2 text-primary/50 font-medium">
              ({sessions.length} session{sessions.length !== 1 ? 's' : ''} logged)
            </span>
          )}
        </p>
      </header>

      {/* Notes-style input */}
      <NotesInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        placeholder="Start typing what you worked out today..."
      />

      {/* Captured data results */}
      {lastLogged && (
        <div className="space-y-5 animate-slide-up">
          <div className="flex items-center gap-2.5 text-primary font-semibold">
            <div
              className="p-1.5 rounded-full"
              style={{ background: 'rgba(34, 197, 94, 0.1)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Captured Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lastLogged.map((entry, idx) => (
              <div
                key={entryDisplayIds[idx]}
                className={`glass-surface p-5 rounded-2xl hover:shadow-lg transition-all duration-300 animate-slide-up stagger-${Math.min(idx + 1, 5)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-primary capitalize text-[15px]">{entry.exercise}</span>
                </div>
                <div className="flex gap-5 text-sm text-muted-foreground">
                  <div>
                    <span className="text-foreground font-semibold">{entry.weight}{entry.weightUnit || 'kg'}</span>
                    <span className="ml-1 text-xs">Weight</span>
                  </div>
                  <div className="h-4 w-px bg-black/10" />
                  <div>
                    <span className="text-foreground font-semibold">{entry.sets} × {entry.reps}</span>
                    <span className="ml-1 text-xs">Sets/Reps</span>
                  </div>
                </div>
                {entry.notes && (
                  <p className="mt-3 text-xs italic text-muted-foreground/70 line-clamp-2">&quot;{entry.notes}&quot;</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};