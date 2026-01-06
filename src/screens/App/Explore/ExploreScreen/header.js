import IconButton from "components/Buttons/IconButton";
import DefaultSearchBar from "components/Inputs/DefaultSearchBar";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { ScrollView, StyleSheet, View, Pressable, Animated } from "react-native";
import {Ionicons, FontAwesome6, FontAwesome5, Octicons} from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SkinConcerns } from "constants/signup";
import { SkinTypes } from "constants/signup";
import { CommonAllergens } from "constants/signup";
import { SkincareProductCategories } from "constants/products";
import { useNavigation } from "@react-navigation/native";
import DefaultText from "components/Text/DefaultText";
import * as Haptics from 'expo-haptics';
import useScalePressAnimation from "hooks/useScalePressAnimation";

const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader")

// Custom Filter Pill Component
const FilterPill = ({ text, isActive, onPress, endAdornment }) => {
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
        outputRange: [1, 0.9],
    });

    const borderColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [
            isActive ? colors.background.primary : colors.accents.stroke,
            isActive ? colors.background.primary : colors.text.secondary
        ],
    });

    return (
        <Animated.View style={[
            filterPillStyles.container,
            {
                borderColor,
                transform: [{ scale }]
            }
        ]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                style={filterPillStyles.pressable}
            >
                <DefaultText style={[
                    filterPillStyles.text,
                    { color: isActive ? colors.background.primary : colors.text.secondary }
                ]}>
                    {text}
                </DefaultText>
                {endAdornment}
            </Pressable>
        </Animated.View>
    );
};

const filterPillStyles = StyleSheet.create({
    container: {
        borderRadius: 20,
        borderWidth: 1.5,
        backgroundColor: `${colors.background.primary}15`, // 15 is ~8% opacity in hex
        minWidth: 75,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    pressable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    text: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '600',
    },
});

// Skin concerns categories for the pills
const SKIN_CONCERN_CATEGORIES = [
    { id: 'explore', title: 'Explore' },
    { id: 'acne', title: 'Acne' },
    { id: 'redness', title: 'Redness' },
    { id: 'oiliness', title: 'Oiliness' },
    { id: 'dryness', title: 'Dryness' },
    { id: 'tone', title: 'Unveven Tone' },
    { id: 'aging', title: 'Aging' },
    { id: 'pores', title: 'Enlarged Pores' },
    { id: 'circles', title: 'Dark Circles' },
];

const getAllAppliedFilterItems = (appliedFilters) => {
    const items = [];
    
    appliedFilters.skinConcerns.forEach(concern => {
        const concernData = SkinConcerns.find(c => c.value === concern);
        if (concernData) {
            items.push({
                type: 'skinConcerns',
                value: concern,
                label: concernData.displayLabel || concernData.title
            });
        }
    });

    appliedFilters.skinTypes.forEach(type => {
        const typeData = SkinTypes.find(t => t.value === type);
        if (typeData) {
            items.push({
                type: 'skinTypes', 
                value: type,
                label: typeData.displayLabel || typeData.title
            });
        }
    });

    appliedFilters.sensitivities.forEach(sensitivity => {
        const sensitivityData = CommonAllergens.find(a => a.value === sensitivity);
        if (sensitivityData) {
            items.push({
                type: 'sensitivities',
                value: sensitivity,
                label: `No ${sensitivityData.displayLabel || sensitivityData.title}`
            });
        }
    });

    appliedFilters.categories.forEach(category => {
        const categoryData = SkincareProductCategories.find(c => c.value === category);
        if (categoryData) {
            items.push({
                type: 'categories',
                value: category,
                label: categoryData.displayLabel || categoryData.title
            });
        }
    });

    if (appliedFilters.brands && appliedFilters.brands.length > 0) {
        items.push({
            type: 'brands',
            value: 'brands',
            label: 'Product Brand'
        });
    }

    // Price sorting options
    if (appliedFilters.priceSort) {
        const priceSortLabels = {
            'price_asc': 'Price: Low to High',
            'price_desc': 'Price: High to Low'
        };
        items.push({
            type: 'priceSort',
            value: appliedFilters.priceSort,
            label: priceSortLabels[appliedFilters.priceSort] || appliedFilters.priceSort
        });
    }

    // Rating sorting options
    if (appliedFilters.ratingSort) {
        const ratingSortLabels = {
            'rating_asc': 'Rating: Low to High',
            'rating_desc': 'Rating: High to Low'
        };
        items.push({
            type: 'ratingSort',
            value: appliedFilters.ratingSort,
            label: ratingSortLabels[appliedFilters.ratingSort] || appliedFilters.ratingSort
        });
    }

    return items;
};

