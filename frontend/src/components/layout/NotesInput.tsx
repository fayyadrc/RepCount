"use client";

import React, { useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Check, MoreHorizontal } from 'lucide-react';

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder = "Start writing...",
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(500, textarea.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (value.trim() && !isSubmitting) {
        onSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white animate-fade-up">
      {/* Apple Notes Header */}
      <div className="flex items-center justify-end gap-6 px-6 py-4">
        <button 
          className="text-[#007AFF] hover:opacity-70 transition-opacity"
          disabled={disabled}
        >
          <MoreHorizontal className="w-6 h-6" strokeWidth={2} />
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !value.trim()}
          className={cn(
            "text-[#007AFF] font-semibold text-[17px] flex items-center gap-2 hover:opacity-70 transition-opacity disabled:opacity-30",
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (
            <Check className="w-6 h-6" strokeWidth={2.5} />
          )}
          <span>Done</span>
        </button>
      </div>

      {/* Writing Surface */}
      <div className="flex-1 px-6 pt-2 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSubmitting}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent border-none outline-none resize-none",
            "text-[19px] leading-[1.5] text-black",
            "placeholder:text-gray-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          style={{
            minHeight: '500px',
            fontFamily: 'var(--font-body)',
          }}
          autoFocus
        />
      </div>
    </div>
  );
};
