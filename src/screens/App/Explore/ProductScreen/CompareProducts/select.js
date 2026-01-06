import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, FlatList, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import DefaultText from '../../../../../components/Text/DefaultText';
import IconButton from '../../../../../components/Buttons/IconButton';
import colors from '../../../../../config/colors';
import DefaultStyles from '../../../../../config/styles';
import { useData } from '../../../../../context/global/DataContext';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import CompressedProductItem from '../../../../../components/Products/CompressedProductItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEMS_PER_PAGE = 25;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const CompareProductsSelectScreen = ({ onProductSelect, onClose, excludedProductIds = [] }) => {
    const insets = useSafeAreaInsets();
    const { products, searchLocalProducts } = useData();

    const [searchTerm, setSearchTerm] = useState('');
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const searchInputRef = useRef(null);

    // Get all available products (filtered to exclude already compared products)
    const availableProducts = useMemo(() => {
        const allProducts = Object.values(products);

        // Create a Set of excluded product IDs for fast lookup
        const excludedIds = new Set(excludedProductIds);

        // Filter out already compared products
        const filtered = allProducts.filter(product => !excludedIds.has(product.id));

        // Sort by safety score descending
        return filtered.sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0));
    }, [products, excludedProductIds]);

    // Get filtered products based on search
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) {
            return availableProducts;
        }

        // Use local search with Infinity to get ALL results, then filter from available products
        const searchResults = searchLocalProducts(searchTerm.trim(), Infinity);
        const availableIds = new Set(availableProducts.map(p => p.id));

        return searchResults.filter(product => availableIds.has(product.id));
    }, [searchTerm, availableProducts, searchLocalProducts]);

    // Load more products (pagination)
    const loadMoreProducts = () => {
        if (isLoadingMore || hasReachedEnd) return;

        const nextPage = currentPage + 1;
        const endIndex = nextPage * ITEMS_PER_PAGE;

        // Check if we already have all products
        if (displayedProducts.length >= filteredProducts.length) {
            setHasReachedEnd(true);
            return;
        }

        setIsLoadingMore(true);

        // Simulate loading for UX (since we're working with local data)
        setTimeout(() => {
            const newDisplayedProducts = filteredProducts.slice(0, endIndex);
            setDisplayedProducts(newDisplayedProducts);
            setCurrentPage(nextPage);

            // Check if we've reached the end
            if (newDisplayedProducts.length >= filteredProducts.length) {
                setHasReachedEnd(true);
            }

            setIsLoadingMore(false);
        }, 300);
    };

    // Update displayed products when filtered products change
    useEffect(() => {
        const initialProducts = filteredProducts.slice(0, ITEMS_PER_PAGE);
        setDisplayedProducts(initialProducts);
        setCurrentPage(1);
        setHasReachedEnd(false);
        setIsLoadingMore(false);
    }, [filteredProducts]);

    // Handle search term changes with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setHasSearched(searchTerm.trim().length > 0);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Focus search input when screen loads
    useEffect(() => {
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    }, []);

    const handleProductSelect = (product) => {
        onProductSelect(product.id);
        onClose();
    };

    const renderProductItem = ({ item }) => (
        <CompressedProductItem
            productInfo={item}
            onPress={() => handleProductSelect(item)}
        />
    );

    const renderSeparator = () => (
        <View style={DefaultStyles.separator} />
    );

    return (
        <View style={[styles.container, { height: SCREEN_HEIGHT - 250 }]}>
            {/* Header */}
            <View style={styles.header}>
                <DefaultText style={styles.headerTitle}>
                    Add Product to Compare
                </DefaultText>

                <IconButton
                    iconComponent={<FontAwesome6 name="xmark" size={18} color="black" />}
                    style={styles.closeButton}
                    onPress={onClose}
                />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons
                        name="search"
                        size={20}
                        color={colors.text.lighter}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        ref={searchInputRef}
                        allowFontScaling={false}
                        style={styles.searchInput}
                        placeholder="Search products..."
                        placeholderTextColor={colors.text.lighter}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        autoCorrect={false}
                        autoCapitalize="none"
                        returnKeyType="search"
                    />
                </View>
            </View>

            {/* Results List */}
            <FlatList
                data={displayedProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={renderSeparator}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMoreProducts}
                onEndReachedThreshold={0.1}
                ListFooterComponent={() => {
                    if (isLoadingMore) {
                        return (
                            <View
                                style={[
                                    styles.loadingMoreContainer,
                                    {
                                        paddingBottom: insets.bottom,
                                    }
                                ]}
                            >
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
                }}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name={searchTerm ? "search" : "cube-outline"}
                            size={48}
                            color={colors.text.lighter}
                            style={styles.emptyIcon}
                        />
                        <DefaultText style={styles.emptyText}>
                            {searchTerm ? 'No products found' : `${availableProducts.length} products available`}
                        </DefaultText>
                        {!searchTerm && (
                            <DefaultText style={styles.emptySubtext}>
                                Start typing to search or scroll to browse all products
                            </DefaultText>
                        )}
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.screen,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: DefaultStyles.container.paddingHorizontal,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.accents.stroke,
    },
    headerTitle: {
        fontSize: DefaultStyles.text.caption.xlarge,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    closeButton: {
        width: 40,
        height: 40,
        backgroundColor: colors.background.light,
    },
    searchContainer: {
        padding: DefaultStyles.container.paddingBottom,
        paddingBottom: 8,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.light,
        borderRadius: 12,
        padding: 16,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.secondary,
        height: '100%',
    },
    listContainer: {
        flexGrow: 1,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.lighter,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.lighter,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.7,
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
});

export default CompareProductsSelectScreen;
