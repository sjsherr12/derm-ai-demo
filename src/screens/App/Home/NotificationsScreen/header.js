import { useNavigation } from "@react-navigation/native";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { StyleSheet } from "react-native";
import { useMemo, useCallback } from "react";
import { useData } from "context/global/DataContext";
import { useAuth } from "context/global/AuthContext";
import { doc, writeBatch, getFirestore } from "firebase/firestore";
import * as Haptics from 'expo-haptics'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const { default: IconButton } = require("components/Buttons/IconButton")
const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader")

const NotificationsScreenHeader = ({
    notifications
}) => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { notifications: contextNotifications, setNotifications } = useData();
    
    // Use context notifications as fallback if prop not provided
    const notificationsList = notifications || contextNotifications || [];
    
    // Check if there are unread notifications
    const hasUnreadNotifications = useMemo(() => {
        return notificationsList.some(notification => !notification.read);
    }, [notificationsList]);
    
    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!user || !hasUnreadNotifications) return;
        
        try {
            const db = getFirestore();
            const batch = writeBatch(db);
            const unreadNotifications = notificationsList.filter(notification => !notification.read);
            
            // Update all unread notifications in Firestore
            unreadNotifications.forEach(notification => {
                const notificationRef = doc(db, 'users', user.uid, 'notifications', notification.id);
                batch.update(notificationRef, { read: true });
            });
            
            await batch.commit();
            
            // Update local state
            const updatedNotifications = notificationsList.map(notification => ({
                ...notification,
                read: true
            }));
            setNotifications(updatedNotifications);
            
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [user, hasUnreadNotifications, notificationsList, setNotifications]);

    return (
        <DefaultTabHeader
            headerLeft={{component:(
                <IconButton
                    style={DefaultStyles.button.icon}
                    icon='arrow-back'
                    color={colors.text.secondary}
                    onPress={() => navigation.goBack()}
                />
            )}}
            header={{component:(
                <DefaultText
                    style={DefaultStyles.text.title.header}
                >
                    Notifications
                </DefaultText>
            )}}
            headerRight={{component:(
                hasUnreadNotifications ? (
                    <IconButton
                        style={[
                            DefaultStyles.button.icon,
                            {
                                backgroundColor:colors.background.primary,
                                borderWidth:0,
                            }
                        ]}
                        iconComponent={<FontAwesome6 name="check" size={20} color={colors.text.primary} />}
                        onPress={markAllAsRead}
                        hapticType={Haptics.ImpactFeedbackStyle.Medium}
                    />
                ) : null
            )}}
        />
    )
}

export default NotificationsScreenHeader;