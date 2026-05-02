"use client";

import React from 'react';
import { useWorkoutStore } from '@/lib/workout-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Dumbbell, Trash2, Weight, Heart, Activity, Timer, Flame, ChevronRight, Mountain, Gauge } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import type { WorkoutSession, StravaActivity } from '@/lib/types';
import { Footprints, Bike, Zap } from 'lucide-react';

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

export const History: React.FC = () => {
  const { sessions, clearSessions } = useWorkoutStore();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = React.useState<WorkoutSession | null>(null);

  const handleClear = () => {
    clearSessions();
    toast({
      title: "History Cleared",
      description: "All workout sessions have been removed.",
    });
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
    <div className="space-y-10 animate-fade-up">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-[28px] md:text-3xl font-bold tracking-tight text-primary">Workout History</h2>
          <p className="text-muted-foreground text-sm">
            {sessions.length === 0
              ? 'No sessions logged yet. Head to Quick Log to get started.'
              : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} recorded`
            }
          </p>
        </div>
        {sessions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleClear}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </header>

      {sessions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 glass-surface rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">No History Yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your logged workouts will appear here. Start by logging a session in Quick Log.
            </p>
          </div>
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
                onClick={() => setSelectedSession(session)}
                className={`cursor-pointer glass-surface rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up hover:scale-[1.02] active:scale-[0.98] stagger-${Math.min(idx + 1, 5)}`}
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

      {/* ─── Detail Modal ─── */}
      <Dialog
        open={!!selectedSession}
        onOpenChange={(open) => {
          if (!open) setSelectedSession(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl glass-surface border border-white/10 text-foreground">
          {selectedSession && (() => {
            const hasStrava = selectedSession.stravaActivities && selectedSession.stravaActivities.length > 0;
            const isPureStrava = selectedSession.entries.length === 0 && hasStrava;
            const primaryStravaActivity = isPureStrava ? selectedSession.stravaActivities![0] : null;

            const displayDuration = selectedSession.durationMins || (isPureStrava && primaryStravaActivity ? primaryStravaActivity.durationSeconds / 60 : 0);
            const displayHr = selectedSession.avgHeartRate || (isPureStrava && primaryStravaActivity ? primaryStravaActivity.avgHeartrate : null);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {isPureStrava && primaryStravaActivity && selectedSession.stravaActivities!.length === 1 ? (
                      <>
                        {getStravaIcon(primaryStravaActivity.type, "w-5 h-5 text-primary")}
                        {primaryStravaActivity.name}
                      </>
                    ) : (
                      "Workout Details"
                    )}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedSession.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </DialogHeader>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {selectedSession.entries.length > 0 && (
                    <>
                      <div className="p-3 rounded-xl glass-surface border border-white/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Weight className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Volume</span>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          {(selectedSession.totalVolumeKg
                            ?? selectedSession.entries.reduce((s, e) => s + e.weight * e.sets * e.reps, 0)
                          ).toLocaleString()} <span className="text-xs font-medium text-muted-foreground">kg</span>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl glass-surface border border-white/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Dumbbell className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sets</span>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          {selectedSession.entries.length} <span className="text-xs font-medium text-muted-foreground">total</span>
                        </p>
                      </div>
                    </>
                  )}

                  {displayDuration > 0 && (
                    <div className="p-3 rounded-xl glass-surface border border-white/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Timer className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Duration</span>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {formatDuration(displayDuration)}
                      </p>
                    </div>
                  )}

                  {displayHr && displayHr > 0 ? (
                    <div className="p-3 rounded-xl glass-surface border border-white/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Heart className="w-3.5 h-3.5" style={{ color: 'hsl(0, 72%, 58%)' }} />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Avg HR</span>
                      </div>
                      <p className="text-lg font-bold" style={{ color: 'hsl(0, 72%, 58%)' }}>
                        {Math.round(displayHr)} <span className="text-xs font-medium text-muted-foreground">bpm</span>
                      </p>
                    </div>
                  ) : null}
                  
                  {isPureStrava && primaryStravaActivity?.distanceMeters && primaryStravaActivity.distanceMeters > 0 ? (
                     <div className="p-3 rounded-xl glass-surface border border-white/10">
                       <div className="flex items-center gap-1.5 mb-1">
                         <Activity className="w-3.5 h-3.5 text-primary" />
                         <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Distance</span>
                       </div>
                       <p className="text-lg font-bold text-primary">
                         {(primaryStravaActivity.distanceMeters / 1000).toFixed(2)} <span className="text-xs font-medium text-muted-foreground">km</span>
                       </p>
                     </div>
                  ) : null}
                  
                  {isPureStrava && primaryStravaActivity?.avgSpeedMps && primaryStravaActivity.avgSpeedMps > 0 ? (
                     <div className="p-3 rounded-xl glass-surface border border-white/10">
                       <div className="flex items-center gap-1.5 mb-1">
                         <Gauge className="w-3.5 h-3.5 text-primary" />
                         <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Avg Pace / Speed</span>
                       </div>
                       <p className="text-lg font-bold text-primary">
                         {primaryStravaActivity.type === 'Run' || primaryStravaActivity.type === 'Walk' 
                              ? `${Math.floor((1000 / primaryStravaActivity.avgSpeedMps) / 60)}:${Math.floor((1000 / primaryStravaActivity.avgSpeedMps) % 60).toString().padStart(2, '0')}`
                              : `${(primaryStravaActivity.avgSpeedMps * 3.6).toFixed(1)}`
                         } <span className="text-xs font-medium text-muted-foreground">{primaryStravaActivity.type === 'Run' || primaryStravaActivity.type === 'Walk' ? '/km' : 'km/h'}</span>
                       </p>
                     </div>
                  ) : null}
                  
                  {isPureStrava && primaryStravaActivity?.elevationGain && primaryStravaActivity.elevationGain > 0 ? (
                     <div className="p-3 rounded-xl glass-surface border border-white/10">
                       <div className="flex items-center gap-1.5 mb-1">
                         <Mountain className="w-3.5 h-3.5 text-primary" />
                         <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Elevation</span>
                       </div>
                       <p className="text-lg font-bold text-primary">
                         {Math.round(primaryStravaActivity.elevationGain)} <span className="text-xs font-medium text-muted-foreground">m</span>
                       </p>
                     </div>
                  ) : null}

                  {isPureStrava && primaryStravaActivity?.calories ? (
                     <div className="p-3 rounded-xl glass-surface border border-white/10">
                       <div className="flex items-center gap-1.5 mb-1">
                         <Flame className="w-3.5 h-3.5" style={{ color: 'hsl(25, 95%, 53%)' }} />
                         <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Calories</span>
                       </div>
                       <p className="text-lg font-bold" style={{ color: 'hsl(25, 95%, 53%)' }}>
                         {Math.round(primaryStravaActivity.calories)} <span className="text-xs font-medium text-muted-foreground">kcal</span>
                       </p>
                     </div>
                  ) : null}
                </div>

              {/* Strava Activities */}
              {selectedSession.stravaActivities && selectedSession.stravaActivities.length > 0 && (!isPureStrava || selectedSession.stravaActivities.length > 1) && (
                <div className="mt-4">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" style={{ color: 'hsl(25, 95%, 53%)' }} />
                    Strava Activities
                  </h4>
                  <div className="space-y-2">
                    {selectedSession.stravaActivities.map((act: StravaActivity, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl glass-surface border border-white/10 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold">{act.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {act.type === 'WeightTraining' ? '🏋️ Weights' :
                              act.type === 'Run' ? '🏃 Run' :
                              act.type === 'Walk' ? '🚶 Walk' :
                              act.type === 'Workout' ? '⚡ Workout' :
                              act.type}
                            {act.distanceMeters > 0 && ` · ${(act.distanceMeters / 1000).toFixed(1)} km`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatDuration(act.durationSeconds / 60)}</p>
                          {act.avgHeartrate && (
                            <p className="text-xs" style={{ color: 'hsl(0, 72%, 58%)' }}>
                              ❤️ {Math.round(act.avgHeartrate)} bpm
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises Breakdown */}
              {selectedSession.entries.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                    Exercise Breakdown
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      // Group entries by exercise name
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
                            className="p-3 rounded-xl glass-surface border border-white/10"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="font-semibold text-sm capitalize">{exercise}</p>
                              <span className="text-xs text-muted-foreground font-medium">
                                {exVolume.toLocaleString()} kg
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {sets.map((set, j) => (
                                <span
                                  key={j}
                                  className="text-[11px] px-2 py-0.5 rounded-full glass-surface border border-white/15 text-muted-foreground font-medium"
                                >
                                  {set.weight}kg × {set.reps}
                                  {set.notes ? ` · ${set.notes}` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </>
          );})()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
