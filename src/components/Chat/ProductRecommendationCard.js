import { View, StyleSheet, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import DefaultText from '../Text/DefaultText';
import colors from '../../config/colors';
import DefaultStyles from '../../config/styles';
import { Ionicons } from '@expo/vector-icons';
import useScalePressAnimation from '../../hooks/useScalePressAnimation';
import { useNavigation } from '@react-navigation/native';

const ProductRecommendationCard = ({ productId, style }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    const { handlePressIn, handlePressOut, scale } = useScalePressAnimation({
        minScale: 0.98,
        maxScale: 1,
        duration: 150,
    });

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;

            setLoading(true);
            setError(null);

            try {
                const db = getFirestore();
                const productDoc = await getDoc(doc(db, 'products', productId));

                if (productDoc.exists()) {
                    setProduct({
                        id: productDoc.id,
                        ...productDoc.data()
                    });
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handlePress = () => {
        if (product) {
            navigation.navigate('ProductScreen', { productId: product.id });
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, style]}>
                <Ionicons name="hourglass" size={20} color={colors.text.secondary} />
                <DefaultText style={styles.loadingText}>Loading product...</DefaultText>
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={[styles.container, styles.errorContainer, style]}>
                <Ionicons name="warning" size={20} color={colors.accents.danger} />
                <DefaultText style={styles.errorText}>{error || 'Product unavailable'}</DefaultText>
            </View>
        );
    }

    return (
        <Pressable
            style={[styles.container, style]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            android_ripple={{ color: colors.background.primary + '20' }}
        >
            <View style={[styles.content, { transform: [{ scale }] }]}>
                <View style={styles.header}>
                    <DefaultText style={styles.productName} numberOfLines={2}>
                        {product.name}
                    </DefaultText>
                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.background.primary}
                    />
                </View>

                <DefaultText style={styles.brand} numberOfLines={1}>
                    {product.brand}
                </DefaultText>

                {product.price && (
                    <DefaultText style={styles.price}>
                        ${product.price.toFixed(2)}
                    </DefaultText>
                )}

                {product.keyIngredients && product.keyIngredients.length > 0 && (
                    <View style={styles.ingredientsContainer}>
                        <DefaultText style={styles.ingredientsLabel}>Key Ingredients:</DefaultText>
                        <DefaultText style={styles.ingredients} numberOfLines={2}>
                            {product.keyIngredients.slice(0, 3).join(', ')}
                            {product.keyIngredients.length > 3 && '...'}
                        </DefaultText>
                    </View>
                )}

                {product.rating && (
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color={colors.accents.warning} />
                        <DefaultText style={styles.rating}>
                            {product.rating.toFixed(1)}
                        </DefaultText>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const ProductRecommendationList = ({ productIds, style }) => {
    if (!productIds || productIds.length === 0) {
        return null;
    }

    return (
        <View style={[styles.listContainer, style]}>
            <DefaultText style={styles.listTitle}>
                Recommended Products
            </DefaultText>
            {productIds.map((productId, index) => (
                <ProductRecommendationCard
                    key={productId}
                    productId={productId}
                    style={[styles.listItem, index === productIds.length - 1 && styles.lastItem]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background.screen,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        padding: DefaultStyles.container.paddingTop,
        marginVertical: 4,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    productName: {
        flex: 1,
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '600',
        color: colors.text.primary,
        marginRight: 8,
    },
    brand: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '500',
        color: colors.text.secondary,
        marginBottom: 6,
    },
    price: {
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '700',
        color: colors.background.primary,
        marginBottom: 8,
    },
    ingredientsContainer: {
        marginBottom: 6,
    },
    ingredientsLabel: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: 2,
    },
    ingredients: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        lineHeight: 16,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    rating: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
        minHeight: 60,
        opacity: 0.7,
    },
    loadingText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
        minHeight: 60,
        backgroundColor: colors.accents.danger + '10',
        borderColor: colors.accents.danger + '30',
    },
    errorText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.accents.danger,
        fontStyle: 'italic',
    },
    listContainer: {
        marginTop: 12,
    },
    listTitle: {
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '600',
        color: colors.background.primary,
        marginBottom: 8,
    },
    listItem: {
        marginBottom: 8,
    },
    lastItem: {
        marginBottom: 0,
    },
});

export default ProductRecommendationCard;
export { ProductRecommendationList };