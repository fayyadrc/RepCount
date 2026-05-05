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
          <h2 className="text-2xl font-bold text-black leading-tight">
            @fayyadrc
          </h2>
          <p className="text-gray-400 text-sm font-medium">Standard Plan</p>
        </div>
      </header>

      {/* Body Stats Card (Simplified Analytics) */}
      <div className="bg-[#F2F2F7]/50 rounded-[24px] p-6 space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.05em]">Body Stats</span>
          <button className="text-[#8E8E93] text-[15px] font-medium">Edit</button>
        </div>

        <div className="flex justify-between items-end px-2">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-black">73.5</span>
              <span className="text-[15px] font-semibold text-[#8E8E93]">kg</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              Weight <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1 text-center">
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-3xl font-bold text-black">170</span>
              <span className="text-[15px] font-semibold text-[#8E8E93]">cm</span>
            </div>
            <div className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              Height
            </div>
          </div>

          <div className="space-y-1 text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-3xl font-bold text-black">25.4</span>
            </div>
            <div className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              BMI
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <div className="bg-white/60 px-3 py-1 rounded-full text-[10px] font-bold text-black border border-black/5">MALE</div>
          <div className="bg-white/60 px-3 py-1 rounded-full text-[10px] font-bold text-black border border-black/5">METRIC</div>
        </div>
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
