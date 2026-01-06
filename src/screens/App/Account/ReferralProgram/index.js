import DefaultButton from "components/Buttons/DefaultButton"
import DefaultText from "components/Text/DefaultText"
import DefaultTextInput from "components/Text/DefaultTextInput"
import colors from "config/colors"
import LinearGradient from "react-native-linear-gradient"
import {Feather, Ionicons, MaterialCommunityIcons, SimpleLineIcons, FontAwesome6} from '@expo/vector-icons'
import { useData } from "../../../../context/global/DataContext"
import { useCallback, useMemo, useState } from "react"
import * as Haptics from 'expo-haptics'
import IconButton from "../../../../components/Buttons/IconButton"
import { lighten } from "../../../../utils/lighten"
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation"
import { ReferralStatus } from "../../../../constants/signup"
import { SafeAreaView } from "react-native-safe-area-context"
import { RefreshControl } from "react-native-gesture-handler"
import { useAuth } from "../../../../context/global/AuthContext"
import { SupportEmail } from "../../../../constants/auth"
import { httpsCallable } from "firebase/functions"
import { functions } from "../../../../services/firebase/firebase"
import LoadingOverlay from "../../../../components/Common/LoadingOverlay"
const { default: DefaultStyles } = require("config/styles")
const { View, ScrollView, Image, StyleSheet, Share, Pressable, Animated, Clipboard, Alert } = require("react-native")
const { default: ReferralProgramScreenHeader } = require("./header")
const ReferralProgramPerson = require('assets/media/people/person3.jpg')

const stepsToGetPayout = [
    'Share your code to friends and family.',
    'To receive your payout, someone must use your referral code during sign-up.',
    'If someone who used your code finishes sign-up, you will be paid ${payoutPerReferral}!'
]

const ReferralStatistic = ({
    group,
    displayedValue
}) => {
    return (
        <View
            style={styles.itemContainer}
        >
            <View
                style={styles.flexContainer}
            >
                <View
                    style={styles.iconContainer}
                >
                    <Ionicons
                        name={group.icon}
                        color={group.color}
                        size={28}
                    />
                </View>

                <View
                    style={{
                        flex:1,
                        gap:6
                    }}
                >
                    <DefaultText
                        style={styles.caption}
                    >
                        Total {group.title}
                    </DefaultText>

                    <DefaultText
                        style={styles.title}
                    >
                        {displayedValue}
                    </DefaultText>
                </View>
            </View>
        </View>
    )
}

