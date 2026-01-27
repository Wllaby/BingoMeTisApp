
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import Constants from 'expo-constants';

interface PremiumContextType {
  isPremium: boolean;
  showPaywall: () => Promise<void>;
  isLoading: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// Check if we're running in Expo Go (which doesn't support custom native modules)
const isExpoGo = Constants.appOwnership === 'expo';

// Mock implementation for Expo Go and Web
export function MockPremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium] = useState(false);
  const [isLoading] = useState(false);

  useEffect(() => {
    console.log('PremiumContext: Running in mock mode (Expo Go or Web)');
  }, []);

  const showPaywall = useCallback(async () => {
    console.log('PremiumContext: Mock paywall - would show upgrade screen');
  }, []);

  const value: PremiumContextType = useMemo(() => ({
    isPremium,
    showPaywall,
    isLoading
  }), [isPremium, showPaywall, isLoading]);

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  // If we're in Expo Go, use mock implementation
  if (isExpoGo) {
    console.log('PremiumProvider: Using mock mode (Expo Go)');
    return <MockPremiumProvider>{children}</MockPremiumProvider>;
  }

  // For native builds, this will be replaced by the .native.tsx version
  // For web, use mock implementation
  return <MockPremiumProvider>{children}</MockPremiumProvider>;
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center'
  }
});
