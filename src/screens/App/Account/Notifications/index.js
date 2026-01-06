import colors from "config/colors";
import EditNotificationPreferencesScreenHeader from "./header";
import {Ionicons, Entypo} from '@expo/vector-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBell, faGear } from '@fortawesome/free-solid-svg-icons';
import DefaultText from "components/Text/DefaultText";
import React, { useMemo, useState, useEffect } from "react";
import * as Notifications from 'expo-notifications'
import { Alert, Linking, AppState } from 'react-native';
const { default: DefaultStyles } = require("config/styles")
const { View, SafeAreaView, ScrollView, StyleSheet, Switch } = require("react-native")

const EditNotificationPreferencesScreen = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        checkNotificationStatus();
        
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
                checkNotificationStatus();
            }
        };
        
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        
        return () => {
            subscription?.remove();
        };
    }, []);

    const checkNotificationStatus = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
    };

    const handleToggleNotifications = async (value) => {
        if (value) {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === 'granted') {
                setNotificationsEnabled(true);
            } else {
                Alert.alert(
                    "Enable Notifications",
                    "To enable notifications, please go to your device settings and allow notifications for Derm AI.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Open Settings", onPress: () => Linking.openSettings() }
                    ]
                );
            }
        } else {
            Alert.alert(
                "Disable Notifications",
                "To disable notifications, please go to your device settings and turn off notifications for Derm AI.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Linking.openSettings() }
                ]
            );
        }
    };

    const stepsToReEnable = useMemo(
        () => [
            {
                description:'Open Settings (top right)',
                icon:'settings-outline',
                iconComponent: <FontAwesomeIcon icon={faGear} size={18} color={colors.text.secondary} />
            },
            {
                description:'Tap \"Notifications\"',
                icon:'notifications-outline',
                iconComponent: <FontAwesomeIcon icon={faBell} size={18} color={colors.text.secondary} />
            },
            {
                description:'Allow Derm AI to send notifications',
                icon:'toggle',
                color:colors.background.primary,
            }
        ], []
    )

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <EditNotificationPreferencesScreenHeader />

                <View
                    style={DefaultStyles.scrollContainer}
                >
                    <View
                        style={[
                            styles.flexContainer,
                            styles.enableContainer
                        ]}
                    >
                        <FontAwesomeIcon icon={faBell} size={22}/>
                        <DefaultText
                            style={styles.title}
                        >
                            Allow Notifications
                        </DefaultText>

                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleToggleNotifications}
                            trackColor={{
                                true: colors.background.primary
                            }}
                            style={{
                                marginLeft:'auto'
                            }}
                        />
                    </View>

                    <DefaultText
                        style={styles.text}
                    >
                        Enabling notifications in the app may not work if you have previously disabled Derm AI notifications on your device. To allow the app to send updates, please do the following:
                    </DefaultText>

                    <View
                        style={styles.itemContainer}
                    >
                        {stepsToReEnable.map((step, idx) => (
                            <React.Fragment
                                key={idx}
                            >
                                <View
                                    style={[
                                        styles.flexContainer,
                                        {
                                            gap:12
                                        }
                                    ]}
                                >
                                    {step.iconComponent ? 
                                        step.iconComponent
                                        :
                                        <Ionicons
                                            size={18}
                                            name={step.icon}
                                            color={step?.color || colors.text.secondary}
                                        />
                                    }
                                    <DefaultText
                                        style={styles.caption}
                                    >
                                        {idx+1}. {step.description}
                                    </DefaultText>
                                </View>

                                {stepsToReEnable.length > idx+1 &&
                                    <View style={DefaultStyles.separator} />
                                }
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default EditNotificationPreferencesScreen;

const styles = StyleSheet.create({
    itemContainer: {
        gap:2,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    enableContainer: {
        borderBottomColor:colors.accents.stroke,
        borderBottomWidth:1.5,
        paddingTop:DefaultStyles.container.paddingTop,
        paddingBottom:DefaultStyles.container.paddingHorizontal,
    },
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
        marginVertical:DefaultStyles.container.paddingTop,
        lineHeight:18
    },
    title: {
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.medium,
        color:colors.text.secondary
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        marginVertical:16,
    },
})