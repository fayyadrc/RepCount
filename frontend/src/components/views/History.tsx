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
  const { sessions, syncStrava, refreshSessions } = useWorkoutStore();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncStrava();
      await refreshSessions();
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
          <h2 className="text-2xl font-bold text-foreground tracking-tight md:text-3xl">History</h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">Your past sessions and activities</p>
        </div>
        <div className="flex gap-2 mb-1">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            aria-label="Sync Strava"
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-foreground ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => (window as { setActiveView?: (view: string) => void }).setActiveView?.('quick-log')}
            aria-label="Start new session"
            className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5 text-background" />
          </button>
        </div>
      </header>

      {sessions.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground font-heading">No activities yet</h3>
            <p className="text-muted-foreground text-sm max-w-[200px]">
              Start a new session or sync with Strava to see your history.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4.5 px-1">
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

            const displayDuration = session.durationMins || (isPureStrava && session.stravaActivities
              ? session.stravaActivities.reduce((sum, act) => sum + act.durationSeconds / 60, 0)
              : 0);

            const validAvgHrs = session.stravaActivities?.map(a => a.avgHeartrate).filter((hr): hr is number => hr !== null && hr > 0) || [];
            const calculatedAvgHr = validAvgHrs.length > 0
              ? Math.round(validAvgHrs.reduce((a, b) => a + b, 0) / validAvgHrs.length)
              : null;
            const displayAvgHr = session.avgHeartRate || calculatedAvgHr;

            const maxHr = session.stravaActivities?.reduce((max, act) => Math.max(max, act.maxHeartrate || 0), 0) || 0;

            const isRun = session.stravaActivities?.some(act => act.type === 'Run') || false;
            const runDistanceMeters = session.stravaActivities?.reduce((sum, act) => sum + (act.distanceMeters || 0), 0) || 0;
 
            return (
              <motion.div
                key={session.id}
                layoutId={session.id}
                onClick={() => onViewDetails?.(session.id)}
                className="group cursor-pointer bg-card border border-border shadow-[0_2px_12px_rgba(0,0,0,0.015)] rounded-[24px] p-6 hover:shadow-md hover:border-border/80 transition-all btn-tap-scale"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-accent-violet uppercase tracking-widest font-mono">
                      {dayName}
                    </p>
                    <h4 className="text-xl font-extrabold text-foreground font-heading">{dateFormatted}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasStrava && (
                      <div className="w-8 h-8 rounded-full bg-accent-orange-bg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-accent-orange" />
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:translate-x-1 transition-transform border border-border/40">
                      <ChevronRight className="w-4 h-4 text-foreground stroke-[2.5]" />
                    </div>
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {!isPureStrava && (
                    <div className="bg-secondary/40 border border-border/30 rounded-[18px] p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Weight className="w-3.5 h-3.5 text-accent-blue" />
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Volume</span>
                      </div>
                      <span className="text-md font-extrabold text-foreground font-mono leading-none">
                        {totalVolume.toLocaleString()}{' '}
                        <span className="text-[10px] text-muted-foreground font-sans font-medium uppercase">kg</span>
                      </span>
                    </div>
                  )}
                  
                  {displayDuration > 0 && (
                    <div className="bg-secondary/40 border border-border/30 rounded-[18px] p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="w-3.5 h-3.5 text-accent-orange" />
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Duration</span>
                      </div>
                      <span className="text-md font-extrabold text-foreground font-mono leading-none">
                        {formatDuration(displayDuration)}
                      </span>
                    </div>
                  )}
 
                  {displayAvgHr && (
                    <div className="bg-secondary/40 border border-border/30 rounded-[18px] p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Heart className="w-3.5 h-3.5 text-destructive" />
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Avg HR</span>
                      </div>
                      <span className="text-md font-extrabold text-foreground font-mono leading-none">
                        {Math.round(displayAvgHr)}{' '}
                        <span className="text-[10px] text-muted-foreground font-sans font-medium uppercase">bpm</span>
                      </span>
                    </div>
                  )}
 
                  {maxHr > 0 && (
                    <div className="bg-secondary/40 border border-border/30 rounded-[18px] p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Max HR</span>
                      </div>
                      <span className="text-md font-extrabold text-foreground font-mono leading-none">
                        {Math.round(maxHr)}{' '}
                        <span className="text-[10px] text-muted-foreground font-sans font-medium uppercase">bpm</span>
                      </span>
                    </div>
                  )}
 
                  {totalCalories > 0 && (
                    <div className="bg-secondary/40 border border-border/30 rounded-[18px] p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Flame className="w-3.5 h-3.5 text-accent-orange" />
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Calories</span>
                      </div>
                      <span className="text-md font-extrabold text-foreground font-mono leading-none">
                        {Math.round(totalCalories)}{' '}
                        <span className="text-[10px] text-muted-foreground font-sans font-medium uppercase">kcal</span>
                      </span>
                    </div>
                  )}
 
                  {isPureStrava && isRun && runDistanceMeters > 0 && (
                    <div className="bg-secondary/40 border border-border/30 rounded-[18px] p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Footprints className="w-3.5 h-3.5 text-accent-blue" />
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Distance</span>
                      </div>
                      <span className="text-md font-extrabold text-foreground font-mono leading-none">
                        {(runDistanceMeters / 1000).toFixed(2)}{' '}
                        <span className="text-[10px] text-muted-foreground font-sans font-medium uppercase">km</span>
                      </span>
                    </div>
                  )}
 
                  {isPureStrava && !isRun && primaryStravaActivity && (
                    <div className="bg-secondary/40 border border-border/30 rounded-[18px] p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {getStravaIcon(primaryStravaActivity.type, "w-3.5 h-3.5 text-accent-blue")}
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono">{primaryStravaActivity.type}</span>
                      </div>
                      {primaryStravaActivity.distanceMeters > 0 && (
                        <span className="text-md font-extrabold text-foreground font-mono leading-none">
                          {(primaryStravaActivity.distanceMeters / 1000).toFixed(2)}{' '}
                          <span className="text-[10px] text-muted-foreground font-sans font-medium uppercase">km</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
 
                {!isPureStrava && uniqueExercises.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uniqueExercises.slice(0, 4).map((entry, idx) => (
                      <span 
                        key={idx}
                        className="ios-badge bg-accent-blue-bg text-accent-blue py-0.5 px-2.5 rounded-lg text-[9px]"
                      >
                        {entry.exercise}
                      </span>
                    ))}
                    {uniqueExercises.length > 4 && (
                      <span className="ios-badge bg-secondary text-muted-foreground py-0.5 px-2 rounded-lg text-[9px]">
                        +{uniqueExercises.length - 4} more
                      </span>
                    )}
                  </div>
                )}
                
                {isPureStrava && session.stravaActivities && (
                  <p className="text-[12px] font-semibold text-muted-foreground italic leading-normal pt-1">
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
