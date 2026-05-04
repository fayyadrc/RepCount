"use client";

import React, { useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { Shell } from '@/components/layout/Shell';
import { QuickLog } from '@/components/views/QuickLog';
import { NextSession } from '@/components/views/NextSession';
import { DataHealth } from '@/components/views/DataHealth';
import { Analytics } from '@/components/views/Analytics';
import { History } from '@/components/views/History';
import { WorkoutDetails } from '@/components/views/WorkoutDetails';
import { ViewState } from '@/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { AnimatePresence } from 'framer-motion';
import { WorkoutProvider, useWorkoutStore } from '@/lib/workout-store';

// ─── Error Boundary ───

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ViewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('View crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-primary">Something went wrong</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App Content (needs to be inside WorkoutProvider) ───

function AppContent() {
  const [activeView, setActiveView] = useState<ViewState>('quick-log');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { sessions } = useWorkoutStore();

  // Expose setActiveView globally for simple navigation from nested components
  React.useEffect(() => {
    (window as any).setActiveView = setActiveView;
  }, [setActiveView]);

  // Derive anomaly count from sessions:
  // For now, track how many sessions have potential issues (non-empty store = realistic scan needed)
  // This will be dynamically updated when DataHealth actually scans data
  const [anomalyCount, setAnomalyCount] = useState(0);

  const renderView = () => {
    switch (activeView) {
      case 'quick-log':
        return <QuickLog />;
      case 'next-session':
        return <NextSession />;
      case 'analytics':
        return <Analytics />;
      case 'data-health':
        return <DataHealth onAnomalyCountChange={setAnomalyCount} />;
      case 'history':
        return <History onViewDetails={(id) => { setSelectedSessionId(id); setActiveView('workout-details'); }} />;
      case 'workout-details':
        return <WorkoutDetails sessionId={selectedSessionId} onBack={() => setActiveView('history')} />;
      default:
        return <QuickLog />;
    }
  };

  return (
    <>
      <Shell 
        activeView={activeView} 
        setActiveView={setActiveView} 
        anomalyCount={anomalyCount}
      >
        <AnimatePresence mode="wait">
          <ViewErrorBoundary 
            key={activeView} 
            onReset={() => setActiveView('quick-log')}
          >
            {renderView()}
          </ViewErrorBoundary>
        </AnimatePresence>
      </Shell>
      <Toaster />
    </>
  );
}

// ─── Root Page ───

export default function Home() {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
}