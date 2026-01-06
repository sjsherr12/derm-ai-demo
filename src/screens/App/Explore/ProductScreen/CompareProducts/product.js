import { Animated, Dimensions, Image, Pressable, StyleSheet, View } from "react-native"
import DefaultStyles from "../../../../../config/styles";
import colors from "../../../../../config/colors";
import DefaultButton from "../../../../../components/Buttons/DefaultButton";
import IconButton from "../../../../../components/Buttons/IconButton";
import DefaultText from "../../../../../components/Text/DefaultText";
import { ProductSafetyRatings, SkincareProductCategories } from "../../../../../constants/products";
import { getSafetyRating, getSkinHarshness } from "../../../../../utils/routine";
import Shimmer from "../../../../../components/Graphics/Shimmer";
import useScalePressAnimation from "../../../../../hooks/useScalePressAnimation";
import { useNavigation } from "@react-navigation/native";
import GradientProgressBar from "../../../../../components/Graphics/SignUp/GradientProgressBar";
import { getIngredientSafetyRating } from "../../../../../utils/ingredients";
import { lighten } from "../../../../../utils/lighten";
import * as Haptics from 'expo-haptics'
import { convertSkinConcernSeverityIdToName, getSeverityRating } from "../../../../../utils/analysis";
import { CommonAllergens, SkinConcerns, SkinTypes } from "../../../../../constants/signup";
import {Feather, Ionicons} from '@expo/vector-icons'
import Skeleton from "../../../../../components/Common/Skeleton";
import { IngredientSafetyRatings } from "../../../../../constants/ingredients";

const ItemPill = ({
    color,
    text
}) => {
    const safeColor = color || colors.accents.stroke;

    return (
        <View
            style={{
                gap:8,
                padding:8,
                paddingRight:32,
                borderRadius:64,
                flexDirection:'row',
                alignItems:'center',
                overflow:'hidden',
                backgroundColor:lighten(safeColor, .95)
            }}
        >
            <View
                style={{
                    width:12,
                    height:12,
                    borderRadius:64,
                    backgroundColor:safeColor,
                }}
            />

            <DefaultText
                numberOfLines={1}
                ellipsizeMode='tail'
                style={styles.subtext}
            >
                {text || 'Loading...'}
            </DefaultText>
        </View>
    )
}

