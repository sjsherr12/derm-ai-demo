import { useNavigation } from "@react-navigation/native";
import Skeleton from "components/Common/Skeleton";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { SkincareProductCategories } from "constants/products";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import { getProductCategory } from "utils/products";
import { getSafetyRating } from "utils/routine";
import * as Haptics from 'expo-haptics'
import * as WebBrowser from 'expo-web-browser'
import { merge } from "lodash";
import useReviewPrompt from "hooks/useReviewPrompt";
import { Ionicons } from '@expo/vector-icons';
import DefaultButton from "components/Buttons/DefaultButton";
import { useState, useMemo, useEffect } from "react";
import { useData } from "context/global/DataContext";
import { useAuth } from "context/global/AuthContext";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "services/firebase/firebase";
import IconButton from "../Buttons/IconButton";
import { BlurView } from 'expo-blur';
import FadeScaleView from "../Containers/FadeScaleView";

const { View, StyleSheet, Image, Pressable, Animated, Dimensions, Alert } = require("react-native")

const SCREEN_WIDTH = Dimensions.get('window').width

const ProductCardItem = ({
    product,
    columns,
    inDemo,
    blur,
}) => {
    const screenWidth = SCREEN_WIDTH - (DefaultStyles.container.paddingHorizontal*2) - (16*(columns-1));
    const navigation = useNavigation();
    const { userData, setUserData } = useData();
    const { user } = useAuth();
    const commonWidth = columns ? (screenWidth/columns) : 160;
    const [isSaved, setIsSaved] = useState(false);
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:100,
        useNativeDriver:true,
    });

    const {
        scale: buyButtonScale,
        handlePressIn: handleBuyButtonPressIn,
        handlePressOut: handleBuyButtonPressOut
    } = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    });

    const { recordPositiveAction } = useReviewPrompt();

    const handlePress = () => {
        if (!product?.id) return; // Don't navigate if product ID is missing

        recordPositiveAction('product_viewed');
        navigation.push('Product', {
            productId: product.id
        })
    }

    // Check if product is already saved
    useEffect(() => {
        if (userData?.routine?.likedProducts && product?.id) {
            setIsSaved(userData.routine.likedProducts.includes(product.id));
        }
    }, [userData?.routine?.likedProducts, product?.id]);

    // Function to open product store link
    const openStore = async () => {
        if (product?.buyLink) {
            try {
                await WebBrowser.openBrowserAsync(`${product?.buyLink}?tag=dermaiapp-20`, {
                    presentationStyle:'pageSheet'
                });
            } catch (e) {
                Alert.alert('Error shopping product', e?.message);
            }
        }
    };

    const handleBuyPress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        openStore();
    };

    const handleSaveToggle = async () => {
        if (!user || !product?.id) return;

        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Update local state immediately for better UX
            setIsSaved(!isSaved);

            const userRef = doc(db, 'users', user.uid);
            const currentLikedProducts = userData?.routine?.likedProducts || [];
            const isCurrentlySaved = currentLikedProducts.includes(product.id);

            if (isCurrentlySaved) {
                // Remove from liked products
                await updateDoc(userRef, {
                    'routine.likedProducts': arrayRemove(product.id)
                });

                // Update the global state
                const updatedLikedProducts = currentLikedProducts.filter(id => id !== product.id);
                setUserData(prev => ({
                    ...prev,
                    routine: {
                        ...prev?.routine,
                        likedProducts: updatedLikedProducts
                    }
                }));
            } else {
                // Add to liked products
                await updateDoc(userRef, {
                    'routine.likedProducts': arrayUnion(product.id)
                });

                // Update the global state
                const updatedLikedProducts = [...currentLikedProducts, product.id];
                setUserData(prev => ({
                    ...prev,
                    routine: {
                        ...prev?.routine,
                        likedProducts: updatedLikedProducts
                    }
                }));
            }
        } catch (error) {
            console.error('Error toggling product save:', error);
            // Revert the local state if there's an error
            setIsSaved(!isSaved);
        }
    }

    const safetyRatingInfo = useMemo(() => 
        getSafetyRating(product?.safetyScore), 
        [product?.safetyScore]
    );

    // Use the actual rating color from safetyRatingInfo
    const getScoreColor = () => {
        return safetyRatingInfo?.color || colors.background.primary;
    }

    const productScore = product?.safetyScore || 0;
    const disableFeatures = inDemo || blur || !product?.id;

    const styles = merge({}, baseStyles, {
        container: {
            maxWidth:commonWidth,
        },
        imageContainer: {
            width:commonWidth,
        }
    })

    return (
        <FadeScaleView>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                disabled={disableFeatures}
            >
                <Animated.View
                    style={[
                        styles.container,
                        {transform:[{scale}]}
                    ]}
                >
                    {/* Blur overlay */}
                    {blur && (
                        <>
                            <BlurView 
                                intensity={100}
                                style={styles.blurOverlay}
                            />
                            <View style={styles.lockContainer}>
                                <DefaultText style={styles.lockEmoji}>🔒</DefaultText>
                            </View>
                        </>
                    )}
                    
                    {/* Heart icon - positioned absolutely at top right */}

                    {!disableFeatures &&
                        <Pressable 
                            style={styles.heartContainer}
                            onPress={handleSaveToggle}
                        >
                            <Ionicons 
                                name={isSaved ? "heart" : "heart-outline"}
                                size={24}
                                color={isSaved ? colors.accents.error : colors.text.lighter}
                            />
                        </Pressable>
                    }

                    {/* Image container - centered at top */}
                    <View style={styles.imageWrapper}>
                        {product?.imageUrl? 
                            <Image
                                source={{
                                    uri: product.imageUrl,
                                    cache: 'force-cache'
                                }}
                                resizeMode='contain'
                                style={styles.imageContainer}
                            />
                            :
                            <Skeleton
                                width={commonWidth * 0.7}
                                height={commonWidth * 0.7}
                                borderRadius={8}
                            />
                        }
                    </View>

                    {/* Content container */}
                    <View style={styles.contentContainer}>
                        {/* Top section with score and brand */}
                        <View style={styles.topContent}>
                            {/* Product score pill */}
                            {product?.id && (
                                <View style={[
                                    styles.scorePill,
                                    { backgroundColor: getScoreColor() }
                                ]}>
                                    <DefaultText style={styles.scoreText}>
                                        Rating: {productScore}/100
                                    </DefaultText>
                                </View>
                            )}

                            {/* Brand name */}
                            {product?.brand ? 
                                <DefaultText style={styles.brand}>
                                    {product.brand}
                                </DefaultText>
                                :
                                <Skeleton
                                    width={80}
                                    height={12}
                                    borderRadius={4}
                                />
                            }
                        </View>

                        {/* Product title */}
                        {product?.name ? 
                            <DefaultText
                                style={styles.name}
                                numberOfLines={2}
                            >
                                {product.name}
                            </DefaultText>
                            :
                            <Skeleton
                                width={120}
                                height={32}
                                borderRadius={4}
                            />
                        }

                        {/* Price button */}
                        <Pressable 
                            
                            onPress={handleBuyPress}
                            onPressIn={handleBuyButtonPressIn}
                            onPressOut={handleBuyButtonPressOut}
                            disabled={!product?.buyLink}
                        >
                            <Animated.View
                            style={[
                                    styles.priceButton,
                                    !product?.buyLink && styles.priceButtonDisabled,
                                    {transform:[{scale:buyButtonScale}]}
                                ]}
                            >
                                <Ionicons 
                                    name="cart-outline" 
                                    size={16} 
                                    color={colors.text.secondary}
                                    style={styles.cartIcon}
                                />
                                <DefaultText style={styles.priceText}>
                                    ${parseFloat(product?.price).toFixed(2)}
                                </DefaultText>
                            </Animated.View>
                        </Pressable>
                    </View>
                </Animated.View>
            </Pressable>
        </FadeScaleView>
    )
}