const ReferralProgramScreen = ({

}) => {

    const {
        personalReferralCode,
        pendingReferrals,
        pendingReferralsLoading,
        fetchPendingReferrals,
        fetchPersonalReferralCode
    } = useData();
    const {user} = useAuth();
    
    const [claimingPayout, setClaimingPayout] = useState(false)
    const pendingPayout = personalReferralCode?.pendingPayout || 0;
    const payoutPerReferral = + personalReferralCode?.payoutPerReferral || 5;
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:150,
    })

    const payoutGroups = useMemo(
        () => [
            {
                title:'Approved Payouts',
                icon:'logo-usd',
                color:colors.accents.success,
                status:ReferralStatus.Completed
            },
            {
                title:'Processing Payouts',
                icon:'card',
                color:colors.accents.info,
                status:ReferralStatus.Approved
            },
            {
                title:'Pending Payouts',
                icon:'time',
                color:colors.accents.warning,
                status:ReferralStatus.Pending
            },
            {
                title:'People Referred',
                icon:'people',
                color:colors.background.primary,
                value:`${pendingReferrals?.length} people`
            }
        ]
    )

    const totalCompletedPayout = useMemo(
        () => {
            if (pendingReferrals?.length) {
                return pendingReferrals.reduce((ac, pr) => {
                    if (pr.status === ReferralStatus.Completed) {
                        return ac + payoutPerReferral;
                    }
                    return ac + 0;
                }, 0)
            }
            return 0;
        }, [pendingReferrals, pendingReferralsLoading]
    )

    const totalProcessingPayout = useMemo(
        () => {
            if (pendingReferrals?.length) {
                return pendingReferrals.reduce((ac, pr) => {
                    if (pr.status === ReferralStatus.Approved) {
                        return ac + payoutPerReferral;
                    }
                    return ac + 0;
                }, 0)
            }
            return 0;
        }, [pendingReferrals, pendingReferralsLoading]
    )

    const totalPendingPayout = useMemo(
        () => {
            if (pendingReferrals?.length) {
                return pendingReferrals.reduce((ac, pr) => {
                    if (pr.status === ReferralStatus.Pending) {
                        return ac + payoutPerReferral;
                    }
                    return ac + 0;
                }, 0)
            }
            return 0;
        }, [pendingReferrals, pendingReferralsLoading]
    )

    const payoutValuesByStatus = useMemo(
        () => ({
            [ReferralStatus.Completed]: {
                amount: totalCompletedPayout,
                count: totalCompletedPayout / payoutPerReferral
            },
            [ReferralStatus.Approved]: {
                amount: totalProcessingPayout,
                count: totalProcessingPayout / payoutPerReferral
            },
            [ReferralStatus.Pending]: {
                amount: totalPendingPayout,
                count: totalPendingPayout / payoutPerReferral
            }
        }), [totalCompletedPayout, totalProcessingPayout, totalPendingPayout]
    )

    const handleShare = useCallback(
        async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            await Share.share({
                url:'https://apps.apple.com/us/app/id6748288286',
                message:`Join me on Derm AI for smarter skincare. Enter my code \"${personalReferralCode?.code}\" at signup and we’ll achieve healthier skin together!`
            })
        }, [personalReferralCode?.code]
    )

    const handleRefresh = useCallback(
        async () => {
            await fetchPersonalReferralCode(true);
            await fetchPendingReferrals(personalReferralCode?.code)
        }, [fetchPersonalReferralCode, fetchPendingReferrals]
    );

    const handlePayout = useCallback(
        async () => {
            if (pendingPayout > 0) {
                setClaimingPayout(true);
                const redeemUserReferralsFunction = httpsCallable(functions, 'redeemUserReferrals');
                const result = await redeemUserReferralsFunction();
                setClaimingPayout(false);
                Alert.alert(
                    result?.data?.success ? 'Successful Payout!' : 'Error Paying Out',
                    result?.data?.message
                );
                await handleRefresh();
            } else {
                Alert.alert(
                    'No pending payout',
                    'No money to be paid out found in account. Please try again later.'
                )
            }
        }, [pendingPayout]
    )

    const handleConfirmPayout = useCallback(
        () => {
            Alert.alert(
                `Claim $${parseFloat(pendingPayout).toFixed(2)} payout?`,
                `Are you sure you would like to claim your payout now? You will receive instructions on how to claim at ${user?.email}. (If this email is not correct, please contact support at ${SupportEmail}.)`,
                [
                    {
                        text:'Cancel',
                        style:'cancel',
                    },
                    {
                        text:'Payout',
                        onPress:handlePayout,
                    }
                ]
            )
        }, [pendingPayout]
    )

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
                edges={['top']}
            >
                <ReferralProgramScreenHeader />

                <ScrollView
                    contentContainerStyle={[
                        DefaultStyles.scrollContainer,
                        {
                            paddingTop:0,
                            paddingHorizontal:0,
                        }
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={pendingReferralsLoading} 
                            onRefresh={handleRefresh} 
                        />
                    }
                >
                    <View
                        style={[
                            DefaultStyles.scrollContainer,
                            {gap:24}
                        ]}
                    >
                        <View
                            style={styles.referralImageContainer}
                        >
                            <Image
                                source={ReferralProgramPerson}
                                style={styles.imageContainer}
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
                                    Earn ${payoutPerReferral} for each friend
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
                        <View
                            style={styles.groupedContainer}
                        >
                            <DefaultText
                                style={styles.sectionTitle}
                            >
                                Referral Code
                            </DefaultText>

                            <View
                                style={styles.flexContainer}
                            >
                                <Pressable
                                    onPressIn={handlePressIn}
                                    onPressOut={handlePressOut}
                                    onPress={handleShare}
                                >
                                    <Animated.View
                                        style={[
                                            styles.referralCodeContainer,
                                            {transform:[{scale}]}
                                        ]}
                                    >
                                        <DefaultText
                                            style={styles.referralCodeText}
                                        >
                                            {personalReferralCode?.code}
                                        </DefaultText>
                                        <FontAwesome6
                                            name='arrow-up-from-bracket'
                                            color={colors.text.dark}
                                            size={22}
                                            style={{
                                                marginLeft:'auto',
                                            }}
                                        />
                                    </Animated.View>
                                </Pressable>
                            </View>
                        </View>

                        <View
                            style={styles.groupedContainer}
                        >
                            <DefaultText
                                style={styles.sectionTitle}
                            >
                                How to Earn
                            </DefaultText>
                            
                            <View
                                style={styles.itemContainer}
                            >
                                {stepsToGetPayout.map((step, idx) => (
                                    <DefaultText
                                        key={idx}
                                        style={styles.text}
                                    >
                                        {idx+1}. {step.replaceAll('{payoutPerReferral}', payoutPerReferral)}
                                    </DefaultText>
                                ))}
                            </View>
                        </View>

                        <View
                            style={styles.groupedContainer}
                        >
                            <DefaultText
                                style={styles.sectionTitle}
                            >
                                Referrals Overview
                            </DefaultText>

                            <View style={styles.statisticsContainer}>
                                {payoutGroups.map((group, idx) => {

                                    let displayedValue;

                                    if (group?.status !== undefined) {
                                        const statusData = payoutValuesByStatus[group.status];
                                        if (statusData) {
                                            displayedValue = `$${statusData.amount.toFixed(2)} (${statusData.count} ${statusData.count === 1 ? 'person' : 'people'})`;
                                        } else {
                                            displayedValue = `$0.00 (0 people)`;
                                        }
                                    } else if (group?.value) {
                                        displayedValue = group.value;
                                    } else {
                                        displayedValue = '0';
                                    }

                                    return (
                                        <ReferralStatistic
                                            key={idx}
                                            displayedValue={displayedValue}
                                            group={group}
                                        />
                                    )
                                })}
                            </View>

                            {pendingPayout > 0 &&
                                <DefaultButton
                                    isActive
                                    title={`Claim your $${parseFloat(pendingPayout).toFixed(2)} payout!`}
                                    onPress={handleConfirmPayout}
                                    hapticType={Haptics.ImpactFeedbackStyle.Medium}
                                />
                            }
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <LoadingOverlay
                visible={claimingPayout}
            />
        </View>
    )
}

