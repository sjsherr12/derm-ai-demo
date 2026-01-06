import { useNavigation } from "@react-navigation/native"
import DefaultTabHeader from "../../../../components/Containers/DefaultTabHeader";
import IconButton from "../../../../components/Buttons/IconButton";
import DefaultStyles from "../../../../config/styles";
import colors from "../../../../config/colors";
import DefaultText from "../../../../components/Text/DefaultText";

const AnalysisScreenCategoryScreenHeader = ({
    categoryName
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
                        {categoryName}s
                    </DefaultText>
                )
            }}
        />
    )
}

export default AnalysisScreenCategoryScreenHeader;