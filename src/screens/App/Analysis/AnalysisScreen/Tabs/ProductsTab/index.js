import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { useData } from "context/global/DataContext";
import { StyleSheet, View, Modal, Pressable, Animated } from "react-native";
import { useMemo,  } from "react";
import AnalysisScreenProductsTabNoProductRecommendationsAvailable from "./noProducts";
import { SkincareProductCategories } from "../../../../../../constants/products";
import AnalysisScreenCategoryScreenShortcut from "../../../CategoryScreen/shortcut";
import {Ionicons} from '@expo/vector-icons'
import useScalePressAnimation from "../../../../../../hooks/useScalePressAnimation";
import { useNavigation } from "@react-navigation/native";
import AnalysisScreenProductsTabCategorizedRecommendations from "./categorized";

const RoutineRecommendationsInfoBlock = () => (
    <View
        style={styles.itemContainer}
    >
        <View
            style={styles.flexContainer}
        >
            <DefaultText
                style={styles.title}
            >
                Routine Recommendations
            </DefaultText>

            <Ionicons
                name='information-circle-outline'
                size={24}
                color={colors.text.secondary}
                style={{
                    marginLeft:'auto'
                }}
            />
        </View>
        <DefaultText
            style={styles.text}
        >
            Based on your analysis, we've curated product categories specifically for you. Each category contains products that target your skin needs and work well with your skin type.
        </DefaultText>
    </View>
)

const RoutineRecommendationHistoryShortcut = () => {

    const navigation = useNavigation();
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('RecommendationHistory')}
        >
            <Animated.View
                style={[
                    styles.itemContainer,
                    {transform:[{scale}]}
                ]}
            >
                <View
                    style={styles.flexContainer}
                >
                    <View
                        style={{
                            flex:1,
                            gap:8
                        }}
                    >
                        <DefaultText
                            style={styles.title}
                        >
                            Recommendation History
                        </DefaultText>

                        <DefaultText
                            style={styles.text}
                        >
                            View all products that were previously recommended for your routine.
                        </DefaultText>
                    </View>

                    <Ionicons
                        name='chevron-forward'
                        size={24}
                        color={colors.text.secondary}
                    />
                </View>
            </Animated.View>
        </Pressable>
    )
}

const AnalysisScreenProductsTab = ({
    routineRecommendations,
}) => {
    return (
        <View
            style={styles.container}
        >
            <RoutineRecommendationsInfoBlock
            />

            <AnalysisScreenProductsTabCategorizedRecommendations
                routineRecommendations={routineRecommendations}
            />

            <RoutineRecommendationHistoryShortcut
            />
        </View>
    )
}

export default AnalysisScreenProductsTab;

const styles = StyleSheet.create({
    container: {
        gap:16,
    },
    flexContainer: {
        gap:16,
        flexDirection:'row',
        alignItems:'center'
    },
    itemContainer: {
        padding:DefaultStyles.container.paddingBottom,
        gap:12,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'600',
        color:colors.text.dark
    },
    helper: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600',
        color:colors.background.primary,
    },
    text: {
        fontSize:14,
        color:colors.text.darker,
        lineHeight:20
    },
    description: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        lineHeight:20,
        textAlign:'left',
    },
})