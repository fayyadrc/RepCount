"use client";

import React, { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkoutStore } from '@/lib/workout-store';
import { NotesInput } from '@/components/layout/NotesInput';
import type { WorkoutEntry } from '@/lib/types';

interface APIParsedWorkoutEntry {
  date: string;
  exercise_name: string;
  weight: number | null;
  unit: string;
  reps: number;
  failure: boolean;
  rir: number | null;
}

interface APIParsedWorkoutLog {
  entries: APIParsedWorkoutEntry[];
}

// Adjust this if your FastAPI backend runs on a different port/host
const API_BASE_URL = "/api";

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

    const payload = { raw_text: input };
    console.log('Sending payload:', payload);

    try {
      // Call the FastAPI endpoint we just built
      const response = await fetch(`${API_BASE_URL}/log/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Grab any JSON error the server sent (otherwise fallback to plain text)
        const errorData = await response.json().catch(async () => {
          const text = await response.text();
          return { detail: text || 'Unknown server error' };
        });
        
        console.error('Server error response:', errorData);
        const errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail) || 'Failed to parse workout on the server';
        throw new Error(errorMessage);
      }

      const jsonResponse = await response.json();
      const parsedData: APIParsedWorkoutLog = jsonResponse.data;

      // Map the flat API entries into the WorkoutEntry[] shape the UI expects
      const result: WorkoutEntry[] = parsedData.entries.map((entry) => ({
        exercise: entry.exercise_name,
        weight: entry.weight ?? 0,
        weightUnit: entry.unit || 'kg',
        sets: 1, // Gemini parses individual lines as individual sets
        reps: entry.reps,
        notes: `${entry.failure ? 'To failure. ' : ''}${entry.rir !== null ? `RIR ${entry.rir}. ` : ''}${entry.notes || ''}`.trim(),
      }));

      if (result.length === 0) {
        throw new Error("No workout data could be extracted.");
      }

      // Persist to store
      addSession(result, input);

      setLastLogged(result);
      setInput('');
      toast({
        title: "Workout Processed",
        description: `Successfully logged ${result.length} set${result.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Failed to log workout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your workout. Please try again.",
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
          Tell RepCout about your performance. We&apos;ll handle the numbers.
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
        placeholder="Start typing what you worked out today... (e.g., Bench Press 80kg 3x8)"
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