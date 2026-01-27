
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  SuperwallProvider, 
  useUser, 
  usePlacement,
  SuperwallLoading,
  SuperwallLoaded,
  SuperwallError
} from 'expo-superwall';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface PremiumContextType {
  isPremium: boolean;
  showPaywall: () => Promise<void>;
  isLoading: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// Superwall API keys - Replace with your actual keys from Superwall dashboard
const SUPERWALL_API_KEYS = {
  ios: 'pk_d1efcfeff344f6a88f5e7d2f7c4e2b4a7c3b2a1a0b9c8d7e6f5a4b3c2d1e0f9',
  android: 'pk_d1efcfeff344f6a88f5e7d2f7c4e2b4a7c3b2a1a0b9c8d7e6f5a4b3c2d1e0f9'
};

function PremiumProviderInner({ children }: { children: ReactNode }) {
  const { subscriptionStatus } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { registerPlacement } = usePlacement({
    onPresent: (info) => {
      console.log('PremiumContext: Paywall presented', info);
    },
    onDismiss: (info, result) => {
      console.log('PremiumContext: Paywall dismissed', info, result);
      // Check subscription status after dismissal
      if (result === 'purchased' || result === 'restored') {
        console.log('PremiumContext: User purchased or restored subscription');
      }
    },
    onError: (error) => {
      console.error('PremiumContext: Paywall error', error);
    }
  });

  useEffect(() => {
    console.log('PremiumContext: Subscription status changed', subscriptionStatus);
    
    if (subscriptionStatus) {
      const isActive = subscriptionStatus.status === 'ACTIVE';
      setIsPremium(isActive);
      console.log('PremiumContext: Premium status:', isActive);
    }
    
    setIsLoading(false);
  }, [subscriptionStatus]);

  const showPaywall = async () => {
    console.log('PremiumContext: Showing paywall');
    try {
      await registerPlacement({
        placement: 'premium_upgrade',
        feature: () => {
          console.log('PremiumContext: User has premium access');
        }
      });
    } catch (error) {
      console.error('PremiumContext: Error showing paywall', error);
    }
  };

  const value: PremiumContextType = {
    isPremium,
    showPaywall,
    isLoading
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  return (
    <SuperwallProvider 
      apiKeys={SUPERWALL_API_KEYS}
      onConfigurationError={(error) => {
        console.error('PremiumContext: Superwall configuration error', error);
      }}
    >
      <SuperwallLoading>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SuperwallLoading>

      <SuperwallError>
        {(error) => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to initialize payment system</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
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
