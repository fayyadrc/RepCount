"use client";

import React from 'react';
import { useWorkoutStore } from '@/lib/workout-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Dumbbell, Trash2, Weight, Heart, Activity, Timer, Flame, ChevronRight, Mountain, Gauge, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WorkoutSession, StravaActivity } from '@/lib/types';
import { Footprints, Bike, Zap, SportShoe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const getStravaIcon = (type: string, className: string) => {
  switch (type) {
    case 'Run':
      return <SportShoe className={className}/>;
    case 'Walk':
      return <Footprints className={className} />;
    case 'Ride':
      return <Bike className={className} />;
    case 'WeightTraining':
      return <Dumbbell className={className} />;
    case 'Workout':
      return <Dumbbell className={className} />;
    default:
      return <Zap className={className} />;
  }
};

interface HistoryProps {
  onViewDetails?: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onViewDetails }) => {
  const { sessions, clearSessions, syncStrava } = useWorkoutStore();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleClear = () => {
    clearSessions();
    toast({
      title: "History Cleared",
      description: "All workout sessions have been removed.",
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncStrava();
      toast({
        title: "Strava Sync Started",
        description: "Fetching your latest activities from Strava. This may take a moment to reflect.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not trigger Strava synchronization.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getUniqueExercises = (session: WorkoutSession) => {
    const seen = new Set<string>();
    return session.entries.filter(e => {
      if (seen.has(e.exercise)) return false;
      seen.add(e.exercise);
      return true;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 animate-fade-up"
    >
      <header className="flex justify-between items-start pt-4">
        <h2 className="text-[34px] font-bold tracking-tight text-black leading-tight">
          Good morning
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-black ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => (window as any).setActiveView?.('quick-log')}
            className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6 text-black" />
          </button>
        </div>
      </header>

      {sessions.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
          <Dumbbell className="w-16 h-16 text-gray-100" strokeWidth={1} />
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-black">No workouts yet</h3>
            <p className="text-gray-400 text-[15px] max-w-[240px] mx-auto leading-relaxed">
              Start your first workout to begin tracking your progress.
            </p>
          </div>
          <button
            onClick={() => (window as any).setActiveView?.('quick-log')}
            className="mt-4 px-8 py-3.5 rounded-full bg-black text-white text-[13px] font-bold tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            + Start Workout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, idx) => {
            const totalVolume = session.totalVolumeKg
              ?? session.entries.reduce((sum, e) => sum + e.weight * e.sets * e.reps, 0);
            const uniqueExercises = getUniqueExercises(session);
            const formattedDate = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            const hasStrava = session.stravaActivities && session.stravaActivities.length > 0;
            const isPureStrava = session.entries.length === 0 && hasStrava;
            const primaryStravaActivity = isPureStrava ? session.stravaActivities![0] : null;
            const weightSession = session.stravaActivities?.find(a => a.type === 'WeightTraining');

            return (
              <div
                key={session.id}
                onClick={() => onViewDetails?.(session.id)}
                className="cursor-pointer bg-white border border-gray-100 rounded-[20px] p-5 hover:shadow-md transition-all active:scale-[0.98] animate-fade-up"
              >
                <div className="p-5">
                  {/* Top row: date + stats */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 glass-surface rounded-xl">
                        {isPureStrava ? getStravaIcon(primaryStravaActivity!.type, "w-4 h-4 text-primary") : <Dumbbell className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{formattedDate}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                          {isPureStrava 
                            ? session.stravaActivities!.map(a => a.type).join(' + ')
                            : `${uniqueExercises.length} exercise${uniqueExercises.length !== 1 ? 's' : ''} · ${session.entries.length} set${session.entries.length !== 1 ? 's' : ''}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {!isPureStrava && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Weight className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{totalVolume.toLocaleString()} kg</span>
                      </div>
                    )}
                    {session.durationMins && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{formatDuration(session.durationMins)}</span>
                      </div>
                    )}
                    {isPureStrava && primaryStravaActivity && primaryStravaActivity.distanceMeters > 0 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{(primaryStravaActivity.distanceMeters / 1000).toFixed(2)} km</span>
                      </div>
                    )}
                    {isPureStrava && primaryStravaActivity && primaryStravaActivity.avgSpeedMps && primaryStravaActivity.avgSpeedMps > 0 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Gauge className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">
                          {primaryStravaActivity.type === 'Run' || primaryStravaActivity.type === 'Walk' 
                            ? `${Math.floor((1000 / primaryStravaActivity.avgSpeedMps) / 60)}:${Math.floor((1000 / primaryStravaActivity.avgSpeedMps) % 60).toString().padStart(2, '0')} /km`
                            : `${(primaryStravaActivity.avgSpeedMps * 3.6).toFixed(1)} km/h`
                          }
                        </span>
                      </div>
                    )}
                    {isPureStrava && primaryStravaActivity && primaryStravaActivity.calories && (
                      <div className="flex items-center gap-1.5" style={{ color: 'hsl(25, 95%, 53%)' }}>
                        <Flame className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{Math.round(primaryStravaActivity.calories)} kcal</span>
                      </div>
                    )}
                    {session.avgHeartRate && (
                      <div className="flex items-center gap-1.5" style={{ color: 'hsl(0, 72%, 58%)' }}>
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{Math.round(session.avgHeartRate)} bpm</span>
                      </div>
                    )}
                    {hasStrava && !isPureStrava && session.stravaActivities!.some(a => a.type !== 'WeightTraining') && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Activity className="w-3.5 h-3.5" style={{ color: 'hsl(25, 95%, 53%)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'hsl(25, 95%, 53%)' }}>
                          +{session.stravaActivities!.filter(a => a.type !== 'WeightTraining').map(a => a.name.replace('Evening ', '').replace('Afternoon ', '')).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Exercise badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueExercises.map((entry, entryIdx) => (
                      <Badge
                        key={entryIdx}
                        variant="secondary"
                        className="text-[11px] font-medium capitalize glass-surface border-white/20 py-0.5"
                      >
                        {entry.exercise}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
