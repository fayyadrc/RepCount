
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, Loader2, Sparkles, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkoutStore } from '@/lib/workout-store';
import { NotesInput } from '@/components/layout/NotesInput';
import type { WorkoutEntry } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface APIParsedWorkoutEntry {
  date: string;
  exercise_name: string;
  weight: number | null;
  unit: string;
  reps: number;
  failure: boolean;
  rir: number | null;
  notes?: string;
}

interface APIParsedWorkoutLog {
  entries: APIParsedWorkoutEntry[];
}

const API_BASE_URL = "/api";

export const QuickLog: React.FC = () => {
  const STORAGE_KEY = 'gym_tracker_draft';
  const [input, setInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || '';
    }
    return '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastLogged, setLastLogged] = useState<WorkoutEntry[] | null>(null);
  const { toast } = useToast();
  const { addSession, sessions } = useWorkoutStore();

  // Autosave draft on input change
  useEffect(() => {
    if (input.trim()) {
      localStorage.setItem(STORAGE_KEY, input);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [input]);

  const entryDisplayIds = useMemo(() => {
    if (!lastLogged) return [];
    return lastLogged.map((_, idx) => `entry-${Date.now()}-${idx}`);
  }, [lastLogged]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsSubmitting(true);
    const payload = { raw_text: input };

    try {
      const response = await fetch(`${API_BASE_URL}/log/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(async () => {
          const text = await response.text();
          return { detail: text || 'Unknown server error' };
        });
        throw new Error(errorData.detail || 'Failed to parse workout');
      }

      const jsonResponse = await response.json();
      const parsedData: APIParsedWorkoutLog = jsonResponse.data;

      const result: WorkoutEntry[] = parsedData.entries.map((entry) => ({
        exercise: entry.exercise_name,
        weight: entry.weight ?? 0,
        weightUnit: entry.unit || 'kg',
        sets: 1, 
        reps: entry.reps,
        notes: `${entry.failure ? 'To failure. ' : ''}${entry.rir !== null ? `RIR ${entry.rir}. ` : ''}${entry.notes || ''}`.trim(),
      }));

      if (result.length === 0) throw new Error("No workout data could be extracted.");

      addSession(result, input);
      setLastLogged(result);
      setInput('');
      localStorage.removeItem(STORAGE_KEY);
      toast({
        title: "Workout Processed",
        description: `Successfully logged ${result.length} sets.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your workout.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pt-2 pb-24"
    >
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight font-heading">Log your workout</h2>
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin text-accent-blue" />}
        </div>
        <p className="text-muted-foreground text-[14px] font-medium leading-relaxed max-w-xl">
          Start typing in natural language and let <span className="font-semibold text-foreground">RepCount</span> worry about the details.
        </p>
      </header>

      {/* Input Section */}
      <div className="bg-card rounded-[28px] border border-border shadow-sm focus-within:shadow-md focus-within:border-border/80 overflow-hidden min-h-[380px] flex flex-col group relative transition-all duration-300">
        {/* Action Button - Floating Circular Submit Button in bottom right */}
        <div className="absolute bottom-6 right-6 z-10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !input.trim()}
            className="w-14 h-14 flex items-center justify-center bg-foreground text-background rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-lg shadow-foreground/10 group-focus-within:shadow-foreground/20 btn-tap-scale"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-7 h-7 stroke-[2.5]" />}
          </button>
        </div>

        <NotesInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          placeholder="e.g. Benched 80kg for 8 reps, followed by 10 reps to failure..."
        />
        
        {/* Subtle keyboard shortcut indicator */}
        <div className="px-8 pb-6 text-[11px] font-bold text-muted-foreground font-mono uppercase tracking-wider select-none pointer-events-none">
          Press ⌘ + Enter to log
        </div>
      </div>

      {/* Captured Data Section */}
      <AnimatePresence>
        {lastLogged && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6 pt-4"
          >
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-accent-orange" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] font-mono">Captured Exercises</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lastLogged.map((entry, idx) => (
                <motion.div 
                  key={entryDisplayIds[idx]}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card rounded-[24px] border border-border p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-lg font-bold text-foreground capitalize font-heading leading-tight">{entry.exercise}</h4>
                    <span className="ios-badge bg-accent-orange-bg text-accent-orange shrink-0">
                      SET 1
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Weight</span>
                      <span className="text-xl font-extrabold text-foreground font-mono mt-0.5">
                        {entry.weight}
                        <span className="text-xs text-muted-foreground ml-0.5 font-sans font-medium uppercase">{entry.weightUnit}</span>
                      </span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Reps</span>
                      <span className="text-xl font-extrabold text-foreground font-mono mt-0.5">{entry.reps}</span>
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="flex items-start gap-2 pt-3 border-t border-border/50">
                      <Check className="w-4 h-4 text-accent-green mt-0.5 shrink-0" strokeWidth={2.5} />
                      <p className="text-[12px] font-semibold text-muted-foreground leading-normal">
                        {entry.notes}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => setLastLogged(null)}
                className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors font-mono btn-tap-scale"
              >
                Clear captured log
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};