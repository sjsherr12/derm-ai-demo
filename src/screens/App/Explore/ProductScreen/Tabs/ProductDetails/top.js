import colors from "config/colors";
import {Ionicons} from '@expo/vector-icons'
import Shimmer from "components/Graphics/Shimmer";
import DefaultText from "components/Text/DefaultText";
import DefaultStyles from "config/styles";
import React, { useMemo } from "react";
import { getSafetyRating } from "utils/routine";
import useScalePressAnimation from "../../../../../../hooks/useScalePressAnimation";
import { useNavigation } from "@react-navigation/native";
import { SkincareProductCategories } from "../../../../../../constants/products";
const { Image, View, StyleSheet, Pressable, Animated } = require("react-native")

const ProductScreenProductDetailsTabTopSection = ({
    product,
    onTextLayout,
}) => {
    const productImage = product?.imageUrl;
    const navigation = useNavigation();
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:100,
    })
    const handlePressImage = () => navigation.navigate('FullProductImage', {
        imageUri: productImage
    })
    const safetyRatingInfo = getSafetyRating(product?.safetyScore)
    const RatingEffect = product?.safetyScore >= 70 ? Shimmer : View;

    return (
        <View style={styles.container}>
            {productImage ? (
                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePressImage}
                >
                    <Animated.View
                        style={{
                            transform:[{scale}]
                        }}
                    >
                        <Image
                            source={{uri: product.imageUrl}}
                            style={styles.imageContainer}
                            resizeMode='contain'
                        />
                    </Animated.View>
                </Pressable>
            ) : (
                <View
                    style={[
                        styles.imageContainer,
                        styles.imagePlaceholder
                    ]}
                >
                    <Ionicons name="image-outline" size={64} color={colors.text.lighter} />
                </View>
            )}

            <RatingEffect
                style={{
                    minWidth:175,
                    borderRadius:64,
                    marginBottom:12,
                    alignItems:'center',
                }}
            >
                <DefaultText
                    style={[
                        styles.safetyRatingText,
                        {
                            backgroundColor: safetyRatingInfo?.color || colors.accents.stroke,
                        }
                    ]}
                >
                    {product?.safetyScore || 0}/100 ({safetyRatingInfo?.name || 'Unknown'})
                </DefaultText>
            </RatingEffect>

            <DefaultText
                style={[
                    styles.title,
                    {
                        textAlign:'center',
                        marginHorizontal:DefaultStyles.container.paddingHorizontal,
                    }
                ]}
                onTextLayout={onTextLayout}
            >
                {product?.name || '...'}
            </DefaultText>

            <DefaultText style={styles.caption}>
                {SkincareProductCategories.find(spc => spc.value === product?.category)?.title ?? 'Category'} · {product?.brand ?? ''}
            </DefaultText>
        </View>
    )
}

export default ProductScreenProductDetailsTabTopSection;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    safetyRatingText: {
        width:180,
        borderRadius:64,
        textAlign:'center',
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.small,
        paddingVertical:12,
        color:'#fff',
    },
    imageContainer: {
        width:180,
        borderWidth:2,
        borderColor:colors.accents.stroke,
        borderRadius:24,
        aspectRatio:1,
        padding:8,
    },
    imagePlaceholder: {
        aspectRatio: 1,
        backgroundColor: colors.background.screen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize:24,
        fontWeight:'700',
        color:colors.text.secondary,
        lineHeight:32,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'500',
        color:colors.text.lighter,
    },
})