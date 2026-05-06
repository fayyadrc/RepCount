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
      <div className="space-y-10 animate-fade-up">
        <header className="space-y-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors -ml-1"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-[13px] font-bold uppercase tracking-wider">Back to Profile</span>
            </button>
          )}
          <div className="space-y-2">
            <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-primary">Data Health</h2>
            <p className="text-muted-foreground text-sm">Review anomalies in your workout data.</p>
          </div>
        </header>
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 glass-surface rounded-full flex items-center justify-center">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">No Data to Scan</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Log some workouts first, then come back here to check for data inconsistencies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-up">
      <header className="space-y-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors -ml-1"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[13px] font-bold uppercase tracking-wider">Back to Profile</span>
          </button>
        )}
        <div className="space-y-2">
          <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-primary">Data Health</h2>
          <p className="text-muted-foreground text-sm">
            Scanned {Math.min(sessions.length, 5)} recent session{Math.min(sessions.length, 5) !== 1 ? 's' : ''} for anomalies.
          </p>
        </div>
      </header>

      {anomalies.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-slide-up">
          <div className="w-16 h-16 glass-surface rounded-full flex items-center justify-center">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Zero issues found</h3>
            <p className="text-muted-foreground text-sm max-w-xs">Your data is clean and consistent. High quality insights guaranteed.</p>
          </div>
        </div>
      ) : (
        <div className="glass-surface rounded-2xl overflow-hidden animate-slide-up">
          <Table>
            <TableHeader className="bg-foreground/[0.02] border-b border-foreground/10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[180px] font-bold text-xs uppercase tracking-widest py-4">Issue</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest">Detail</TableHead>
                <TableHead className="w-[100px] font-bold text-xs uppercase tracking-widest">Severity</TableHead>
                <TableHead className="w-[160px] text-right font-bold text-xs uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalies.map((a, idx) => (
                <TableRow key={a.id} className={`group transition-colors border-foreground/10 hover:bg-foreground/5 stagger-${Math.min(idx + 1, 5)}`}>
                  <TableCell className="font-semibold text-primary">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={a.severity === 'high' ? "text-destructive w-4 h-4" : "text-amber-500 w-4 h-4"} />
                      {a.issue}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground leading-relaxed">
                    {a.detail}
                    {a.date && (
                      <div className="mt-1 text-[10px] font-mono opacity-50 uppercase">{a.date}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.severity === 'high' ? "destructive" : "secondary"} className={`capitalize font-bold text-[10px] px-2 py-0 ${a.severity !== 'high' && 'glass-surface'}`}>
                      {a.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:text-destructive hover:bg-foreground/10"
                        title="Ignore"
                        onClick={() => handleAction(a.id, 'ignore')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3 text-xs glass-surface text-primary border-foreground/20 hover:bg-foreground/10"
                        onClick={() => handleAction(a.id, 'fix')}
                      >
                        Note Fix
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};