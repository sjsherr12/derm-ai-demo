import { StyleSheet, View } from "react-native";
import colors from "../../../../config/colors";
import DefaultText from "../../../../components/Text/DefaultText";
import DefaultStyles from "../../../../config/styles";
import DefaultTabHeader from "../../../../components/Containers/DefaultTabHeader";

const ShareAnalysisScreenHeader = ({
}) => {

    return (
        <View
            style={styles.container}
        >
            <View
                style={styles.stub}
            />
        </View>
    )
}

export default ShareAnalysisScreenHeader;

const styles = StyleSheet.create({
    container: {
        width:'100%',
        alignItems:'center'
    },
    stub: {
        width:40,
        backgroundColor:colors.text.lighter,
        borderRadius:64,
        height:5,
    },
    title: {
        fontWeight:'700',
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.secondary
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.darker,
    }
})