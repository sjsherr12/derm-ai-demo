import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import SignUpNavigator from './src/navigation/SignUpNavigator';
import { Text, TextInput, SafeAreaView, View, Alert } from 'react-native';
import DefaultStyles from 'config/styles';
import { AuthProvider } from 'context/global/AuthContext';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomNavigation from 'navigation/CustomNavigation';
import { enableScreens } from 'react-native-screens';
import * as Font from 'expo-font';
import { RedirectProvider } from 'context/RedirectContext';
import { redirectContextNavigationRef } from 'context/RedirectContext';
import { SignUpFlowProvider } from 'context/SignUpFlowContext';
import { DataProvider } from 'context/global/DataContext';
import { ProductCacheProvider } from 'context/global/ProductCacheProvider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistentSafeAreaProvider } from 'context/SafeAreaContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications'
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import SplashTransition from './src/components/Graphics/SplashTransition';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep native splash visible until we're ready to show our custom splash
SplashScreen.preventAutoHideAsync();

enableScreens();

export default function App() {
    const [showSplash, setShowSplash] = useState(true);
    const [splashComplete, setSplashComplete] = useState(false);
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        const loadFonts = async () => {
            await Font.loadAsync({
                'HedvigLettersSerif': require('./src/assets/fonts/HedvigLettersSerif.ttf'),
            });
            setFontsLoaded(true);
            // Hide native splash once fonts are loaded so custom splash can show
            await SplashScreen.hideAsync();
        };

        loadFonts();
    }, []);

    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const { isAvailable } = await Updates.checkForUpdateAsync();
                if (isAvailable) {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                }
            } catch (error) {
                console.log('Error checking for updates:', error);
            }
        };

        checkForUpdates();
    }, []);

    const handleSplashComplete = () => {
        setShowSplash(false);
        // Wait a frame before loading heavy data to ensure smooth transition
        requestAnimationFrame(() => {
            setSplashComplete(true);
        });
    };

    if (!fontsLoaded) {
        return null; // Or your loading component
    }

    return (
        <GestureHandlerRootView style={DefaultStyles.outer}>
            <ProductCacheProvider>
                <SafeAreaProvider>
                    <PersistentSafeAreaProvider>
                        <BottomSheetModalProvider>
                            <RedirectProvider>
                                <SignUpFlowProvider>
                                    <AuthProvider>
                                        <DataProvider deferInitialization={!splashComplete}>
                                            {splashComplete ? (
                                                <NavigationContainer ref={redirectContextNavigationRef}>
                                                    <CustomNavigation />
                                                </NavigationContainer>
                                            ) : null}
                                        </DataProvider>
                                    </AuthProvider>
                                </SignUpFlowProvider>
                            </RedirectProvider>
                        </BottomSheetModalProvider>
                    </PersistentSafeAreaProvider>
                </SafeAreaProvider>
            </ProductCacheProvider>
            {showSplash && <SplashTransition onComplete={handleSplashComplete} />}
        </GestureHandlerRootView>
    );
}