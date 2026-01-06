import React, { useState, useMemo, useCallback } from 'react';
import { 
    View, 
    StyleSheet, 
    FlatList, 
    Pressable, 
    ScrollView,
    Text,
    Keyboard,
    Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DefaultText from 'components/Text/DefaultText';
import DefaultSearchBar from 'components/Inputs/DefaultSearchBar';
import DefaultButton from 'components/Buttons/DefaultButton';
import IconButton from 'components/Buttons/IconButton';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import * as Haptics from 'expo-haptics';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useData } from 'context/global/DataContext';
import useScalePressAnimation from '../../../../hooks/useScalePressAnimation';


const CheckboxCircle = React.memo(({ isSelected, onPress }) => {
    return (
        <Pressable
            style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected
            ]}
            onPress={onPress}
        >
            {isSelected && (
                <IconButton
                    iconComponent={<FontAwesome6 name="check" size={14} color="white" />}
                    color={colors.background.screen}
                    size={16}
                    style={styles.checkIcon}
                />
            )}
        </Pressable> 
    );
});

const BrandItem = React.memo(({ brand, isSelected, onToggle, isLast }) => {
    const handlePress = useCallback(() => onToggle(brand), [brand, onToggle]);
    
    return (
        <View>
            <Pressable
                style={styles.brandItem}
                onPress={handlePress}
            >
                <DefaultText style={styles.brandText}>
                    {brand}
                </DefaultText>
                <CheckboxCircle
                    isSelected={isSelected}
                    onPress={handlePress}
                />
            </Pressable>
            {!isLast && <View style={DefaultStyles.separator} />}
        </View>
    );
});

const AlphabetHeader = React.memo(({ letter }) => {
    return (
        <View style={styles.alphabetHeader}>
            <DefaultText style={styles.alphabetText}>
                {letter}
            </DefaultText>
        </View>
    );
});

const SelectedBrandPill = React.memo(({ brand, onRemove }) => {
    const handleRemove = useCallback(() => onRemove(brand), [brand, onRemove]);
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.9,
        maxScale:1,
        duration:100,
    })
    
    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleRemove}
        >
            <Animated.View
                style={{
                    ...styles.pill,
                    transform:[{scale}]
                }}
            >
                <DefaultText style={styles.pillText}>
                    {brand}
                </DefaultText>
                <IconButton
                    icon="close"
                    color={colors.background.primary}
                    size={18}
                />
            </Animated.View>
        </Pressable>
    );
});

