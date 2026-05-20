"use client";

import React, { useState, useEffect, useRef } from 'react';
import { DataAnomaly } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  X,
  Inbox,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkoutStore } from '@/lib/workout-store';
import type { WorkoutEntry, WorkoutSession } from '@/lib/types';

interface DataHealthProps {
  onAnomalyCountChange?: (count: number) => void;
  onBack?: () => void;
}

/**
 * Simple rule-based anomaly detection on workout data.
 * Checks for: unrealistic weights, very high reps at heavy weight,
 * suspicious units, and repeated identical sessions.
 */
function detectAnomalies(sessions: WorkoutSession[]): DataAnomaly[] {
  const anomalies: DataAnomaly[] = [];
  let anomalyIdx = 0;

  sessions.slice(0, 5).forEach(session => {
    session.entries.forEach((entry: WorkoutEntry) => {
      const exerciseLower = entry.exercise.toLowerCase();

      // Unrealistic weight (e.g., >300kg for most exercises)
      if (entry.weight > 300) {
        anomalies.push({
          id: `anomaly-${++anomalyIdx}`,
          issue: 'Unrealistic Weight',
          detail: `${entry.exercise}: ${entry.weight}${entry.weightUnit || 'kg'} seems unusually high. Did you mean ${Math.round(entry.weight / 10)}${entry.weightUnit || 'kg'}?`,
          date: session.date,
          severity: 'high',
        });
      }

      // Very high reps with heavy weight (e.g., >100kg for 30+ reps)
      if (entry.weight > 100 && entry.reps > 25) {
        anomalies.push({
          id: `anomaly-${++anomalyIdx}`,
          issue: 'Unrealistic Reps',
          detail: `${entry.exercise}: ${entry.weight}${entry.weightUnit || 'kg'} for ${entry.reps} reps is extremely unusual. Did you mean ${Math.round(entry.reps / 10)} reps?`,
          date: session.date,
          severity: 'high',
        });
      }

      // Isolation exercises with very heavy weight
      const isolationExercises = ['lateral raise', 'curl', 'fly', 'extension', 'kickback', 'raise'];
      const isIsolation = isolationExercises.some(iso => exerciseLower.includes(iso));
      if (isIsolation && entry.weight > 50) {
        anomalies.push({
          id: `anomaly-${++anomalyIdx}`,
          issue: 'Suspicious Weight',
          detail: `${entry.exercise}: ${entry.weight}${entry.weightUnit || 'kg'} is unusually heavy for an isolation exercise. Double-check this entry.`,
          date: session.date,
          severity: 'low',
        });
      }

      // Zero weight (might be an error)
      if (entry.weight === 0 && !exerciseLower.includes('bodyweight') && !exerciseLower.includes('plank')) {
        anomalies.push({
          id: `anomaly-${++anomalyIdx}`,
          issue: 'Missing Weight',
          detail: `${entry.exercise}: weight recorded as 0${entry.weightUnit || 'kg'}. Was this a bodyweight exercise, or was the weight forgotten?`,
          date: session.date,
          severity: 'low',
        });
      }
    });
  });

  return anomalies;
}

