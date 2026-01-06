import { useNavigation } from "@react-navigation/native";
import IconButton from "../../../../components/Buttons/IconButton";
import DefaultTabHeader from "../../../../components/Containers/DefaultTabHeader";
import DefaultStyles from "../../../../config/styles";
import colors from "../../../../config/colors";
import DefaultText from "../../../../components/Text/DefaultText";

const RecommendationHistoryScreenHeader = ({

}) => {
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
                        History
                    </DefaultText>
                )
            }}
        />
    )
}

export default RecommendationHistoryScreenHeader;