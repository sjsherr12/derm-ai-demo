import FadeScaleView from "components/Containers/FadeScaleView";
import DefaultStyles from "config/styles";
import { signOut } from "firebase/auth";
import React, { useCallback, useEffect, useState, memo, useMemo, useRef } from "react";
import { auth } from "services/firebase/firebase";
import { useFocusEffect } from "@react-navigation/native";
import AnalysisScreenHeader from "./header";
import { useData } from "context/global/DataContext";
import useAnalysisLoader from "context/global/useAnalysisLoader";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import { StyleSheet, ActivityIndicator, Image, Pressable, RefreshControl } from "react-native";
import CompressedProductItem from "components/Products/CompressedProductItem";
import Skeleton from "components/Common/Skeleton";
import TopTabBar from "components/Options/TopTabBar";
import * as Haptics from 'expo-haptics'
import AnalysisScreenScanTab from "./Tabs/ScansTab";
import AnalysisScreenProductsTab from "./Tabs/ProductsTab";
import AnalysisScreenNoScansAvailable from "./noScans";
import AnalysisScreenProgressTab from "./Tabs/ProgressTab";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";

const { View, Text, Button, ScrollView } = require("react-native")

const AnalysisScreenTabs = {
    Analysis: 0,
    Products: 1,
    Progress: 2,
}

// Memoized tab content components
const MemoizedAnalysisTab = memo(({ diagnoses, scanEligibility, latestScan, analysisLoading, scanEligibilityLoading, hasNoScans, severityTrends, analysisStats, pendingScan, pendingScanProgress }) => (
    <>
        <AnalysisScreenScanTab
            diagnoses={diagnoses}
            scanEligibility={scanEligibility}
            latestScan={latestScan}
            analysisLoading={analysisLoading}
            scanEligibilityLoading={scanEligibilityLoading}
            hasNoScans={hasNoScans}
            pendingScan={pendingScan}
            pendingScanProgress={pendingScanProgress}
        />
    </>
), (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    // IMPORTANT: Always allow re-render if pendingScanProgress changes (for smooth animation)
    if (prevProps.pendingScanProgress !== nextProps.pendingScanProgress) {
        return false; // Re-render
    }

    return (
        prevProps.diagnoses?.length === nextProps.diagnoses?.length &&
        prevProps.scanEligibility === nextProps.scanEligibility &&
        prevProps.latestScan?.id === nextProps.latestScan?.id &&
        prevProps.analysisLoading === nextProps.analysisLoading &&
        prevProps.scanEligibilityLoading === nextProps.scanEligibilityLoading &&
        prevProps.hasNoScans === nextProps.hasNoScans &&
        prevProps.pendingScan === nextProps.pendingScan
    );
});

const MemoizedProductsTab = memo(({ routineRecommendations, scanRecommendations, recommendationsLoading }) => (
    <AnalysisScreenProductsTab
        routineRecommendations={routineRecommendations}
        scanRecommendations={scanRecommendations}
        recommendationsLoading={recommendationsLoading}
    />
));

const MemoizedProgressTab = memo(({severityTrends}) => (
    <AnalysisScreenProgressTab
        severityTrends={severityTrends}
    />
))

