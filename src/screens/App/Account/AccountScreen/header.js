import { useNavigation } from "@react-navigation/native";
import IconButton from "components/Buttons/IconButton";
import DefaultTabHeader from "components/Containers/DefaultTabHeader";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { StyleSheet, View } from "react-native";

const AccountScreenHeader = () => {
    
    const navigation = useNavigation();

    return (
        <DefaultTabHeader
            headerLeft={{component:(
                <DefaultText
                    style={styles.headerTitle}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                >
                    My Account
                </DefaultText>
            )}}
            headerRight={{
                component:(
                    <IconButton
                        icon='close'
                        size={24}
                        color={colors.text.secondary}
                        style={DefaultStyles.button.icon}
                        onPress={() => navigation.goBack()}
                    />
                ),
                style: {
                    flex:.25, // only needs to fit content and align completely left.
                }
            }}
        />
    )
}

export default AccountScreenHeader;

const styles = StyleSheet.create({
    headerTitle: {
        fontSize:DefaultStyles.text.title.small,
        fontWeight:'600',
        color:colors.text.secondary,
    },
})