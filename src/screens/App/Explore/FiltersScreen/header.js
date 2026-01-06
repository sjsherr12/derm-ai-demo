const { useNavigation } = require("@react-navigation/native");
const { default: IconButton } = require("components/Buttons/IconButton");
const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader");
const { default: DefaultText } = require("components/Text/DefaultText");
const { default: colors } = require("config/colors");
const { default: DefaultStyles } = require("config/styles");

const FiltersHeader = ({
    setFilters,
    hasFilters
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
                        Filters
                    </DefaultText>
                )
            }}
            headerRight={{
                component: (
                    <IconButton
                        style={DefaultStyles.button.icon}
                        icon='reload'
                        color={colors.text.secondary}
                        onPress={setFilters} // this must clear the filters, setFilters prop is above
                        disabled={!hasFilters}
                    />
                )
            }}
        />
    )
}

export default FiltersHeader;