
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
  Gauge,
  Footprints,
  Bike,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WorkoutSession, StravaActivity } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

const getStravaIcon = (type: string, className: string) => {
  switch (type) {
    case 'Run':
      return <Activity className={className}/>;
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
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight">History</h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Your past sessions and activities</p>
        </div>
        <div className="flex gap-2 mb-1">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-10 h-10 rounded-full bg-[#F2F2F7] flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-black ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => (window as any).setActiveView?.('quick-log')}
            className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {sessions.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-gray-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-black">No activities yet</h3>
            <p className="text-gray-400 text-sm max-w-[200px]">
              Start a new session or sync with Strava to see your history.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
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
                className="group cursor-pointer bg-[#F2F2F7]/50 rounded-[24px] p-5 hover:bg-[#F2F2F7] transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.1em]">
                      {dayName}
                    </p>
                    <h4 className="text-lg font-bold text-black">{dateFormatted}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasStrava && (
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                    )}
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="w-4 h-4 text-black" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Weight/Volume Stat */}
                  {!isPureStrava && (
                    <div className="bg-white/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#8E8E93]">
                        <Weight className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Volume</span>
                      </div>
                      <span className="text-sm font-bold text-black">{totalVolume.toLocaleString()} <span className="text-[10px] text-gray-400">kg</span></span>
                    </div>
                  )}
                  
                  {/* Duration Stat */}
                  {session.durationMins && (
                    <div className="bg-white/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#8E8E93]">
                        <Timer className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Duration</span>
                      </div>
                      <span className="text-sm font-bold text-black">{formatDuration(session.durationMins)}</span>
                    </div>
                  )}

                  {/* HR Stat */}
                  {session.avgHeartRate && (
                    <div className="bg-white/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-red-500/70">
                        <Heart className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Avg HR</span>
                      </div>
                      <span className="text-sm font-bold text-black">{Math.round(session.avgHeartRate)} <span className="text-[10px] text-gray-400">bpm</span></span>
                    </div>
                  )}

                  {/* Calories Stat */}
                  {totalCalories > 0 && (
                    <div className="bg-white/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-orange-500">
                        <Flame className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Calories</span>
                      </div>
                      <span className="text-sm font-bold text-black">{Math.round(totalCalories)} <span className="text-[10px] text-gray-400">kcal</span></span>
                    </div>
                  )}

                  {/* Strava Distance/Type */}
                  {isPureStrava && primaryStravaActivity && primaryStravaActivity.distanceMeters > 0 && (
                    <div className="bg-white/60 rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#8E8E93]">
                        {getStravaIcon(primaryStravaActivity.type, "w-3 h-3")}
                        <span className="text-[9px] font-bold uppercase tracking-wider">{primaryStravaActivity.type}</span>
                      </div>
                      <span className="text-sm font-bold text-black">{(primaryStravaActivity.distanceMeters / 1000).toFixed(2)} <span className="text-[10px] text-gray-400">km</span></span>
                    </div>
                  )}
                </div>

                {/* Exercise List */}
                {!isPureStrava && uniqueExercises.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uniqueExercises.slice(0, 4).map((entry, idx) => (
                      <div 
                        key={idx}
                        className="px-2.5 py-1 bg-black/5 rounded-lg text-[10px] font-bold text-black/60 uppercase tracking-tight"
                      >
                        {entry.exercise}
                      </div>
                    ))}
                    {uniqueExercises.length > 4 && (
                      <div className="px-2.5 py-1 bg-black/5 rounded-lg text-[10px] font-bold text-black/40 uppercase tracking-tight">
                        +{uniqueExercises.length - 4} more
                      </div>
                    )}
                  </div>
                )}
                
                {isPureStrava && session.stravaActivities && (
                  <p className="text-[11px] font-semibold text-gray-400 italic">
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
