import { ScrollView, View } from "react-native";
import { useData } from "../../../../context/global/DataContext"
import { useSafeAreaStyles } from "../../../../hooks/useSafeAreaStyles";
import DefaultStyles from "../../../../config/styles";
import RecommendationHistoryScreenHeader from "./header";
import React from "react";
import EmptyComponentGeneric from "../../../../components/Graphics/EmptyGeneric";
import RecommendationHistoryShortcut from "./shortcut";

const RecommendationHistoryScreen = ({

}) => {
    const {diagnoses, routineRecommendations} = useData();
    const safeAreaStyles = useSafeAreaStyles();

    const diagnosesWithRecommendations = diagnoses?.filter(
        diagnosis => diagnosis?.routineRecommendations
    )?.sort((dA, dB) => dB.createdAt - dA.createdAt).slice(1);

    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}
        >
            <RecommendationHistoryScreenHeader
            />

            <ScrollView
                style={DefaultStyles.scrollContainer}
            >
                {diagnosesWithRecommendations?.length && diagnosesWithRecommendations?.map((diagnosis, idx) => (
                    <RecommendationHistoryShortcut
                        key={idx}
                        diagnosis={diagnosis}
                    />
                )) || (
                    <EmptyComponentGeneric
                        icon='list-outline'
                        size={64}
                        title={'No recommendations'}
                        description={'You have no recommendation history. Take more scans to get more routine recommendations!'}
                    />
                )}
            </ScrollView>
        </View>
    )
}

export default RecommendationHistoryScreen;