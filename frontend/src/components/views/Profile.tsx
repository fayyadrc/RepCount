import React from 'react';
import { ChevronDown, User, Shield, Bell, CircleHelp } from 'lucide-react';
import { motion } from 'framer-motion';

export const Profile: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pt-4 pb-20"
    >
      <header className="flex items-center gap-4">
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
