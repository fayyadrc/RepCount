
"use client";

import React, { useState, useMemo } from 'react';
import { CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
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
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastLogged, setLastLogged] = useState<WorkoutEntry[] | null>(null);
  const { toast } = useToast();
  const { addSession, sessions } = useWorkoutStore();

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
          <h2 className="text-3xl font-bold text-black tracking-tight">New Session</h2>
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin text-gray-300" />}
        </div>
        <p className="text-gray-400 text-sm font-medium">
          Log your workout in natural language. RepCount handles the rest.
        </p>
      </header>

      {/* Input Section */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col group relative">
        <NotesInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          placeholder="E.g. Bench press 80kg 8 reps rir 1, 3 sets..."
        />
        
        {/* Floating Action Button for Submission */}
        <div className="p-6 pt-0 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !input.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-[13px] font-bold tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 shadow-lg shadow-black/10"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Log Workout</span>
          </button>
        </div>
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
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.05em]">Captured Exercises</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastLogged.map((entry, idx) => (
                <motion.div 
                  key={entryDisplayIds[idx]}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#F2F2F7]/50 rounded-[24px] p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold text-black capitalize">{entry.exercise}</h4>
                    <div className="px-3 py-1 bg-white rounded-full border border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                      SET 1
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Weight</span>
                      <span className="text-lg font-bold text-black">{entry.weight}<span className="text-xs text-gray-400 ml-0.5">{entry.weightUnit}</span></span>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Reps</span>
                      <span className="text-lg font-bold text-black">{entry.reps}</span>
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="flex items-start gap-1.5 pt-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                      <p className="text-[11px] font-semibold text-gray-500 line-clamp-2">
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
                className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest hover:text-black transition-colors"
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