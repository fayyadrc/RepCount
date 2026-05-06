import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Footprints, 
  Bike, 
  Dumbbell, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  Waves,
  Mountain,
  Flower2,
  Flame,
  Heart
} from 'lucide-react';

export type ActivityType = 
  | 'run' 
  | 'cycle' 
  | 'strength' 
  | 'walk' 
  | 'swim' 
  | 'hike' 
  | 'yoga' 
  | 'hiit' 
  | 'cardio'
  | 'other';

export interface DayActivity {
  type: ActivityType;
  count: number;
}

interface ActivityCalendarProps {
  initialMonth?: Date;
  activities?: Record<string, DayActivity>;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ 
  initialMonth = new Date(),
  activities = {}
}) => {
  const [viewDate, setViewDate] = useState(initialMonth);
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  const changeMonth = (offset: number) => {
    const nextDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(nextDate);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long' });
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6; 
  
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const daysInMonth = lastDayOfMonth.getDate();
  
  const calendarDays: { day: number; month: 'prev' | 'current' | 'next'; dateKey?: string }[] = [];
  
  for (let i = startOffset - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthLastDay - i, month: 'prev' });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ day: i, month: 'current', dateKey });
  }
  
  const totalCells = calendarDays.length > 35 ? 42 : 35;
  const remainingCells = totalCells - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({ day: i, month: 'next' });
  }

  const renderIcon = (type: ActivityType, className?: string) => {
    const iconProps = { className: className || "w-5 h-5 md:w-7 md:h-7" };
    switch (type) {
      case 'run': return <Footprints {...iconProps} />;
      case 'cycle': return <Bike {...iconProps} />;
      case 'strength': return <Dumbbell {...iconProps} />;
      case 'walk': return <Footprints {...iconProps} className={cn(iconProps.className, "opacity-70")} />;
      case 'swim': return <Waves {...iconProps} />;
      case 'hike': return <Mountain {...iconProps} />;
      case 'yoga': return <Flower2 {...iconProps} />;
      case 'hiit': return <Flame {...iconProps} />;
      case 'cardio': return <Heart {...iconProps} />;
      default: return <Zap {...iconProps} />;
    }
  };

  return (
    <div className="bg-card rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-border w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h4 className="text-[17px] md:text-[20px] font-bold text-foreground tracking-tight">
            {monthName} <span className="text-muted-foreground font-medium ml-1">{year}</span>
          </h4>
        </div>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors active:scale-90">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={() => changeMonth(1)} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors active:scale-90">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-4 md:gap-y-6">
        {daysOfWeek.map((day, i) => (
          <div key={i} className="text-center text-[11px] md:text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="col-span-7 grid grid-cols-7 gap-y-4 md:gap-y-6"
          >
            {calendarDays.map((cell, i) => {
              const activity = cell.dateKey ? activities[cell.dateKey] : null;
              const isCurrent = cell.month === 'current';
              
              return (
                <div key={i} className="flex flex-col items-center justify-start min-h-[60px] md:min-h-[85px]">
                  {isCurrent ? (
                    activity ? (
                      <div className="relative flex flex-col items-center">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-10 h-10 md:w-14 md:h-14 bg-foreground rounded-full flex items-center justify-center text-background relative shadow-lg"
                        >
                          {renderIcon(activity.type)}
                        </motion.div>
                        <span className="mt-1 md:mt-2 text-[10px] md:text-[13px] font-medium text-muted-foreground">
                          {cell.day}
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 md:w-14 md:h-14 border border-border rounded-full flex items-center justify-center text-[12px] md:text-[15px] font-medium text-foreground">
                        {cell.day}
                      </div>
                    )
                  ) : (
                    <span className="text-[12px] md:text-[15px] font-medium text-muted-foreground/50 pt-2 md:pt-4">
                      {cell.day}
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
