import DefaultStyles from "config/styles";
import RoutineScreenHeader from "./header";
import TopTabBar from "components/Options/TopTabBar";
import DefaultBottomSheet from "components/Containers/DefaultBottomSheet";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
const { View, Text, Button, StyleSheet, Image, ScrollView, RefreshControl, Modal, Pressable, Alert, TouchableWithoutFeedback } = require("react-native")
import RoutineScreenStreakProgress from "./streakProgress";
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import RoutineScreenStreakCalendar from "./streakCalendar";
import RoutineScreenRoutineProduct from "./routineProduct";
import DefaultButton from "components/Buttons/DefaultButton";
import {Ionicons, FontAwesome6} from '@expo/vector-icons'
import colors from "config/colors";
import { useData } from "context/global/DataContext";
import { useAuth } from "context/global/AuthContext";
import Skeleton from "components/Common/Skeleton";
import { RoutineProductTypes, SkincareProductCategories } from "constants/products";
import { SkincareRoutineOrderByCategory } from "constants/routine";
import FadeScaleView from "components/Containers/FadeScaleView";
import useRoutineLoader from "context/global/useRoutineLoader";
import { getRoutineCompletionStatus, calculateIndividualStreak } from "utils/routine";
import { completeRoutine, getIndividualCompletedDaysForCalendar, isRoutineCompletedToday } from "utils/streaks";
import EmptyRoutineGraphic from "components/Graphics/EmptyRoutineGraphic";
import { useNavigation, useRoute } from "@react-navigation/native";
import { deleteRoutineProduct } from "utils/routineProducts";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { darken } from "../../../../utils/darken";
import DefaultText from "../../../../components/Text/DefaultText";
import IconButton from "../../../../components/Buttons/IconButton";

