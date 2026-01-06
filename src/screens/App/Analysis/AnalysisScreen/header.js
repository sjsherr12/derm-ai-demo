import { useNavigation } from "@react-navigation/native"
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import IconButton from "components/Buttons/IconButton"
import * as Haptics from 'expo-haptics'
import useAnalysisLoader from "context/global/useAnalysisLoader"
import { useCallback, useEffect, useState, useMemo } from "react"
import { useAuth } from "context/global/AuthContext"
import { useData } from "context/global/DataContext"
import { getUserFirstName } from "utils/user"
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import UserProfileImage from "../../../../components/Common/UserProfileImage";
const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader")
const { default: DefaultText } = require("components/Text/DefaultText")
const { default: colors } = require("config/colors")
const { default: DefaultStyles } = require("config/styles")
const { StyleSheet, Image, View, Pressable, Animated, Text } = require("react-native")

const AnalysisScreenHeader = ({
    notifications
}) => {
    const {user} = useAuth();
    const navigation = useNavigation();

    // Use context notifications as fallback if prop not provided
    const notificationsList = notifications || contextNotifications || [];
    
    // Calculate unread notifications count
    const unreadCount = useMemo(() => {
        return notificationsList.filter(notification => !notification.read).length;
    }, [notificationsList]);

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150
    })
    
    return (
        <DefaultTabHeader
            headerLeft={{component:(
                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={() => navigation.navigate('Account')}
                >
                    <Animated.View
                        style={{
                            transform:[{scale}]
                        }}
                    >
                        <View style={{
                            gap:16,
                            flexDirection:'row',
                            alignItems:'center',
                        }}>
                            <UserProfileImage
                                image={user?.photoURL}
                                style={styles.userProfile}
                            />

                            <DefaultText
                                style={styles.headerTitle}
                                numberOfLines={1}
                                ellipsizeMode='tail'
                            >
                                {user?.displayName? `Hi, ${getUserFirstName(user)}!` : 'Welcome back!'}
                            </DefaultText>
                        </View>
                    </Animated.View>
                </Pressable>
            )}}
            headerRight={{
                component:(
                    <View style={{ position: 'relative' }}>
                        <IconButton
                            icon='notifications-outline'
                            color={colors.text.secondary}
                            style={[
                                DefaultStyles.button.icon,
                                {
                                    marginLeft:'auto',
                                }
                            ]}
                            onPress={useCallback(() => navigation.navigate('Notifications'), [])}
                        />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                ),
                style: {
                    flex:.25, // only needs to fit content and align completely left.
                }
            }}
        />
    )
}

export default AnalysisScreenHeader;

const styles = StyleSheet.create({
    headerTitle: {
        fontSize:28,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    userProfile: {
        width: 48,
        height: 48,
        borderRadius: 64,
        backgroundColor:colors.background.light,
    },
    badge: {
        position: 'absolute',
        top:-4,
        right:-4,
        backgroundColor: colors.background.secondary,
        borderRadius: 16,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    }
})