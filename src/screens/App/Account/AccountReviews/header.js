import IconButton from "components/Buttons/IconButton";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";

const { useNavigation } = require("@react-navigation/native");
const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader");

const AccountReviewsScreenHeader = ({

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
                        My Reviews
                    </DefaultText>
                )
            }}
        />
    )
}

export default AccountReviewsScreenHeader;