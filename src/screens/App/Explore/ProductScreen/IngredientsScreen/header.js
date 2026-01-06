import colors from "config/colors";

const { useNavigation } = require("@react-navigation/native");
const { default: IconButton } = require("components/Buttons/IconButton");
const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader");
const { default: DefaultText } = require("components/Text/DefaultText");
const { default: DefaultStyles } = require("config/styles");

const IngredientsScreenHeader = () => {
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
                        All Ingredients
                    </DefaultText>
                )
            }}
        />
    )
}

export default IngredientsScreenHeader;