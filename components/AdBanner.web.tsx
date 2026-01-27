
import React from 'react';
import { usePremium } from '@/contexts/PremiumContext';

interface AdBannerProps {
  position?: 'top' | 'bottom';
}

// Web version - no ads on web platform
export function AdBanner({ position = 'bottom' }: AdBannerProps) {
  const { isPremium } = usePremium();

  console.log('AdBanner (Web): Ads not supported on web platform');
  
  // Don't show anything on web
  return null;
}