const CompareProductsVerticalProductDisplay = ({
    product,
    loading,
    expanded,
    setExpanded,
    ingredients,
    ingredientsCutoff,
    onRemove
}) => {

    const navigation = useNavigation();
    const productCategoryName = SkincareProductCategories.find(category => category.value === product.category).title;
    const productSafetyScore = product?.safetyScore ?? 100
    const productSafetyInfo = getSafetyRating(productSafetyScore)
    const productSkinHarshness = getSkinHarshness(product?.skinHarshness) || { name: 'Unknown', color: colors.accents.stroke }
    const ingredientListLength = product?.ingredients?.length ?? ingredientsCutoff+1
    const ingredientsLeftToDisplay = ingredientListLength - ingredientsCutoff;
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:100,
    })

    // Calculate ingredient safety distribution
    const ingredientSafetyDistribution = IngredientSafetyRatings
        .sort((a, b) => b.value - a.value) // Sort from highest (Avoid=5) to lowest (Perfect=1)
        .map(rating => {
            const count = ingredients?.filter(ing => ing?.safetyScore === rating.value).length || 0;
            return {
                ...rating,
                count,
                proportion: ingredients?.length > 0 ? count / ingredients.length : 0
            };
        })
        .filter(dist => dist.count > 0); // Only show bars for safety levels that exist

    return (
        <View
            style={styles.container}
        >
            <DefaultButton
                title='Remove'
                onPress={onRemove}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                style={{
                    flex:1,
                    maxHeight:48,
                    borderRadius:64,
                    color:colors.text.secondary,
                    backgroundColor:colors.background.light,
                }}
                extraStyles={{
                    button: {
                        height:48,
                    },
                    text: {
                        fontSize:DefaultStyles.text.caption.small,
                        fontWeight:'600'
                    }
                }}
            />

            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => navigation.navigate('Product', {
                    productId: product?.id
                })}
            >
                <Animated.View
                    style={{
                        gap:16,
                        transform:[{scale}]
                    }}
                >
                    <Image
                        source={{uri: product?.imageUrl}}
                        style={styles.imageContainer}
                        resizeMode='contain'
                    />

                    <View
                        style={{
                            gap:6
                        }}
                    >
                        <DefaultText
                            style={styles.caption}
                        >
                            {product?.brand}
                        </DefaultText>

                        <DefaultText
                            style={{
                                ...styles.subtext,
                                color:colors.text.lighter,
                            }}
                        >
                            {productCategoryName}
                        </DefaultText>

                        <DefaultText
                            style={styles.title}
                            numberOfLines={2}
                        >
                            {product?.name}
                        </DefaultText>
                    </View>
                </Animated.View>
            </Pressable>

            <DefaultText
                style={{
                    ...styles.safetyPill,
                    backgroundColor:productSafetyInfo.color
                }}
            >
                {productSafetyScore}/100 ({productSafetyInfo.name})
            </DefaultText>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    Ingredients safety
                </DefaultText>

                <View
                    style={{
                        flexDirection:'row',
                        alignItems:'center',
                        gap:2
                    }}
                >
                    {ingredientSafetyDistribution.length > 0 ? (
                        ingredientSafetyDistribution.map((dist, idx) => (
                            <View
                                key={idx}
                                style={{
                                    flex: dist.proportion,
                                    backgroundColor: dist.color,
                                    height: 10,
                                    borderRadius: 64,
                                }}
                            />
                        ))
                    ) : (
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: colors.accents.stroke,
                                height: 10,
                                borderRadius: 64,
                            }}
                        />
                    )}
                </View>
                
                <View
                    style={{
                        ...styles.itemContainer,
                        marginTop:4,
                    }}
                >
                    {loading ? (
                        <>
                            {Array.from({length:3}).map((_, idx) => (
                                <Skeleton
                                    key={idx}
                                    height={30}
                                    borderRadius={64}
                                    style={{
                                        flex:1
                                    }}
                                />
                            ))}
                        </>
                    ) : (
                        <>
                            {ingredients?.slice(0, expanded ? ingredients?.length : ingredientsCutoff)?.filter(ing => ing)?.map((ing, idx) => {
                                const safetyInfo = getIngredientSafetyRating(ing)

                                return (
                                    <ItemPill
                                        key={idx}
                                        color={safetyInfo?.color}
                                        text={ing?.name}
                                    />
                                )
                            })}
                        </>
                    )}

                    <DefaultButton
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        title={loading ? 'Loading...' : expanded ? 'Show less' : `Show ${(ingredientsLeftToDisplay)} more`}
                        onPress={loading ? null : () => setExpanded(prev => !prev)}
                        style={{
                            height:36,
                            borderRadius:64,
                        }}
                        extraStyles={{
                            button: {
                                height:36
                            },
                            text: {
                                fontSize:DefaultStyles.text.caption.xsmall
                            }
                        }}
                    />
                </View>
            </View>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    Skin harshness
                </DefaultText>

                <ItemPill
                    color={productSkinHarshness.color}
                    text={productSkinHarshness.name}
                />
            </View>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    Concern focuses
                </DefaultText>

                {Object.entries(product?.concernWeights)?.sort((a, b) => a[0].localeCompare(b[0]))?.map(([key, weighting], idx) => (
                    <View
                        key={idx}
                        style={{
                            borderRadius:8,
                            borderWidth:1.5,
                            gap:8,
                            borderColor:colors.accents.stroke,
                            padding:8,
                        }}
                    >
                        <DefaultText
                            style={styles.subtext}
                        >
                            {convertSkinConcernSeverityIdToName(key)} ({weighting*100}%)
                        </DefaultText>
                        <GradientProgressBar
                            progress={weighting}
                            height={5}
                            colorA={colors.background.primary}
                            colorB={colors.background.primary}
                        />
                    </View>
                ))}
            </View>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    Targeted Concerns
                </DefaultText>

                <View
                    style={styles.itemContainer}
                >
                    {product?.skinConcerns?.sort().map((concern, idx) => {
                        const concernInfo = SkinConcerns.find(skc => skc.value === concern);

                        return (
                            <View
                                key={idx}
                                style={{
                                    gap:8,
                                    padding:8,
                                    backgroundColor:lighten(colors.accents.error, .95),
                                    borderRadius:64,
                                    flexDirection:'row',
                                    alignItems:'center'
                                }}
                            >
                                <Feather
                                    name='target'
                                    size={12}
                                    color={colors.text.primary}
                                    backgroundColor={colors.accents.error}
                                    padding={4}
                                    borderRadius={64}
                                />

                                <DefaultText
                                    style={styles.subtext}
                                >
                                    {concernInfo?.displayLabel ?? 'Skin concern'}
                                </DefaultText>
                            </View>
                        )
                    })}
                </View>
            </View>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    Best Skin Types
                </DefaultText>

                <View
                    style={styles.itemContainer}
                >
                    {product?.skinTypes?.sort().map((skinType, idx) => {
                        const skinTypeInfo = SkinTypes.find(st => st.value === skinType);

                        return (
                            <View
                                key={idx}
                                style={{
                                    gap:8,
                                    padding:8,
                                    backgroundColor:lighten(colors.background.primary, .95),
                                    borderRadius:64,
                                    flexDirection:'row',
                                    alignItems:'center'
                                }}
                            >
                                <Ionicons
                                    name={skinTypeInfo.icon}
                                    size={12}
                                    color={colors.text.primary}
                                    backgroundColor={colors.background.primary}
                                    padding={4}
                                    borderRadius={64}
                                />

                                <DefaultText
                                    style={styles.subtext}
                                >
                                    {skinTypeInfo?.displayLabel ?? 'Skin type'}
                                </DefaultText>
                            </View>
                        )
                    })}
                </View>
            </View>

            {product?.sensitivities?.length > 0 && (
                <View
                    style={styles.itemContainer}
                >
                    <DefaultText
                        style={styles.caption}
                    >
                        Sensitive Items
                    </DefaultText>

                    {product?.sensitivities?.sort().map((sensitivity, idx) => {
                        const sensitiveInfo = CommonAllergens.find(ca => ca.value === sensitivity);

                        return (
                            <View
                                key={idx}
                                style={{
                                    gap:8,
                                    padding:8,
                                    backgroundColor:lighten(colors.accents.warning, .95),
                                    borderRadius:64,
                                    flexDirection:'row',
                                    alignItems:'center'
                                }}
                            >
                                <Ionicons
                                    name='alert-circle-outline'
                                    size={12}
                                    color={colors.text.primary}
                                    backgroundColor={colors.accents.warning}
                                    padding={4}
                                    borderRadius={64}
                                />

                                <DefaultText
                                    style={styles.subtext}
                                >
                                    {sensitiveInfo?.title ?? 'Sensitive item'}
                                </DefaultText>
                            </View>
                        )
                    })}
                </View>
            )}
        </View>
    )
}

export default CompareProductsVerticalProductDisplay;

const styles = StyleSheet.create({
    container: {
        maxWidth:250,
        padding:DefaultStyles.container.paddingHorizontal,
        paddingTop:0,
        gap:16,
        borderRightWidth:1.5,
        borderRightColor:colors.accents.stroke,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        gap:12,
    },
    iconButton: {
        width:48,
        height:48,
        backgroundColor:colors.background.light,
        borderRadius:64,
    },
    imageContainer: {
        width:200,
        aspectRatio:1,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        padding:4,
    },
    itemContainer: {
        gap:4
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600',
        color:colors.text.darker,
    },
    subtext: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
    },
    title: {
        marginTop:4,
        marginBottom:-4,
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'600',
        color:colors.text.dark,
        minHeight:45,
    },
    safetyPill: {
        paddingHorizontal:16,
        paddingVertical:12,
        textAlign:'center',
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.primary,
        borderRadius:64,
    }
})