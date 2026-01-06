const { useNavigation } = require("@react-navigation/native");
const { View, StyleSheet } = require("react-native");
import {Ionicons, Entypo} from '@expo/vector-icons'
import DefaultButton from 'components/Buttons/DefaultButton';
import DefaultText from 'components/Text/DefaultText';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import * as Haptics from 'expo-haptics'

const AnalysisScreenNoScansAvailable = () => {

    const navigation = useNavigation();

    return (
        <View
            style={styles.container}
        >
            <Entypo
                name='camera'
                color={colors.text.lighter}
                size={54}
            />
            <DefaultText
                style={styles.title}
            >
                No scans yet
            </DefaultText>
            <DefaultText
                style={styles.caption}
            >
                You have not completed a scan yet. Take your first facial analysis scan to start!
            </DefaultText>

            <DefaultButton
                isActive
                title='Add Scan'
                endAdornment={
                    <Ionicons
                        name='add-circle-outline'
                        size={24}
                        color={colors.text.primary}
                        style={{
                            marginLeft:8,
                        }}
                    />
                }
                style={{
                    borderRadius:64,
                    height:50,
                    marginTop:DefaultStyles.container.paddingTop,
                }}
                extraStyles={{
                    button: {
                        height:50,
                    },
                    text: {
                        fontSize:DefaultStyles.text.caption.small,
                    }
                }}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                onPress={() => navigation.navigate('FaceScan')}
            />
        </View>
    )
}

export default AnalysisScreenNoScansAvailable;

const styles = StyleSheet.create({
    container: {
        flex:1,
        borderWidth:2,
        borderStyle:'dashed',
        borderColor:colors.accents.stroke,
        justifyContent:'center',
        borderRadius:12,
        alignItems:'center',
        gap:16,
        padding:DefaultStyles.container.paddingHorizontal
    },
    title: {
        fontSize:DefaultStyles.text.title.small,
        color:colors.text.lighter,
        fontWeight:'600',
        textAlign:'center',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        textAlign:'center',
        lineHeight:22,
    }
})