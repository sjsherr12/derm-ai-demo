import { useNavigation } from "@react-navigation/native";
import DefaultStyles from "../../../../config/styles";
import IconButton from "../../../../components/Buttons/IconButton";
import DefaultTabHeader from "../../../../components/Containers/DefaultTabHeader";
import DefaultText from "../../../../components/Text/DefaultText";
import colors from "../../../../config/colors";

const ChatHistoryScreenHeader = () => {

    const navigation = useNavigation();

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
                        Chat History
                    </DefaultText>
                )
            }}
        />
    )
}

export default ChatHistoryScreenHeader;