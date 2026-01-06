import {Ionicons, Feather, Entypo, FontAwesome6} from '@expo/vector-icons'
import colors from 'config/colors';
import React, { useCallback, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser'
import * as Haptics from 'expo-haptics'
import { Animated, Pressable, StyleSheet, View, Image } from 'react-native';
import DefaultText from 'components/Text/DefaultText';
import DefaultStyles from 'config/styles';
import { useData } from 'context/global/DataContext';
import { useNavigation } from '@react-navigation/native';
import useScalePressAnimation from 'hooks/useScalePressAnimation';
import Skeleton from 'components/Common/Skeleton';
import StarRating from 'components/Common/StarRating';
import { SkinConcerns } from 'constants/signup';
import { SkinTypes } from 'constants/signup';
import { CommonAllergens } from 'constants/signup';
import IngredientsScreenIngredientItem from '../../IngredientsScreen/ingredient';
import { lighten } from '../../../../../../utils/lighten';
import ExploreScreenSection from '../../../ExploreScreen/section';
const { default: DefaultButton } = require("components/Buttons/DefaultButton");

const ProductScreenProductDetailsTab = ({
    product,
    productId,
    productReviews,
    productIngredients,
    averageRating,
    expandedIngredientId,
    setExpandedIngredientId,
    setScoringMethodOpen,
    handleAddToRoutine,
    isProductInRoutine
}) => {
    const navigation = useNavigation();
    const { products } = useData();
    const [showAllIngredients, setShowAllIngredients] = useState(false);
    const [alternativeProducts, setAlternativeProducts] = useState([]);
    const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(true);

    // Helper function to check if two arrays have the same elements (order-independent)
    const arraysMatch = useCallback((arr1, arr2) => {
        if (!arr1 || !arr2) return false;
        if (arr1.length !== arr2.length) return false;

        const sorted1 = [...arr1].sort((a, b) => Number(a) - Number(b));
        const sorted2 = [...arr2].sort((a, b) => Number(a) - Number(b));

        return sorted1.every((val, idx) => val === sorted2[idx]);
    }, []);

    // Fetch alternative products when product changes
    useEffect(() => {
        if (!product || !products) {
            setAlternativeProducts([]);
            setIsLoadingAlternatives(false);
            return;
        }

        setIsLoadingAlternatives(true);

        // Filter products based on criteria
        const alternatives = Object.values(products)
            .filter(p => {
                // Exclude the current product
                if (p.id === productId) return false;

                // Must have same category
                if (p.category !== product.category) return false;

                // Must have same concerns (order-independent)
                if (!arraysMatch(p.skinConcerns, product.skinConcerns)) return false;

                // Must have same skin types (order-independent)
                if (!arraysMatch(p.skinTypes, product.skinTypes)) return false;

                // Must have >= safety score
                if ((p.safetyScore || 0) < (product.safetyScore || 0)) return false;

                // Must have <= sensitivities length
                const pSensitivitiesLength = p.sensitivities?.length || 0;
                const productSensitivitiesLength = product.sensitivities?.length || 0;
                if (pSensitivitiesLength > productSensitivitiesLength) return false;

                return true;
            })
            // Sort by highest safety score first, then by least sensitivities
            .sort((a, b) => {
                const safetyDiff = (b.safetyScore || 0) - (a.safetyScore || 0);
                if (safetyDiff !== 0) return safetyDiff;

                const aSensitivitiesLength = a.sensitivities?.length || 0;
                const bSensitivitiesLength = b.sensitivities?.length || 0;
                return aSensitivitiesLength - bSensitivitiesLength;
            });

        setAlternativeProducts(alternatives);
        setIsLoadingAlternatives(false);
    }, [product, products, productId, arraysMatch]);

    // Custom sorting function for ingredients
    const getSortedIngredients = (ingredients) => {
        if (!ingredients || ingredients.length === 0) return [];

        // Create array with original indices to maintain order
        const indexedIngredients = ingredients.map((ingredient, index) => ({
            ...ingredient,
            originalIndex: index
        }));

        // Separate ingredients with scores below perfect (score > 1) and perfect/unscored ingredients
        const problematicIngredients = [];
        const goodIngredients = [];

        indexedIngredients.forEach((ingredient) => {
            if (ingredient?.safetyScore && ingredient.safetyScore > 1) {
                problematicIngredients.push(ingredient);
            } else {
                goodIngredients.push(ingredient);
            }
        });

        // Sort problematic ingredients by worst score first (higher score = worse), 
        // then by original order for ingredients with same score
        problematicIngredients.sort((a, b) => {
            if (a.safetyScore !== b.safetyScore) {
                return b.safetyScore - a.safetyScore; // Higher score first (worse ingredients)
            }
            return a.originalIndex - b.originalIndex; // Original order for same scores
        });

        // Combine: problematic ingredients first, then good ingredients in original order
        return [...problematicIngredients, ...goodIngredients];
    };

    const handleBuy = useCallback(
        () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            openStore();
        },
        []
    )

    const {handlePressIn: handleBuyPressIn, handlePressOut: handleBuyPressOut, scale: buyScale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150
    })

    const {handlePressIn: handleTextPressIn, handlePressOut: handleTextPressOut, scale: textScale} = useScalePressAnimation({
        minScale:.9,
        maxScale:1,
        duration:100,
    })

    const {handlePressIn: handleContainerPressIn, handlePressOut: handleContainerPressOut, scale: containerScale} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:100,
    })

    const openStore = useCallback(async () => {
        if (product?.buyLink) {
            try {
                await WebBrowser.openBrowserAsync(`${product?.buyLink}?tag=dermaiapp-20`, {
                    presentationStyle:'pageSheet'
                });
            } catch (e) {
                Alert.alert('Error shopping product', e?.message);
            }
        }
    }, [product?.buyLink]);

    const navigateToReviews = useCallback(() => {
        if (hasReviews) {
            navigation.navigate('AllReviews', { productId })
        }
        else {
            navigation.navigate('WriteReview', { productId });
        }
        
    }, [navigation, productId, hasReviews, productReviews]);

    const hasReviews = productReviews.length > 0;

    return (
        <React.Fragment>
            <Pressable
                onPressIn={handleBuyPressIn}
                onPressOut={handleBuyPressOut}
                onPress={handleBuy}
            >
                <Animated.View
                    style={[
                        styles.shopButton,
                        {transform:[{scale: buyScale}]}
                    ]}
                >
                    <View style={styles.shopButtonLeft}>
                        <DefaultText style={styles.shopButtonTitle}>
                            Shop Online
                        </DefaultText>
                        <View style={styles.shopButtonInfo}>
                            <View style={styles.amazonLogoContainer}>
                                <Image 
                                    source={require('assets/logos/amazon.png')} 
                                    style={styles.amazonLogo}
                                    resizeMode="contain"
                                />
                            </View>
                            <DefaultText style={styles.amazonText}>
                                Amazon
                            </DefaultText>
                        </View>
                    </View>
                    <View style={styles.priceContainer}>
                        <DefaultText style={styles.priceText}>
                            ${parseFloat(product?.price).toFixed(2)}
                        </DefaultText>
                    </View>
                </Animated.View>
            </Pressable>

            <DefaultButton
                title={isProductInRoutine ? 'In routine' : 'Add to routine'}
                startAdornment={
                    <FontAwesome6
                        name={isProductInRoutine ? 'check' : 'add'}
                        color={isProductInRoutine ? colors.accents.success : colors.text.primary}
                        size={24}
                    />
                }
                style={{
                    color:isProductInRoutine ? colors.text.secondary : colors.text.primary,
                    backgroundColor:isProductInRoutine ? colors.accents.stroke : colors.background.secondary
                }}
                onPress={isProductInRoutine ? null : handleAddToRoutine}
                hapticType={isProductInRoutine ? null : Haptics.ImpactFeedbackStyle.Soft}
            />

            <DefaultButton
                isActive
                title='Compare products'
                startAdornment={
                    <Ionicons
                        name='swap-horizontal'
                        size={24}
                        color={colors.text.primary}
                    />
                }
                onPress={() => navigation.navigate('CompareProducts', {
                    initialProductId: productId
                })}
            />

            <View style={styles.itemContainer}>
                <DefaultText
                    style={styles.title}
                >
                    Overview
                </DefaultText>
                <DefaultText
                    style={styles.text}
                >
                    {product?.description || 'No description available'}
                </DefaultText>
            </View>

            <View style={styles.itemContainer}>
                <View style={styles.reviewFlexContainer}>
                    <DefaultText
                        style={[
                            styles.caption,
                            {marginRight:'auto'}
                        ]}
                    >
                        {hasReviews ? 'User Reviews' : 'No reviews yet'}
                    </DefaultText>
                    
                    {hasReviews && (
                        <DefaultText style={styles.caption}>
                            {parseFloat(averageRating).toFixed(1)}
                        </DefaultText>
                    )}

                    <StarRating
                        rating={averageRating}
                        color={hasReviews ? undefined : colors.text.lighter}
                        style={{
                            gap:2,
                        }}
                    />
                </View>

                <DefaultButton
                    isActive={!hasReviews}
                    title={hasReviews ? 'View all reviews' : 'Add a review'}
                    endAdornment={
                        <FontAwesome6
                            name={hasReviews ? 'arrow-right' : 'add'}
                            color={hasReviews ? colors.text.secondary : colors.text.primary}
                            size={18}
                            style={{
                                marginLeft:16,
                                marginBottom:2,
                            }}
                        />
                    }
                    style={{
                        borderRadius:64,
                        height:45,
                    }}
                    extraStyles={{
                        button: {
                            height:45,
                        },
                        text: {
                            fontSize:DefaultStyles.text.caption.small,
                            fontWeight:'400',
                        }
                    }}
                    onPress={navigateToReviews}
                    hapticType={Haptics.ImpactFeedbackStyle.Soft}
                />
            </View>

            <View style={styles.ingredientsContainer}>
                <View
                    style={styles.flexContainer}
                >
                    <DefaultText style={styles.title}>
                        Ingredients
                    </DefaultText>

                    <Pressable
                        onPressIn={handleTextPressIn}
                        onPressOut={handleTextPressOut}
                        style={{
                            marginLeft:'auto',
                        }}
                        onPress={() => navigation.navigate('IngredientsScreen', {
                            ingredients: productIngredients,
                        })}
                    >
                        <Animated.View
                            style={{
                                flexDirection:'row',
                                alignItems:'center',
                                transform:[{scale:textScale}]
                            }}
                        >
                            <DefaultText
                                style={[
                                    styles.ingredientsCaption,
                                    {
                                        marginRight:4,
                                        color:colors.background.primary,
                                    }
                                ]}
                            >
                                See All
                            </DefaultText>
                            <Entypo
                                name='chevron-right'
                                color={colors.background.primary}
                                size={20}
                            />
                        </Animated.View>
                    </Pressable>
                </View>
                
                {productIngredients.length > 0 ? (
                    <View style={styles.ingredientsList}>
                        {(() => {
                            const sortedIngredients = getSortedIngredients(productIngredients);
                            const displayedIngredients = showAllIngredients ? sortedIngredients : sortedIngredients?.slice(0,5);
                            
                            return displayedIngredients.map((ingredient, index) => {


                                return (
                                    <IngredientsScreenIngredientItem
                                        key={`${ingredient.id || ingredient.name || 'unknown'}-${ingredient.originalIndex}`}
                                        ingredient={ingredient}
                                        value={expandedIngredientId}
                                        onChange={setExpandedIngredientId}
                                    />
                                )
                            });
                        })()}
                        
                        <View style={{gap: 12}}>
                            {getSortedIngredients(productIngredients).length > 5 && (
                                <DefaultButton
                                    isActive
                                    title={showAllIngredients ? 'Show less' : `Show all ingredients`}
                                    style={{
                                        height:50,
                                        borderRadius: 64,
                                        marginTop: 16,
                                    }}
                                    extraStyles={{
                                        button:{
                                            height:50,
                                        },
                                        text: {
                                            fontSize:DefaultStyles.text.caption.small,
                                        }
                                    }}
                                    endAdornment={
                                        <Ionicons
                                            name={showAllIngredients ? 'arrow-up' : 'arrow-down'}
                                            color={colors.text.primary}
                                            size={18}
                                        />
                                    }
                                    onPress={() => setShowAllIngredients(!showAllIngredients)}
                                    hapticType={Haptics.ImpactFeedbackStyle.Light}
                                />
                            )}

                            {(getSortedIngredients(productIngredients).length <= 5 || showAllIngredients) && (
                                <DefaultButton
                                    title="Report a mistake"
                                    style={{
                                        height:50,
                                        borderRadius: 64,
                                        color:colors.text.primary,
                                        backgroundColor:lighten(colors.accents.error, .25),
                                        marginTop: getSortedIngredients(productIngredients).length <= 5 ? 16 : 0,
                                    }}
                                    extraStyles={{
                                        button:{
                                            height:50,
                                        },
                                        text: {
                                            fontSize:DefaultStyles.text.caption.small,
                                        }
                                    }}
                                    endAdornment={
                                        <Ionicons
                                            name='alert-circle-outline'
                                            color={colors.text.primary}
                                            size={18}
                                        />
                                    }
                                    onPress={() => navigation.navigate('ReportProductMistake', {
                                        productId
                                    })}
                                    hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                />
                            )}
                        </View>
                    </View>
                ) : product ? (
                    <View style={styles.ingredientsList}>
                        {[...Array(5)].map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.ingredientSkeletonContainer,
                                    index < 4 && {
                                        borderBottomWidth: 1.5,
                                        borderBottomColor: colors.accents.stroke,
                                    }
                                ]}
                            >
                                <View style={styles.ingredientSkeletonContent}>
                                    <View style={styles.ingredientSkeletonLeft}>
                                        <Skeleton width={120} height={16} />
                                        <View style={styles.ingredientSkeletonRating}>
                                            <Skeleton width={12} height={12} borderRadius={6} />
                                            <Skeleton width={60} height={14} />
                                        </View>
                                    </View>
                                    <Skeleton width={28} height={28} borderRadius={14} />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <DefaultText style={styles.noIngredientsText}>
                        No ingredient information available.
                    </DefaultText>
                )}
            </View>

            {product?.skinConcerns?.length > 0 &&
                <View style={styles.itemContainer}>
                    <DefaultText style={styles.title}>
                        Targeted Concerns
                    </DefaultText>

                    {product?.skinConcerns?.sort((a, b) => Number(a) - Number(b)).map((concern, idx) => {
                        const concernInfo = SkinConcerns.find(c => c.value === concern);

                        return (
                            <View
                                key={idx}
                                style={[
                                    styles.flexContainer,
                                    {gap:16,}
                                ]}
                            >
                                <Feather
                                    name='target'
                                    size={24}
                                    color={colors.text.primary}
                                    backgroundColor={colors.accents.error}
                                    padding={6}
                                    borderRadius={8}
                                />

                                <View
                                    style={{gap:4}}
                                >
                                    <DefaultText
                                        style={styles.smallTitle}
                                    >
                                        {concernInfo.title}
                                    </DefaultText>
                                    
                                    <DefaultText
                                        style={styles.text}
                                    >
                                        {concernInfo.description}
                                    </DefaultText>
                                </View>
                            </View>
                        )
                    })}
                </View>
            }

            {product?.skinTypes?.length > 0 &&
                <View style={styles.itemContainer}>
                    <DefaultText style={styles.title}>
                        Best Skin Types
                    </DefaultText>

                    {product?.skinTypes?.sort((a, b) => Number(a) - Number(b)).map((type, idx) => {
                        const typeInfo = SkinTypes.find(t => t.value === type);

                        return (
                            <View
                                key={idx}
                                style={[
                                    styles.flexContainer,
                                    {gap:16,}
                                ]}
                            >   
                                <Ionicons
                                    name={typeInfo.icon}
                                    size={24}
                                    color={colors.text.primary}
                                    backgroundColor={colors.background.primary}
                                    padding={6}
                                    borderRadius={8}
                                />

                                <View
                                    style={{gap:4}}
                                >
                                    <DefaultText
                                        style={styles.smallTitle}
                                    >
                                        {typeInfo.title}
                                    </DefaultText>
                                    
                                    <DefaultText
                                        style={styles.text}
                                    >
                                        {typeInfo.description}
                                    </DefaultText>
                                </View>
                            </View>
                        )
                    })}
                </View>
            }

            {product?.sensitivities?.length > 0 &&
                <View style={styles.itemContainer}>
                    <DefaultText style={styles.title}>
                        Sensitive Items
                    </DefaultText>

                    {product.sensitivities.sort((a, b) => Number(a) - Number(b)).map((type, idx) => {
                        const sensitivityInfo = CommonAllergens.find(t => t.value === type);

                        return (
                            <View
                                key={idx}
                                style={[
                                    styles.flexContainer,
                                    {gap:16,}
                                ]}
                            >
                                <Ionicons
                                    name='alert-circle-outline'
                                    size={24}
                                    color={colors.text.primary}
                                    backgroundColor={colors.accents.warning}
                                    padding={6}
                                    borderRadius={8}
                                />

                                <View
                                    style={{gap:4}}
                                >
                                    <DefaultText
                                        style={styles.smallTitle}
                                    >
                                        {sensitivityInfo.title}
                                    </DefaultText>
                                    
                                    <DefaultText
                                        style={styles.text}
                                    >
                                        {sensitivityInfo.description}
                                    </DefaultText>
                                </View>
                            </View>
                        )
                    })}
                </View>
            }

            {(isLoadingAlternatives || alternativeProducts.length > 0) && (
                <View
                    style={{
                        padding:DefaultStyles.container.paddingBottom,
                        borderWidth:1.5,
                        borderColor:colors.accents.stroke,
                        borderRadius:16,
                    }}
                >
                    <ExploreScreenSection
                        title='Product Alternatives'
                        description='Safer products with the same skin type and concern matches.'
                        products={alternativeProducts}
                        style={{
                            paddingHorizontal:-16,
                        }}
                        contentContainerStyle={{
                            paddingHorizontal:16,
                        }}
                        scrollContainerStyle={{
                            marginHorizontal:-16,
                        }}
                        isLoading={isLoadingAlternatives}
                        onExpand={() => {
                            navigation.navigate('Recommendations', {
                                recommendations: alternativeProducts.map((product => product?.id)),
                                tabTitle:'Alternatives',
                                infoTitle:'Product Alternatives',
                                infoDescription:`These products match the same skin concerns and skin types as ${product?.name || 'this product'}, while having an equal or higher safety score and equal or fewer sensitivities. All alternatives are sorted by safety score to show you the safest options first.`
                            })
                        }}
                    />
                </View>
            )}

            <Pressable
                onPressIn={handleContainerPressIn}
                onPressOut={handleContainerPressOut}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
                    setScoringMethodOpen(prev => !prev)
                }}
            >
                <Animated.View
                    style={[
                        styles.itemContainer,
                        {
                            transform:[{scale:containerScale}],
                        }
                    ]}
                >
                    <View
                        style={styles.flexContainer}
                    >
                        <View
                            style={{gap:6}}
                        >
                            <DefaultText
                                style={styles.caption}
                            >
                                Scoring Method
                            </DefaultText>
                            
                            <DefaultText
                                style={styles.text}
                            >
                                Learn how products are individually rated.
                            </DefaultText>
                        </View>

                        <Ionicons
                            name='chevron-forward-outline'
                            color={colors.text.secondary}
                            size={24}
                            style={{marginLeft:'auto'}}
                        />
                    </View>
                </Animated.View>
            </Pressable>
        </React.Fragment>
    )
}

