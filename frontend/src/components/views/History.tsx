"use client";

import React, { useState } from 'react';
import { useWorkoutStore } from '@/lib/workout-store';
import { 
  Plus, 
  Dumbbell, 
  Weight, 
  Heart, 
  Activity, 
  Timer, 
  Flame, 
  ChevronRight, 
  RefreshCw,
  Mountain,
  Footprints,
  Bike,
  Zap,
  Waves,
  Flower2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WorkoutSession } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

const getStravaIcon = (type: string, className: string) => {
  switch (type) {
    case 'Run':
      return <Footprints className={className}/>;
    case 'Walk':
      return <Footprints className={className} />;
    case 'Ride':
      return <Bike className={className} />;
    case 'Swim':
      return <Waves className={className} />;
    case 'Hike':
      return <Mountain className={className} />;
    case 'Yoga':
      return <Flower2 className={className} />;
    case 'WeightTraining':
    case 'Workout':
    case 'Crossfit':
      return <Dumbbell className={className} />;
    default:
      return <Zap className={className} />;
  }
};

interface HistoryProps {
  onViewDetails?: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onViewDetails }) => {
  const { sessions, syncStrava } = useWorkoutStore();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncStrava();
      toast({
        title: "Strava Sync Started",
        description: "Fetching your latest activities from Strava.",
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
      const name = e.exercise.toLowerCase();
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pt-4 pb-24"
    >
      <header className="flex justify-between items-end px-1">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">History</h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">Your past sessions and activities</p>
        </div>
        <div className="flex gap-2 mb-1">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-foreground ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => (window as any).setActiveView?.('quick-log')}
            className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5 text-background" />
          </button>
        </div>
      </header>

      {sessions.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No activities yet</h3>
            <p className="text-muted-foreground text-sm max-w-[200px]">
              Start a new session or sync with Strava to see your history.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-1">
          {sessions.map((session) => {
            const totalVolume = session.totalVolumeKg
              ?? session.entries.reduce((sum, e) => sum + e.weight * e.sets * e.reps, 0);
            const uniqueExercises = getUniqueExercises(session);
            
            const dateObj = new Date(session.date + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const dateFormatted = dateObj.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });

            const hasStrava = session.stravaActivities && session.stravaActivities.length > 0;
            const isPureStrava = session.entries.length === 0 && hasStrava;
            const primaryStravaActivity = isPureStrava ? session.stravaActivities![0] : null;
            const totalCalories = session.stravaActivities?.reduce((sum, act) => sum + (act.calories || 0), 0) || 0;

            return (
              <motion.div
                key={session.id}
                layoutId={session.id}
                onClick={() => onViewDetails?.(session.id)}
                className="group cursor-pointer bg-secondary/50 rounded-[24px] p-5 hover:bg-secondary transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                      {dayName}
                    </p>
                    <h4 className="text-lg font-bold text-foreground">{dateFormatted}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasStrava && (
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                    )}
                    <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="w-4 h-4 text-foreground" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {!isPureStrava && (
                    <div className="bg-card/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Weight className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Volume</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{totalVolume.toLocaleString()} <span className="text-[10px] text-muted-foreground">kg</span></span>
                    </div>
                  )}
                  
                  {session.durationMins && (
                    <div className="bg-card/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Duration</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatDuration(session.durationMins)}</span>
                    </div>
                  )}

                  {session.avgHeartRate && (
                    <div className="bg-card/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-red-500/70">
                        <Heart className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Avg HR</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{Math.round(session.avgHeartRate)} <span className="text-[10px] text-muted-foreground">bpm</span></span>
                    </div>
                  )}

                  {totalCalories > 0 && (
                    <div className="bg-card/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-orange-500">
                        <Flame className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Calories</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{Math.round(totalCalories)} <span className="text-[10px] text-muted-foreground">kcal</span></span>
                    </div>
                  )}

                  {isPureStrava && primaryStravaActivity && (
                    <div className="bg-card/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {getStravaIcon(primaryStravaActivity.type, "w-3 h-3")}
                        <span className="text-[9px] font-bold uppercase tracking-wider">{primaryStravaActivity.type}</span>
                      </div>
                      {primaryStravaActivity.distanceMeters > 0 && (
                        <span className="text-sm font-bold text-foreground">{(primaryStravaActivity.distanceMeters / 1000).toFixed(2)} <span className="text-[10px] text-muted-foreground">km</span></span>
                      )}
                    </div>
                  )}
                </div>

                {!isPureStrava && uniqueExercises.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uniqueExercises.slice(0, 4).map((entry, idx) => (
                      <div 
                        key={idx}
                        className="px-2.5 py-1 bg-foreground/5 rounded-lg text-[10px] font-bold text-foreground/60 uppercase tracking-tight"
                      >
                        {entry.exercise}
                      </div>
                    ))}
                    {uniqueExercises.length > 4 && (
                      <div className="px-2.5 py-1 bg-foreground/5 rounded-lg text-[10px] font-bold text-foreground/40 uppercase tracking-tight">
                        +{uniqueExercises.length - 4} more
                      </div>
                    )}
                  </div>
                )}
                
                {isPureStrava && session.stravaActivities && (
                  <p className="text-[11px] font-semibold text-muted-foreground italic">
                    {session.stravaActivities.map(a => a.name).join(', ')}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
