
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';
import Constants from 'expo-constants';
import { router } from 'expo-router';

interface PremiumContextType {
  isPremium: boolean;
  showPaywall: () => Promise<void>;
  isLoading: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// Superwall API key from your dashboard
const SUPERWALL_API_KEY = 'pk_QrtKh8s4cybt_M4lx7gg1';

// Check if we're running in a development environment
const isExpoGo = Constants.appOwnership === 'expo';

// Mock implementation for Expo Go and fallback
export function MockPremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium] = useState(false);
  const [isLoading] = useState(false);

  useEffect(() => {
    console.log('PremiumContext: Running in mock mode (Expo Go or Web)');
  }, []);

  const showPaywall = useCallback(async () => {
    console.log('PremiumContext: Mock paywall - navigating to premium screen');
    
    try {
      router.push('/premium');
    } catch (error) {
      console.error('PremiumContext: Error navigating to premium screen:', error);
    }
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

// Safely try to import Superwall
let SuperwallModule: any = null;
let superwallLoadError: any = null;

try {
  if (!isExpoGo) {
    SuperwallModule = require('expo-superwall');
    console.log('PremiumContext: Superwall module loaded successfully');
  } else {
    console.log('PremiumContext: Running in Expo Go, Superwall not available');
  }
} catch (error) {
  superwallLoadError = error;
  console.log('PremiumContext: Superwall module not available:', error);
}

// Create safe hook wrappers that can be called unconditionally
function useSafeSuperwallUser() {
  // Always call the hook unconditionally - if SuperwallModule doesn't exist, return null
  if (SuperwallModule && SuperwallModule.useUser) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return SuperwallModule.useUser();
  }
  return null;
}

function useSafeSuperwallPlacement(config: any) {
  // Always call the hook unconditionally - if SuperwallModule doesn't exist, return null
  if (SuperwallModule && SuperwallModule.usePlacement) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return SuperwallModule.usePlacement(config);
  }
  return null;
}

// Real Superwall implementation
function PremiumProviderInner({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the placement configuration
  const placementConfig = useMemo(() => ({
    onPresent: (info: any) => {
      console.log('Superwall: Paywall presented', info);
    },
    onDismiss: (info: any, result: any) => {
      console.log('Superwall: Paywall dismissed', info, result);
      if (result === 'purchased' || result === 'restored') {
        console.log('Superwall: User purchased or restored subscription');
      }
    },
    onError: (error: any) => {
      console.error('Superwall: Paywall error', error);
    }
  }), []);

  // CRITICAL FIX: Always call hooks unconditionally at the top level
  // The safe wrappers handle the case where SuperwallModule might be null
  const user = useSafeSuperwallUser();
  const placement = useSafeSuperwallPlacement(placementConfig);
  
  const subscriptionStatus = user?.subscriptionStatus;
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
      } else {
        console.log('Superwall: registerPlacement not available, navigating to premium screen');
        router.push('/premium');
      }
    } catch (error) {
      console.error('Superwall: Error showing paywall', error);
      try {
        router.push('/premium');
      } catch (navError) {
        console.error('Superwall: Error navigating to premium screen:', navError);
      }
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

  // If Superwall module is not available or failed to load, use mock
  if (!SuperwallModule || superwallLoadError) {
    console.log('PremiumProvider: Superwall module not available, using mock mode');
    if (superwallLoadError) {
      console.log('PremiumProvider: Load error:', superwallLoadError);
    }
    return <MockPremiumProvider>{children}</MockPremiumProvider>;
  }

  // If Superwall components are not available, use mock
  if (!SuperwallModule.SuperwallProvider || !SuperwallModule.SuperwallLoading || 
      !SuperwallModule.SuperwallError || !SuperwallModule.SuperwallLoaded) {
    console.log('PremiumProvider: Superwall components not available, using mock mode');
    return <MockPremiumProvider>{children}</MockPremiumProvider>;
  }

  // Use real Superwall provider for production native builds
  const SuperwallProvider = SuperwallModule.SuperwallProvider;
  const SuperwallLoading = SuperwallModule.SuperwallLoading;
  const SuperwallError = SuperwallModule.SuperwallError;
  const SuperwallLoaded = SuperwallModule.SuperwallLoaded;

  try {
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
          {(error: any) => {
            console.error('Superwall: Error state', error);
            // Fallback to mock provider on error
            return <MockPremiumProvider>{children}</MockPremiumProvider>;
          }}
        </SuperwallError>

        <SuperwallLoaded>
          <PremiumProviderInner>
            {children}
          </PremiumProviderInner>
        </SuperwallLoaded>
      </SuperwallProvider>
    );
  } catch (error) {
    console.error('PremiumProvider: Error initializing Superwall, falling back to mock mode:', error);
    return <MockPremiumProvider>{children}</MockPremiumProvider>;
  }
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
    textAlign: 'center',
    marginTop: 4
  }
});
