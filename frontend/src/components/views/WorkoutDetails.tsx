
"use client";

import React, { useEffect } from 'react';
import { useWorkoutStore } from '@/lib/workout-store';
import { 
  ChevronLeft, 
  Weight, 
  Dumbbell, 
  Timer, 
  Heart, 
  Activity, 
  Gauge, 
  Mountain, 
  Flame, 
  Footprints, 
  Bike, 
  Zap,
  Info,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StravaActivity, WorkoutEntry } from '@/lib/types';
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
  const { sessions, updateLog, deleteLog } = useWorkoutStore();
  const { toast } = useToast();
  const selectedSession = sessions.find(s => s.id === sessionId);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<{ weight: number, reps: number, exercise: string, notes: string }>({
    weight: 0,
    reps: 0,
    exercise: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Scroll to top when view loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!selectedSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
          <Info className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">Session Not Found</h3>
          <button 
            onClick={onBack}
            className="text-muted-foreground text-sm font-bold uppercase tracking-widest hover:text-foreground transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
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
  const maxHr = selectedSession.stravaActivities?.reduce((max, act) => Math.max(max, act.maxHeartrate || 0), 0) || 0;
  const totalCalories = selectedSession.stravaActivities?.reduce((sum, act) => sum + (act.calories || 0), 0) || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pt-4 pb-24"
    >
      <header className="space-y-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all btn-tap-scale group"
        >
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border/40 group-hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4 text-foreground stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">Back to History</span>
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight font-heading leading-tight">
            {isPureStrava && primaryStravaActivity && selectedSession.stravaActivities!.length === 1 
              ? primaryStravaActivity.name 
              : "Workout Details"
            }
          </h2>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider font-mono mt-1.5">
            {new Date(selectedSession.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </header>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {selectedSession.entries.length > 0 && (
          <StatCard 
            icon={<Weight className="w-4 h-4 text-accent-blue" />}
            label="Total Volume"
            value={(selectedSession.totalVolumeKg ?? selectedSession.entries.reduce((s, e) => s + e.weight * e.sets * e.reps, 0)).toLocaleString()}
            subtext="kg"
          />
        )}
        {displayDuration > 0 && (
          <StatCard 
            icon={<Timer className="w-4 h-4 text-accent-orange" />}
            label="Duration"
            value={formatDuration(displayDuration)}
            subtext="active time"
          />
        )}
        {(displayHr || maxHr > 0) && (
          <StatCard 
            icon={<Heart className="w-4 h-4 text-destructive" />}
            label="Heart Rate"
            value={
              <div className="flex items-baseline gap-2">
                <span className="font-mono">{displayHr ? Math.round(displayHr) : '--'}</span>
                {maxHr > 0 && <span className="text-[11px] text-muted-foreground font-sans font-semibold">/ {Math.round(maxHr)} max</span>}
              </div>
            }
            subtext="bpm"
          />
        )}
        {totalCalories > 0 && (
          <StatCard 
            icon={<Flame className="w-4 h-4 text-accent-orange" />}
            label="Calories"
            value={Math.round(totalCalories)}
            subtext="kcal burnt"
          />
        )}
        {isPureStrava && primaryStravaActivity?.distanceMeters && (
          <StatCard 
            icon={<Activity className="w-4 h-4 text-accent-blue" />}
            label="Distance"
            value={(primaryStravaActivity.distanceMeters / 1000).toFixed(2)}
            subtext="km"
          />
        )}
      </div>

      {/* Exercises Breakdown */}
      {selectedSession.entries.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Dumbbell className="w-4 h-4 text-foreground" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] font-mono">Exercise Breakdown</span>
          </div>
          
          <div className="space-y-4">
            {(() => {
              const grouped: Record<string, WorkoutEntry[]> = {};
              selectedSession.entries.forEach(entry => {
                if (!grouped[entry.exercise]) grouped[entry.exercise] = [];
                grouped[entry.exercise].push(entry);
              });

              const handleStartEdit = (entry: WorkoutEntry) => {
                if (!entry.id) return;
                setEditingId(entry.id);
                setEditValues({
                  weight: entry.weight,
                  reps: entry.reps,
                  exercise: entry.exercise,
                  notes: entry.notes || ''
                });
              };

              const handleSaveEdit = async (id: string) => {
                setIsSubmitting(true);
                try {
                  await updateLog(id, {
                    ...editValues,
                    sets: 1, 
                    weightUnit: 'kg'
                  });
                  setEditingId(null);
                  toast({ title: "Updated", description: "Log entry updated successfully." });
                } catch (e) {
                  toast({ variant: "destructive", title: "Error", description: "Failed to update log." });
                } finally {
                  setIsSubmitting(false);
                }
              };

              const handleDelete = async (id: string) => {
                setIsSubmitting(true);
                try {
                  await deleteLog(id);
                  toast({ title: "Deleted", description: "Log entry removed." });
                } catch (e) {
                  toast({ variant: "destructive", title: "Error", description: "Failed to delete entry." });
                } finally {
                  setIsSubmitting(false);
                  setIsDeletingId(null);
                }
              };

              return Object.entries(grouped).map(([exercise, sets], i) => {
                const exVolume = sets.reduce((s, e) => s + e.weight * e.sets * e.reps, 0);
                return (
                  <div key={i} className="bg-card border border-border shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-[24px] p-6 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-lg font-bold text-foreground capitalize font-heading leading-tight">{exercise}</h4>
                      <span className="ios-badge bg-accent-blue-bg text-accent-blue">
                        {exVolume.toLocaleString()} kg
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {sets.map((set, j) => {
                        const isEditing = set.id && editingId === set.id;
                        const isDeleting = set.id && isDeletingId === set.id;

                        if (isEditing) {
                          return (
                            <div key={j} className="flex flex-col gap-3 p-4 bg-secondary/30 rounded-2xl border border-border">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1 font-mono">Weight (kg)</label>
                                  <input 
                                    type="number" 
                                    value={editValues.weight}
                                    onChange={(e) => setEditValues({...editValues, weight: parseFloat(e.target.value)})}
                                    className="w-full bg-card border border-border rounded-xl p-2.5 text-sm font-bold font-mono focus:ring-1 focus:ring-foreground outline-none"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1 font-mono">Reps</label>
                                  <input 
                                    type="number" 
                                    value={editValues.reps}
                                    onChange={(e) => setEditValues({...editValues, reps: parseInt(e.target.value)})}
                                    className="w-full bg-card border border-border rounded-xl p-2.5 text-sm font-bold font-mono focus:ring-1 focus:ring-foreground outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleSaveEdit(set.id!)}
                                  disabled={isSubmitting}
                                  className="flex-1 bg-foreground text-background rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform btn-tap-scale font-mono"
                                >
                                  <Check className="w-3.5 h-3.5" /> Save
                                </button>
                                <button 
                                  onClick={() => setEditingId(null)}
                                  disabled={isSubmitting}
                                  className="px-4 bg-card border border-border text-muted-foreground rounded-xl py-2.5 flex items-center justify-center active:scale-95 transition-transform btn-tap-scale"
                                >
                                  <X className="w-3.5 h-3.5 text-foreground" />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={j} className="group flex items-center justify-between text-sm py-3 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-bold text-muted-foreground/80 uppercase w-10 font-mono">Set {j+1}</span>
                              <span className="font-extrabold text-foreground font-mono">{set.weight}<span className="text-[10px] text-muted-foreground font-sans font-medium ml-0.5 uppercase">kg</span></span>
                              <span className="text-muted-foreground/50">×</span>
                              <span className="font-extrabold text-foreground font-mono">{set.reps}<span className="text-[10px] text-muted-foreground font-sans font-medium ml-0.5 uppercase">reps</span></span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {set.notes && !isDeleting && (
                                <span className="ios-badge bg-accent-orange-bg text-accent-orange py-0.5 px-2 rounded-lg text-[9px] truncate max-w-[120px]">
                                  {set.notes}
                                </span>
                              )}
                              
                              {!isDeleting ? (
                                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleStartEdit(set)}
                                    className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors btn-tap-scale"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => setIsDeletingId(set.id || null)}
                                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors btn-tap-scale"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-destructive uppercase font-mono">Delete?</span>
                                  <button 
                                    onClick={() => handleDelete(set.id!)}
                                    className="p-1.5 bg-destructive text-destructive-foreground rounded-lg transition-colors btn-tap-scale"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => setIsDeletingId(null)}
                                    className="p-1.5 bg-secondary text-muted-foreground rounded-lg transition-colors btn-tap-scale"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>
      )}

      {/* Strava Details if available */}
      {hasStrava && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Flame className="w-4 h-4 text-accent-orange" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] font-mono">Strava Activities</span>
          </div>
          
          <div className="space-y-3">
            {selectedSession.stravaActivities?.map((act, i) => (
              <div key={i} className="bg-card rounded-[24px] p-5 border border-border shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-orange-bg flex items-center justify-center">
                    {getStravaIcon(act.type, "w-5 h-5 text-accent-orange")}
                  </div>
                  <div>
                    <p className="font-extrabold text-foreground tracking-tight leading-tight">{act.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest font-mono mt-0.5">{act.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-foreground font-mono">{formatDuration(act.durationSeconds / 60)}</p>
                  {act.calories && <p className="text-[10px] font-bold text-accent-orange uppercase tracking-tight font-mono mt-0.5">{Math.round(act.calories)} kcal</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: React.ReactNode, subtext: string }> = ({ icon, label, value, subtext }) => (
  <div className="bg-card border border-border shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-[24px] p-5 space-y-3.5">
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/80 text-foreground shrink-0">{icon}</div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">{label}</span>
    </div>
    <div>
      <div className="text-2xl font-extrabold text-foreground font-heading">{value}</div>
      <p className="text-[10px] font-semibold text-muted-foreground mt-1 uppercase tracking-wide font-mono">{subtext}</p>
    </div>
  </div>
);