import { useNavigation, useRoute } from "@react-navigation/native"
import { ScrollView, StyleSheet, View, Text, Image, Pressable, Animated } from "react-native";
import DefaultStyles from "../../../../config/styles";
import { SafeAreaView } from "react-native-safe-area-context";
import IconButton from "../../../../components/Buttons/IconButton";
import { lighten } from "../../../../utils/lighten";
import colors from "../../../../config/colors";
import DefaultText from "../../../../components/Text/DefaultText";
import { useMemo } from "react";
import ProductCardItem from "../../../../components/Products/ProductCardItem";
import { useData } from "../../../../context/global/DataContext";
import RoutineScreenRoutineProduct from "../../Routine/RoutineScreen/routineProduct";
import {FontAwesome6, Ionicons} from '@expo/vector-icons'
import AnalysisScreenCategoryScreenHeader from "./header";
import { SkinTypes, SkinConcerns, CommonAllergens } from "../../../../constants/signup";
import { getSeverityRating } from "../../../../utils/analysis";
import DefaultButton from "../../../../components/Buttons/DefaultButton";
import FadeScaleView from "../../../../components/Containers/FadeScaleView";
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation";
import { getSafetyRating } from "../../../../utils/routine";
import Shimmer from "../../../../components/Graphics/Shimmer";

function isVowel(x) {  return /[aeiouAEIOU]/.test(x); }

// Helper component to render text with bold formatting using **text** convention
const BoldText = ({ children, style }) => {
    if (!children) return null;

    const parts = children.split(/(\*\*.*?\*\*)/g);

    return (
        <DefaultText style={style}>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    const text = part.slice(2, -2);
                    return (
                        <Text key={index} style={{ fontWeight: '700' }}>
                            {text}
                        </Text>
                    );
                }
                return <Text key={index}>{part}</Text>;
            })}
        </DefaultText>
    );
};