const ProductBrandScreen = React.memo(() => {
    const navigation = useNavigation();
    const route = useRoute();
    const { selectedBrands = [], onApplyBrands } = route.params || {};
    const { brandsArray, products, productsInitialized, productsLoading } = useData();
    
    const [searchText, setSearchText] = useState('');
    const [tempSelectedBrands, setTempSelectedBrands] = useState(selectedBrands);
    const [isSearchActive, setIsSearchActive] = useState(true);


    // Group brands alphabetically - memoized for performance
    const groupedBrands = useMemo(() => {
        if (!brandsArray || brandsArray.length === 0) {
            return [];
        }

        const searchLower = searchText.toLowerCase();
        const filtered = brandsArray.filter(brand =>
            brand.toLowerCase().includes(searchLower)
        );

        const grouped = filtered.reduce((acc, brand) => {
            const firstChar = brand.charAt(0).toUpperCase();
            if (!acc[firstChar]) {
                acc[firstChar] = [];
            }
            acc[firstChar].push(brand);
            return acc;
        }, {});

        // Sort keys alphabetically
        const sortedKeys = Object.keys(grouped).sort();
        return sortedKeys.map(key => ({
            letter: key,
            brands: grouped[key]
        }));
    }, [brandsArray, searchText]);

    const toggleBrand = useCallback((brand) => {
        setTempSelectedBrands(prev => {
            if (prev.includes(brand)) {
                return prev.filter(b => b !== brand);
            } else {
                return [...prev, brand];
            }
        });
    }, []);

    const removeBrandFromSelected = useCallback((brand) => {
        setTempSelectedBrands(prev => prev.filter(b => b !== brand));
    }, []);

    const handleApply = useCallback(() => {
        if (onApplyBrands) {
            onApplyBrands(tempSelectedBrands);
        }
        navigation.goBack();
    }, [onApplyBrands, tempSelectedBrands, navigation]);

    const handleCancel = useCallback(() => {
        setSearchText('');
        setIsSearchActive(false);
        Keyboard.dismiss();
    }, []);

    const handleSearchFocus = useCallback(() => {
        setIsSearchActive(true);
    }, []);

    const handleClose = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    // Memoize flat data structure for FlatList
    const flatListData = useMemo(() => {
        const data = [];
        groupedBrands.forEach(group => {
            data.push({ type: 'header', letter: group.letter });
            group.brands.forEach((brand, index) => {
                data.push({ 
                    type: 'brand', 
                    brand, 
                    isLast: index === group.brands.length - 1 
                });
            });
        });
        return data;
    }, [groupedBrands]);

    // Memoize key extractor
    const keyExtractor = useCallback((item) => 
        item.type === 'header' ? `header-${item.letter}` : `brand-${item.brand}`,
        []
    );

    // Memoize render item function
    const renderItem = useCallback(({ item }) => {
        if (item.type === 'header') {
            return <AlphabetHeader letter={item.letter} />;
        }
        return (
            <BrandItem
                brand={item.brand}
                isSelected={tempSelectedBrands.includes(item.brand)}
                onToggle={toggleBrand}
                isLast={item.isLast}
            />
        );
    }, [tempSelectedBrands, toggleBrand]);

    // Memoize content container style
    const contentContainerStyle = useMemo(() => [
        styles.brandListContent,
        tempSelectedBrands.length === 0 && styles.brandListContentNoPills
    ], [tempSelectedBrands.length]);

    const renderBrandList = useCallback(() => {
        return (
            <FlatList
                data={flatListData}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                style={styles.brandList}
                contentContainerStyle={contentContainerStyle}
                removeClippedSubviews={true}
                maxToRenderPerBatch={20}
                updateCellsBatchingPeriod={50}
                windowSize={10}
            />
        );
    }, [flatListData, keyExtractor, renderItem, contentContainerStyle]);

    // Memoize search bar style
    const searchBarStyle = useMemo(() => [
        styles.searchBar,
        isSearchActive && styles.searchBarActive
    ], [isSearchActive]);

    // Memoize list container style
    const listContainerStyle = useMemo(() => [
        styles.listContainer,
        tempSelectedBrands.length > 0 && styles.listContainerWithPills
    ], [tempSelectedBrands.length]);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <DefaultText style={styles.title}>
                        Product Brand
                    </DefaultText>
                    <IconButton
                        icon="close"
                        color={colors.text.secondary}
                        onPress={handleClose}
                        size={24}
                        style={styles.closeButton}
                    />
                </View>
                
                <View style={styles.searchContainer}>
                    <DefaultSearchBar
                        value={searchText}
                        onChangeText={setSearchText}
                        onFocus={handleSearchFocus}
                        onBlur={() => setIsSearchActive(false)}
                        placeholder="Search brands"
                        autoCorrect={false}
                        autoFocus={true}
                        style={{
                            container: searchBarStyle
                        }}
                        startAdornment={
                            <FontAwesome6 
                                name="magnifying-glass"
                                size={18}
                                color="black"
                                style={{
                                    marginLeft:4
                                }}
                            />
                        }
                    />
                    
                    {isSearchActive && (
                        <Pressable onPress={handleCancel}>
                            <DefaultText style={styles.cancelText}>
                                Cancel
                            </DefaultText>
                        </Pressable>
                    )}
                </View>
            </View>
            
            <View style={DefaultStyles.separator} />
            
            {/* Selected Pills */}
            {tempSelectedBrands.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.pillsContainer}
                    contentContainerStyle={styles.pillsContent}
                >
                    {tempSelectedBrands.map(brand => (
                        <SelectedBrandPill
                            key={brand}
                            brand={brand}
                            onRemove={removeBrandFromSelected}
                        />
                    ))}
                </ScrollView>
            )}
            
            {/* Scrollable Brand List */}
            <View style={listContainerStyle}>
                {productsLoading ? (
                    <View style={styles.loadingContainer}>
                        <DefaultText style={styles.loadingText}>
                            Loading brands...
                        </DefaultText>
                    </View>
                ) : !productsInitialized ? (
                    <View style={styles.loadingContainer}>
                        <DefaultText style={styles.loadingText}>
                            Initializing product database...
                        </DefaultText>
                    </View>
                ) : (!brandsArray || brandsArray.length === 0) ? (
                    <View style={styles.loadingContainer}>
                        <DefaultText style={styles.loadingText}>
                            No brands found in database
                        </DefaultText>
                    </View>
                ) : (
                    renderBrandList()
                )}
            </View>
            
            {/* Apply Button */}
            <View style={styles.applyButtonContainer}>
                <DefaultButton
                    title="Apply"
                    isActive={tempSelectedBrands.length > 0}
                    onPress={handleApply}
                    hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    style={styles.applyButton}
                />
            </View>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background.screen,
    },
    header: {
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: colors.background.screen,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: DefaultStyles.text.caption.xlarge,
        fontWeight: '700',
        color: colors.text.secondary,
    },
    closeButton: {
        width:36,
        height:36,
        backgroundColor:colors.background.light
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchBar: {
        flex: 1,
        borderColor: colors.accents.stroke,
    },
    searchBarActive: {
        borderColor: colors.background.primary,
        flex: 1,
    },
    searchIcon: {
        padding: 0,
        margin: 0,
        width:48,
        height:48
    },
    cancelText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.background.primary,
        fontWeight: '500',
    },
    pillsContainer: {
        maxHeight: 60,
        backgroundColor: colors.background.screen,
    },
    pillsContent: {
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
        paddingVertical: 12,
        gap: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.background.primary}20`,
        borderRadius: 10,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 6,
        gap: 4,
    },
    pillText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.background.primary,
        fontWeight: '500',
    },
    pillRemove: {
        paddingVertical: 6,
    },
    listContainer: {
        flex: 1,
    },
    listContainerWithPills: {
        borderTopColor: colors.accents.stroke,
    },
    brandList: {
        flex: 1,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
    },
    brandListContent: {
        paddingBottom: 12,
    },
    brandListContentNoPills: {
        paddingTop: 12,
    },
    alphabetHeader: {
        backgroundColor: `${colors.background.primary}20`,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginVertical: 4,
        borderRadius:8
    },
    alphabetText: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '700',
        color: colors.text.secondary,
    },
    brandItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    brandText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.accents.stroke,
        backgroundColor: colors.background.screen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: colors.background.primary,
        borderColor: colors.background.primary,
    },
    checkIcon: {
        padding: 0,
        margin: 0,
    },
    applyButtonContainer: {
        backgroundColor: colors.background.screen,
        padding: DefaultStyles.container.paddingHorizontal,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: colors.accents.stroke,
    },
    applyButton: {
        borderRadius: 64,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
});

export default ProductBrandScreen;