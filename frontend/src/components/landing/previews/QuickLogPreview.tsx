import React from 'react';
import { Check, Sparkles } from 'lucide-react';

const MOCK_ENTRIES = [
  { exercise: 'Bench Press', weight: 80, unit: 'kg', reps: 8, notes: 'RIR 2. Clean lockout.' },
  { exercise: 'Incline DB Press', weight: 28, unit: 'kg', reps: 10, notes: 'To failure.' },
];

export const QuickLogPreview: React.FC = () => (
  <div className="space-y-4 p-4 sm:p-6">
    <div className="bg-card rounded-[20px] border border-border p-4 min-h-[120px] relative">
      <p className="text-[13px] text-muted-foreground font-medium leading-relaxed pr-12">
        Benched 80kg for 8 reps, then incline dumbbell press 28kg x 10 to failure...
      </p>
      <div className="absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center bg-foreground text-background rounded-full shadow-md">
        <Check className="w-4 h-4 stroke-[2.5]" />
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Sparkles className="w-3.5 h-3.5 text-accent-orange" />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] font-mono">
        Captured Exercises
      </span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {MOCK_ENTRIES.map((entry) => (
        <div
          key={entry.exercise}
          className="bg-card rounded-[16px] border border-border p-4 space-y-3"
        >
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-sm font-bold text-foreground font-heading">{entry.exercise}</h4>
            <span className="ios-badge bg-accent-orange-bg text-accent-orange text-[9px]">SET 1</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Weight</span>
              <p className="text-base font-extrabold font-mono">
                {entry.weight}
                <span className="text-[10px] text-muted-foreground ml-0.5 font-sans">{entry.unit}</span>
              </p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Reps</span>
              <p className="text-base font-extrabold font-mono">{entry.reps}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
