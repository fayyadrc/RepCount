"use client";

import React from 'react';
import { LandingNav } from './LandingNav';
import { HeroSection } from './HeroSection';
import { FeatureShowcase } from './FeatureShowcase';
import { CtaSection } from './CtaSection';
import { LandingFooter } from './LandingFooter';
import { Toaster } from '@/components/ui/toaster';

export const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-background premium-dot-grid">
    <LandingNav />
    <main>
      <HeroSection />
      <FeatureShowcase />
      <CtaSection />
    </main>
    <LandingFooter />
    <Toaster />
  </div>
);
