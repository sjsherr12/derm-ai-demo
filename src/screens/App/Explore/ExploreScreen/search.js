import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import DefaultText from 'components/Text/DefaultText';
import CompressedProductItem from 'components/Products/CompressedProductItem';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 10;

const ExploreScreenSearchList = memo(({
    displayedSearchResults = [],
    searchResults = [],
    searchQuery = '',
    searchIsLoadingMore = false,
    searchHasReachedEnd = false,
    onProductSelect,
    onLoadMore,
}) => {
    const [searchHistory, setSearchHistory] = useState([]);

    // Load search history on component mount
    useEffect(() => {
        loadSearchHistory();
    }, [loadSearchHistory]);

    // Memoized search history functions
    const loadSearchHistory = useCallback(async () => {
        try {
            const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            if (history) {
                setSearchHistory(JSON.parse(history));
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        }
    }, []);

    const saveSearchHistory = useCallback(async (newHistory) => {
        try {
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
            setSearchHistory(newHistory);
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }, []);

    const addToSearchHistory = useCallback((product) => {
        const newHistory = [product, ...searchHistory.filter(item => item.id !== product.id)]
            .slice(0, MAX_HISTORY_ITEMS);
        saveSearchHistory(newHistory);
    }, [searchHistory, saveSearchHistory]);


    const clearSearchHistory = useCallback(() => {
        saveSearchHistory([]);
    }, [saveSearchHistory]);

    // Enhanced onProductSelect to add to search history
    const handleProductSelect = useCallback((product) => {
        addToSearchHistory(product);
        onProductSelect(product);
    }, [addToSearchHistory, onProductSelect]);

    // Memoized search history item component
    const SearchHistoryItem = memo(({ item }) => (
        <CompressedProductItem
            productInfo={item}
            onPress={() => handleProductSelect(item)}
        />
    ));

    // Memoized search history header component
    const SearchHistoryHeader = memo(() => (
        <View style={searchHistoryStyles.headerContainer}>
            <DefaultText style={searchHistoryStyles.headerTitle}>
                Recent Searches
            </DefaultText>
            <Pressable 
                onPress={clearSearchHistory}
                android_ripple={{ color: colors.background.secondary }}
                style={searchHistoryStyles.clearButton}
            >
                <DefaultText style={searchHistoryStyles.clearText}>
                    Clear All
                </DefaultText>
            </Pressable>
        </View>
    ));

    // Memoized render functions
    const renderSearchResultItem = useCallback(({ item }) => (
        <CompressedProductItem
            productInfo={item}
            onPress={() => handleProductSelect(item)}
        />
    ), [handleProductSelect]);

    const renderSearchResultSeparator = useCallback(() => (
        <View style={{ height: 1, backgroundColor: colors.accents.stroke }} />
    ), []);

    const keyExtractor = useCallback((item) => item.id, []);

    // Show search history when no search query and has history
    if (!searchQuery && searchHistory.length > 0) {
        return (
            <FlatList
                data={searchHistory}
                renderItem={({ item }) => (
                    <SearchHistoryItem 
                        item={item} 
                    />
                )}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={renderSearchResultSeparator}
                ListHeaderComponent={SearchHistoryHeader}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: DefaultStyles.container.paddingHorizontal,
                    paddingBottom: DefaultStyles.tabScrollContainer.paddingBottom,
                }}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        );
    }

    return (
        <FlatList
            data={displayedSearchResults}
            renderItem={renderSearchResultItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={renderSearchResultSeparator}
            contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: DefaultStyles.container.paddingHorizontal,
                paddingBottom: DefaultStyles.tabScrollContainer.paddingBottom,
            }}
            showsVerticalScrollIndicator={false}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.1}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={10}
            ListFooterComponent={() => {
                if (searchIsLoadingMore) {
                    return (
                        <View style={{ 
                            paddingVertical: 20, 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            flexDirection: 'row' 
                        }}>
                            <ActivityIndicator
                                size="small"
                            />
                            <DefaultText style={{ 
                                fontSize: DefaultStyles.text.caption.small, 
                                color: colors.text.lighter, 
                                marginLeft: 8 
                            }}>
                                Loading more products...
                            </DefaultText>
                        </View>
                    );
                }
                
                if (searchHasReachedEnd && searchResults.length > 0) {
                    return (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <DefaultText style={{ 
                                fontSize: DefaultStyles.text.caption.small, 
                                color: colors.text.lighter, 
                                fontStyle: 'italic' 
                            }}>
                                No more products
                            </DefaultText>
                        </View>
                    );
                }
                
                return null;
            }}
            ListEmptyComponent={() => (
                <View style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    paddingVertical: 60 
                }}>
                    <DefaultText style={{ 
                        fontSize: DefaultStyles.text.caption.medium, 
                        color: colors.text.lighter, 
                        textAlign: 'center' 
                    }}>
                        {searchQuery ? `No products found for "${searchQuery}"` : 'Start typing to search products...'}
                    </DefaultText>
                </View>
            )}
        />
    );
});

// Search history styles
const searchHistoryStyles = {
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: DefaultStyles.text.caption.large,
        fontWeight: '600',
        color: colors.text.dark,
    },
    clearButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    clearText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.background.primary,
        fontWeight: '500',
    },
};

export default ExploreScreenSearchList;