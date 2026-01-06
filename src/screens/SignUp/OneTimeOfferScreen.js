import { Alert, Image, SafeAreaView, StyleSheet, Switch, View } from "react-native"
import DefaultStyles from "../../config/styles"
import IconButton from "../../components/Buttons/IconButton";
import { useNavigation } from "@react-navigation/native";
import DefaultText from "../../components/Text/DefaultText";
import colors from "../../config/colors";
import {FontAwesome6, Ionicons, Octicons} from '@expo/vector-icons'
import { lighten } from "../../utils/lighten";
import { LinearGradient } from "expo-linear-gradient";
import gradient, { createHorizontalGradient } from "../../utils/gradient";
import LeftLeaf from '../../assets/extra/leaf_left.png'
import RightLeaf from '../../assets/extra/leaf_right.png'
import StarRating from "../../components/Common/StarRating";
import DefaultButton from "../../components/Buttons/DefaultButton";
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from "react";
import Purchases from 'react-native-purchases';
import { useAuth } from "../../context/global/AuthContext";

const OneTimeOfferScreen = () => {

    const navigation = useNavigation();
    const { checkSubscriptionStatus } = useAuth();
    const [yearlyPackage, setYearlyPackage] = useState(null);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const lightenedPrimary = lighten(colors.background.primary, .5)
    const gradientProps = createHorizontalGradient(colors.background.primary, colors.background.secondary)

    const handlePurchase = async () => {
        try {
            setPurchaseLoading(true);

            if (!yearlyPackage) {
                throw new Error('No yearly package available');
            }

            const { customerInfo } = await Purchases.purchasePackage(yearlyPackage);

            const hasProEntitlement = customerInfo.entitlements.active['pro'] !== undefined;

            if (hasProEntitlement) {
                Alert.alert(
                    'Purchase Successful',
                    'Welcome to Derm AI Pro!',
                    [{ text: 'Continue', onPress: () => navigation.navigate('CreateAccount') }]
                );
            } else {
                throw new Error('Purchase did not grant entitlement');
            }
        } catch (error) {
            console.error('Purchase error:', error);

            if (error.userCancelled) {
                navigation.goBack();
                return;
            }

            Alert.alert(
                'Purchase Failed',
                'Unable to complete purchase. Please try again.'
            );
        } finally {
            setPurchaseLoading(false);
        }
    };

    useEffect(() => {
        const fetchYearlyPackage = async () => {
            try {
                const offerings = await Purchases.getOfferings();

                // Look for the discount25 offering
                const discount25Offering = offerings.all?.['discount25'];

                if (discount25Offering && discount25Offering.availablePackages.length > 0) {
                    // Find the annual package in the discount25 offering
                    const yearlyPkg = discount25Offering.annual ||
                                    discount25Offering.availablePackages.find(
                                        pkg => pkg.packageType === 'ANNUAL'
                                    );
                    setYearlyPackage(yearlyPkg);
                }
            } catch (error) {
                console.error('Error fetching yearly package:', error);
            }
        };

        fetchYearlyPackage();
    }, []);

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <View
                    style={{
                        ...DefaultStyles.container,
                        paddingBottom:0,
                    }}
                >
                    <View
                        style={styles.topContainer}
                    >
                        <IconButton
                            icon='close'
                            size={24}
                            onPress={() => navigation.goBack()}
                            style={{
                                ...DefaultStyles.button.icon,
                                marginRight:'auto',
                            }}
                        />

                        <DefaultText
                            style={styles.title}
                        >
                            YOUR ONE-TIME OFFER
                        </DefaultText>
                    </View>

                    <View
                        style={styles.heroContainer}
                    >
                        <View
                            style={styles.flexContainer}
                        >
                            <View
                                style={styles.sparkleContainer}
                            >
                                <Ionicons
                                    name='sparkles'
                                    color={lightenedPrimary}
                                    size={24}
                                    style={{
                                        marginLeft:'auto'
                                    }}
                                />
                                <Ionicons
                                    name='sparkles'
                                    color={colors.background.secondary}
                                    size={48}
                                    style={{
                                        marginRight:'auto'
                                    }}
                                />
                                <Ionicons
                                    name='sparkles'
                                    color={colors.background.primary}
                                    size={16}
                                    style={{
                                        marginLeft:'auto'
                                    }}
                                />
                            </View>

                            <LinearGradient
                                style={styles.enlargedOffer}
                                {...gradientProps}
                            >
                                <DefaultText
                                    style={styles.enlargedOfferText}
                                >
                                    80% OFF{'\n'}FOREVER
                                </DefaultText>
                            </LinearGradient>

                            <View
                                style={styles.sparkleContainer}
                            >
                                <Ionicons
                                    name='sparkles'
                                    color={colors.background.secondary}
                                    size={24}
                                    style={{
                                        marginRight:'auto'
                                    }}
                                />
                                <Ionicons
                                    name='sparkles'
                                    color={lightenedPrimary}
                                    size={48}
                                    style={{
                                        marginLeft:'auto'
                                    }}
                                />
                                <Ionicons
                                    name='sparkles'
                                    color={colors.background.primary}
                                    size={16}
                                    style={{
                                        marginRight:'auto'
                                    }}
                                />
                            </View>
                        </View>

                        <DefaultText
                            style={styles.subtitle}
                        >
                            <DefaultText
                                style={{
                                    fontWeight:'800',
                                    textDecorationLine:'line-through'
                                }}
                            >
                                $29.99
                            </DefaultText>
                            <DefaultText
                                style={{
                                    fontWeight:'300'
                                }}
                            >
                                {' '}$1.67/mo
                            </DefaultText>
                        </DefaultText>
                    </View>

                    <View
                        style={{
                            flex:1,
                            justifyContent:'center',
                            gap:32,
                        }}
                    >
                        <View
                            style={{
                                ...styles.flexContainer,
                                gap:24,
                                justifyContent:'center',
                            }}
                        >
                            <View
                                style={{
                                    ...styles.flexContainer,
                                    gap:12,
                                }}
                            >
                                <Image
                                    source={LeftLeaf}
                                    style={styles.leaf}
                                />

                                <View
                                    style={styles.leafContainer}
                                >
                                    <DefaultText
                                        style={styles.caption}
                                    >
                                        10k+
                                    </DefaultText>
                                    <DefaultText
                                        style={styles.text}
                                    >
                                        Happy users
                                    </DefaultText>
                                </View>

                                <Image
                                    source={RightLeaf}
                                    style={styles.leaf}
                                />
                            </View>

                            <View
                                style={{
                                    ...styles.flexContainer,
                                    gap:12,
                                }}
                            >
                                <Image
                                    source={LeftLeaf}
                                    style={styles.leaf}
                                />

                                <View
                                    style={styles.leafContainer}
                                >
                                    <DefaultText
                                        style={styles.caption}
                                    >
                                        4.8 stars
                                    </DefaultText>
                                    
                                    <StarRating
                                        size={16}
                                        style={{
                                            gap:4,
                                        }}
                                        rating={5}
                                        color={colors.accents.warning}
                                    />
                                </View>

                                <Image
                                    source={RightLeaf}
                                    style={styles.leaf}
                                />
                            </View>
                        </View>

                        <DefaultText
                            style={{
                                ...styles.text,
                                width:'95%',
                                textAlign:'center',
                                alignSelf:'center'
                            }}
                        >
                            Once you close your one-time offer, it’s gone! Save 80% with yearly access.
                        </DefaultText>
                    </View>

                    <View
                        style={styles.bottomContainer}
                    >
                        <View
                            style={styles.offeringInfoOuterContainer}
                        >
                            <DefaultText
                                style={{
                                    ...styles.text,
                                    fontWeight:'700',
                                    color:colors.text.primary,
                                    textAlign:'center',
                                    paddingVertical:8,
                                }}
                            >
                                3-DAY FREE TRIAL
                            </DefaultText>

                            <View
                                style={styles.offeringInfoContainer}
                            >
                                <View
                                    style={{
                                        gap:8
                                    }}
                                >
                                    <DefaultText
                                        style={{
                                            ...styles.text,
                                            fontWeight:'500'
                                        }}
                                    >
                                        Yearly Access
                                    </DefaultText>
                                    <DefaultText
                                        style={styles.subtext}
                                    >
                                        12mo • $19.99
                                    </DefaultText>
                                </View>

                                <DefaultText
                                    style={{
                                        ...styles.caption,
                                        marginLeft:'auto',
                                        marginBottom:'auto'
                                    }}
                                >
                                    $1.67/mo
                                </DefaultText>
                            </View>
                        </View>

                        <DefaultButton
                            isActive={!purchaseLoading}
                            title={purchaseLoading ? 'Processing...' : 'Start Free Trial'}
                            hapticType={Haptics.ImpactFeedbackStyle.Soft}
                            onPress={handlePurchase}
                            disabled={purchaseLoading}
                            style={{
                                opacity: purchaseLoading ? 0.6 : 1,
                            }}
                            extraStyles={{
                                text: {
                                    fontWeight:'700'
                                }
                            }}
                        />

                        <View
                            style={styles.flexContainer}
                        >
                            <FontAwesome6
                                name='check'
                                size={16}
                                color={colors.text.secondary}
                            />

                            <DefaultText
                                style={{
                                    ...styles.text,
                                    fontWeight:'600',
                                }}
                            >
                                No Commitment - Cancel Anytime
                            </DefaultText>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default OneTimeOfferScreen;

const styles = StyleSheet.create({
    topContainer: {
        gap:16,
        paddingBottom:DefaultStyles.container.paddingBottom,
        alignItems:'center',
        justifyContent:'center',
        width:'100%',
    },
    bottomContainer:{
        gap:16,
        width:'100%',
        alignItems:'center',
    },
    flexContainer:{
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    sparkleContainer:{
        width:50,
        gap:16,
    },
    offeringInfoContainer: {
        padding:DefaultStyles.container.paddingBottom,
        backgroundColor:colors.background.screen,
        flexDirection:'row',
        alignItems:'center',
        borderBottomLeftRadius:14,
        borderBottomRightRadius:14,
    },
    offeringInfoOuterContainer: {
        backgroundColor:colors.background.primary,
        borderRadius:16,
        padding:2,
        width:'100%',
    },
    enlargedOffer: {
        padding:DefaultStyles.container.paddingHorizontal,
        borderRadius:16,
        boxShadow:'0px 6px 12px rgba(0,0,0,.05)'
    },
    enlargedOfferText: {
        fontSize:DefaultStyles.text.title.large,
        fontWeight:'700',
        color:colors.text.primary
    },
    heroContainer: {
        width:'100%',
        alignItems:'center',
        gap:24,
    },
    title: {
        fontSize:28,
        textAlign:'center',
        fontWeight:'700',
        color:colors.text.secondary
    },
    subtitle: {
        fontWeight:'300',
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.title.xsmall,
    },
    caption: {
        fontWeight:'600',
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.caption.medium,
    },
    text: {
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.caption.small,
    },
    subtext: {
        color:colors.text.lighter,
        fontSize:DefaultStyles.text.caption.xsmall
    },
    leaf: {
        width:24,
        height:48,
    },
    leafContainer: {
        gap:8,
        alignItems:'center',
    }
})