
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import Constants from 'expo-constants';
import { 
  SuperwallProvider, 
  useUser, 
  usePlacement,
  SuperwallLoading,
  SuperwallLoaded,
  SuperwallError
} from 'expo-superwall';

interface PremiumContextType {
  isPremium: boolean;
  showPaywall: () => Promise<void>;
  isLoading: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// Superwall API key from your dashboard
const SUPERWALL_API_KEY = 'pk_QrtKh8s4cybt_M4lx7gg1';

// Check if we're running in Expo Go (which doesn't support custom native modules)
const isExpoGo = Constants.appOwnership === 'expo';

// Mock implementation for Expo Go
export function MockPremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium] = useState(false);
  const [isLoading] = useState(false);

  useEffect(() => {
    console.log('PremiumContext: Running in mock mode (Expo Go)');
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

// Real Superwall implementation
function PremiumProviderInner({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ALWAYS call hooks unconditionally at the top level
  const user = useUser();
  const subscriptionStatus = user?.subscriptionStatus;
  
  // Memoize the placement configuration to prevent recreating on every render
  const placementConfig = useMemo(() => ({
    onPresent: (info: any) => {
      console.log('Superwall: Paywall presented', info);
    },
    onDismiss: (info: any, result: any) => {
      console.log('Superwall: Paywall dismissed', info, result);
      // Check subscription status after dismissal
      if (result === 'purchased' || result === 'restored') {
        console.log('Superwall: User purchased or restored subscription');
      }
    },
    onError: (error: any) => {
      console.error('Superwall: Paywall error', error);
    }
  }), []);

  const placement = usePlacement(placementConfig);
  const registerPlacement = placement?.registerPlacement;

  useEffect(() => {
    console.log('Superwall: Subscription status changed', subscriptionStatus);
    
    if (subscriptionStatus) {
      const isActive = subscriptionStatus.status === 'ACTIVE';
      setIsPremium(isActive);
      console.log('Superwall: Premium status:', isActive);
    }
    
    setIsLoading(false);
  }, [subscriptionStatus]);

  const showPaywall = useCallback(async () => {
    console.log('Superwall: Showing paywall for premium_upgrade placement');
    try {
      if (registerPlacement) {
        await registerPlacement({
          placement: 'premium_upgrade',
          feature: () => {
            console.log('Superwall: User has premium access');
          }
        });
      }
    } catch (error) {
      console.error('Superwall: Error showing paywall', error);
    }
  }, [registerPlacement]);

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

  // Use real Superwall provider for native builds
  return (
    <SuperwallProvider 
      apiKey={SUPERWALL_API_KEY}
      onConfigurationError={(error: any) => {
        console.error('Superwall: Configuration error', error);
      }}
    >
      <SuperwallLoading>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Initializing payment system...</Text>
        </View>
      </SuperwallLoading>

      <SuperwallError>
        {(error: any) => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to initialize payment system</Text>
            <Text style={styles.errorSubtext}>{String(error)}</Text>
          </View>
        )}
      </SuperwallError>

      <SuperwallLoaded>
        <PremiumProviderInner>
          {children}
        </PremiumProviderInner>
      </SuperwallLoaded>
    </SuperwallProvider>
  );
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
