import React from 'react';
import { ChevronDown, User, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { ActivityCalendar, DayActivity, ActivityType } from '@/components/ui/ActivityCalendar';
import { useWorkoutStore } from '@/lib/workout-store';
import { WorkoutSession } from '@/lib/types';

export const Profile: React.FC = () => {
  const { sessions } = useWorkoutStore();

  // Helper to determine the primary activity type for a session
  const getSessionActivityType = (session: WorkoutSession): ActivityType => {
    // Check Strava activities first for specific types
    if (session.stravaActivities && session.stravaActivities.length > 0) {
      const type = session.stravaActivities[0].type;
      switch (type) {
        case 'Run': return 'run';
        case 'Ride': return 'cycle';
        case 'Walk': return 'walk';
        case 'Swim': return 'swim';
        case 'Hike': return 'hike';
        case 'Yoga': return 'yoga';
        case 'Workout': return 'hiit';
        case 'Crossfit': return 'hiit';
        case 'WeightTraining': return 'strength';
        case 'Rowing': return 'cardio';
        default: break; 
      }
    }

    // Manual gym entries check
    if (session.entries.length > 0) return 'strength';
    
    return 'other';
  };

  // Helper to get the count for a session (number of distinct activities)
  const getSessionCount = (session: WorkoutSession): number => {
    const manualSessionCount = session.entries.length > 0 ? 1 : 0;
    const stravaActivityCount = session.stravaActivities?.length || 0;
    return manualSessionCount + stravaActivityCount;
  };

  // Aggregate sessions by date for the calendar
  const activities = React.useMemo(() => {
    const acc: Record<string, DayActivity> = {};
    
    // Priority for icons: Run > Cycle > Strength > Swim > Hike > Yoga > HIIT > Walk > Other
    const priority: Record<ActivityType, number> = { 
      'run': 10, 
      'cycle': 9, 
      'strength': 8, 
      'swim': 7,
      'hike': 6,
      'yoga': 5,
      'hiit': 4,
      'cardio': 3,
      'walk': 2,
      'other': 1 
    };

    sessions.forEach(session => {
      const date = session.date;
      const type = getSessionActivityType(session);
      const count = getSessionCount(session);

      if (!acc[date]) {
        acc[date] = { type, count };
      } else {
        acc[date].count += count;
        if (priority[type] > priority[acc[date].type]) {
          acc[date].type = type;
        }
      }
    });

    return acc;
  }, [sessions]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pt-4 pb-32 px-3 md:px-4"
    >
      <header className="flex items-center gap-4 px-1">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
          <User className="text-white w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight leading-tight">
            @fayyadrc
          </h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Standard Plan</p>
        </div>
      </header>

      {/* Activity Calendar Section */}
      <div className="space-y-4">
        <h3 className="px-2 text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.05em]">Activity Tracker</h3>
        <ActivityCalendar activities={activities} />
      </div>

      {/* Settings List */}
      <div className="space-y-1">
        <h3 className="px-2 text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.05em] mb-3">Preferences</h3>
        <ProfileItem 
          icon={<Bell className="w-5 h-5" />} 
          label="Data Health" 
          onClick={() => (window as any).setActiveView?.('data-health')}
        />
      </div>
    </motion.div>
  );
};

const ProfileItem: React.FC<{ icon: React.ReactNode, label: string, onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors rounded-2xl border border-gray-50"
  >
    <div className="flex items-center gap-3">
      <div className="text-black">{icon}</div>
      <span className="text-[15px] font-semibold text-black">{label}</span>
    </div>
    <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
  </button>
);