const AnalysisScreenCategoryScreen = ({

}) => {

    const route = useRoute();
    const navigation = useNavigation();
    const {products, userData, routineProducts} = useData();
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:100,
    })

    const {
        category,
        categoryProducts,
    } = route?.params

    const categoryName = useMemo(
        () => category.title,
        [category]
    )

    const bestProduct = useMemo(
        () => products?.[categoryProducts[0]],
        [products, categoryProducts]
    )

    const bestProductRatingInfo = getSafetyRating(bestProduct?.safetyScore ?? 100)

    const alternatesAvailable = useMemo(
        () => categoryProducts?.length > 1,
        [categoryProducts]
    )

    // Check if product is already in routine
    const isProductInRoutine = useMemo(() => {
        if (!routineProducts || !bestProduct?.id) return false;

        const existingProductIds = new Set(
            routineProducts
                ?.map(routineProduct => routineProduct.productInfo?.id)
                ?.filter(Boolean) || []
        );

        return existingProductIds.has(bestProduct.id);
    }, [routineProducts, bestProduct?.id])

    // Generate personalized good match description
    const goodMatchDescription = useMemo(() => {
        if (!bestProduct || !userData?.profile?.skinInfo) return null;

        const userSkinInfo = userData.profile.skinInfo;
        const parts = [];

        // Start with product name
        parts.push(`**${bestProduct?.brand}’s ${bestProduct.name}** is a **Good Match** for you because`);

        // Check for targeted skin types
        const userSkinTypes = userSkinInfo.skinTypes || [];
        const overlappingSkinTypes = bestProduct.skinTypes?.filter(type =>
            userSkinTypes.includes(type)
        ) || [];

        if (overlappingSkinTypes.length > 0) {
            const typeNames = overlappingSkinTypes.map(type => {
                const typeInfo = SkinTypes.find(t => t.value === type);
                return typeInfo?.title || type;
            }).join(', ');
            parts.push(`it's targeted for your skin type **(${typeNames})**`);
        }

        // Check for targeted skin concerns
        const userConcerns = userSkinInfo.skinConcerns || [];
        const hasNoConcerns = userConcerns.length === 1 && userConcerns[0] === 0;
        const overlappingConcerns = bestProduct.skinConcerns?.filter(concern =>
            userConcerns.includes(concern)
        ) || [];

        if (overlappingConcerns.length > 0) {
            const concernNames = overlappingConcerns.map(concern => {
                const concernInfo = SkinConcerns.find(c => c.value === concern);
                return concernInfo?.title || concern;
            }).join(', ');

            if (parts.length > 1) {
                parts.push(`and addresses your concerns like **${concernNames}**`);
            } else {
                parts.push(`it addresses your concerns like **${concernNames}**`);
            }
        } else if (hasNoConcerns) {
            // User has no specific concerns, mention general skin health
            if (parts.length > 1) {
                parts.push(`and helps maintain **overall skin balance and health**`);
            } else {
                parts.push(`it helps maintain **overall skin balance and health**`);
            }
        }

        // Check avoided sensitivities
        const userSensitivities = userSkinInfo.sensitivities || [];
        const hasNoSensitivities = userSensitivities.length === 1 && userSensitivities[0] === 0;
        const productSensitivities = bestProduct.sensitivities || [];
        const avoidedAllergens = userSensitivities.filter(sensitivity =>
            !productSensitivities.includes(sensitivity) && sensitivity !== 0
        );

        if (avoidedAllergens.length > 0 && !hasNoSensitivities) {
            const allergenNames = avoidedAllergens.map(allergen => {
                const allergenInfo = CommonAllergens.find(a => a.value === allergen);
                return allergenInfo?.title || allergen;
            }).join(', ');

            const connector = parts.length > 1 ? '. It also' : 'it';
            parts.push(`${connector} avoids **${allergenNames}**, which you're sensitive to`);
        }

        // Add product type info if available
        if (bestProduct.productType) {
            parts.push(`. This **${bestProduct.productType}** is also known to have good compatibility for people with your skin profile`);
        }

        // Join parts together
        if (parts.length === 1) {
            return parts[0] + ' it includes targeted ingredients for your skin profile. Check the product page for individual ingredient breakdowns.';
        }

        return parts.join(' ') + '. Check the product page for individual ingredient breakdowns.';
    }, [bestProduct, userData])

    const RatingEffect = bestProduct?.safetyScore >= 70 ? Shimmer : View;

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
                edges={['top']}
            >
                <AnalysisScreenCategoryScreenHeader
                    categoryName={categoryName}
                />

                <ScrollView
                    contentContainerStyle={styles.tabScrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* <View
                        style={styles.itemContainer}
                    >
                        <DefaultText
                            style={styles.title}
                        >
                            {categoryName}s
                        </DefaultText>
                        <DefaultText
                            style={styles.text}
                        >
                            {category.description}
                        </DefaultText>
                    </View>

                    <View style={styles.separator} /> */}

                    <View
                        style={styles.itemContainer}
                    >
                        <DefaultText
                            style={styles.caption}
                        >
                            Why Do I Need a{isVowel(categoryName.charAt(0)) && 'n'} {categoryName}?
                        </DefaultText>

                        <DefaultText
                            style={styles.text}
                        >
                            {category.whyThisCategory}
                        </DefaultText>
                    </View>

                    <View style={styles.separator} />

                    <View
                        style={styles.itemContainer}
                    >
                        <DefaultText
                            style={styles.caption}
                        >
                            Recommended {categoryName}
                        </DefaultText>

                        <DefaultText
                            style={styles.text}
                        >
                            Below is the best {categoryName.toLowerCase()} we’ve found for your skin profile. {alternatesAvailable && 'If it’s not what you’re looking for, check out the alternative options.'}
                        </DefaultText>
                    </View>

                    {/* <RoutineScreenRoutineProduct
                        productInfo={bestProduct}
                        onPress={() => navigation.navigate('Product', {
                            productId: bestProduct?.id
                        })}
                        endAdornment={
                            <Ionicons
                                name='chevron-forward'
                                size={24}
                                color={colors.text.secondary}
                            />
                        }
                    /> */}

                    <Pressable
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        onPress={() => navigation.navigate('Product', {
                            productId: bestProduct?.id
                        })}
                    >
                        <Animated.View
                            style={{
                                ...styles.enlargedCardContainer,
                                transform:[{scale}]
                            }}
                        >
                            <Image
                                style={styles.imageContainer}
                                source={{uri:bestProduct?.imageUrl}}
                                resizeMode='contain'
                            />

                            <RatingEffect
                                style={{
                                    width:180,
                                    borderRadius:64,
                                    marginBottom:12,
                                    alignItems:'center',
                                    marginHorizontal:'auto',
                                }}
                            >
                                <DefaultText
                                    style={{
                                        ...styles.ratingPill,
                                        backgroundColor:bestProductRatingInfo.color,
                                    }}
                                >
                                    {bestProduct?.safetyScore ?? 100}/100 ({bestProductRatingInfo.name})
                                </DefaultText>
                            </RatingEffect>

                            <View
                                style={{
                                    gap:8
                                }}
                            >
                                <DefaultText
                                    style={styles.enlargedCardTitle}
                                >
                                    {bestProduct?.name}
                                </DefaultText>

                                <DefaultText
                                    style={styles.subtext}
                                >
                                    {bestProduct?.brand} · {categoryName}
                                </DefaultText>
                            </View>

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
                                    borderRadius:18,
                                    color:isProductInRoutine ? colors.text.secondary : colors.text.primary,
                                    backgroundColor:isProductInRoutine ? colors.accents.stroke : colors.background.primary
                                }}
                                onPress={isProductInRoutine ? null : () => navigation.navigate('AddProductModal', {
                                    screen:'AddProductEdit',
                                    params: {
                                        productId: bestProduct?.id,
                                        mode: 'add'
                                    }
                                })}
                            />
                        </Animated.View>
                    </Pressable>

                    {goodMatchDescription && (
                        <View
                            style={styles.matchContainer}
                        >
                            <View
                                style={styles.flexContainer}
                            >
                                <Ionicons
                                    name='sparkles'
                                    color={colors.background.secondary}
                                    size={16}
                                />
                                <DefaultText
                                    style={styles.matchTitle}
                                >
                                    Good match
                                </DefaultText>

                                <Ionicons
                                    size={24}
                                    name='information-circle-outline'
                                    color={colors.text.lighter}
                                    style={{
                                        marginLeft:'auto'
                                    }}
                                />
                            </View>

                            <BoldText style={styles.matchText}>
                                {goodMatchDescription}
                            </BoldText>
                        </View>
                    )}

                    {alternatesAvailable &&
                        <>
                            <View style={styles.separator} />
                            <View
                                style={styles.itemContainer}
                            >
                                <DefaultText
                                    style={styles.alternativeCaption}
                                >
                                    Product Alternatives
                                </DefaultText>
                                <ScrollView
                                    contentContainerStyle={{
                                        gap:16,
                                        flexDirection:'row',
                                        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
                                    }}
                                    style={{
                                        marginHorizontal:-DefaultStyles.container.paddingHorizontal
                                    }}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                >
                                    {categoryProducts.slice(1).map((cp, idx) => {
                                        const product = products?.[cp];

                                        return (
                                            <ProductCardItem
                                                key={idx}
                                                product={product}
                                                columns={2.5}
                                            />
                                        )
                                    })}
                                </ScrollView>
                            </View>
                        </>
                    }
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

