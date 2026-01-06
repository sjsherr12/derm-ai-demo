import DefaultStyles from "config/styles";
import ExploreScreenHeader from "./header";
import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import ExploreScreenSection from "./section";
import { useData } from "context/global/DataContext";
import * as Haptics from 'expo-haptics'
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import ProductCardItem from "components/Products/ProductCardItem";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultPill from "components/Options/DefaultPill";
import ExploreScreenFilteredItems from "./filtered";
import ExploreScreenDefaultResults from "./default";
import ExploreScreenSearchList from "./search";
import { Animated } from "react-native";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";

const { View, ScrollView } = require("react-native")

const ITEMS_PER_PAGE = 25;

const ExploreScreen = ({
}) => {
    const navigation = useNavigation();
    const safeAreaStyles = useSafeAreaStyles();
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false); // Track scroll state
    
    // Search-specific states
    const [searchResults, setSearchResults] = useState([]);
    const [displayedSearchResults, setDisplayedSearchResults] = useState([]);
    const [searchCurrentPage, setSearchCurrentPage] = useState(1);
    const [searchIsLoadingMore, setSearchIsLoadingMore] = useState(false);
    const [searchHasReachedEnd, setSearchHasReachedEnd] = useState(false);
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(1)).current;
    
    // Filter states
    const [appliedFilters, setAppliedFilters] = useState({
        skinConcerns: [],
        skinTypes: [],
        sensitivities: [], // These will be excluded
        categories: [],
        brands: [],
        priceSort: null, // Single value for sorting
        ratingSort: null // No default selection
    });
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [filteredProductsLoading, setFilteredProductsLoading] = useState(false);

    const { 
        userData, 
        products,
        productsLoading,
        fetchPersonalizedProductsOptimized,
        getLocalTrendingProducts,
        searchLocalProducts,
    } = useData();

    // Local state for personalized products (moved from global state)
    const [personalizedProducts, setPersonalizedProducts] = useState([]);

    // Fetch personalized products when user data is available
    useEffect(() => {
        const fetchPersonalizedProducts = async () => {
            if (!userData?.profile?.skinInfo) return;
            
            try {
                const dislikedProducts = userData?.routine?.dislikedProducts || [];
                const productIds = await fetchPersonalizedProductsOptimized(
                    userData.profile.skinInfo, 
                    dislikedProducts, 
                    25
                );
                setPersonalizedProducts(productIds);
            } catch (error) {
                console.error('Error fetching personalized products:', error);
            }
        };

        fetchPersonalizedProducts();
    }, [userData, fetchPersonalizedProductsOptimized, setPersonalizedProducts]);

    // Memoized helper functions for filter management
    const hasAnyFilters = useCallback(() => {
        return appliedFilters.skinConcerns.length > 0 || 
               appliedFilters.skinTypes.length > 0 || 
               appliedFilters.sensitivities.length > 0 || 
               appliedFilters.categories.length > 0 ||
               appliedFilters.brands.length > 0 ||
               appliedFilters.priceSort !== null ||
               appliedFilters.ratingSort !== null; // Count any rating sort as a filter
    }, [appliedFilters]);

    const removeFilter = useCallback((filterType, value) => {
        setAppliedFilters(prev => ({
            ...prev,
            [filterType]: filterType === 'brands' && value === 'brands'
                ? [] // Clear all brands when removing the brand pill
                : filterType === 'priceSort' || filterType === 'ratingSort'
                ? null // Clear single-select sorting options
                : prev[filterType].filter(item => item !== value)
        }));
    }, []);

    // Memoized filtered products computation
    const filteredProductsData = useMemo(() => {
        if (!hasAnyFilters()) {
            return [];
        }

        try {
            // Get all products from global state and filter them
            const allProducts = Object.values(products);
            
            const filtered = allProducts.filter(product => {
                // Filter by skin concerns
                if (appliedFilters.skinConcerns.length > 0) {
                    if (!product.skinConcerns || !Array.isArray(product.skinConcerns) ||
                        !appliedFilters.skinConcerns.some(concern => product.skinConcerns.includes(concern))) {
                        return false;
                    }
                }

                // Filter by skin types  
                if (appliedFilters.skinTypes.length > 0) {
                    if (!product.skinTypes || !Array.isArray(product.skinTypes) ||
                        !appliedFilters.skinTypes.some(type => product.skinTypes.includes(type))) {
                        return false;
                    }
                }

                // Filter by sensitivities (exclude products with these)
                if (appliedFilters.sensitivities.length > 0) {
                    if (product.sensitivities && Array.isArray(product.sensitivities) &&
                        appliedFilters.sensitivities.some(sensitivity => product.sensitivities.includes(sensitivity))) {
                        return false;
                    }
                }

                // Filter by categories
                if (appliedFilters.categories.length > 0) {
                    if (!appliedFilters.categories.includes(product.category)) {
                        return false;
                    }
                }

                // Filter by brands
                if (appliedFilters.brands.length > 0) {
                    if (!appliedFilters.brands.includes(product.brand)) {
                        return false;
                    }
                }

                // No price filtering - just include all products for sorting later

                return true;
            });

            // Sort by price, rating, or safety score based on applied filters
            return filtered.sort((a, b) => {
                if (appliedFilters.priceSort === 'price_asc') {
                    // Price low to high - handle products without price
                    const priceA = a.price || 0;
                    const priceB = b.price || 0;
                    return priceA - priceB;
                } else if (appliedFilters.priceSort === 'price_desc') {
                    // Price high to low - handle products without price
                    const priceA = a.price || 0;
                    const priceB = b.price || 0;
                    return priceB - priceA;
                } else if (appliedFilters.ratingSort === 'rating_asc') {
                    // Rating low to high - handle products without rating
                    const ratingA = a.reviews?.averageRating || a.safetyScore || 0;
                    const ratingB = b.reviews?.averageRating || b.safetyScore || 0;
                    return ratingA - ratingB;
                } else if (appliedFilters.ratingSort === 'rating_desc') {
                    // Rating high to low - handle products without rating
                    const ratingA = a.reviews?.averageRating || a.safetyScore || 0;
                    const ratingB = b.reviews?.averageRating || b.safetyScore || 0;
                    return ratingB - ratingA;
                } else {
                    // Default when no sorting is applied: sort by rating high to low (same as safety score)
                    const ratingA = a.reviews?.averageRating || a.safetyScore || 0;
                    const ratingB = b.reviews?.averageRating || b.safetyScore || 0;
                    return ratingB - ratingA;
                }
            });
        } catch (error) {
            console.error('Error filtering products:', error);
            return [];
        }
    }, [products, appliedFilters.skinConcerns, appliedFilters.skinTypes, appliedFilters.sensitivities, appliedFilters.categories, appliedFilters.brands, appliedFilters.priceSort, appliedFilters.ratingSort]);

    // Update filtered products when memoized data changes
    useEffect(() => {
        setFilteredProductsLoading(true);
        // Simulate async processing for UX consistency
        const timer = setTimeout(() => {
            setFilteredProducts(filteredProductsData);
            setFilteredProductsLoading(false);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [filteredProductsData]);


    // Memoized trending products
    const trendingProductsData = useMemo(() => {
        if (getLocalTrendingProducts) {
            return getLocalTrendingProducts(25);
        }
        return [];
    }, [getLocalTrendingProducts, products]);

    useEffect(() => {
        setTrendingProducts(trendingProductsData);
    }, [trendingProductsData]);

    // Handle search query changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery);
            } else if (isSearching) {
                // Clear search results but stay in search mode if focused
                setSearchResults([]);
                setDisplayedSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Memoized search mode deactivation
    const deactivateSearchMode = useCallback(() => {
        setIsSearching(false);
        setSearchResults([]);
        setDisplayedSearchResults([]);
    }, []);

    // Perform search with fuzzy matching - get ALL results, not limited
    const performSearch = (query) => {
        const results = searchLocalProducts(query.trim(), Infinity);
        setSearchResults(results);
        
        // Reset pagination
        setSearchCurrentPage(1);
        setSearchHasReachedEnd(false);
        setSearchIsLoadingMore(false);
        
        // Set initial displayed results
        const initialResults = results.slice(0, ITEMS_PER_PAGE);
        setDisplayedSearchResults(initialResults);
    };

    // Load more search results (pagination)
    const loadMoreSearchResults = () => {
        if (searchIsLoadingMore || searchHasReachedEnd) return;
        
        const nextPage = searchCurrentPage + 1;
        const endIndex = nextPage * ITEMS_PER_PAGE;
        
        // Check if we already have all results
        if (displayedSearchResults.length >= searchResults.length) {
            setSearchHasReachedEnd(true);
            return;
        }
        
        setSearchIsLoadingMore(true);
        
        // Simulate loading for UX
        setTimeout(() => {
            const newDisplayedResults = searchResults.slice(0, endIndex);
            setDisplayedSearchResults(newDisplayedResults);
            setSearchCurrentPage(nextPage);
            
            // Check if we've reached the end
            if (newDisplayedResults.length >= searchResults.length) {
                setSearchHasReachedEnd(true);
            }
            
            setSearchIsLoadingMore(false);
        }, 300);
    };

    // Memoized product selection handler
    const handleSearchProductSelect = useCallback((product) => {
        navigation.navigate('Product', { 
            productId: product.id,
            productInfo: product 
        });
    }, [navigation]);

    // Memoized cancel search function
    const cancelSearch = useCallback(() => {
        setSearchQuery('');
        deactivateSearchMode();
    }, [deactivateSearchMode]);

    // Handle scroll events to show/hide shadow
    const handleScroll = (event) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        setIsScrolled(scrollY > 10); // Show shadow after scrolling 10px
    };

    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}
        >
            <ExploreScreenHeader
                    userData={userData}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    appliedFilters={appliedFilters}
                    onRemoveFilter={removeFilter}
                    onOpenFilters={() => navigation.navigate('Filters', {
                        currentFilters: appliedFilters,
                        onFiltersChange: setAppliedFilters
                    })}
                    isScrolled={isScrolled}
                    isSearching={isSearching}
                    onCancelSearch={cancelSearch}
                    onSearchFocus={() => setIsSearching(true)}
                />

                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    {/* Search Results View - Always mounted but visibility controlled */}
                    <View style={{ 
                        flex: 1, 
                        display: isSearching ? 'flex' : 'none' 
                    }}>
                        <ExploreScreenSearchList
                            displayedSearchResults={displayedSearchResults}
                            searchResults={searchResults}
                            searchQuery={searchQuery}
                            searchIsLoadingMore={searchIsLoadingMore}
                            searchHasReachedEnd={searchHasReachedEnd}
                            onProductSelect={handleSearchProductSelect}
                            onLoadMore={loadMoreSearchResults}
                        />
                    </View>

                    {/* Normal Content View - Always mounted but visibility controlled */}
                    <View style={{ 
                        flex: 1, 
                        display: !isSearching ? 'flex' : 'none' 
                    }}>
                        {/* Default Results - ScrollView for mixed content */}
                        <View style={{ 
                            flex: 1,
                            display: !hasAnyFilters() ? 'flex' : 'none',
                            marginTop:-1
                        }}>
                            <ScrollView
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={[
                                    {
                                        paddingTop: 21, 
                                    },
                                    safeAreaStyles.safeAreaBottomWithTabBar
                                ]}
                            >
                                <ExploreScreenDefaultResults
                                    personalizedProducts={personalizedProducts}
                                    trendingProducts={trendingProducts}
                                    setAppliedFilters={setAppliedFilters}
                                    isLoadingProducts={productsLoading}
                                />
                            </ScrollView>
                        </View>

                        {/* Filtered Results - Direct FlatList, no ScrollView wrapper */}
                        <View style={{ 
                            flex: 1,
                            display: hasAnyFilters() ? 'flex' : 'none',
                            marginTop: -1
                        }}>
                            <ExploreScreenFilteredItems
                                filteredProducts={filteredProducts}
                                filteredProductsLoading={filteredProductsLoading}
                                onScroll={handleScroll}
                                safeAreaBottomPadding={safeAreaStyles.safeAreaBottomWithTabBar.paddingBottom}
                            />
                        </View>
                    </View>
                </Animated.View>
        </View>
    )
}

export default ExploreScreen;