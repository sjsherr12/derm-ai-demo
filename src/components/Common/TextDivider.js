import { merge } from "lodash"
import { StyleSheet, Text, View } from "react-native"
import colors from "../../config/colors";
import { darken } from "../../utils/darken";
import DefaultText from "components/Text/DefaultText";

const TextDivider = ({
    text,
    style,
}) => {
    const mergedStyles = merge({}, styles, style);
    return (
        <View style={mergedStyles.optionDividerContainer}>
            <View style={mergedStyles.optionDividerLine} />
            <DefaultText style={mergedStyles.optionDividerText}>{text}</DefaultText>
            <View style={mergedStyles.optionDividerLine} />
        </View>
    )
}

const styles = StyleSheet.create({
    optionDividerContainer: {
        paddingVertical:6,
        gap:16,
        display:'flex',
        alignItems:'center',
        flexDirection:'row',
        width:'100%',
    },
    optionDividerText: {
        fontSize:16,
        color:colors.text.secondary,
    },
    optionDividerLine: {
        flex:1,
        backgroundColor:colors.accents.stroke,
        height:2,
        borderRadius:32,
    }
})

export default TextDivider;