const ExploreScreenHeader = ({
    userData,
    searchQuery,
    setSearchQuery,
    appliedFilters = [],
    onRemoveFilter,
    onOpenFilters,
    isScrolled = false,
    isSearching = false,
    onCancelSearch,
    onSearchFocus,
}) => {
    const navigation = useNavigation();
    const shadowOpacity = useRef(new Animated.Value(0)).current;
    const searchInputRef = useRef(null);
    const appliedFilterItems = getAllAppliedFilterItems(appliedFilters);
    const [activeConcern, setActiveConcern] = useState('explore');
    const canClearSearchQuery = useMemo(
        () => searchQuery?.length
    , [searchQuery])

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.9,
        maxScale:1,
        duration:150
    })

    // Handle cancel with unfocusing
    const handleCancelSearch = () => {
        // Unfocus the search input
        if (searchInputRef.current) {
            searchInputRef.current.blur();
        }
        
        // Call the parent's cancel function
        onCancelSearch();
    };

    useEffect(() => {
        Animated.timing(shadowOpacity, {
            toValue: isScrolled ? 1 : 0,
            duration: 100,
            useNativeDriver: true,
        }).start();
    }, [isScrolled, shadowOpacity]);

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.container}>
                <View style={styles.searchContainer}>
                    <DefaultSearchBar
                        ref={searchInputRef}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={onSearchFocus}
                        placeholder='Find products'
                        autoCorrect={false}
                        style={styles.searchBar}
                        startAdornment={
                            <FontAwesome6
                                name='magnifying-glass'
                                color={colors.text.secondary}
                                size={18}
                            />
                        }
                        endAdornment={
                            isSearching ? (
                                <IconButton
                                    icon='close-circle'
                                    size={24}
                                    color={canClearSearchQuery ? colors.text.secondary : colors.text.lighter}
                                    onPress={() => {canClearSearchQuery && setSearchQuery('')}}
                                    style={{
                                        width:48,
                                        height:48,
                                    }}
                                />
                            ) : (
                                <IconButton
                                    icon='options-outline'
                                    size={24}
                                    color={colors.text.secondary}
                                    onPress={onOpenFilters}
                                    style={{
                                        width:48,
                                        height:48,
                                    }}
                                />
                            )
                        }
                    />

                    {isSearching ? (
                        <Pressable
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                            onPress={handleCancelSearch}
                        >
                            <Animated.View
                                style={[
                                    styles.cancelButton,
                                    {transform:[{scale}]}
                                ]}
                            >
                                <DefaultText style={styles.cancelButtonText}>
                                    Cancel
                                </DefaultText>
                            </Animated.View>
                        </Pressable>
                    ) : (
                        <IconButton
                            iconComponent={<Octicons name="bookmark" size={24} color={colors.text.primary}/>}
                            style={{
                                backgroundColor:colors.background.primary,
                                width:50,
                                height:50,
                                borderRadius:12
                            }}
                            onPress={() => navigation.navigate('SavedProducts')}
                        />
                    )}
                </View>

                {appliedFilterItems.length > 0 && !isSearching && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.optionsContainer}
                    >
                        {appliedFilterItems.map((filterItem, idx) => (
                            <FilterPill
                                isActive={true}
                                text={filterItem.label}
                                key={`${filterItem.type}-${filterItem.value}`}
                                onPress={() => onRemoveFilter(filterItem.type, filterItem.value)}
                                endAdornment={
                                    <IconButton
                                        iconComponent={<FontAwesome6 name="xmark" size={18} color={colors.background.primary} />}
                                        onPress={() => onRemoveFilter(filterItem.type, filterItem.value)}
                                        style={{
                                            width:20,
                                            height:20,
                                        }}
                                    />
                                }
                            />
                        ))}
                    </ScrollView>
                )}
            </View>
            
            {/* Separator Line - Full Width */}
            <View style={DefaultStyles.separator} />
        </View>
    )
}

export default ExploreScreenHeader;

const styles = StyleSheet.create({
    headerWrapper: {
        position: 'relative',
        backgroundColor: colors.background.screen,
        zIndex: 10, // Ensure header stays above content
    },
    container: {
        gap: 16,
        paddingVertical: DefaultStyles.container.paddingHorizontal,
        backgroundColor: colors.background.screen,
    },
    shadowGradient: {
        position: 'absolute',
        bottom: 7.5,
        left: 0,
        right: 0,
        height: 12,
        zIndex: 1, // Above content but below header
    },
    searchContainer: {
        flexDirection:'row',
        gap:12,
        alignItems:'center',
        justifyContent:'space-between',
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    searchBar: {
        container: {
            flex:1,
            paddingLeft:20,
            paddingRight:2,
            borderRadius:12,
        },
    },
    optionsContainer: {
        flexDirection:'row',
        gap:10,
        alignItems:'center',
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    cancelButton: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        height: 48,
    },
    cancelButtonText: {
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '600',
        color: colors.background.primary,
    },
    concernsPillsContainer: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    concernPill: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
    },
    concernPillActive: {
        borderColor: colors.text.secondary,
        borderWidth: 1.5,
    },
    concernPillText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    concernPillTextActive: {
        color: colors.text.secondary,
    },
})