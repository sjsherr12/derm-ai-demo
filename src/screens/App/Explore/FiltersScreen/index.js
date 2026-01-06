import { useState, useEffect, useRef, memo, useMemo } from "react";
import { View, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import DefaultStyles from "config/styles";
import FiltersHeader from "./header";
import DefaultText from "components/Text/DefaultText";
import DefaultButton from "components/Buttons/DefaultButton";
import colors from "config/colors";
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from "@react-navigation/native";
import { SkinConcerns, SkinTypes, CommonAllergens } from "constants/signup";
import { SkincareProductCategories as ProductCategories } from "constants/products";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SkincareProductCategories } from "constants/products";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import ProductBrandShortcut from "./ProductBrandShortcut";
import { useData } from "context/global/DataContext";
import Slider from '@react-native-community/slider'

// Custom Option Pill Component for FiltersScreen
const OptionPill = ({ text, isActive, onPress }) => {
    const animation = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        Animated.timing(animation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
        }).start();
    };

    const handlePressOut = () => {
        Animated.timing(animation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: false,
        }).start();
    };

    const scale = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.96],
    });

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [
            isActive ? `${colors.background.primary}20` : colors.background.screen,
            isActive ? `${colors.background.primary}30` : colors.accents.stroke
        ],
    });

    const borderColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [
            isActive ? colors.background.primary : colors.accents.stroke,
            isActive ? colors.background.primary : colors.text.secondary
        ],
    });

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={optionPillStyles.pressable}
        >
            <Animated.View style={[
                optionPillStyles.container,
                {
                    backgroundColor,
                    borderColor,
                    transform: [{ scale }]
                }
            ]}>
                <DefaultText style={[
                    optionPillStyles.text,
                    { color: isActive ? colors.background.primary : colors.text.secondary }
                ]}>
                    {text}
                </DefaultText>
            </Animated.View>
        </Pressable>
    );
};

const optionPillStyles = StyleSheet.create({
    container: {
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    pressable: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '500',
        textAlign: 'center',
    },
});

const FiltersScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { currentFilters, onFiltersChange } = route.params || {};
    const { products } = useData();

    // Price sorting options
    const priceSortingOptions = [
        {
            displayLabel: 'Low to High',
            title: 'Price: Low to High',
            value: 'price_asc'
        },
        {
            displayLabel: 'High to Low',
            title: 'Price: High to Low', 
            value: 'price_desc'
        }
    ];
    
    // Rating sorting options
    const ratingSortingOptions = [
        {
            displayLabel: 'Low to High',
            title: 'Rating: Low to High',
            value: 'rating_asc'
        },
        {
            displayLabel: 'High to Low',
            title: 'Rating: High to Low',
            value: 'rating_desc'
        }
    ];
    
    const availableFilters = [
        {
            title:'Product Categories',
            name:'categories',
            options:SkincareProductCategories,
        },
        {
            title:'Skin Concerns',
            name: 'skinConcerns',
            options: SkinConcerns.slice(1),
        },
        {
            title:'Skin Types',
            name: 'skinTypes',
            options: SkinTypes,
        },
        {
            title:'Avoid Ingredients',
            name:'sensitivities',
            options: CommonAllergens.slice(1 ),
        },
        {
            title:'Price',
            name: 'priceSort',
            options: priceSortingOptions,
            singleSelect: true, // Only one can be selected
        },
        {
            title:'Safety Score',
            name: 'ratingSort',
            options: ratingSortingOptions,
            singleSelect: true, // Only one can be selected
        },
    ]

    const [appliedFilters, setAppliedFilters] = useState(currentFilters || {
        skinConcerns: [],
        skinTypes: [],
        sensitivities: [],
        categories: [],
        brands: [],
        priceSort: null, // Single value, not array
        ratingSort: null // No default selection
    });


    // Helper functions for filter management
    const addFilter = (filterType, value) => {
        setAppliedFilters(prev => ({
            ...prev,
            [filterType]: [...prev[filterType], value]
        }));
    };

    const removeFilter = (filterType, value) => {
        setAppliedFilters(prev => ({
            ...prev,
            [filterType]: prev[filterType].filter(item => item !== value)
        }));
    };

    const clearAllFilters = () => {
        setAppliedFilters({
            skinConcerns: [],
            skinTypes: [],
            sensitivities: [],
            categories: [],
            brands: [],
            priceSort: null,
            ratingSort: null // No default selection
        });
    };

    const hasAnyFilters = () => {
        return appliedFilters.skinConcerns.length > 0 ||
               appliedFilters.skinTypes.length > 0 ||
               appliedFilters.sensitivities.length > 0 ||
               appliedFilters.categories.length > 0 ||
               appliedFilters.brands.length > 0 ||
               appliedFilters.priceSort !== null ||
               appliedFilters.ratingSort !== null; // Count any rating sort as a filter
    };

    // Calculate filtered products count
    const getFilteredProductsCount = useMemo(() => {
        if (!hasAnyFilters() || !products) {
            return 0;
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

                return true;
            });

            return filtered.length;
        } catch (error) {
            console.warn('Error filtering products:', error);
            return 0;
        }
    }, [appliedFilters, products]);

    // Apply filters when leaving the screen
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            if (onFiltersChange) {
                onFiltersChange(appliedFilters);
            }
        });

        return unsubscribe;
    }, [navigation, appliedFilters, onFiltersChange]);

    const handleShowProducts = () => {
        if (onFiltersChange) {
            onFiltersChange(appliedFilters);
        }
        navigation.goBack();
    };

    const handleBrandShortcutPress = () => {
        navigation.navigate('ProductBrandFilter', {
            selectedBrands: appliedFilters.brands,
            onApplyBrands: handleApplyBrands
        });
    };

    const handleApplyBrands = (selectedBrands) => {
        setAppliedFilters(prev => ({
            ...prev,
            brands: selectedBrands
        }));
    };

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <FiltersHeader
                    setFilters={clearAllFilters}
                    hasFilters={hasAnyFilters()}
                />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={DefaultStyles.scrollContainer}
                >
                    {availableFilters.map((filter, idx) => (
                        <View
                            key={idx}
                            style={styles.itemContainer}
                        >
                            <DefaultText
                                style={styles.title}
                            >
                                {filter.title}
                            </DefaultText>

                            <View
                                style={styles.pillContainer}
                            >
                                {filter.options.map((option, idx) => (
                                    <OptionPill
                                        key={idx}
                                        text={option.displayLabel || option.title}
                                        isActive={
                                            filter.singleSelect 
                                                ? appliedFilters?.[filter.name] === option.value
                                                : appliedFilters?.[filter.name].includes(option.value)
                                        }
                                        onPress={() => {
                                            if (filter.singleSelect) {
                                                // For single select, toggle the selection
                                                if (appliedFilters?.[filter.name] === option.value) {
                                                    setAppliedFilters(prev => ({
                                                        ...prev,
                                                        [filter.name]: null
                                                    }));
                                                } else {
                                                    setAppliedFilters(prev => ({
                                                        ...prev,
                                                        [filter.name]: option.value
                                                    }));
                                                }
                                            } else {
                                                // For multi-select, use existing logic
                                                if (appliedFilters?.[filter.name].includes(option.value)) {
                                                    removeFilter(filter.name, option.value)
                                                }
                                                else {
                                                    addFilter(filter.name, option.value)
                                                }
                                            }
                                        }}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Product Brand Shortcut */}
                    <ProductBrandShortcut
                        selectedBrands={appliedFilters.brands}
                        onPress={handleBrandShortcutPress}
                    />
                </ScrollView>

                <View
                    style={styles.bottomContainer}
                >
                    <DefaultButton
                        isActive
                        title={hasAnyFilters() ? `Show ${getFilteredProductsCount} Product${getFilteredProductsCount === 1 ? '' : 's'}` : "Show Products"}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        onPress={handleShowProducts}
                        style={{
                            borderRadius: 64,
                        }}
                    />
                </View>

            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize: DefaultStyles.text.caption.large,
        fontWeight:'700',
        color: colors.text.secondary
    },
    itemContainer: {
        gap:16,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        padding:DefaultStyles.container.paddingBottom,
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    bottomContainer: {
        backgroundColor: colors.background.screen,
        padding: DefaultStyles.container.paddingHorizontal,
        borderTopWidth: 1,
        borderTopColor: colors.accents.stroke,
    }
})

export default memo(FiltersScreen);