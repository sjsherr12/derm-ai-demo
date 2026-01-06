import { StyleSheet, View } from "react-native"
import {Ionicons} from '@expo/vector-icons'
import DefaultText from "../Text/DefaultText"
import DefaultStyles from "../../config/styles"
import colors from "../../config/colors"

const EmptyComponentGeneric = ({
    icon = 'unk',
    size = 64,
    title,
    description,
}) => {

    return (
        <View style={styles.emptyContainer}>
            <Ionicons
                name={icon}
                color={colors.text.lighter}
                size={size}
            />
            <DefaultText style={styles.title}>
                {title ?? 'Empty List'}
            </DefaultText>
            <DefaultText style={styles.caption}>
                {description ?? 'There are no items in this list.'}
            </DefaultText>
        </View>
    )
}

export default EmptyComponentGeneric;

const styles = StyleSheet.create({
    emptyContainer: {
        borderWidth:2,
        borderStyle:'dashed',
        borderColor:colors.accents.stroke,
        justifyContent:'center',
        borderRadius:16,
        alignItems:'center',
        gap:16,
        padding:DefaultStyles.container.paddingHorizontal
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