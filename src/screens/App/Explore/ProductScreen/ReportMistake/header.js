import { useNavigation } from "@react-navigation/native"
import IconButton from "../../../../../components/Buttons/IconButton"
import DefaultTabHeader from "../../../../../components/Containers/DefaultTabHeader"
import colors from "../../../../../config/colors"
import DefaultStyles from "../../../../../config/styles"
import DefaultText from "../../../../../components/Text/DefaultText"

const ProductScreenReportProductMistakeHeader = () => {

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
                        Report a mistake
                    </DefaultText>
                )
            }}
        />
    )
}

export default ProductScreenReportProductMistakeHeader;