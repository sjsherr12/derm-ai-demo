import IconButton from "components/Buttons/IconButton";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { CommonIngredientConcerns } from "constants/ingredients";
import { ProductSafetyRatings } from "constants/products";
import * as Haptics from 'expo-haptics'
import { darken } from "utils/darken";
import { lighten } from "utils/lighten";

const { View, StyleSheet } = require("react-native")

const ProductScreenScoringMethodExplanation = ({
    onClose
}) => {

    return (
        <View
            style={styles.container}
        >
            <View
                style={styles.flexContainer}
            >
                <DefaultText
                    style={styles.title}
                >
                    Scoring Method
                </DefaultText>

                <IconButton
                    style={styles.iconButton}
                    icon='close'
                    size={16}
                    color={colors.text.darker}
                    onPress={onClose}
                />
            </View>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    How We Rate Products
                </DefaultText>

                <DefaultText
                    style={styles.text}
                >
                    At Derm AI, we evaluate skincare products based on the quality and function of their ingredients. Each ingredient is carefully analyzed for its safety, efficacy, and role in skincare—such as soothing, brightening, or supporting the skin barrier.
                    {'\n\n'}
                    Products are then scored using a custom algorithm that weighs these ingredient functions, prioritizing those most beneficial to your skin goals. The result is a clear rating from 0 to 100 that helps you quickly gauge how well a product is likely to perform.
                </DefaultText>
            </View>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    Rating Categories
                </DefaultText>

                {ProductSafetyRatings.map((rating, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.flexContainer,
                            styles.ratingCategoryContainer,
                            // First item: reduce top padding since title has margin
                            idx === 0 && styles.ratingCategoryFirst,
                            // Last item: remove bottom padding
                            idx === ProductSafetyRatings?.length-1 && styles.ratingCategoryLast,
                            // Border for all except last
                            (idx < ProductSafetyRatings?.length-1) && {
                                borderBottomWidth:1,
                                borderBottomColor:colors.accents.stroke,
                            }
                        ]}
                    >
                        <View
                            style={{
                                borderRadius:64,
                                borderWidth:6,
                                borderColor:rating?.color,
                                padding:6,      
                            }}
                        />
                        <DefaultText
                            style={styles.smallTitle}
                        >
                            {rating.name} ({rating.min} - {rating.max})
                        </DefaultText>
                    </View>
                ))}
            </View>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.caption}
                >
                    How We Assess Ingredients
                </DefaultText>

                <DefaultText
                    style={styles.text}
                >
                    Each ingredient is analyzed based on its function, effectiveness, and how it interacts with the skin. We consider both scientific research and dermatological relevance to determine how helpful or harmful an ingredient may be. To assess the overall safety of product ingredients, we evaluate them according to the following criteria.
                </DefaultText>
            </View>

            <View
                style={styles.concernsContainer}
            >
                {CommonIngredientConcerns.map((concern, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.flexContainer,
                            {
                                paddingVertical:DefaultStyles.container.paddingBottom,
                            },
                            (idx !== CommonIngredientConcerns?.length-1) && {
                                borderBottomColor:colors.text.primary,
                                borderBottomWidth:0.5,
                            },
                        ]}
                    >
                        <View
                            style={{
                                padding:10,
                                borderRadius:16,
                                backgroundColor:lighten(colors.background.primary, .2),
                            }}
                        >
                            <concern.IconComponent
                                name={concern.icon}
                                size={32}
                                color={colors.text.primary}
                            />
                        </View>
                        <View
                            style={{
                                gap:4,
                                flex:1,
                            }}                        
                        >
                            <DefaultText
                                style={[
                                    styles.smallTitle,
                                    {
                                        fontWeight:'600',
                                        color:colors.text.primary
                                    }
                                ]}
                            >
                                {concern.name}
                            </DefaultText>
                            <DefaultText
                                style={[
                                    styles.text,
                                    {color:colors.text.primary}
                                ]}
                            >
                                {concern.description}
                            </DefaultText>
                        </View>
                    </View>
                ))}
            </View>

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.text}
                >
                    *Derm AI does not partner with any company or brand, so the rankings we provide are completely unbiased and represent accurate product scores. 
                </DefaultText>
            </View>
        </View>
    )
}

export default ProductScreenScoringMethodExplanation;

const styles = StyleSheet.create({
    container: {
        gap:24,
        flex:1,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        backgroundColor:colors.background.screen,
    },
    flexContainer: {
        gap:14,
        flex:1,
        flexDirection:'row',
        alignItems:'center',
    },
    ratingCategoryContainer: {
        paddingTop: 4,
        paddingBottom:14,
    },
    ratingCategoryFirst: {
        paddingTop: 6, // Reduced top padding since title has margin
    },
    ratingCategoryLast: {
        paddingBottom: 0, // No bottom padding for last item
    },
    itemContainer: {
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        gap:10,
    },
    concernsContainer: {
        backgroundColor:colors.background.primary,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
        borderRadius:16,
    },
    title: {
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.secondary,
        fontWeight:'600'
    },
    caption: {
        fontSize:DefaultStyles.text.caption.large,
        color:colors.text.secondary,
        fontWeight:'600'
    },
    smallTitle: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
    },
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
        lineHeight:18
    },
    iconButton: {
        width:32,
        height:32,
        marginLeft:'auto',
        backgroundColor:colors.background.light,
    },
})