import { Alert, Animated, Button, Image, Linking, StyleSheet, Text, View } from "react-native";
import DefaultStyles from "../../config/styles";
import SignUpQuestions from "../../data/SignUpQuestions";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import IconButton from "components/Buttons/IconButton";
import DefaultButton from "components/Buttons/DefaultButton";
import * as Haptics from 'expo-haptics'
import {AntDesign, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons'
import { NativeEventEmitter, NativeModules } from "react-native";
import { SubscriptionTypes } from "constants/signup";
import { useEffect, useState, memo, useCallback } from "react";
import Purchases, { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import ConditionalScrollView from "components/Containers/ConditionalScrollView";
import { useAuth } from "context/global/AuthContext";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import { AppleSTDEula, PrivacyPolicyLink, TermsOfUseLink } from "../../constants/auth";
import { AuthIntent } from "../../constants/auth";
import { useNavigation, useRoute } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase/firebase";
import Collage from '../../assets/extra/collage.png'
import { lighten } from "../../utils/lighten";

const sellPoints = [
    {
        highlight: 'AI-powered',
        text: 'skin diagnosis',
        icon: <MaterialCommunityIcons
            name='line-scan'
            size={28}
            color={colors.background.primary}
        />,
    },
    {
        highlight: 'Personalized',
        text: 'recommendations',
        icon: <FontAwesome6
            name='wand-magic-sparkles'
            size={20}
            color={colors.background.primary}
        />,
    },
    // {
    //     highlight: 'All-in-one',
    //     text: 'routine management',
    //     icon: <FontAwesome6
    //         name='list-check'
    //         size={24}
    //         color={colors.background.primary}
    //     />,
    // },
    {
        highlight: 'Progress tracking',
        text: 'over time',
        icon: <MaterialCommunityIcons
            name='chart-timeline-variant-shimmer'
            size={28}
            color={colors.background.primary}
        />,
    },
    {
        highlight: '100% unbiased',
        text: 'product ratings',
        icon: <MaterialIcons
            name='verified'
            size={28}
            color={colors.background.primary}
        />,
    }
]

const PaywallScreen = ({
}) => {
    const route = useRoute();
    const navigation = useNavigation();
    const safeAreaStyles = useSafeAreaStyles();
    const { checkSubscriptionStatus, checkInfluencerDiscount, hasPendingInfluencerDiscount, discountPercent, user, authIntent } = useAuth();
    const [offerings, setOfferings] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState(0);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const isSignUpFlow = route?.name === 'Paywall'
    const freeTrialAvailable = isSignUpFlow;

    const handleLogout = useCallback(async () => {
        if (!isSignUpFlow) {
            await signOut(auth);
            navigation.goBack();
        }
    }, [isSignUpFlow]);

    const handleSuccessfulPurchase = useCallback(async () => {
        if (isSignUpFlow) {
            navigation.navigate('CreateAccount');
        }
        else {
            navigation.goBack();
        }
    }, [isSignUpFlow, navigation]);

    const viewTermsOfUse = useCallback(
        async () => await Linking.openURL(TermsOfUseLink), []
    )

    const viewPrivacyPolicy = useCallback(
        async () => await Linking.openURL(PrivacyPolicyLink), []
    )

    // NEW REVENUECAT CODE
    const restorePurchase = async () => {
        try {
            setPurchaseLoading(true);
            
            const customerInfo = await Purchases.restorePurchases();
            
            // Check if user has active entitlements after restore
            const hasProEntitlement = customerInfo.entitlements.active['pro'] !== undefined;
            
            if (hasProEntitlement) {
                Alert.alert(
                    'Restore Successful', 
                    'Your subscription has been restored!',
                    [{ text: 'Continue', onPress: handleSuccessfulPurchase }]
                );
            } else {
                Alert.alert(
                    'No Purchases Found', 
                    'No previous purchases found to restore.'
                );
            }
        } catch (error) {
            console.error('Error restoring purchases:', error);
            Alert.alert(
                'Restore Failed', 
                'Unable to restore purchases. Please try again.'
            );
        } finally {
            setPurchaseLoading(false);
        }
    }

    // NEW REVENUECAT CODE
    const handlePurchase = async () => {
        try {
            setPurchaseLoading(true);
            
            if (!offerings || !offerings.length) {
                throw new Error('No offerings available');
            }
            
            const selectedPackage = offerings[selectedProductId];
            if (!selectedPackage) {
                throw new Error('No package selected');
            }
            
            const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
            
            // Check if purchase was successful and user now has pro access
            const hasProEntitlement = customerInfo.entitlements.active['pro'] !== undefined;
            
            if (hasProEntitlement) {
                Alert.alert(
                    'Purchase Successful', 
                    'Welcome to Derm AI Pro!',
                    [{ text: 'Continue', onPress: handleSuccessfulPurchase }]
                );
            } else {
                throw new Error('Purchase did not grant entitlement');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            
            if (error.userCancelled && isSignUpFlow) {
                // User cancelled, don't show error
                navigation.navigate('OneTimeOffer')
                return;
            }
            
            Alert.alert(
                'Purchase Failed', 
                'Unable to complete purchase. Please try again.'
            );
        } finally {
            setPurchaseLoading(false);
        }
    }

    // NEW REVENUECAT CODE
    useEffect(() => {
        const fetchOfferings = async () => {
            try {
                const offerings = await Purchases.getOfferings();
                let packagesToUse = [];

                if (hasPendingInfluencerDiscount && discountPercent) {
                    // Look for the discounted offering first
                    const discountOffering = offerings.all?.[`discount${discountPercent}`];

                    if (discountOffering && discountOffering.availablePackages.length > 0) {
                        // Use the discounted packages
                        packagesToUse = discountOffering.availablePackages;
                    }
                }

                // If no discount packages found, use default offering
                if (packagesToUse.length === 0 && offerings.current && offerings.current.availablePackages.length > 0) {
                    packagesToUse = offerings.current.availablePackages;
                }

                if (packagesToUse.length > 0) {
                    // Sort packages: monthly first, then annual
                    const sortedPackages = packagesToUse.sort((a, b) => {
                        if (a.packageType === 'MONTHLY') return 1;
                        if (b.packageType === 'MONTHLY') return -1;
                        return 0;
                    });

                    setOfferings(sortedPackages);
                }
            } catch (error) {
                console.error('Error fetching offerings:', error);

                // Fallback packages in case of error
                const fallbackPackages = SubscriptionTypes.map((sub, index) => ({
                    identifier: sub.id,
                    product: {
                        identifier: sub.productId,
                        title: sub.title,
                        description: sub.description,
                        priceString: sub.description.match(/\$[\d.]+/)?.[0] || '$9.99'
                    },
                    packageType: index === 1 ? 'ANNUAL' : 'MONTHLY'
                }));
                setOfferings(fallbackPackages);
            }
        };

        fetchOfferings();
    }, [hasPendingInfluencerDiscount, discountPercent])

    // Check for influencer discount when component mounts
    useEffect(() => {
        if (user?.uid) {
            checkInfluencerDiscount(user.uid);
        }
    }, [user?.uid])

    return (
        <View style={[DefaultStyles.outer, safeAreaStyles.safeAreaBottom]}>
            <View style={styles.container}>
                <Image
                    source={Collage}
                    style={{
                        width:'100%',
                        height:250,
                        marginTop:-DefaultStyles.container.paddingTop*4,
                    }}
                    resizeMode='cover'
                />

                <View style={styles.mainContainer}>
                    <DefaultText
                        style={styles.title}
                    >
                        Derm AI
                    </DefaultText>
                    <DefaultText
                        style={styles.caption}
                    >
                        Organic skincare made simple.
                    </DefaultText>

                    <View
                        style={{
                            flex:1,
                            marginTop:DefaultStyles.container.paddingTop*2,
                            justifyContent:'center',
                            gap:12,
                        }}
                    >
                        {sellPoints.map((point, idx) => (
                            <View
                                key={idx}
                                style={styles.flexContainer}
                            >
                                <View
                                    style={{
                                        width:32,
                                        height:32,
                                        backgroundColor:colors.background.screen,
                                        alignItems:'center',
                                        justifyContent:'center'
                                    }}
                                >
                                    {point.icon}
                                </View>
                                <DefaultText
                                    style={{
                                        fontSize:DefaultStyles.text.caption.large,
                                        fontWeight:'500',
                                        color:colors.text.secondary
                                    }}
                                >
                                    <DefaultText
                                        style={{
                                            fontWeight:'700'
                                        }}
                                    >
                                        {point.highlight}
                                    </DefaultText>
                                    {' '}
                                    {point.text}
                                </DefaultText>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomContainer}>

                    <View style={styles.paymentOptionsContainer}>
                        {offerings && offerings.map((packageItem, idx) => {
                            const isActive = selectedProductId === idx;
                            const isAnnual = packageItem?.packageType === 'ANNUAL';
                            const displayPrice = isAnnual ? packageItem?.product?.pricePerYearString : packageItem?.product?.pricePerMonthString;

                            // Get title and description from package or fallback to SubscriptionTypes
                            const title = String(packageItem?.product?.title).replaceAll('Derm AI Pro - ', '')
                            
                            // Generate description based on whether it's discounted or not
                            let description;
                            const pricePerMonthString = packageItem?.product?.pricePerMonthString;
                            if (isAnnual) {
                                if (freeTrialAvailable) {
                                    description = `No payment due now! (then ${pricePerMonthString}/mo)`;
                                } else {
                                    description = `Just ${pricePerMonthString} per month!`;
                                }
                            } else {
                                if (hasPendingInfluencerDiscount && !!discountPercent) {
                                    const introPrice = packageItem?.product?.introPrice?.priceString
                                    description = `${introPrice} for first month, then ${displayPrice}/mo`
                                } else {
                                    description = `Just ${displayPrice} per month!`;
                                }
                            }

                            return (
                                <DefaultButton
                                    key={packageItem.identifier || idx}
                                    onPress={() => setSelectedProductId(idx)}
                                    title={title}
                                    description={description}
                                    startAdornment={isActive ? (
                                        <View
                                            style={{
                                                width:26,
                                                height:26,
                                                backgroundColor:colors.background.primary,
                                                borderRadius:64,
                                                alignItems:'center',
                                                justifyContent:'center',
                                            }}
                                        >
                                            <FontAwesome6
                                                name='check'
                                                size={16}
                                                color={colors.text.primary}
                                            />
                                        </View>
                                    ) : (
                                        <FontAwesome6
                                            name='circle'
                                            color={colors.accents.stroke}
                                            size={24}
                                        />
                                    )}
                                    endAdornment={isAnnual && freeTrialAvailable &&
                                        <View style={styles.badge}>
                                            <DefaultText style={styles.badgeText}>
                                                FREE TRIAL
                                            </DefaultText>
                                        </View>
                                    }
                                    style={{
                                        height:75,
                                        borderWidth:1.5,
                                        backgroundColor:isActive ? lighten(colors.background.primary, .95) : colors.background.screen,
                                        borderColor:isActive ? colors.background.primary : colors.background.light,
                                        borderRadius:24,
                                        boxShadow:'0px 6px 12px rgba(0,0,0,.025)',
                                    }}
                                    extraStyles={{
                                        button: {
                                            width:'100%',
                                            borderRadius:18,
                                        },
                                        text: {
                                            fontWeight:'800',
                                        },
                                        description: {
                                            color:colors.text.darker,
                                            fontWeight:'600',
                                        }
                                    }}
                                />
                            )
                        })}
                    </View>

                    <DefaultButton
                        isActive={!purchaseLoading}
                        title={purchaseLoading ? 'Processing...' : (() => {
                            const selectedPackage = offerings?.[selectedProductId];
                            const isYearlySelected = selectedPackage?.packageType === 'ANNUAL';
                            const canShowTrial = isYearlySelected && freeTrialAvailable
                            return canShowTrial ? 'Start my 3-day free trial!' : 'Continue';
                        })()}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        style={{
                            borderRadius:64,
                            opacity: purchaseLoading ? 0.6 : 1,
                        }}
                        extraStyles={{
                            text: {
                                fontWeight:'700'
                            }
                        }}
                        onPress={handlePurchase}
                        disabled={purchaseLoading}
                    />
                    <DefaultText style={styles.text}>
                        {!isSignUpFlow &&
                            <DefaultText
                                onPress={handleLogout}
                            >
                                Logout ·{" "}
                            </DefaultText>
                        }

                        <DefaultText
                            onPress={viewTermsOfUse}
                        >
                            Terms of Use ·{" "}
                        </DefaultText>

                        <DefaultText
                            onPress={viewPrivacyPolicy}
                        >
                            Privacy Policy ·{" "}
                        </DefaultText>

                        <DefaultText
                            onPress={purchaseLoading ? null : restorePurchase}
                        >
                            {purchaseLoading ? 'Wait...' : 'Restore'}
                        </DefaultText>
                    </DefaultText>
                </View>
            </View>
        </View>
    );
}

export default PaywallScreen;

const styles = StyleSheet.create({
    container: {
        backgroundColor:colors.background.screen,
        flex:1,
    },
    topContainer: {
        gap:16,
        display:'flex',
        alignItems:'center',
        flexDirection:'row',
        width:'100%',
        justifyContent:'space-between',
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    flexCenter: {
        width:'100%',
        alignItems:'center',
        justifyContent:'center',
    },
    flexContainer: {
        display:'flex',
        alignItems:'center',
        justifyContent:'start',
        gap:12,
        flexDirection:'row',
    },
    mainContainer: {
        flex:1,
        alignItems:'center',
        marginBottom:DefaultStyles.container.paddingBottom,
    },
    bottomContainer: {
        gap:16,
        borderRadius:48,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        paddingBottom:0,
        justifyContent:'flex-end',
        alignItems:'center',
    },
    paymentOptionsContainer: {
        gap:16,
        width:'100%',     
    },
    title: {
        fontSize:48,
        textAlign:'center',
        fontWeight:'600',
        fontFamily:'HedvigLettersSerif',
        color:colors.text.secondary,
    },
    caption: {
        marginTop:4,
        fontSize:DefaultStyles.text.caption.large,
        color:colors.text.darker,
        fontFamily:'HedvigLettersSerif',
        fontWeight:'500',
        textAlign:'center',
    },
    text: {
        color:colors.text.darker,
        fontSize:12,
    },
    bolded: {
        fontWeight:'700',
    },
    restorePurchase: {
        fontSize:16,
        fontWeight:'600',
        color:'#777',
        textAlign:'right',
    },
    iconButton: {
        width:48,
        height:48,
        backgroundColor:colors.background.light,
    },
    logo: {
        width:48,
        height:48,
        borderRadius:12,
    },
    badge: {
        padding:6,
        width:96,
        marginRight:36,
        marginBottom:'auto',
        marginTop:-22,
        borderRadius:64,
        backgroundColor:colors.background.primary,
    },
    badgeText: {
        fontSize:12,
        fontWeight:'900',
        color:colors.text.primary,
        textAlign:'center',
    }
})