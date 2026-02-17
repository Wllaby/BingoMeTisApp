
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert, Platform } from "react-native";
import { useNetworkState } from "expo-network";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { PremiumProvider } from "@/contexts/PremiumContext";
// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Initialize Google Mobile Ads
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    const mobileAds = require('react-native-google-mobile-ads').default;
    mobileAds()
      .initialize()
      .then(() => {
        console.log('Google Mobile Ads initialized successfully');
      })
      .catch((error: any) => {
        console.error('Failed to initialize Google Mobile Ads:', error);
      });
  } catch (error) {
    console.error('Error loading Google Mobile Ads module:', error);
  }
}

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Handle deep links for Superwall
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      
      const url = Linking.parse(event.url);
      console.log('Parsed deep link:', url);
      
      // Superwall deep links will be automatically handled by the SDK
      // You can add custom handling here if needed
    };

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with deep link:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
      background: "rgb(1, 1, 1)", // True black background for OLED displays
      card: "rgb(28, 28, 30)", // Dark card/surface color
      text: "rgb(255, 255, 255)", // White text for dark mode
      border: "rgb(44, 44, 46)", // Dark gray for separators/borders
      notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
    },
  };
  return (
    <>
      <StatusBar style="auto" animated />
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <PremiumProvider>
            <WidgetProvider>
              <GestureHandlerRootView>
              <Stack>
                {/* Main app with tabs */}
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ 
                    headerShown: false,
                    headerBackTitle: ''
                  }} 
                />
                
                {/* Modal screens outside tabs */}
                <Stack.Screen 
                  name="create-theme" 
                  options={{ 
                    headerShown: false,
                    headerBackTitle: '',
                    presentation: 'card'
                  }} 
                />
                
                <Stack.Screen 
                  name="join-game" 
                  options={{ 
                    headerShown: false,
                    headerBackTitle: '',
                    presentation: 'card'
                  }} 
                />
                
                <Stack.Screen 
                  name="history" 
                  options={{ 
                    headerShown: false,
                    headerBackTitle: '',
                    presentation: 'card'
                  }} 
                />
                
                <Stack.Screen 
                  name="admin-upload" 
                  options={{ 
                    headerShown: false,
                    headerBackTitle: '',
                    presentation: 'card'
                  }} 
                />

                <Stack.Screen 
                  name="premium" 
                  options={{ 
                    headerShown: false,
                    headerBackTitle: '',
                    presentation: 'card'
                  }} 
                />
              </Stack>
              <SystemBars style={"auto"} />
              </GestureHandlerRootView>
            </WidgetProvider>
          </PremiumProvider>
        </ThemeProvider>
    </>
  );
}
