import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import DefaultText from 'components/Text/DefaultText';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import { getProductCategory } from 'utils/products';
import Skeleton from 'components/Common/Skeleton';
import { ProductSafetyRatings } from 'constants/products';
import { getSafetyRating } from '../../utils/routine';

const CompressedProductItem = ({
    productInfo,
    onPress,
    loading = false
}) => {
    const productCategory = getProductCategory(productInfo);
    
    const scoreColor = getSafetyRating(productInfo?.safetyScore).color;

    if (loading || !productInfo) {
        return (
            <View style={styles.container}>
                <Skeleton width={50} height={50} borderRadius={8} />
                <View style={styles.textContainer}>
                    <Skeleton width={120} height={16} />
                    <Skeleton width={80} height={12} />
                </View>
            </View>
        );
    }

    return (
        <Pressable 
            style={styles.container} 
            onPress={onPress}
            android_ripple={{ color: colors.background.secondary }}
        >
            <Image
                source={{ uri: productInfo?.imageUrl }}
                style={styles.productImage}
            />
            
            <View style={styles.textContainer}>
                <View style={styles.titleContainer}>
                    <View style={styles.titleTextContainer}>
                        <DefaultText 
                            numberOfLines={1}
                            style={styles.productTitle}
                        >
                            {productInfo.name}
                        </DefaultText>
                    </View>

                    <View style={styles.metaContainer}>
                        <DefaultText 
                            style={styles.categoryText}
                            numberOfLines={1}
                        >
                            {productCategory}
                        </DefaultText>
                        <DefaultText style={styles.separator}>•</DefaultText>
                        <DefaultText 
                            style={styles.brandText}
                            numberOfLines={1}
                        >
                            {productInfo.brand}
                        </DefaultText>
                    </View>
                </View>
                {(productInfo?.safetyScore !== undefined && productInfo?.safetyScore !== null) && (
                    <View style={[styles.scorePill, { backgroundColor: scoreColor }]}>
                        <DefaultText style={styles.scoreText}>
                            {Math.round(productInfo.safetyScore)}/100
                        </DefaultText>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width:'100%',
        backgroundColor:'red',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical:DefaultStyles.container.paddingBottom,
        gap: 14,
        backgroundColor: colors.background.screen,
    },
    productImage: {
        width: 40,
        height: 40,
        borderRadius:8,
        resizeMode:'contain',
    },
    textContainer: {
        flex: 1,
        flexDirection:'row',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flexDirection: 'column',
        height:40,
        justifyContent:'flex-start',
        marginRight:'auto',
        width:212,
    },
    titleTextContainer: {
        marginBottom:7,
    },
    scorePill: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        fontSize: DefaultStyles.text.caption.xsmall,
        fontWeight: '600',
        color: '#fff',
    },
    productTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    brandText: {
        fontSize: DefaultStyles.text.caption.xsmall,
        color: colors.text.lighter,
        fontWeight: '500',
    },
    separator: {
        fontSize: DefaultStyles.text.caption.xsmall,
        color: colors.text.lighter,
    },
    categoryText: {
        fontSize: DefaultStyles.text.caption.xsmall,
        color: colors.text.lighter,
        fontWeight: '500',
    },
});

export default CompressedProductItem;