export default ReferralProgramScreen;

const styles = StyleSheet.create({
    imageContainer: {
        width:'100%',
        height:220,
    },
    referralCodeContainer: {
        width:'100%',
        height:64,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
        borderRadius:14,
        borderWidth:3,
        borderColor:colors.background.primary,
        flexDirection:'row',
        alignItems:'center',
    },
    referralCodeText: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'800',
        color:colors.text.dark
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'600',
        color:colors.text.secondary,
        alignSelf:'flex-start'
    },
    itemContainer: {
        flex:1,
        padding:DefaultStyles.container.paddingBottom,
        gap:8,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    groupedContainer: {
        gap:8,
    },
    statisticsContainer: {
        gap:12,
    },
    flexContainer: {
        flex:1,
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    pictureCaption: {
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'700',
        color:colors.text.secondary
    },
    caption: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
        fontWeight:'600',
    },
    sectionTitle:{
        color:colors.text.secondary,
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.large,
        marginBottom:6
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        alignSelf:'flex-start',
        lineHeight:20
    },
    referralImageContainer: {
        borderRadius:16,
        borderWidth:2,
        borderColor:colors.accents.stroke,
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
    },
    iconButton: {
        width:64,
        height:64,
        backgroundColor:colors.background.primary,
        borderRadius:8,
    },
    iconContainer: {
        width:48,
        height:48,
        borderRadius:64,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        alignItems:'center',
        justifyContent:'center'
    }
})