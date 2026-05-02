"use client";

import React, { useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Send } from 'lucide-react';

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
  placeholder = "What did you train today?",
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea height
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (value.trim() && !isSubmitting) {
        onSubmit();
      }
    }
  };

  return (
    <div
      className={cn(
        "relative glass-surface rounded-[20px] overflow-hidden transition-all duration-300",
        "focus-within:shadow-[0_12px_48px_rgba(0,0,0,0.12)]",
        "focus-within:border-white/50",
      )}
    >
      {/* Faint top divider */}
      <div className="h-px mx-6 bg-black/[0.04]" />

      {/* Writing surface */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSubmitting}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent border-none outline-none resize-none",
          "px-6 pt-5 pb-20",
          "text-[17px] leading-[1.65] text-foreground",
          "placeholder:text-muted-foreground/50 placeholder:italic",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "selection:bg-accent/20",
        )}
        style={{
          minHeight: '200px',
          fontFamily: 'var(--font-body)',
        }}
      />

      {/* Bottom fade gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--glass-bg) 0%, transparent 100%)',
        }}
      />

      {/* Floating submit button */}
      <div className="absolute bottom-5 right-5 pointer-events-auto">
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !value.trim()}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full",
            "text-sm font-semibold text-white",
            "transition-all duration-200 ease-out",
            "disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed",
            "active:scale-[0.96]",
            !isSubmitting && value.trim() && "hover:-translate-y-0.5",
          )}
          style={{
            background: value.trim() && !isSubmitting
              ? 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(208, 12%, 28%) 100%)'
              : 'hsl(var(--primary))',
            boxShadow: value.trim() && !isSubmitting
              ? '0 4px 16px rgba(76, 84, 91, 0.35), 0 1px 3px rgba(0,0,0,0.1)'
              : 'none',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing…</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
