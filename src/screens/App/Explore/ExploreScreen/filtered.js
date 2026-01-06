import ProductCardItem from "components/Products/ProductCardItem";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import {MaterialIcons} from '@expo/vector-icons'
import { useState, useEffect } from "react";

const INITIAL_LOAD_COUNT = 20; // Start with more for better UX
const LOAD_MORE_COUNT = 20;

const ExploreScreenFilteredItems = ({
    filteredProducts,
    filteredProductsLoading,
    onScroll,
    safeAreaBottomPadding = 100, // fallback to old default
}) => {
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);

    // Reset displayed products when filteredProducts changes
    useEffect(() => {
        if (filteredProducts.length > 0) {
            const initialProducts = filteredProducts.slice(0, INITIAL_LOAD_COUNT);
            setDisplayedProducts(initialProducts);
            setHasReachedEnd(initialProducts.length >= filteredProducts.length);
        } else {
            setDisplayedProducts([]);
            setHasReachedEnd(true);
        }
        setIsLoadingMore(false);
    }, [filteredProducts]);

    const loadMoreProducts = () => {
        if (isLoadingMore || hasReachedEnd || filteredProductsLoading || displayedProducts.length >= filteredProducts.length) return;

        setIsLoadingMore(true);
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            const currentCount = displayedProducts.length;
            const nextProducts = filteredProducts.slice(0, currentCount + LOAD_MORE_COUNT);
            
            setDisplayedProducts(nextProducts);
            setHasReachedEnd(nextProducts.length >= filteredProducts.length);
            setIsLoadingMore(false);
        }, 200);
    };

    const renderProductItem = ({ item }) => (
        <View style={{ width: '48%' }}>
            <ProductCardItem
                product={item}
                columns={2}
            />
        </View>
    );

    const renderLoadingPlaceholders = () => (
        <View style={styles.productsContainer}>
            {Array.from({ length: INITIAL_LOAD_COUNT }).map((_, idx) => (
                <View key={idx} style={{ width: '48%' }}>
                    <ProductCardItem
                        isLoading={true}
                        columns={2}
                    />
                </View>
            ))}
        </View>
    );

    const renderFooter = () => {
        if (isLoadingMore) {
            return (
                <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator
                        size="small"
                    />
                    <DefaultText style={styles.loadingMoreText}>
                        Loading more products...
                    </DefaultText>
                </View>
            );
        }
        
        return null;
    };

    if (filteredProductsLoading) {
        return (
            <View style={styles.container}>
                {renderLoadingPlaceholders()}
            </View>
        );
    }

    if (filteredProducts.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.notFoundContainer}>
                    <MaterialIcons
                        size={48}
                        style={styles.icon}
                        name='search-off'
                    />
                    <DefaultText style={styles.title}>
                        No Products Found
                    </DefaultText>
                    <DefaultText style={styles.caption}>
                        Try adjusting your filters to see more results.
                    </DefaultText>
                </View>
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.resultsContainer}>
            <DefaultText style={styles.endOfListText}>
                {filteredProducts.length} Results
            </DefaultText>
        </View>
    );

    return (
        <FlatList
            data={displayedProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[
                styles.flatListContent,
                { paddingBottom: safeAreaBottomPadding }
            ]}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            onScroll={onScroll}
            scrollEventThrottle={16}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            style={styles.flatList}
        />
    )
}

export default ExploreScreenFilteredItems;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
        paddingTop: 0,
    },
    flatList: {
        flex: 1,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
    },
    flatListContent: {
        paddingTop: 20,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    productsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    notFoundContainer: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.accents.stroke,
        justifyContent: 'center',
        borderRadius: 16,
        alignItems: 'center',
        gap: 8,
        padding: DefaultStyles.container.paddingHorizontal,
        marginTop:22
    },
    icon: {
        color: colors.text.lighter,
    },
    title: {
        fontSize: DefaultStyles.text.caption.large,
        color: colors.text.lighter,
        fontWeight: '600',
        textAlign: 'center',
    },
    caption: {
        fontSize: DefaultStyles.text.caption.xsmall,
        color: colors.text.lighter,
        textAlign: 'center',
    },
    loadingMoreContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    loadingMoreText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.lighter,
        marginLeft: 8,
    },
    endOfListContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    endOfListText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.lighter,
        fontStyle: 'italic',
    },
    resultsContainer: {
        paddingBottom: 18,
    },
})