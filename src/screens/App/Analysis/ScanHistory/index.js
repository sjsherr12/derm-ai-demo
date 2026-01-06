import DefaultStyles from "config/styles";
import { ScrollView, View } from "react-native";
import ScanHistoryScreenHeader from "./header";
import { useData } from "context/global/DataContext";
import AnalysisScreenScanShortcut from "../AnalysisScreen/shortcut";
import AnalysisScreenNoScansAvailable from "../AnalysisScreen/noScans";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";

const ScanHistoryScreen = () => {
    const safeAreaStyles = useSafeAreaStyles();
    const { userData, diagnoses } = useData();

    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}
        >
            <ScanHistoryScreenHeader
            />

            <ScrollView
                contentContainerStyle={[
                    {
                        padding: 16,
                        gap: 16,
                    },
                    safeAreaStyles.safeAreaBottomWithTabBar
                ]}
            >
                    {diagnoses?.length? diagnoses.map((diagnosis, idx) => (
                        <AnalysisScreenScanShortcut
                            key={idx}
                            userData={userData}
                            diagnosis={diagnosis}
                        />
                    )) : <AnalysisScreenNoScansAvailable />}
            </ScrollView>
        </View>
    )
}

export default ScanHistoryScreen;