export default ProductScreenProductDetailsTab;

const styles = StyleSheet.create({
    itemContainer: {
        gap:12,
        padding:DefaultStyles.container.paddingBottom,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        borderRadius:16,
    },
    ingredientsContainer: {
        padding:DefaultStyles.container.paddingBottom,
        borderWidth:3,
        borderColor:colors.background.primary,
        borderRadius:16,
    },
    title: {
        fontSize:24,
        fontWeight:'700',
        color:colors.text.secondary,
    },
    smallTitle: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
    },
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
        lineHeight:18
    },
    caption: {
        fontWeight:'600',
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.caption.small,
    },
    ingredientsCaption:{
        fontWeight:'500',
        color:colors.background.secondary,
        fontSize:DefaultStyles.text.caption.small,
    },
    reviewFlexContainer:{
        gap:8,
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
        marginBottom:8,
    },
    flexContainer: {
        gap:8,
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
    },
    noIngredientsText: {
        fontWeight: '400',
        color: colors.text.lighter,
        fontSize: DefaultStyles.text.caption.small,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    ingredientSkeletonContainer: {
        paddingVertical: DefaultStyles.container.paddingBottom,
    },
    ingredientSkeletonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    ingredientSkeletonLeft: {
        gap: 6,
    },
    ingredientSkeletonRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    shopButton: {
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        borderRadius: 18,
        padding: DefaultStyles.container.paddingBottom,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    shopButtonLeft: {
        alignItems: 'flex-start',
        gap: 8,
        marginRight: 16,
    },
    shopButtonTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    shopButtonInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    amazonLogoContainer: {
        width: 28,
        height: 28,
        borderRadius: 20,
        backgroundColor: '#232F3E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    amazonLogo: {
        width: 16,
        height: 16,
    },
    amazonText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    priceContainer: {
        backgroundColor:colors.background.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    priceText: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight: '600',
        color:colors.text.primary,
    },
})