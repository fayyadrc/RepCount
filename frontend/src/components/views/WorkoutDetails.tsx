"use client";

import React, { useEffect } from 'react';
import { useWorkoutStore } from '@/lib/workout-store';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Weight, Dumbbell, Timer, Heart, Activity, Gauge, Mountain, Flame, Footprints, Bike, Zap } from 'lucide-react';
import type { StravaActivity } from '@/lib/types';
import { motion } from 'framer-motion';

const getStravaIcon = (type: string, className: string) => {
  switch (type) {
    case 'Run':
    case 'Walk':
      return <Footprints className={className} />;
    case 'Ride':
      return <Bike className={className} />;
    case 'WeightTraining':
    case 'Workout':
      return <Dumbbell className={className} />;
    default:
      return <Zap className={className} />;
  }
};

interface WorkoutDetailsProps {
  sessionId: string | null;
  onBack: () => void;
}

export const WorkoutDetails: React.FC<WorkoutDetailsProps> = ({ sessionId, onBack }) => {
  const { sessions } = useWorkoutStore();
  const selectedSession = sessions.find(s => s.id === sessionId);

  // Scroll to top when view loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!selectedSession) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.15 }}
        className="py-20 flex flex-col items-center justify-center text-center space-y-4"
      >
        <h3 className="text-lg font-bold text-primary">Session Not Found</h3>
        <Button variant="outline" onClick={onBack}>Go Back</Button>
      </motion.div>
    );
  }

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const hasStrava = selectedSession.stravaActivities && selectedSession.stravaActivities.length > 0;
  const isPureStrava = selectedSession.entries.length === 0 && hasStrava;
  const primaryStravaActivity = isPureStrava ? selectedSession.stravaActivities![0] : null;

  const displayDuration = selectedSession.durationMins || (isPureStrava && primaryStravaActivity ? primaryStravaActivity.durationSeconds / 60 : 0);
  const displayHr = selectedSession.avgHeartRate || (isPureStrava && primaryStravaActivity ? primaryStravaActivity.avgHeartrate : null);
  const displayMaxHr = isPureStrava && primaryStravaActivity ? primaryStravaActivity.maxHeartrate : null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="space-y-6"
    >
      <header className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-fit text-muted-foreground hover:text-primary -ml-2"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to History
        </Button>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            {isPureStrava && primaryStravaActivity && selectedSession.stravaActivities!.length === 1 ? (
              <>
                {getStravaIcon(primaryStravaActivity.type, "w-6 h-6 text-primary")}
                {primaryStravaActivity.name}
              </>
            ) : (
              "Workout Details"
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date(selectedSession.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </header>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {selectedSession.entries.length > 0 && (
          <>
            <div className="p-4 rounded-2xl glass-surface border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Weight className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Volume</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {(selectedSession.totalVolumeKg
                  ?? selectedSession.entries.reduce((s, e) => s + e.weight * e.sets * e.reps, 0)
                ).toLocaleString()} <span className="text-sm font-medium text-muted-foreground">kg</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-surface border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Sets</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {selectedSession.entries.length} <span className="text-sm font-medium text-muted-foreground">total</span>
              </p>
            </div>
          </>
        )}

        {displayDuration > 0 && (
          <div className="p-4 rounded-2xl glass-surface border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Duration</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatDuration(displayDuration)}
            </p>
          </div>
        )}

        {displayHr && displayHr > 0 ? (
          <div className="p-4 rounded-2xl glass-surface border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4" style={{ color: 'hsl(0, 72%, 58%)' }} />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Avg HR</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'hsl(0, 72%, 58%)' }}>
              {Math.round(displayHr)} <span className="text-sm font-medium text-muted-foreground">bpm</span>
            </p>
          </div>
        ) : null}

        {displayMaxHr && displayMaxHr > 0 ? (
          <div className="p-4 rounded-2xl glass-surface border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4" style={{ color: 'hsl(0, 72%, 58%)' }} />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Max HR</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'hsl(0, 72%, 58%)' }}>
              {Math.round(displayMaxHr)} <span className="text-sm font-medium text-muted-foreground">bpm</span>
            </p>
          </div>
        ) : null}
        
        {isPureStrava && primaryStravaActivity?.distanceMeters && primaryStravaActivity.distanceMeters > 0 ? (
            <div className="p-4 rounded-2xl glass-surface border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Distance</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {(primaryStravaActivity.distanceMeters / 1000).toFixed(2)} <span className="text-sm font-medium text-muted-foreground">km</span>
              </p>
            </div>
        ) : null}
        
        {isPureStrava && primaryStravaActivity?.avgSpeedMps && primaryStravaActivity.avgSpeedMps > 0 ? (
            <div className="p-4 rounded-2xl glass-surface border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pace/Speed</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {primaryStravaActivity.type === 'Run' || primaryStravaActivity.type === 'Walk' 
                    ? `${Math.floor((1000 / primaryStravaActivity.avgSpeedMps) / 60)}:${Math.floor((1000 / primaryStravaActivity.avgSpeedMps) % 60).toString().padStart(2, '0')}`
                    : `${(primaryStravaActivity.avgSpeedMps * 3.6).toFixed(1)}`
                } <span className="text-sm font-medium text-muted-foreground">{primaryStravaActivity.type === 'Run' || primaryStravaActivity.type === 'Walk' ? '/km' : 'km/h'}</span>
              </p>
            </div>
        ) : null}
        
        {isPureStrava && primaryStravaActivity?.elevationGain && primaryStravaActivity.elevationGain > 0 ? (
            <div className="p-4 rounded-2xl glass-surface border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Mountain className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Elevation</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {Math.round(primaryStravaActivity.elevationGain)} <span className="text-sm font-medium text-muted-foreground">m</span>
              </p>
            </div>
        ) : null}

        {isPureStrava && primaryStravaActivity?.calories ? (
            <div className="p-4 rounded-2xl glass-surface border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4" style={{ color: 'hsl(25, 95%, 53%)' }} />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Calories</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'hsl(25, 95%, 53%)' }}>
                {Math.round(primaryStravaActivity.calories)} <span className="text-sm font-medium text-muted-foreground">kcal</span>
              </p>
            </div>
        ) : null}
      </div>

      {/* Strava Activities */}
      {selectedSession.stravaActivities && selectedSession.stravaActivities.length > 0 && (!isPureStrava || selectedSession.stravaActivities.length > 1) && (
        <section className="pt-8 border-t border-white/5">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold mb-5 flex items-center gap-2 px-1">
            <Flame className="w-3.5 h-3.5" style={{ color: 'hsl(25, 95%, 53%)' }} />
            Strava Activities
          </h4>
          <div className="space-y-3">
            {selectedSession.stravaActivities.map((act: StravaActivity, i: number) => (
              <div
                key={i}
                className="p-4 rounded-2xl glass-surface border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="font-bold text-primary">{act.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {act.type === 'WeightTraining' ? '🏋️ Weights' :
                      act.type === 'Run' ? '🏃 Run' :
                      act.type === 'Walk' ? '🚶 Walk' :
                      act.type === 'Workout' ? '⚡ Workout' :
                      act.type}
                    {act.distanceMeters > 0 && ` · ${(act.distanceMeters / 1000).toFixed(1)} km`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatDuration(act.durationSeconds / 60)}</p>
                  {(act.avgHeartrate || act.maxHeartrate) && (
                    <p className="text-sm mt-1" style={{ color: 'hsl(0, 72%, 58%)' }}>
                      ❤️ {act.avgHeartrate ? Math.round(act.avgHeartrate) : '--'} bpm
                      {act.maxHeartrate ? ` (Max: ${Math.round(act.maxHeartrate)})` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Exercises Breakdown */}
      {selectedSession.entries.length > 0 && (
        <section className="pt-8 border-t border-white/5">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold mb-5 px-1">
            Exercise Breakdown
          </h4>
          <div className="space-y-4">
            {(() => {
              const grouped: Record<string, typeof selectedSession.entries> = {};
              selectedSession.entries.forEach(entry => {
                if (!grouped[entry.exercise]) grouped[entry.exercise] = [];
                grouped[entry.exercise].push(entry);
              });

              return Object.entries(grouped).map(([exercise, sets], i) => {
                const exVolume = sets.reduce((s, e) => s + e.weight * e.sets * e.reps, 0);
                return (
                  <div
                    key={i}
                    className="p-4 rounded-2xl glass-surface border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-lg capitalize text-primary tracking-tight">{exercise}</p>
                      <span className="text-xs text-muted-foreground font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {exVolume.toLocaleString()} kg
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sets.map((set, j) => (
                        <span
                          key={j}
                          className="text-sm px-3 py-1.5 rounded-full glass-surface border border-white/10 text-muted-foreground font-medium"
                        >
                          <strong className="text-primary font-bold">{set.weight}kg</strong> × {set.reps}
                          {set.notes ? ` · ${set.notes}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>
      )}
    </motion.div>
  );
};