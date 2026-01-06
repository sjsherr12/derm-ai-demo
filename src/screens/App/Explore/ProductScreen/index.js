import DefaultStyles from "config/styles";
import ProductScreenHeader from "./header";
import TopTabBar from "components/Options/TopTabBar";
import { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import * as Haptics from 'expo-haptics'
import { Alert, Animated, Button, Dimensions, Image, Modal, Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from "react-native";
import colors from "config/colors";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useData } from "context/global/DataContext";
import { useAuth } from "context/global/AuthContext";
import useIngredientFetcher from "context/global/useIngredientFetcher";
import { useNavigation, useRoute } from "@react-navigation/native";
import IngredientsScreenIngredientItem from "./IngredientsScreen/ingredient";
import DefaultBottomSheet from "components/Containers/DefaultBottomSheet";
import IngredientsScreenIngredientDetailedInfo from "./IngredientsScreen/ingredientInfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import ProductScreenScoringMethodExplanation from "./scoringMethod";
import { db } from "services/firebase/firebase";
import ProductScreenProductDetailsTabTopSection from "./Tabs/ProductDetails/top";
import ProductScreenProductDetailsTab from "./Tabs/ProductDetails";
import ProductScreenSkinMatchTabTopSection from "./Tabs/SkinMatch/top";
import ProductScreenSkinMatchTab from "./Tabs/SkinMatch";

const SCREEN_WIDTH = Dimensions.get('window').width;

const matches = [
    {
        title:'It’s a match!',
        color:colors.background.primary,
        icon:'check'
    },
    {
        title:'Decent match!',
        color:colors.accents.warning,
        icon:'circle-minus'
    },
    {
        title:'Not a match!',
        color:colors.accents.error,
        icon:'xmark'
    }
]

const ProductScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const safeAreaStyles = useSafeAreaStyles();

    const {productId} = route?.params;
    const {
        getLocalProductById, 
        getProductReviews, 
        getProductAverageRating, 
        userData,
        setUserData,
        routineProducts,
        mostRecentDiagnosis
    } = useData();
    const { user } = useAuth();
    const { fetchProductIngredients, getCachedIngredients } = useIngredientFetcher();
    
    // Initialize product from local cache
    const [product, setProduct] = useState(() => getLocalProductById(productId));
    const [productIngredients, setProductIngredients] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState(0);
    const [expandedIngredientId, setExpandedIngredientId] = useState(null)
    const [isScoringMethodOpen, setScoringMethodOpen] = useState(false)
    const [titleLineCount, setTitleLineCount] = useState(1);

    // Animation values for tab transitions
    const productDetailsOpacity = useRef(new Animated.Value(1)).current;
    const productDetailsScale = useRef(new Animated.Value(1)).current;
    const skinMatchOpacity = useRef(new Animated.Value(0)).current;
    const skinMatchUserImagePosition = useRef(new Animated.Value(-100)).current;
    const skinMatchProductImagePosition = useRef(new Animated.Value(100)).current;
    const skinMatchContentOpacity = useRef(new Animated.Value(0)).current;

    const expandedIngredient = productIngredients.find(pi => pi?.id === expandedIngredientId)
    
    // Get overlapping skin concerns between product and user
    const overlappingSkinConcerns = useMemo(() => {
        if (!product?.skinConcerns || !userData?.profile?.skinInfo?.skinConcerns) return null;
        if (!Array.isArray(product.skinConcerns) || !Array.isArray(userData.profile.skinInfo.skinConcerns)) return null;

        // case: only concern is "overall" / "no main concerns"
        if (userData.profile.skinInfo.skinConcerns.length === 1 && userData.profile.skinInfo.skinConcerns[0] === 0) return null;
        
        // only case that can return an array
        return product.skinConcerns.filter(concern => 
            userData.profile.skinInfo.skinConcerns.includes(concern)
        );
    }, [product?.skinConcerns, userData?.profile?.skinInfo?.skinConcerns]);

    const overlappingSkinTypes = useMemo(() => {
        if (!product?.skinTypes || userData?.profile?.skinInfo?.skinType === undefined) return null;
        if (!Array.isArray(product.skinTypes)) return null;
        
        return product.skinTypes.includes(userData.profile.skinInfo.skinType) ? [userData.profile.skinInfo.skinType] : [];
    }, [product?.skinTypes, userData?.profile?.skinInfo?.skinType]);

    // Get conflicting sensitivities between user and product
    const conflictingSensitivities = useMemo(() => {
        if (!product?.sensitivities || !userData?.profile?.skinInfo?.sensitivities) return null;
        if (!Array.isArray(product.sensitivities) || !Array.isArray(userData.profile.skinInfo.sensitivities)) return null;
        
        // only case that can return an array
        return userData.profile.skinInfo.sensitivities.filter(sensitivity =>
            product.sensitivities.includes(sensitivity)
        );
    }, [product?.sensitivities, userData?.profile?.skinInfo?.sensitivities]);

    // Check if product is liked
    const isProductLiked = useMemo(() => {
        const likedProducts = userData?.routine?.likedProducts || [];
        return likedProducts.includes(product?.id);
    }, [userData?.routine?.likedProducts, product?.id]);

    // Toggle liked product
    const toggleLikedProduct = useCallback(async () => {
        if (!user || !product?.id) return;

        try {
            const userRef = doc(db, 'users', user.uid);
            const currentLikedProducts = userData?.routine?.likedProducts || [];
            const productId = product.id;
            const isCurrentlyLiked = currentLikedProducts.includes(productId);
            
            if (isCurrentlyLiked) {
                // Update local state
                const updatedLikedProducts = currentLikedProducts.filter(id => id !== productId);
                setUserData(prev => ({
                    ...prev,
                    routine: {
                        ...prev?.routine,
                        likedProducts: updatedLikedProducts
                    }
                }));

                // Remove from liked products
                await updateDoc(userRef, {
                    'routine.likedProducts': arrayRemove(productId)
                });
            } else {
                // Update local state
                const updatedLikedProducts = [...currentLikedProducts, productId];
                setUserData(prev => ({
                    ...prev,
                    routine: {
                        ...prev?.routine,
                        likedProducts: updatedLikedProducts
                    }
                }));

                // Add to liked products
                await updateDoc(userRef, {
                    'routine.likedProducts': arrayUnion(productId)
                });
            }
        } catch (error) {
            console.error('Error toggling liked product:', error);
        }
    }, [user, product?.id, userData?.routine?.likedProducts, setUserData]);

    // Check if product is already in routine
    const isProductInRoutine = useMemo(() => {
        if (!routineProducts || !product?.id) return false;
        
        const existingProductIds = new Set(
            routineProducts
                ?.map(routineProduct => routineProduct.productInfo?.id)
                ?.filter(Boolean) || []
        );
        
        return existingProductIds.has(product.id);
    }, [routineProducts, product?.id]);

    // Handle add to routine
    const handleAddToRoutine = useCallback(() => {
        navigation.navigate('AddProductModal', {
            screen: 'AddProductEdit',
            params: {
                productId: product?.id,
                routineType: 0, // Default to morning routine
                mode: 'add',
            }
        });
    }, [navigation, product?.id]);

    const getMatchType = () => {
        if (conflictingSensitivities?.length) {
            return 2;
        }

        const noOverlappingConcerns = overlappingSkinConcerns && !(overlappingSkinConcerns?.length); // it exists (an array) but has no items
        const noOverlappingSkinTypes = overlappingSkinTypes && !(overlappingSkinTypes?.length);

        if (noOverlappingConcerns || noOverlappingSkinTypes) {
            return 1;
        }

        return 0;
    }

    const match = getMatchType();
    const matchInfo = matches[match];

    const productReviews = useMemo(() => 
        getProductReviews ? getProductReviews(productId) : [], 
        [getProductReviews, productId]
    );

    const averageRating = useMemo(() => 
        getProductAverageRating ? getProductAverageRating(productId) : 0, 
        [getProductAverageRating, productId]
    );

    // Reset state when productId changes and fetch from local cache
    useEffect(() => {
        if (!productId) {
            setProduct(null);
            return;
        }

        // Get product from local cache
        const cachedProduct = getLocalProductById(productId);
        
        // Reset all state for new product
        setProduct(cachedProduct);
        setProductIngredients([]);
        
        if (!cachedProduct) {
            console.warn(`Product ${productId} not found in local cache`);
        }
    }, [productId, refreshing]); // Only depend on productId and refreshing

    // Update product with computed averageRating for backward compatibility
    useEffect(() => {
        if (!product || !getProductAverageRating) return;

        const computedAverage = getProductAverageRating(productId);
        
        // Only update if the computed average differs from what's stored
        if (product.reviews?.averageRating !== computedAverage) {
            const updated = {
                ...product,
                reviews: {
                    ...product.reviews,
                    averageRating: computedAverage,
                },
            };

            setProduct(updated);
            // Note: Don't update global products state - it's now read-only from cache
        }
    }, [product, productId, getProductAverageRating, averageRating]); // Include averageRating to trigger updates

    // Fetch ingredients for the product
    useEffect(() => {
        if (!product || productIngredients.length > 0) return;

        const fetchIngredients = async () => {
            try {
                const ingredients = await fetchProductIngredients(product);
                setProductIngredients(ingredients);
            } catch (error) {
                console.error('Error fetching product ingredients:', error);
            }
        };

        fetchIngredients();
    }, [product?.name, fetchProductIngredients, productIngredients.length]); // Use stable product identifier

    // Memoized refresh handler
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        // Force re-fetch by clearing local product state
        setProduct(null);
        
        // Set a minimum refresh time for better UX
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    // Memoized tab change handler with animations
    const handleTabChange = useCallback((newTab) => {
        if (newTab === tab) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

        // Update tab state immediately so both views are rendered
        setTab(newTab);

        if (newTab === 1) {
            // Switching to Skin Match tab
            Animated.parallel([
                // Product Details: scale up and fade out
                Animated.timing(productDetailsScale, {
                    toValue: 1.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(productDetailsOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                // Skin Match: fade in container
                Animated.timing(skinMatchOpacity, {
                    toValue: 1,
                    duration: 300,
                    delay: 150,
                    useNativeDriver: true,
                }),
                // Skin Match: slide in images
                Animated.spring(skinMatchUserImagePosition, {
                    toValue: 0,
                    friction: 8,
                    tension: 50,
                    delay: 150,
                    useNativeDriver: true,
                }),
                Animated.spring(skinMatchProductImagePosition, {
                    toValue: 0,
                    friction: 8,
                    tension: 50,
                    delay: 150,
                    useNativeDriver: true,
                }),
                // Skin Match: fade in content
                Animated.timing(skinMatchContentOpacity, {
                    toValue: 1,
                    duration: 300,
                    delay: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Switching to Product Details tab
            Animated.parallel([
                // Skin Match: slide out images
                Animated.timing(skinMatchUserImagePosition, {
                    toValue: -100,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(skinMatchProductImagePosition, {
                    toValue: 100,
                    duration: 250,
                    useNativeDriver: true,
                }),
                // Skin Match: fade out content
                Animated.timing(skinMatchContentOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                // Skin Match: fade out container
                Animated.timing(skinMatchOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                // Product Details: scale down and fade in
                Animated.timing(productDetailsScale, {
                    toValue: 1,
                    duration: 300,
                    delay: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(productDetailsOpacity, {
                    toValue: 1,
                    duration: 300,
                    delay: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [tab, productDetailsOpacity, productDetailsScale, skinMatchOpacity, skinMatchUserImagePosition, skinMatchProductImagePosition, skinMatchContentOpacity]);

    return (
        <View style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}>
                <ProductScreenHeader
                    product={product}
                    isProductLiked={isProductLiked}
                    toggleLikedProduct={toggleLikedProduct}
                />

                <ScrollView
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={handleRefresh} 
                        />
                    }
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.topContainer}>
                        <TopTabBar
                            tabs={['Product Details', 'Skin Match']}
                            activeTab={tab}
                            onChange={handleTabChange}
                            hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        />

                        <View
                            style={{
                                ...styles.tabContentContainer,
                                minHeight:tab ? SCREEN_WIDTH*.725 : titleLineCount > 2 ? 390 : titleLineCount > 1 ? 360 : 330,
                            }}
                        >
                            {/* Product Details Tab */}
                            <Animated.View
                                style={[
                                    styles.tabContent,
                                    {
                                        opacity: productDetailsOpacity,
                                        transform: [{ scale: productDetailsScale }],
                                        zIndex: tab === 0 ? 2 : 1,
                                    }
                                ]}
                                pointerEvents={tab === 0 ? 'auto' : 'none'}
                            >
                                <ProductScreenProductDetailsTabTopSection
                                    product={product}
                                    onTextLayout={(e) => setTitleLineCount(e?.nativeEvent?.lines?.length ?? 1)}
                                />
                            </Animated.View>

                            {/* Skin Match Tab */}
                            <Animated.View
                                style={[
                                    styles.tabContent,
                                    {
                                        opacity: skinMatchOpacity,
                                        zIndex: tab === 1 ? 2 : 1,
                                    }
                                ]}
                                pointerEvents={tab === 1 ? 'auto' : 'none'}
                            >
                                <ProductScreenSkinMatchTabTopSection
                                    product={product}
                                    userData={userData}
                                    latestScan={mostRecentDiagnosis}
                                    matchInfo={matchInfo}
                                    userImagePosition={skinMatchUserImagePosition}
                                    productImagePosition={skinMatchProductImagePosition}
                                    contentOpacity={skinMatchContentOpacity}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    <View style={DefaultStyles.scrollContainer}>

                        {/* Product Details Tab */}
                        <View style={{display:tab === 0 ? 'contents' : 'none'}}>
                            <ProductScreenProductDetailsTab
                                product={product}
                                productId={productId}
                                productReviews={productReviews}
                                productIngredients={productIngredients}
                                averageRating={averageRating}
                                expandedIngredientId={expandedIngredientId}
                                setExpandedIngredientId={setExpandedIngredientId}
                                setScoringMethodOpen={setScoringMethodOpen}
                                handleAddToRoutine={handleAddToRoutine}
                                isProductInRoutine={isProductInRoutine}
                            />
                        </View>

                        {/* Skin Match Tab */}
                        <View style={{display:tab === 1 ? 'contents' : 'none'}}>
                            <ProductScreenSkinMatchTab
                                product={product}
                                userData={userData}
                                match={match}
                                overlappingSkinConcerns={overlappingSkinConcerns}
                                overlappingSkinTypes={overlappingSkinTypes}
                                conflictingSensitivities={conflictingSensitivities}
                            />
                        </View>
                    </View>
                </ScrollView>

            <DefaultBottomSheet
                isOpen={!!expandedIngredientId}
                onClose={() => setExpandedIngredientId(null)}
            >
                <IngredientsScreenIngredientDetailedInfo
                    ingredient={expandedIngredient}
                    onClose={() => setExpandedIngredientId(null)}
                />
            </DefaultBottomSheet>

            <DefaultBottomSheet
                isOpen={isScoringMethodOpen}
                onClose={() => setScoringMethodOpen(false)}
            >
                <ProductScreenScoringMethodExplanation
                    onClose={() => setScoringMethodOpen(false)}
                />
            </DefaultBottomSheet>
        </View>
    );
};

export default memo(ProductScreen);

const styles = StyleSheet.create({
    container: {
        gap:8,
    },
    topContainer: {
        padding:12,
        paddingTop:DefaultStyles.container.paddingBottom,
        paddingBottom:DefaultStyles.container.paddingHorizontal,
        alignItems:'center',
        justifyContent:'center',
        gap:12,
        boxShadow:'0px 6px 12px rgba(0,0,0,.025)',
        borderBottomLeftRadius:48,
        borderBottomRightRadius:48,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        borderTopWidth:0,
    },
    tabContentContainer: {
        position: 'relative',
        width: '100%',
        alignItems: 'center',
    },
    tabContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop:DefaultStyles.container.paddingTop,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        paddingBottom:DefaultStyles.container.paddingBottom,
    },
});