const RoutineScreen = ({
}) => {
    const route = useRoute();
    const navigation = useNavigation();
    const safeAreaStyles = useSafeAreaStyles();
    const {fetchRoutineProducts} = useRoutineLoader();
    const {
        routineProducts,
        setRoutineProducts,
        routineCompletions, 
        fetchRoutineCompletions, 
        updateRoutineCompletions
    } = useData();
    const {user} = useAuth();

    const [tab, setTab] = useState(route?.params?.initialTab ?? RoutineProductTypes.indexOf('Morning'))
    const [refreshing, setRefreshing] = useState(false)
    const [streakDisplaying, setStreakDisplaying] = useState(false);
    const [confirmingCompletion, setConfirmingCompletion] = useState(false);

    const routine = routineProducts?.filter(rp => rp?.routineInfo?.routineType !== (!tab + 0))
    const isCurrentRoutineEmpty = !routine || routine.length === 0;

    const routineCompletionStatus = getRoutineCompletionStatus(
        routineCompletions.morningRoutine,
        routineCompletions.eveningRoutine,
        tab
    );
    
    const selectedRoutineTabCompleted = routineCompletionStatus === 'completed';
    const completeRoutineDisabled = selectedRoutineTabCompleted;

    const currentTabCompletions = tab === 0 ? routineCompletions.morningRoutine : routineCompletions.eveningRoutine;
    const currentStreak = calculateIndividualStreak(currentTabCompletions);
    
    const completedDays = getIndividualCompletedDaysForCalendar(currentTabCompletions);

    const handleRefresh = async () => {
        setRefreshing(true);
        
        await Promise.all([
            fetchRoutineProducts(),
            fetchRoutineCompletions()
        ]);
        
        setTimeout(() => {
            setRefreshing(false)
        }, 1000)
    }
    
    const handleCompleteRoutine = async () => {
        if (!user || completeRoutineDisabled) return;

        try {
            // Optimistically update UI immediately
            const timestamp = new Date().toISOString();
            updateRoutineCompletions(tab, timestamp);
            setConfirmingCompletion(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Write to Firestore in background (non-blocking)
            completeRoutine(user.uid, tab).catch(error => {
                console.error('Error completing routine:', error);
                // Optionally revert the optimistic update here if needed
            });
        } catch (error) {
            console.error('Error completing routine:', error);
            setConfirmingCompletion(false);
        }
    };

    const handleCompleteRoutinePress = useCallback(() => {
        if (!user || completeRoutineDisabled) return;
        
        if (confirmingCompletion) {
            // Second tap - complete the routine
            handleCompleteRoutine();
        } else {
            // First tap - enter confirmation state
            setConfirmingCompletion(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            
            // Auto-revert after 3 seconds
            setTimeout(() => {
                setConfirmingCompletion(false);
            }, 3000);
        }
    }, [confirmingCompletion, user, completeRoutineDisabled, tab]);

    const handleAddProduct = () => {
        navigation.navigate('AddProductModal', {
            screen: 'AddProductSelect',
            params: {
                routineType: tab,
            }
        });
    };

    const handleDeleteRoutineProduct = async (routineProductId) => {
        if (!user || !routineProductId) return;
        
        try {
            await deleteRoutineProduct(user.uid, routineProductId);
            
            // Remove from local state
            if (routineProducts && setRoutineProducts) {
                const updatedProducts = routineProducts.filter(item => 
                    item.routineInfo.id !== routineProductId
                );
                setRoutineProducts(updatedProducts);
            }
            
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.error('Error deleting routine product:', error);
        }
    };
        
    useEffect(() => {
        const getRoutine = async () => {
            if (!routineProducts) {
                await fetchRoutineProducts()
            }
            await fetchRoutineCompletions();
        }

        getRoutine();
    }, [])

    useEffect(() => {
        // Handle refresh when returning from add product flow
        if (route?.params?.refresh) {
            fetchRoutineProducts();
            fetchRoutineCompletions();
            
            // Set the selected tab if provided
            if (route?.params?.selectedTab !== undefined) {
                setTab(route?.params?.selectedTab);
            }
            
            // Clear the params to prevent unnecessary re-renders
            navigation.setParams({ refresh: false, selectedTab: undefined });
        }
    }, [route?.params?.refresh, route?.params?.selectedTab]);

    // Reset confirmation state when tab changes
    useEffect(() => {
        setConfirmingCompletion(false);
    }, [tab]);
    
    const handleCancelConfirmation = () => {
        if (confirmingCompletion) {
            setConfirmingCompletion(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={handleCancelConfirmation}>
                <View
                    style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}
                >
                    <RoutineScreenHeader
                        activeTab={tab}
                        toggleStreakDisplay={() => setStreakDisplaying((prev => !prev))}
                        currentStreak={currentStreak}
                    />

                    <ScrollView
                        contentContainerStyle={[
                            {
                                padding: 16,
                                gap: 16,
                            },
                            safeAreaStyles.safeAreaBottomWithTabBar
                        ]}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                    >

                    <RoutineScreenStreakCalendar
                        completedDays={completedDays}
                        morningCompletions={routineCompletions.morningRoutine}
                        eveningCompletions={routineCompletions.eveningRoutine}
                        selectedTab={tab}
                    />
                    
                    <TopTabBar
                        tabs={RoutineProductTypes}
                        activeTab={tab}
                        onChange={setTab}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    />
                    
                    <FadeScaleView
                        key={tab}
                        style={styles.routineProductsContainer}
                    >
                        {isCurrentRoutineEmpty ? (
                            <>
                                <EmptyRoutineGraphic 
                                    isMorningRoutine={tab === 0}
                                    size="large"
                                    showText={true}
                                />
                                <DefaultButton
                                    isActive
                                    onPress={handleAddProduct}
                                    title="Add Products"
                                    endAdornment={
                                        <FontAwesome6
                                            name="plus"
                                            color={colors.text.primary}
                                            size={22}
                                        />
                                    }
                                />
                            </>
                        ) : (
                            <>
                                {(routine || Array.from({length:4}))?.map((rp, idx) => (
                                    <RoutineScreenRoutineProduct
                                        key={idx}
                                        productInfo={rp?.productInfo}
                                        routineInfo={rp?.routineInfo}
                                        displayDirections
                                        badge={`Step ${idx+1}`}
                                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                        isCompleted={selectedRoutineTabCompleted}
                                        onPress={() => navigation.navigate('EditRoutineItem', {
                                            mode:'edit',
                                            productId: rp?.productInfo?.id,
                                            routineItem:rp,
                                            routineType:0,
                                        })}
                                        onDelete={rp?.routineInfo?.id ? handleDeleteRoutineProduct : undefined}
                                    />
                                ))}

                                {routine? (
                                    <Pressable onPress={(e) => e.stopPropagation()}>
                                        <DefaultButton
                                            isActive={!completeRoutineDisabled}
                                            disabled={completeRoutineDisabled}
                                            onPress={handleCompleteRoutinePress}
                                            title={confirmingCompletion ?
                                                `Tap again to confirm` :
                                                selectedRoutineTabCompleted?
                                                    `Routine Completed` :
                                                    `Complete Routine`
                                            }
                                            endAdornment={
                                                completeRoutineDisabled ? (
                                                    <FontAwesome6
                                                        name="check"
                                                        size={22}
                                                        color={colors.text.primary}
                                                    />
                                                ) : confirmingCompletion ? (
                                                    <Ionicons
                                                        name="checkmark-circle-outline"
                                                        size={22}
                                                        color={colors.accents.success}
                                                    />
                                                ) : null
                                            }
                                            extraStyles={completeRoutineDisabled ? {
                                                button: {
                                                    backgroundColor: colors.background.secondary,
                                                },
                                                text: {
                                                    color: colors.text.primary,
                                                }
                                            } : confirmingCompletion ? {
                                                button: {
                                                    backgroundColor: colors.accents.success,
                                                    borderColor: colors.accents.success,
                                                },
                                                text: {
                                                    color: colors.text.primary,
                                                }
                                            } : {}}
                                            hapticType={Haptics.ImpactFeedbackStyle.Light}
                                        />
                                    </Pressable>
                                ) : (
                                    <Skeleton width='100%' height={60} borderRadius={12} />
                                )}
                            </>
                        )}

                    </FadeScaleView>
                </ScrollView>

                <Modal
                    visible={streakDisplaying}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setStreakDisplaying(false)}
                >
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setStreakDisplaying(false)}
                    >
                        <Pressable
                            style={styles.modalContent}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <RoutineScreenStreakProgress
                                currentStreak={currentStreak}
                                morningCompletions={routineCompletions.morningRoutine}
                                eveningCompletions={routineCompletions.eveningRoutine}
                                selectedTab={tab}
                                onClose={() => setStreakDisplaying(false)}
                            />
                        </Pressable>
                    </Pressable>
                </Modal>
                </View>
            </TouchableWithoutFeedback>
        </GestureHandlerRootView>
    )
}

export default memo(RoutineScreen);

const styles = StyleSheet.create({
    routineProductsContainer: {
        padding:4,
        gap:20,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.background.screen,
        borderRadius: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    }
})