import DefaultStyles from "config/styles";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faBell, faClock, faStar, faGear, faPalette, faLanguage, faFileLines, faShield, faCircleInfo, faArrowRightFromBracket, faTrash } from '@fortawesome/free-solid-svg-icons';
import { signOut } from "firebase/auth";
import React, { useCallback, useMemo, memo } from "react";
import { auth } from "services/firebase/firebase";
import AccountScreenHeader from "./header";
import colors from "config/colors";
import { useAuth } from "context/global/AuthContext";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import { useNavigation } from "@react-navigation/native";
import DefaultText from "components/Text/DefaultText";
import {Ionicons, Entypo, FontAwesome6} from '@expo/vector-icons'
import ReferralPersonImage from 'assets/media/people/person3.jpg'
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics'
import UserProfileImage from "components/Common/UserProfileImage";
import * as WebBrowser from 'expo-web-browser'
import { SupportEmail } from "constants/auth";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import { PrivacyPolicyLink, TermsOfUseLink } from "../../../../constants/auth";
const { View, Text, Button, ScrollView, StyleSheet, Image, Pressable, Animated, Linking, Alert } = require("react-native")

const EditProfileShortcut = ({

}) => {

    const {user} = useAuth();
    const navigation = useNavigation();

    const userDisplayName = useMemo(
        () => user?.displayName || 'Derm AI User',
        [user?.displayName]
    )

    const userEmail = useMemo(
        () => user?.email || 'View account details',
        [user?.email]
    )

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })
    
    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('EditProfile')}
        >
            <Animated.View
                style={[
                    styles.itemContainer,
                    {transform:[{scale}]}
                ]}
            >
                <View
                    style={styles.flexContainer}
                >
                    <UserProfileImage
                        width={52}
                        height={52}
                        image={user?.photoURL}
                    />

                    <View
                        style={{
                            flex:1,
                            justifyContent:'space-between',
                            height:52,
                        }}
                    >
                        <DefaultText
                            numberOfLines={1}
                            style={styles.nameTitle}
                        >
                            {userDisplayName}
                        </DefaultText>
                        <DefaultText
                            numberOfLines={1}
                            style={styles.text}
                        >
                            {userEmail}
                        </DefaultText>
                    </View>

                    <Entypo
                        name='chevron-right'
                        color={colors.text.secondary}
                        size={26}
                        style={{
                            marginLeft:'auto'
                        }}
                    />
                </View>
            </Animated.View>
        </Pressable>
    )
}

const ReferralShortcut = ({

}) => {

    const navigation = useNavigation();

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
        useNativeDriver:true,
    })

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('ReferralProgram')}
        >
            <Animated.View
                style={[
                    styles.itemContainer,
                    {transform:[{scale}]}
                ]}
            >
                <View
                    style={styles.referralContainer}
                >
                    <FontAwesome6
                        name='user-plus'
                        size={18}
                        color={colors.text.secondary}
                    />
                    <DefaultText
                        style={styles.referralTitle}
                    >
                        Refer a Friend!
                    </DefaultText>
                </View>

                <View
                    style={styles.referralImageContainer}
                >
                    <Image
                        source={ReferralPersonImage}
                        style={{
                            width:'100%',
                            height:175,
                        }}
                    />

                    <View
                        style={styles.fixedContainer}
                    >
                        <DefaultText
                            style={[
                                styles.pictureCaption,
                                {color:colors.text.primary}
                            ]}
                        >
                            Achieve healthier{"\n"}skin together!
                        </DefaultText>

                        <DefaultText
                            style={styles.pillText}
                        >
                            Earn $5 for each friend
                        </DefaultText>
                    </View>

                    <LinearGradient
                        colors={['rgba(0,0,0,0.2)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.leftShadow}
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.25)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.rightShadow}
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.5)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.bottomShadow}
                    />
                </View>
            </Animated.View>
        </Pressable>
    )
}

const AccountShortcut = ({
    shortcut
}) => {

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })

    const handlePress = async () => {
        if (shortcut?.onPress) {
            await shortcut.onPress()
        }
    }

    const renderIcon = () => {
        if (shortcut.iconComponent) {
            return shortcut.iconComponent;
        }
        
        return (
            <Ionicons
                name={shortcut.icon}
                color={colors.text.secondary}
                size={20}
            />
        );
    }
    
    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
        >
            <Animated.View
                style={[
                    styles.flexContainer,
                    {
                        paddingVertical:18,
                        transform:[{scale}]
                    }
                ]}
            >
                {renderIcon()}
                
                <DefaultText
                    style={styles.caption}
                >
                    {shortcut.name}
                </DefaultText>

                <Entypo
                    name='chevron-right'
                    color={colors.text.secondary}
                    size={18}
                    style={{
                        marginLeft:'auto'
                    }}
                />
            </Animated.View>
        </Pressable>
    )
}

