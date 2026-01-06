import {Ionicons, FontAwesome6, Entypo} from '@expo/vector-icons'
import ProductCardItem from 'components/Products/ProductCardItem'
import colors from 'config/colors'
import DefaultStyles from 'config/styles'
import useScalePressAnimation from 'hooks/useScalePressAnimation'
import * as Haptics from 'expo-haptics'
import { memo, useMemo, useState, useCallback, useEffect } from 'react'
const { default: DefaultText } = require("components/Text/DefaultText")
const { View, StyleSheet, ScrollView, Animated, Pressable } = require("react-native")

const MAX_DISPLAYED_PRODUCTS = 10;
const INITIAL_LOAD_COUNT = 3;
const LOAD_MORE_THRESHOLD = 0.8; // Load more when 80% of current item is visible

const ExploreScreenSection = memo(({
    title,
    description,
    products,
    onExpand,
    isLoading = false,
    style,
    contentContainerStyle,
    scrollContainerStyle,
}) => {
    const [visibleProductCount, setVisibleProductCount] = useState(INITIAL_LOAD_COUNT);

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:150,
    })

    // Reset visible count when products array changes
    useEffect(() => {
        setVisibleProductCount(INITIAL_LOAD_COUNT);
    }, [products]);

    // Memoize displayed products based on lazy loading
    const displayedProducts = useMemo(() => {
        const maxToShow = Math.min(visibleProductCount, MAX_DISPLAYED_PRODUCTS, products.length);
        return products.slice(0, maxToShow);
    }, [products, visibleProductCount]);

    // Handle scroll events to detect when to load more products
    const handleScroll = useCallback((event) => {
        const { contentOffset, layoutMeasurement } = event.nativeEvent;
        const scrollPosition = contentOffset.x;
        const scrollViewWidth = layoutMeasurement.width;
        
        // Calculate approximate product width (assuming consistent sizing)
        // Based on columns={2.2} in ProductCardItem, each product takes up about 1/2.2 of screen width
        const screenWidth = scrollViewWidth;
        const productWidth = (screenWidth - (DefaultStyles.container.paddingHorizontal * 2)) / 2.2 + 16; // including gap
        
        // Calculate how many products should be visible based on scroll position
        // Add 1 to start loading the next product as soon as current one starts becoming visible
        const productsInView = Math.floor(scrollPosition / productWidth) + Math.ceil(scrollViewWidth / productWidth) + 1;
        
        // Load more products if we need them and haven't reached the limit
        const shouldLoadMore = productsInView > visibleProductCount && 
                              visibleProductCount < Math.min(MAX_DISPLAYED_PRODUCTS, products.length);
        
        if (shouldLoadMore) {
            setVisibleProductCount(prev => Math.min(
                Math.max(prev, productsInView), 
                MAX_DISPLAYED_PRODUCTS, 
                products.length
            ));
        }
    }, [visibleProductCount, products.length]);

    if (displayedProducts?.length) {
        return (
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onExpand}
            >
                <View
                    style={{
                        ...styles.container,
                        ...style
                    }}
                >
                    <View
                        style={{
                            gap:8,
                        }}
                    >
                        <Animated.View
                            style={[
                                styles.flexContainer,
                                {transform:[{scale}]}
                            ]}
                        >
                            <DefaultText
                                style={styles.title}
                            >
                                {title}
                            </DefaultText>

                            <DefaultText
                                style={styles.text}
                            >
                                See All
                            </DefaultText>
                            <Entypo name="chevron-right" size={20} color={colors.background.primary} />
                        </Animated.View>
                        
                        <DefaultText
                            style={styles.caption}
                        >
                            {description}
                        </DefaultText>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            ...styles.productContainer,
                            ...contentContainerStyle
                        }}
                        style={{
                            marginHorizontal:-DefaultStyles.container.paddingHorizontal,
                            ...scrollContainerStyle,
                        }}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {isLoading ? (
                            // Show skeleton loading cards
                            Array.from({ length: INITIAL_LOAD_COUNT }).map((_, idx) => (
                                <ProductCardItem
                                    key={`skeleton-${idx}`}
                                    isLoading={true}
                                    columns={2.25}
                                />
                            ))
                        ) : (
                            displayedProducts.map((product, idx) => (
                                <ProductCardItem
                                    key={product.id || idx}
                                    product={product}
                                    columns={2.25}
                                />
                            ))
                        )}
                    </ScrollView>
                </View>
            </Pressable>
        )
    }
});

export default ExploreScreenSection;

const styles = StyleSheet.create({
    container: {
        gap:16,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:4,
    },
    productContainer: {
        gap:16,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'500',
        color:colors.background.primary,
        marginLeft:'auto',
    },
    seeMoreCard: {
        height: '100%',
        maxWidth:150,
        gap: 16,
    },
    seeMoreContent: {
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.background.primary,
        backgroundColor: colors.background.light,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        width:'100%',
        height:'100%'
    },
    seeMoreIcon: {
        opacity: 0.8,
    },
    seeMoreText: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '600',
        color: colors.background.primary,
        textAlign: 'center',
    },
    seeMoreSubtext: {
        fontSize: DefaultStyles.text.caption.xsmall,
        fontWeight: '500',
        color: colors.text.lighter,
        textAlign: 'center',
    }
})