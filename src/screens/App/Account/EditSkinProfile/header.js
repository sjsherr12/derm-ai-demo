import DefaultText from "components/Text/DefaultText"

const { useNavigation } = require("@react-navigation/native")
const { default: IconButton } = require("components/Buttons/IconButton")
const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader")
const { default: colors } = require("config/colors")
const { default: DefaultStyles } = require("config/styles")

const EditSkinProfileScreenHeader = ({

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
                        Skin Profile
                    </DefaultText>
                )
            }}
        />
    )
}

export default EditSkinProfileScreenHeader;