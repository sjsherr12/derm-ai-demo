import { useNavigation } from "@react-navigation/native";
import IconButton from "components/Buttons/IconButton";
import DefaultTabHeader from "components/Containers/DefaultTabHeader";
import DefaultText from "components/Text/DefaultText";
import DefaultStyles from "config/styles";

const ProductScreenWriteReviewScreenHeader = () => {
    const navigation = useNavigation();

    return (
        <DefaultTabHeader
            headerLeft={{
                component: (
                    <IconButton
                        style={DefaultStyles.button.icon}
                        icon='arrow-back'
                        onPress={() => navigation.goBack()}
                    />
                )
            }}
            header={{
                component: (
                    <DefaultText
                        style={DefaultStyles.text.title.header}
                    >
                        Write a review
                    </DefaultText>
                )
            }}
        />
    )
}

export default ProductScreenWriteReviewScreenHeader;