const AnalysisScreen = () => {
    const {
        userData,
        diagnoses,
        mostRecentDiagnosis,
        severityTrends,
        analysisStats,
        analysisLoading,
        notifications,

        routineRecommendations,
        scanRecommendations,
        recommendationsLoading,

        pendingScan,
        pendingScanProgress,
    } = useData();

    const { 
        refreshAnalysisData, 
        checkScanEligibility
    } = useAnalysisLoader();

    const safeAreaStyles = useSafeAreaStyles();
    const [tab, setTab] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const [scanEligibility, setScanEligibility] = useState(null);
    const [scanEligibilityLoading, setScanEligibilityLoading] = useState(true);
    const [mountedTabs, setMountedTabs] = useState({ 0: true }); // Track which tabs have been mounted

    // Mount tab when it becomes active
    useEffect(() => {
        if (!mountedTabs[tab]) {
            setMountedTabs(prev => ({ ...prev, [tab]: true }));
        }
    }, [tab]);

    // Memoize computed values to prevent unnecessary re-renders
    const hasNoScans = useMemo(() => {
        // Only consider hasNoScans true if we've finished loading and have no data
        return !analysisLoading && (!diagnoses || diagnoses.length === 0);
    }, [diagnoses, analysisLoading]);

    // Load analysis data only on mount
    useEffect(() => {
        let isMounted = true;
        
        const loadInitialData = async () => {
            if (!isMounted) return;
            
            // Only load if we don't have diagnoses data yet and not currently loading
            if (!diagnoses?.length && !analysisLoading) {
                await refreshAnalysisData();
            }
            
            if (!isMounted) return;
            
            // Always check scan eligibility on mount
            setScanEligibilityLoading(true);
            const eligibility = await checkScanEligibility();
            if (isMounted) {
                setScanEligibility(eligibility);
                setScanEligibilityLoading(false);
            }
        };
        
        loadInitialData();
        
        return () => {
            isMounted = false;
        };
    }, []); // Remove dependencies to prevent loops

    // Only refresh scan eligibility when screen comes into focus (but not on initial mount)
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Skip the focus effect on initial mount to prevent double loading
            if (!hasMounted) return;

            const refreshEligibility = async () => {
                // Don't show loading state - just update data silently
                const eligibility = await checkScanEligibility();
                setScanEligibility(eligibility);
            };
            refreshEligibility();
        }, [checkScanEligibility, hasMounted])
    );

    // Listen for when pendingScan clears (scan complete) and refresh data
    const prevPendingScanRef = useRef(pendingScan);
    useEffect(() => {
        const hadPendingScan = prevPendingScanRef.current;
        const nowHasPendingScan = pendingScan;

        // If we had a pending scan and now we don't (it completed), refresh
        if (hadPendingScan && !nowHasPendingScan) {
            refreshAnalysisData();
            checkScanEligibility().then(eligibility => setScanEligibility(eligibility));
        }

        prevPendingScanRef.current = pendingScan;
    }, [pendingScan, refreshAnalysisData, checkScanEligibility]);

    // Manual refresh function for pull-to-refresh or manual triggers
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        setScanEligibilityLoading(true);
        
        try {
            await refreshAnalysisData();
            const eligibility = await checkScanEligibility();
            setScanEligibility(eligibility);
        } finally {
            setScanEligibilityLoading(false);
            setRefreshing(false);
        }
    }, [refreshAnalysisData, checkScanEligibility]);

    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}
        >
            <AnalysisScreenHeader
                notifications={notifications}
            />

            <FadeScaleView
                style={[
                    styles.topTabBarContainer,
                    {
                        display:analysisLoading || diagnoses?.length > 0 ? 'flex' : 'none'
                    }
                ]}
            >
                <TopTabBar
                    tabs={Object.entries(AnalysisScreenTabs).map(([key, value], idx) => key)}
                    activeTab={tab}
                    onChange={setTab}
                    hapticType={Haptics.ImpactFeedbackStyle.Soft}
                />
            </FadeScaleView>

            <ScrollView
                style={{
                    paddingTop:0,
                }}
                contentContainerStyle={[
                    {
                        padding: 16,
                        gap: 16,
                    },
                    safeAreaStyles.safeAreaBottomWithTabBar
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing} 
                        onRefresh={handleRefresh} 
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {mountedTabs[AnalysisScreenTabs.Analysis] && (
                    <View style={tab === AnalysisScreenTabs.Analysis ? styles.activeTab : styles.hiddenTab}>
                        <MemoizedAnalysisTab
                            diagnoses={diagnoses}
                            scanEligibility={scanEligibility}
                            latestScan={mostRecentDiagnosis}
                            analysisLoading={analysisLoading}
                            scanEligibilityLoading={scanEligibilityLoading}
                            hasNoScans={hasNoScans}
                            severityTrends={severityTrends}
                            analysisStats={analysisStats}
                            pendingScan={pendingScan}
                            pendingScanProgress={pendingScanProgress}
                        />
                    </View>
                )}
                {mountedTabs[AnalysisScreenTabs.Products] && (
                    <View style={tab === AnalysisScreenTabs.Products ? styles.activeTab : styles.hiddenTab}>
                        <MemoizedProductsTab
                            routineRecommendations={routineRecommendations}
                            scanRecommendations={scanRecommendations}
                            recommendationsLoading={recommendationsLoading}
                        />
                    </View>
                )}
                {mountedTabs[AnalysisScreenTabs.Progress] && (
                    <View style={tab === AnalysisScreenTabs.Progress ? styles.activeTab : styles.hiddenTab}>
                        <MemoizedProgressTab
                            severityTrends={severityTrends}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Tab visibility styles
    activeTab: {
        flex: 1,
        gap:16,
    },
    hiddenTab: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        opacity: 0,
        pointerEvents: 'none',
    },
    topTabBarContainer: {
        padding:DefaultStyles.container.paddingBottom,
        paddingBottom:0,
    },
});

export default memo(AnalysisScreen);