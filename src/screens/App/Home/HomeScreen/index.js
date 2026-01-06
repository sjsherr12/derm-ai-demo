import IconButton from "components/Buttons/IconButton";
import DefaultTabHeader from "components/Containers/DefaultTabHeader";
import FadeScaleView from "components/Containers/FadeScaleView";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { useAuth } from "context/global/AuthContext";
import { deleteUser, signOut } from "firebase/auth";
import { useCallback, useEffect, useState, memo } from "react";
import { auth } from "services/firebase/firebase";
import { useFocusEffect } from "@react-navigation/native";
import { getUserFirstName } from "utils/user";
import HomeScreenHeader from "./header";
import {collection, getDocs, getFirestore, query, serverTimestamp, where} from 'firebase/firestore'
import { Genders } from "constants/signup";
import { db } from "services/firebase/firebase";
import HomeScreenScanShortcut from "./scanShortcut";
import HomeScreenRoutineShortcut from "./routineShortcut";
import HomeScreenUpdateSkinProfileShortcut from "./skinProfileShortcut";
import HomeScreenAnalysisSummaryShortcut from "./analysisShortcut";
import useRoutineLoader from "context/global/useRoutineLoader";
import { RoutineProductTypes } from "constants/products";
import { useData } from "context/global/DataContext";
import { getRoutineTimeOfDay } from "utils/routine";
import useAnalysisLoader from "context/global/useAnalysisLoader";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";

const { View, Text, Button, StyleSheet, Image, ScrollView } = require("react-native")

const HomeScreen = ({
    navigation
}) => {
    const {fetchRoutineProducts} = useRoutineLoader();
    const {routineProducts} = useData();
    const { checkScanEligibility } = useAnalysisLoader();
    const safeAreaStyles = useSafeAreaStyles();
    const [scanEligibility, setScanEligibility] = useState(null);
    const currentRoutineType = getRoutineTimeOfDay()
    const isMorningRoutine = currentRoutineType === RoutineProductTypes.indexOf('Morning')
    const routine = routineProducts?.filter(rp => rp?.routineInfo?.routineType === currentRoutineType)

    const summary = {
        concerns: [
            {
                title:'Acne',
                status:'Improving',
                severity:.75,
                severityColor:'#005500',
            },
            {
                title:'Dryness',
                status:'Stable',
                severity:.5,
                severityColor:'#333333',
            },
            {
                title:'Oiliness',
                status:'Good',
                severity:.4,
                severityColor:'#00ff00'
            }
        ],
        highlight: {
            title:'Skin Texture Improved',
            description:'Your consistent routine is showing results!'
        },
        tip: {
            title:'Hydration Tip',
            description:'Consider adding a hyaluronic acid serum.'
        }
    }

    useEffect(() => {
        const getRoutine = async () => {
            if (!routineProducts) {
                await fetchRoutineProducts()
            }
        }

        const getScanEligibility = async () => {
            try {
                const eligibility = await checkScanEligibility();
                setScanEligibility(eligibility);
            } catch (error) {
                console.error('Error checking scan eligibility on Home screen:', error);
            }
        }

        getRoutine();
        getScanEligibility();
    }, [])

    // Refresh scan eligibility when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const getScanEligibility = async () => {
                try {
                    const eligibility = await checkScanEligibility();
                    setScanEligibility(eligibility);
                } catch (error) {
                    console.error('Error checking scan eligibility on Home screen focus:', error);
                }
            }
            getScanEligibility();
        }, [checkScanEligibility])
    );

    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}
        >
            <HomeScreenHeader />
            <ScrollView
                contentContainerStyle={[
                    {
                        padding: 16,
                        gap: 16,
                    },
                    safeAreaStyles.safeAreaBottomWithTabBar
                ]}
            >
                <HomeScreenScanShortcut
                    scanEligibility={scanEligibility}
                />

                <HomeScreenRoutineShortcut
                    isMorningRoutine={isMorningRoutine}
                    products={routine}
                    length={3}
                />

                <HomeScreenUpdateSkinProfileShortcut/>

                <HomeScreenAnalysisSummaryShortcut
                    timeSinceLastScan={504836944}
                    summarizedData={summary}
                />
            </ScrollView>
        </View>
    )
}

export default memo(HomeScreen);

const styles = StyleSheet.create({

})