import { useNavigation } from "@react-navigation/native"
import DefaultTabHeader from "../../../../components/Containers/DefaultTabHeader";
import IconButton from "../../../../components/Buttons/IconButton";
import DefaultStyles from "../../../../config/styles";
import colors from "../../../../config/colors";
import { useCallback } from "react";
import { Alert } from "react-native";
import DefaultText from "../../../../components/Text/DefaultText";

const ExploreScreenSavedProductsScreenHeader = ({

}) => {
    const navigation = useNavigation();

    const handleInfoAlert = useCallback(
        () => Alert.alert(
            'Saved Products',
            'Products you\'ve saved for later. Keep track of items you want to try or reference again.'
        ), []
    )

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
                        Saved Products
                    </DefaultText>
                )
            }}
            headerRight={{
                component: (
                    <IconButton
                        style={DefaultStyles.button.icon}
                        icon='information-outline'
                        color={colors.text.secondary}
                        onPress={handleInfoAlert}
                    />
                )
            }}
        />
    )
}

export default ExploreScreenSavedProductsScreenHeader;