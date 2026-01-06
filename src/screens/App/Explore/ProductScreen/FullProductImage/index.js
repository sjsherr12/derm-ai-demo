import { Image, SafeAreaView, StyleSheet, View } from "react-native"
import DefaultStyles from "../../../../../config/styles"
import { useNavigation, useRoute } from "@react-navigation/native"
import IconButton from "../../../../../components/Buttons/IconButton";
import colors from "../../../../../config/colors";

const FullProductImageScreen = () => {

    const route = useRoute();
    const navigation = useNavigation();
    const {imageUri} = route?.params;

    return (
        <SafeAreaView
            style={styles.outer}
        >
            <View
                style={styles.topContainer}
            >
                <IconButton
                    style={styles.closeButton}
                    color={colors.text.primary}
                    size={24}
                    icon='close'
                    onPress={() => navigation.goBack()}
                />
            </View>
            <View
                style={styles.container}
            >
                <Image
                    source={{uri:imageUri}}
                    style={styles.imageContainer}
                    resizeMode='contain'
                />
            </View>

            <View style={styles.bottomContainer} />
        </SafeAreaView>
    )
}

export default FullProductImageScreen;

const styles = StyleSheet.create({
    outer: {
        flex:1,
        backgroundColor:'#000'
    },
    imageContainer: {
        width:'100%',
        aspectRatio:1,
    },
    container: {
        flex:1,
        alignItems:'center',
        justifyContent:'center'
    },
    topContainer: {
        width:'100%',
        paddingHorizontal:DefaultStyles.container.paddingBottom,
    },
    bottomContainer: {
        width:'100%',
        paddingVertical:DefaultStyles.container.paddingHorizontal
    },
    closeButton: {
        width:48,
        height:48,
        backgroundColor:'#000'
    }
})