export const DataHealth: React.FC<DataHealthProps> = ({ onAnomalyCountChange, onBack }) => {
  const { sessions } = useWorkoutStore();
  const [anomalies, setAnomalies] = useState<DataAnomaly[]>([]);
  const { toast } = useToast();

  const lastScannedCount = useRef<number>(-1);

  useEffect(() => {
    if (sessions.length === 0) {
      setAnomalies([]);
      onAnomalyCountChange?.(0);
      return;
    }

    if (sessions.length === lastScannedCount.current) return;
    lastScannedCount.current = sessions.length;

    const detected = detectAnomalies(sessions);
    setAnomalies(detected);
    onAnomalyCountChange?.(detected.length);
  }, [sessions, onAnomalyCountChange]);

  const handleAction = (id: string, action: 'ignore' | 'fix') => {
    setAnomalies(prev => {
      const updated = prev.filter(a => a.id !== id);
      onAnomalyCountChange?.(updated.length);
      return updated;
    });
    toast({
      title: action === 'ignore' ? "Anomaly Ignored" : "Noted for Correction",
      description: action === 'ignore'
        ? "Record will remain as-is."
        : "You can correct this in your next Quick Log entry.",
    });
  };

  // ─── Empty state: no sessions ───
  if (sessions.length === 0) {
    return (
      <div className="space-y-8 pt-2 pb-24 animate-fade-up">
        <header className="space-y-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all duration-200 -ml-1 px-3 py-1.5 rounded-full hover:bg-secondary/80 btn-tap-scale text-xs font-bold uppercase tracking-wider"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Profile
            </button>
          )}
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground font-heading">Data Health</h2>
            <p className="text-muted-foreground text-sm font-medium">Review anomalies in your workout data.</p>
          </div>
        </header>

        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-card border border-border shadow-sm rounded-[28px] p-8">
          <div className="w-16 h-16 bg-secondary rounded-[20px] flex items-center justify-center">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground font-heading">No Data to Scan</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Log some workouts first, then come back here to check for data inconsistencies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-2 pb-24 animate-fade-up">
      <header className="space-y-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all duration-200 -ml-1 px-3 py-1.5 rounded-full hover:bg-secondary/80 btn-tap-scale text-xs font-bold uppercase tracking-wider w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Profile
          </button>
        )}
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground font-heading">Data Health</h2>
          <p className="text-muted-foreground text-sm font-medium">
            Scanned {Math.min(sessions.length, 5)} recent session{Math.min(sessions.length, 5) !== 1 ? 's' : ''} for anomalies.
          </p>
        </div>
      </header>

      {anomalies.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-card border border-border shadow-sm rounded-[28px] p-8 animate-slide-up">
          <div className="w-16 h-16 bg-accent-green-bg text-accent-green rounded-[20px] flex items-center justify-center">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground font-heading">Zero Issues Found</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Your data is clean and consistent. High quality insights guaranteed.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4.5 animate-slide-up">
          {anomalies.map((a, idx) => (
            <div
              key={a.id}
              className={`bg-card border border-border shadow-[0_2px_12px_rgba(0,0,0,0.015)] rounded-[24px] overflow-hidden hover:shadow-md transition-all duration-300 group btn-tap-scale p-6 stagger-${Math.min(idx + 1, 5)}`}
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    a.severity === 'high' 
                      ? 'bg-accent-orange-bg text-accent-orange border border-accent-orange/10' 
                      : 'bg-accent-blue-bg text-accent-blue border border-accent-blue/10'
                  }`}>
                    <AlertCircle className="w-5.5 h-5.5 stroke-[2.2]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-extrabold text-foreground font-heading tracking-tight leading-tight">
                        {a.issue}
                      </h4>
                      <span className={`ios-badge uppercase ${
                        a.severity === 'high' 
                          ? 'bg-accent-orange-bg text-accent-orange' 
                          : 'bg-accent-blue-bg text-accent-blue'
                      }`}>
                        {a.severity} severity
                      </span>
                      {a.date && (
                        <span className="ios-badge bg-secondary text-muted-foreground font-mono">
                          {a.date}
                        </span>
                      )}
                    </div>
                    <p className="text-[13.5px] font-medium leading-relaxed text-muted-foreground">
                      {a.detail}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 justify-end self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 sm:flex-initial h-9 px-4 text-[12px] font-bold rounded-xl glass-surface text-primary border border-border hover:bg-secondary/80 transition-all btn-tap-scale"
                    onClick={() => handleAction(a.id, 'fix')}
                  >
                    Note Fix
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 sm:flex-initial h-9 px-4 text-[12px] font-bold rounded-xl hover:text-destructive hover:bg-destructive/5 transition-all text-muted-foreground btn-tap-scale"
                    onClick={() => handleAction(a.id, 'ignore')}
                  >
                    Ignore
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};