export default ProductCardItem;

const baseStyles = StyleSheet.create({
    container: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        backgroundColor: colors.background.screen,
        padding: 12,
        position: 'relative',
        minHeight: 200, // Ensures consistent height
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 14,
        zIndex: 10,
        overflow: 'hidden',
    },
    lockContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 11,
    },
    lockEmoji: {
        fontSize: 64,
    },
    heartContainer: {
        position: 'absolute',
        top: 6,
        right: 6,
        zIndex: 1,
        padding: 4,
    },
    imageWrapper: {
        alignItems: 'center',
        marginBottom: 2,
    },
    imageContainer: {
        borderRadius: 8,
        aspectRatio: 1,
        paddingHorizontal:12,
        paddingVertical:10
    },
    contentContainer: {
        flex: 1,
    },
    topContent: {
        gap: 6, 
    },
    scorePill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 14,
        alignSelf: 'flex-start',
    },
    scoreText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.text.primary,
    },
    brand: {
        fontSize: DefaultStyles.text.caption.xsmall,
        fontWeight: '500',
        color: colors.text.lighter,
    },
    name: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.text.secondary,
        lineHeight: 18,
        minHeight: 36,
        marginTop:6,
        marginBottom:10
    },
    priceButton: {
        backgroundColor: colors.accents.stroke,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceButtonDisabled: {
        opacity: 0.5,
    },
    cartIcon: {
        marginRight: 6,
    },
    priceText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.secondary,
    },
})