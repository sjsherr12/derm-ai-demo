import { useNavigation } from "@react-navigation/native";
import IconButton from "components/Buttons/IconButton";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { Alert } from "react-native";

const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader")

const RecommendationsScreenHeader = ({
    tabTitle,
    infoTitle,
    infoDescription,
}) => {
    const navigation = useNavigation();

    const handlePresentInfo = () => {
        Alert.alert(
            infoTitle,
            infoDescription
        )
    }

    return (
        <DefaultTabHeader
            headerLeft={{
                component: (
                    <IconButton
                        style={DefaultStyles.button.icon}
                        icon='arrow-back'
                        color={colors.text.secondary}
                        onPress={() => navigation.goBack()}
                    />
                )
            }}
            header={{
                component: (
                    <DefaultText
                        numberOfLines={1}
                        style={DefaultStyles.text.title.header}
                    >
                        {tabTitle}
                    </DefaultText>
                )
            }}
            headerRight={{
                component: (
                    <IconButton
                        style={DefaultStyles.button.icon}
                        icon='information-outline'
                        color={colors.text.secondary}
                        onPress={handlePresentInfo}
                    />
                )
            }}
        />
    )
}

export default RecommendationsScreenHeader;