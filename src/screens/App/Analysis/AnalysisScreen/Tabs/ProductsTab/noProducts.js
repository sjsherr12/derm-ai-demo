import {Ionicons} from '@expo/vector-icons'
import DefaultText from 'components/Text/DefaultText';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
const { StyleSheet, View } = require("react-native")

const AnalysisScreenProductsTabNoProductRecommendationsAvailable = () => {
    return (
        <View
            style={styles.emptyContainer}
        >
            <Ionicons
                name='list-outline'
                size={64}
                color={colors.text.lighter}
            />
            <DefaultText
                style={styles.title}
            >
                No Products Available.
            </DefaultText>

            <DefaultText
                style={styles.caption}
            >
                We have no product recommendations currently available. Check back later for more options!
            </DefaultText>
        </View>
    )
}

export default AnalysisScreenProductsTabNoProductRecommendationsAvailable;

const styles = StyleSheet.create({
    emptyContainer: {
        gap:16,
        borderRadius:16,
        borderWidth:2,
        borderStyle:'dashed',
        borderColor:colors.accents.stroke,
        padding:DefaultStyles.container.paddingHorizontal,
        justifyContent:'center',
        alignItems:'center',
    },
    title: {
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.lighter,
        fontWeight:'600',
        textAlign:'center',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        textAlign:'center',
        lineHeight:20
    }
})