const AccountShortcutSections = ({

}) => {
    const {user} = useAuth();
    const navigation = useNavigation();

    const handleSignout = async () => {
        await signOut(auth);
    }

    const handleLogoutWithConfirmation = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: handleSignout
                }
            ]
        );
    }

    const sections = [
        {
            name:'Account',
            shortcuts: [
                {
                    name:'Skin Profile',
                    icon: 'person-outline',
                    iconComponent: <FontAwesomeIcon icon={faUser} size={18}/>,
                    onPress: () => navigation.navigate('EditSkinProfile')
                },
                {
                    name:'Notifications',
                    icon: 'notifications',
                    iconComponent: <FontAwesomeIcon icon={faBell} size={18}/>,
                    onPress: () => navigation.navigate('EditNotificationPreferences')
                },
                {
                    name:'Scan History',
                    icon: 'time-outline',
                    iconComponent: <FontAwesomeIcon icon={faClock} size={18}/>,
                    onPress: () => navigation.navigate('ScanHistory')
                },
                {
                    name:'My Reviews',
                    icon: 'star-outline',
                    iconComponent: <FontAwesomeIcon icon={faStar} size={18}/>,
                    onPress: () => navigation.navigate('AccountReviews')
                },
            ]
        },
        // {
        //     name:'Preferences',
        //     shortcuts: [
        //         {
        //             name:'Appearance',
        //             icon: 'color-palette-outline',
        //             iconComponent: <FontAwesomeIcon icon={faPalette} size={18}/>,
        //             onPress: () => navigation.navigate('EditAppearancePreferences')
        //         },
        //         {
        //             name:'Language',
        //             icon: 'language-outline',
        //             iconComponent: <FontAwesomeIcon icon={faLanguage} size={18}/>,
        //             onPress: () => navigation.navigate('EditLanguagePreferences')
        //         }
        //     ]
        // },
        {
            name:'Legal',
            shortcuts: [
                {
                    name:'Terms and Conditions',
                    icon: 'document-text-outline',
                    iconComponent: <FontAwesomeIcon icon={faFileLines} size={18}/>,
                    onPress: async () => await WebBrowser.openBrowserAsync(TermsOfUseLink)
                },
                {
                    name:'Privacy Policy',
                    icon: 'shield-checkmark-outline',
                    iconComponent: <FontAwesomeIcon icon={faShield} size={18}/>,
                    onPress: async () => await WebBrowser.openBrowserAsync(PrivacyPolicyLink)
                },
                {
                    name:'Support Email',
                    icon: 'help-circle-outline',
                    iconComponent: <FontAwesomeIcon icon={faCircleInfo} size={18}/>,
                    onPress: async () => await Linking.openURL(`mailto:${SupportEmail}?subject=${encodeURIComponent('Support Request')}`)
                }
            ]
        },
        {
            name:'Actions',
            shortcuts: [
                {
                    name:'Logout',
                    icon: 'log-out-outline',
                    iconComponent: <FontAwesomeIcon icon={faArrowRightFromBracket} size={18}/>,
                    onPress: handleLogoutWithConfirmation
                },
                {
                    name:'Delete',
                    icon: 'trash',
                    iconComponent: <FontAwesomeIcon icon={faTrash} size={18}/>,
                    onPress: () => navigation.navigate('ManageAccount')
                }
            ]
        }
    ]

    return sections.map((section, idx) => (
        <View
            key={idx}
            style={[
                styles.itemContainer,
                {
                    gap:0,
                    paddingVertical:0,
                }
            ]}
        >
            {section.shortcuts.map((shortcut, sidx) => (
                <React.Fragment
                    key={sidx}
                >
                    <AccountShortcut
                        shortcut={shortcut}
                    />
                    
                    {section.shortcuts.length > sidx+1 &&
                        <View style={DefaultStyles.separator} />
                    }
                </React.Fragment>
            ))}
        </View>
    ))
}

const AccountScreen = () => {
    const safeAreaStyles = useSafeAreaStyles();

    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}
        >
            <AccountScreenHeader />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    {
                        padding: 16,
                        gap: 16,
                    },
                    safeAreaStyles.safeAreaBottomWithTabBar
                ]}
            >
                    <EditProfileShortcut />

                    <ReferralShortcut />

                    <AccountShortcutSections />
            </ScrollView>
        </View>
    )
}

export default memo(AccountScreen);

const styles = StyleSheet.create({
    itemContainer: {
        gap:16,
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    referralContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:12,
        flex:1,
    },
    referralTitle: {
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'600',
        color:colors.text.secondary
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
        flex:1,
    },
    nameTitle: {
        fontSize:22,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'500',
        color:colors.text.secondary
    },
    pictureCaption: {
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'500',
        color:colors.text.secondary
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
    },
    referralImageContainer: {
        position:'relative',
        borderRadius:12,
        overflow:'hidden',
    },
    leftShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 100,
        height: '100%',
    },
    rightShadow: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 100,
        height: '100%',
    },
    bottomShadow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    fixedContainer: {
        position:'absolute',
        bottom:0,
        left:0,
        padding:12,
        gap:12,
        zIndex:2,
    },
    pillText: {
        color:colors.text.secondary,
        borderRadius:64,
        backgroundColor:colors.background.screen,
        paddingHorizontal:12,
        paddingVertical:8,
        fontSize:DefaultStyles.text.caption.xsmall,
        fontWeight:'600'
    }
})