export default AnalysisScreenCategoryScreen;

const styles = StyleSheet.create({
    enlargedCardContainer: {
        padding:DefaultStyles.container.paddingBottom,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        borderRadius:16,
        gap:16,
    },
    enlargedCardTitle: {
        fontSize:DefaultStyles.text.caption.xlarge,
        fontWeight:'700',
        marginHorizontal:'auto',
        textAlign:'center',
        color:colors.text.secondary
    },
    imageContainer: {
        width:175,
        borderWidth:2,
        borderColor:colors.accents.stroke,
        borderRadius:16,
        aspectRatio:1,
        padding:8,
        marginHorizontal:'auto',
    },
    matchContainer: {
        borderWidth:1.5,
        borderColor:colors.background.secondary,
        backgroundColor:lighten(colors.accents.success, .95),
        flex:1,
        borderRadius:16,
        padding:DefaultStyles.container.paddingBottom,
        gap:16,
    },
    matchTitle: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'700',
        color:colors.background.secondary
    },
    matchText: {
        fontSize:14,
        fontWeight:'400',
        color:colors.text.secondary,
        lineHeight:20
    },
    subtext: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        fontWeight:'500',
        textAlign:'center',
        marginHorizontal:'auto'
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:8,
    },
    tabScrollContainer: {
        paddingVertical:DefaultStyles.container.paddingBottom,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        paddingBottom:60,
        gap:16,
    },
    iconButton: {
        width:48,
        height:48,   
    },
    itemContainer: {
        flex:1,
        gap:12,
    },
    caption: {
        fontWeight:'700',
        fontSize:DefaultStyles.text.caption.xlarge,
        color:colors.text.secondary
    },
    alternativeCaption: {
        fontWeight:'700',
        fontSize:DefaultStyles.text.caption.xlarge,
        color:colors.text.secondary,
        marginBottom:6
    },
    text: {
        fontWeight:'500',
        fontSize:14,
        color:colors.text.darker,
        alignSelf:'flex-start',
        lineHeight:20
    },
    separator: {
        flex:1,
        height:1.5,
        minHeight:1.5,
        maxHeight:1.5,
        backgroundColor:colors.accents.stroke,
        marginVertical: 4,
    },
    categoryPill: {
        paddingHorizontal:16,
        paddingVertical:8,
        borderRadius:16,
        fontSize:DefaultStyles.text.caption.xsmall,
        fontWeight:'600',
        color:colors.text.secondary
    },
    ratingPill: {
        width:175,
        borderRadius:64,
        textAlign:'center',
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.small,
        paddingVertical:12,
        color:'#fff',
    }
})