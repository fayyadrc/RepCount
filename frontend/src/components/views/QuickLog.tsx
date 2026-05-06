
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pt-4 pb-24"
    >
      <header>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Log your workout</h2>
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          Start typing in natural language and let RepCount worry about the details.
        </p>
      </header>

      {/* Input Section */}
      <div className="bg-card rounded-[24px] border border-border shadow-sm overflow-hidden min-h-[400px] flex flex-col group relative">
        {/* Action Button - Top Right Circle Tick */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !input.trim()}
            className="w-12 h-12 flex items-center justify-center bg-foreground text-background rounded-full hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-10 shadow-xl shadow-foreground/10 group-focus-within:shadow-foreground/20"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
          </button>
        </div>

        <NotesInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          placeholder="What did you do today?"
        />
      </div>

      {/* Captured Data Section */}
      <AnimatePresence>
        {lastLogged && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.05em]">Captured Exercises</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastLogged.map((entry, idx) => (
                <motion.div 
                  key={entryDisplayIds[idx]}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-secondary/50 rounded-[24px] p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold text-foreground capitalize">{entry.exercise}</h4>
                    <div className="px-3 py-1 bg-background rounded-full border border-border text-[10px] font-bold text-muted-foreground uppercase">
                      SET 1
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Weight</span>
                      <span className="text-lg font-bold text-foreground">{entry.weight}<span className="text-xs text-muted-foreground ml-0.5">{entry.weightUnit}</span></span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Reps</span>
                      <span className="text-lg font-bold text-foreground">{entry.reps}</span>
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="flex items-start gap-1.5 pt-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                      <p className="text-[11px] font-semibold text-muted-foreground line-clamp-2">
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
                className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
              >
                Clear History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};