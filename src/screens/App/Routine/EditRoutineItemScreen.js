import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DefaultText from 'components/Text/DefaultText';
import IconButton from 'components/Buttons/IconButton';
import DefaultButton from 'components/Buttons/DefaultButton';
import DefaultTextInput from 'components/Text/DefaultTextInput';
import RoutineScreenRoutineProduct from './RoutineScreen/routineProduct';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import { Ionicons, FontAwesome6, Entypo } from '@expo/vector-icons';
import { RoutineProductTypes, RoutineProductUsageFrequencies } from 'constants/products';
import { useData } from 'context/global/DataContext';
import { useAuth } from 'context/global/AuthContext';
import { addRoutineProduct, updateRoutineProduct, deleteRoutineProduct } from 'utils/routineProducts';
import * as Haptics from 'expo-haptics';
import TopTabBar from 'components/Options/TopTabBar';
import { MenuView } from '@react-native-menu/menu';

const EditRoutineItemScreen = ({ 
    // Direct props for bottom sheet usage
    routineItem: propRoutineItem,
    onClose: propOnClose,
    mode: propMode
}) => {
    const scrollRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const navigation = useNavigation();
    const route = useRoute();
    const { products, routineProducts, setRoutineProducts } = useData();
    const { user } = useAuth();
    
    const { 
        productId, 
        routineItem, 
        routineType: initialRoutineType,
        mode = 'add', // 'add' or 'edit'
        shouldDoubleExit
    } = route.params || {};
    
    // Use props if available (for bottom sheet usage)
    const finalRoutineItem = propRoutineItem || routineItem;
    const finalMode = propMode || mode;
    const handleClose = propOnClose || (() => navigation.goBack());
    
    // Determine if we're editing an existing item or adding a new one
    const isEditMode = finalMode === 'edit' && finalRoutineItem;
    const productInfo = isEditMode ? finalRoutineItem?.productInfo : products[productId];
    
    const [routineType, setRoutineType] = useState(
        isEditMode ? finalRoutineItem?.routineInfo?.routineType : (initialRoutineType ?? 0)
    );
    const [usageFrequency, setUsageFrequency] = useState(
        isEditMode ? finalRoutineItem?.routineInfo?.usageFrequency : 0
    );
    const [directions, setDirections] = useState(
        isEditMode ? finalRoutineItem?.routineInfo?.directions || '' : ''
    );
    const [saving, setSaving] = useState(false);

    // Word limit for notes
    const NOTES_WORD_LIMIT = 50;
    const wordCount = directions.trim() ? directions.trim().split(/\s+/).length : 0;

    // Track initial values to detect changes
    const initialValues = {
        routineType: isEditMode ? finalRoutineItem?.routineInfo?.routineType : (initialRoutineType ?? 0),
        usageFrequency: isEditMode ? finalRoutineItem?.routineInfo?.usageFrequency : 0,
        directions: isEditMode ? finalRoutineItem?.routineInfo?.directions || '' : ''
    };

    // Check if any values have changed
    const hasChanges = isEditMode ?
        routineType !== initialValues.routineType ||
        usageFrequency !== initialValues.usageFrequency ||
        directions !== initialValues.directions : true;

    // Handle directions text change with word limit
    const handleDirectionsChange = (text) => {
        const words = text.trim().split(/\s+/);
        if (text.trim() === '' || words.length <= NOTES_WORD_LIMIT) {
            setDirections(text);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    const iteratedExit = (timesToAttempt) => {
        let i = 0;
        while (i < timesToAttempt && navigation.canGoBack()) {
            navigation.goBack();
            i++;
        }
    }

    const handleSave = async () => {
        if (!user || !productInfo) {
            Alert.alert('Error', `Unable to ${isEditMode ? 'update' : 'save'} routine item`);
            return;
        }

        // Determine if "Both" was selected (routineType will be 2 for "Both")
        const isBothSelected = !isEditMode && routineType === 2;

        // Check for duplicates in the target routine type(s)
        if (routineProducts) {
            if (isBothSelected) {
                // Check for duplicates in both morning and evening
                const morningExists = routineProducts.find(
                    routineProduct =>
                        routineProduct.productInfo?.id === productInfo.id &&
                        routineProduct.routineInfo?.routineType === 0
                );
                const eveningExists = routineProducts.find(
                    routineProduct =>
                        routineProduct.productInfo?.id === productInfo.id &&
                        routineProduct.routineInfo?.routineType === 1
                );

                if (morningExists && eveningExists) {
                    Alert.alert(
                        'Product Already Added',
                        'This product is already in both your morning and evening routines.',
                        [{ text: 'OK', style: 'default' }]
                    );
                    return;
                } else if (morningExists) {
                    Alert.alert(
                        'Product Already Added',
                        'This product is already in your morning routine. It will only be added to your evening routine.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Continue', style: 'default', onPress: () => performSave(true, false, true) }
                        ]
                    );
                    return;
                } else if (eveningExists) {
                    Alert.alert(
                        'Product Already Added',
                        'This product is already in your evening routine. It will only be added to your morning routine.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Continue', style: 'default', onPress: () => performSave(true, true, false) }
                        ]
                    );
                    return;
                }
            } else {
                // Single routine type check
                const existingProduct = routineProducts.find(
                    routineProduct =>
                        routineProduct.productInfo?.id === productInfo.id &&
                        routineProduct.routineInfo?.routineType === routineType &&
                        // In edit mode, exclude the current item being edited
                        (!isEditMode || routineProduct.routineInfo?.id !== finalRoutineItem?.routineInfo?.id)
                );

                if (existingProduct) {
                    const routineTypeName = routineType === 0 ? 'morning' : 'evening';
                    Alert.alert(
                        'Product Already Added',
                        `This product is already in your ${routineTypeName} routine. You can edit the existing routine item instead.`,
                        [{ text: 'OK', style: 'default' }]
                    );
                    return;
                }
            }
        }

        // Perform the save
        await performSave(isBothSelected, true, true);
    };

    const performSave = async (isBothSelected, addMorning, addEvening) => {
        setSaving(true);

        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (isEditMode) {
                // Edit mode - single update
                const routineItemData = {
                    productId: productInfo.id,
                    routineType,
                    usageFrequency,
                    directions: directions ? directions.trim() : '',
                };

                await updateRoutineProduct(user.uid, finalRoutineItem?.routineInfo?.id, routineItemData);

                // Update local state
                if (routineProducts && setRoutineProducts) {
                    const updatedProducts = routineProducts.map(item =>
                        item.routineInfo.id === finalRoutineItem.routineInfo.id
                            ? { ...item, routineInfo: { ...item.routineInfo, ...routineItemData } }
                            : item
                    );
                    setRoutineProducts(updatedProducts);
                }

                handleClose();
            } else {
                // Add mode - potentially create two documents
                const newRoutineItems = [];

                if (isBothSelected) {
                    // Create morning routine item if needed
                    if (addMorning) {
                        const morningData = {
                            productId: productInfo.id,
                            routineType: 0, // Morning
                            usageFrequency,
                            directions: directions ? directions.trim() : '',
                        };
                        const morningId = await addRoutineProduct(user.uid, morningData);
                        newRoutineItems.push({
                            routineInfo: { id: morningId, ...morningData },
                            productInfo: productInfo
                        });
                    }

                    // Create evening routine item if needed
                    if (addEvening) {
                        const eveningData = {
                            productId: productInfo.id,
                            routineType: 1, // Evening
                            usageFrequency,
                            directions: directions ? directions.trim() : '',
                        };
                        const eveningId = await addRoutineProduct(user.uid, eveningData);
                        newRoutineItems.push({
                            routineInfo: { id: eveningId, ...eveningData },
                            productInfo: productInfo
                        });
                    }
                } else {
                    // Single routine item
                    const routineItemData = {
                        productId: productInfo.id,
                        routineType,
                        usageFrequency,
                        directions: directions ? directions.trim() : '',
                    };
                    const newItemId = await addRoutineProduct(user.uid, routineItemData);
                    newRoutineItems.push({
                        routineInfo: { id: newItemId, ...routineItemData },
                        productInfo: productInfo
                    });
                }

                // Add to local state
                if (routineProducts && setRoutineProducts && newRoutineItems.length > 0) {
                    setRoutineProducts([...routineProducts, ...newRoutineItems]);
                }

                // Navigate back to the routine screen
                iteratedExit(1+(!!(shouldDoubleExit)+0));
            }

        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'saving'} routine item:`, error);
            Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'save'} routine item. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!isEditMode || !finalRoutineItem) return;

        Alert.alert(
            'Delete Routine Item',
            'Are you sure you want to remove this item from your routine?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteRoutineProduct(user.uid, finalRoutineItem.routineInfo.id);
                            
                            // Remove from local state
                            if (routineProducts && setRoutineProducts) {
                                const updatedProducts = routineProducts.filter(item => 
                                    item.routineInfo.id !== finalRoutineItem.routineInfo.id
                                );
                                setRoutineProducts(updatedProducts);
                            }
                            
                            handleClose();
                        } catch (error) {
                            console.error('Error deleting routine item:', error);
                            Alert.alert('Error', 'Failed to delete routine item. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const RoutineTypeSelector = () => {
        // Add "Both" option for add mode only
        const routineTypeTabs = isEditMode
            ? RoutineProductTypes
            : [...RoutineProductTypes, 'Both'];

        return (
            <View style={styles.selectorContainer}>
                <DefaultText style={styles.selectorLabel}>Routine</DefaultText>
                <View style={styles.selectorOptions}>
                    <TopTabBar
                        activeTab={routineType}
                        onChange={setRoutineType}
                        tabs={routineTypeTabs}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    />
                </View>
            </View>
        );
    };

    const UsageFrequencySelector = () => (
        <View style={styles.selectorContainer}>
            <DefaultText style={styles.selectorLabel}>Usage Frequency</DefaultText>
            <MenuView
                title="Select usage frequency"
                actions={RoutineProductUsageFrequencies.map((frequency, index) => ({
                    id: `frequency-${index}`,
                    title: frequency.title,
                    state: usageFrequency === frequency.value ? 'on' : 'off'
                }))}
                onPressAction={({ nativeEvent }) => {
                    const selectedIndex = parseInt(nativeEvent.event.split('-')[1]);
                    const selectedFrequency = RoutineProductUsageFrequencies[selectedIndex];
                    setUsageFrequency(selectedFrequency.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                }}
            >
                <View style={styles.menuTrigger}>
                    <DefaultText style={styles.menuTriggerText}>
                        {RoutineProductUsageFrequencies.find(f => f.value === usageFrequency)?.title || "Select usage frequency"}
                    </DefaultText>
                    <Ionicons name="chevron-down" size={16} color={colors.text.tertiary} />
                </View>
            </MenuView>
        </View>
    );

    if (!productInfo) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.errorContainer}>
                        <DefaultText style={styles.errorText}>
                            Product not found
                        </DefaultText>
                        <DefaultButton
                            title="Go Back"
                            onPress={() => navigation.goBack()}
                        />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header - only show for add mode (when it's a pushed screen) */}
                {!isEditMode && (
                    <View style={styles.header}>
                        <IconButton
                            icon='arrow-back'
                            size={24}
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        />
                        
                        <DefaultText style={styles.headerTitle}>
                            Add to Routine
                        </DefaultText>
                        
                        <View style={{width:32}} />
                    </View>
                )}

                {/* Header for edit mode (bottom sheet style) */}
                {isEditMode && (
                    <View style={styles.editHeader}>
                        <DefaultText style={styles.editHeaderTitle}>
                            Edit Routine Step
                        </DefaultText>
                        
                        <IconButton
                            iconComponent={<FontAwesome6 name="xmark" size={18} color="black" />}
                            style={styles.closeButton}
                            onPress={handleClose}
                        />
                    </View>
                )}

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            ref={scrollRef}
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps='handled'
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.content}>
                                <RoutineScreenRoutineProduct
                                    productInfo={productInfo}
                                    routineInfo={{
                                        routineType,
                                        usageFrequency,
                                        directions,
                                    }}
                                    expandable={false}
                                    onPress={() => {
                                        if (isEditMode) {
                                            navigation.goBack();
                                            setTimeout(() => navigation.navigate('Product', {
                                                productId
                                            }), 100)
                                        }
                                    }}
                                />

                                <RoutineTypeSelector />

                                <UsageFrequencySelector />

                                <View style={styles.directionsContainer}>
                                    <View style={styles.directionsHeader}>
                                        <DefaultText style={styles.directionsLabel}>
                                            Notes (optional)
                                        </DefaultText>
                                        <DefaultText style={[styles.wordCountText, wordCount > NOTES_WORD_LIMIT * 0.8 && styles.wordCountWarning]}>
                                            {wordCount}/{NOTES_WORD_LIMIT}
                                        </DefaultText>
                                    </View>
                                    <DefaultTextInput
                                        value={directions}
                                        onChangeText={handleDirectionsChange}
                                        style={styles.directionsInput}
                                        placeholder="Add specific instructions..."
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                        onFocus={() => {
                                            // Clear any existing timeout
                                            if (scrollTimeoutRef.current) {
                                                clearTimeout(scrollTimeoutRef.current);
                                            }
                                            
                                            // Scroll to input after keyboard appears
                                            scrollTimeoutRef.current = setTimeout(() => {
                                                scrollRef.current?.scrollToEnd({ animated: true });
                                            }, 300);
                                        }}
                                    />
                                </View>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>

                {/* Bottom Actions */}
                <View style={styles.bottomContainer}>
                    <DefaultButton
                        isActive={hasChanges}
                        disabled={saving || !hasChanges}
                        title={saving ? 'Saving...' : (isEditMode ? 'Save changes' : 'Add to routine')}
                        onPress={handleSave}
                        style={!hasChanges && !saving ? styles.disabledButton : undefined}
                        extraStyles={!hasChanges && !saving ? { text: styles.disabledButtonText } : undefined}
                        endAdornment={
                            !saving && hasChanges && (
                                <FontAwesome6 name="check" size={20} color="white" />
                            )
                        }
                    />
                    
                    {isEditMode && (
                        <DefaultButton
                            title='Remove from routine'
                            onPress={handleDelete}
                            style={styles.deleteButton}
                        />
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.screen,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: DefaultStyles.container.paddingHorizontal,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.accents.stroke,
    },
    editHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
        paddingTop: DefaultStyles.container.paddingHorizontal,
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: colors.background.light,
    },
    headerTitle: {
        fontSize: DefaultStyles.text.caption.large,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    editHeaderTitle: {
        fontSize: DefaultStyles.text.caption.xlarge,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    closeButton: {
        width: 40,
        height: 40,
        backgroundColor: colors.background.light,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 60, // Extra padding for keyboard
    },
    content: {
        padding: DefaultStyles.container.paddingHorizontal,
        gap: 20,
    },
    selectorContainer: {
        gap: 12,
    },
    selectorLabel: {
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    selectorOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    selectorOption: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.accents.stroke,
        backgroundColor: colors.background.screen,
        alignItems: 'center',
    },
    selectorOptionActive: {
        backgroundColor: colors.background.primary,
        borderColor: colors.background.primary,
    },
    selectorOptionText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    selectorOptionTextActive: {
        color: colors.text.primary,
        fontWeight: '600',
    },
    directionsContainer: {
        gap: 12,
    },
    directionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    directionsLabel: {
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    wordCountText: {
        fontSize: DefaultStyles.text.caption.xsmall,
        color: colors.text.tertiary,
        fontWeight: '500',
    },
    wordCountWarning: {
        color: colors.accents.warning,
    },
    directionsInput: {
        fontSize: DefaultStyles.text.caption.small,
        minHeight: 100,
        padding: DefaultStyles.container.paddingTop,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        borderRadius: 12,
        backgroundColor: colors.background.screen,
    },
    bottomContainer: {
        paddingVertical:16,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
        paddingBottom: DefaultStyles.container.paddingBottom,
        borderTopWidth: 1.5,
        borderTopColor: colors.accents.stroke,
        backgroundColor: colors.background.screen,
        gap: 14,
    },
    deleteButton: {
        backgroundColor:colors.accents.error,
        color:'#fff'
    },
    disabledButton: {
        backgroundColor: colors.accents.stroke,
        color:colors.text.secondary
    },
    deleteText: {
        fontSize: DefaultStyles.text.caption.small,
        color: '#fff',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DefaultStyles.container.paddingHorizontal,
        gap: 20,
    },
    errorText: {
        fontSize: DefaultStyles.text.title.small,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    menuTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        backgroundColor: colors.background.screen,
    },
    menuTriggerText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        fontWeight: '500',
    },
});

export default EditRoutineItemScreen;