import DefaultText from "components/Text/DefaultText"
import colors from "config/colors"
import {Ionicons} from '@expo/vector-icons'
import { useRoute } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import { IngredientSafetyRatings } from "constants/ingredients"
const { default: DefaultStyles } = require("config/styles")
const { View, ScrollView, StyleSheet, Text } = require("react-native")
const { default: IngredientsScreenHeader } = require("./header")

const IngredientsScreen = ({
}) => {
    const route = useRoute();
    const {ingredients} = route?.params;

    return (
        <View style={DefaultStyles.outer}>
            <SafeAreaView
                style={DefaultStyles.safeArea}
                edges={['top']}
            >
                <IngredientsScreenHeader/>

                <ScrollView
                    contentContainerStyle={DefaultStyles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={styles.itemContainer}
                    >
                        <Ionicons
                            name='information-circle-outline'
                            color={colors.text.secondary}
                            size={24}
                        />
                        <DefaultText
                            style={styles.text}
                        >
                            The ingredients are listed in the exact order they appear on the product’s packaging label.
                        </DefaultText>
                    </View>

                    <DefaultText style={styles.largerText}>
                        {ingredients?.map((ing, idx) => {
                            const safetyColor = ing?.safetyScore > 1
                                ? IngredientSafetyRatings.find(rating => rating.value === ing.safetyScore)?.color
                                : undefined;

                            return (
                                <DefaultText key={idx} style={safetyColor ? {color: safetyColor} : undefined}>
                                    {ing?.name}{idx < ingredients?.length - 1 ? ', ' : ''}
                                </DefaultText>
                            );
                        }) ?? 'No ingredients found'}.
                    </DefaultText>
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

export default IngredientsScreen;

const styles = StyleSheet.create({
    itemContainer: {
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:12,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        gap:16,
        flexDirection:'row',
        alignItems:'center',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.large,
        color:colors.text.secondary,
        fontWeight:'600'
    },
    largerText: {
        fontWeight:'500',
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        lineHeight:22,
    },
    text: {
        flex:1,
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
    },
})