import 'dotenv/config';

export default {
    expo: {
        version: '1.0.4',
        name: "Derm AI",
        slug: "derm-ai",
        owner: "derm-ai",
        scheme: process.env.BUNDLE_ID,
        orientation: 'portrait',
        icon: "./src/assets/logos/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,

        ios: {
            deploymentTarget: '11.0',
            bundleIdentifier: process.env.BUNDLE_ID,
            usesAppleSignIn: true,
            supportsTablet: false,
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSAppleIDUsageDescription: 'Sign in with your Apple ID to personalize your experience',
                NSCameraUsageDescription: 'Use your camera to take face scans so Derm AI can track your skin progress over time.',
            },
            googleServicesFile: "./GoogleService-Info.plist",
        },

        android: {
            package: process.env.BUNDLE_ID,
            googleServicesFile: './google-services.json',
            adaptiveIcon: {
                foregroundImage: "./src/assets/logos/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            useNextNotificationsApi: true,
            edgeToEdgeEnabled: true,
        },

        web: {
            favicon: "./src/assets/logos/icon.png",
        },

        updates: {
            enabled: true,
            checkAutomatically: "ON_LOAD",
            fallbackToCacheTimeout: 3000,
            url: process.env.EAS_UPDATE_URL,
        },

        runtimeVersion: '1.0.4',

        plugins: [
            'expo-iap',
            'expo-apple-authentication',
            'expo-web-browser',
            [
                'expo-camera',
                {
                    cameraPermission: 'Use your camera to take face scans so Derm AI can track your skin progress over time.',
                }
            ],
            [
                'expo-notifications',
                {
                    icon: './src/assets/logos/icon.png',
                    color:'#ffffff'
                }
            ],
            'react-native-video',
        ],

        extra: {
            BUNDLE_ID: process.env.BUNDLE_ID,

            GOOGLE_EXPO_CLIENT_ID: process.env.GOOGLE_EXPO_CLIENT_ID,
            GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
            GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID,
            GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID,

            REVENUECAT_PUBLIC_API_KEY_APPLE: process.env.REVENUECAT_PUBLIC_API_KEY_APPLE,

            eas: {
                projectId: process.env.EXPO_PROJECT_ID,
            },
        },
    },
};