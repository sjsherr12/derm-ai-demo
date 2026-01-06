import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import IconButton from "components/Buttons/IconButton";
import DefaultTabHeader from "components/Containers/DefaultTabHeader";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import * as Haptics from 'expo-haptics';

const ProductScreenEditReviewScreenHeader = ({
    onDeleteReview,
    reviewId,
    isDeleting = false
}) => {
    const navigation = useNavigation();

    const handleDeletePress = () => {
        Alert.alert(
            'Delete Review',
            'Are you sure you want to delete this review? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await onDeleteReview(reviewId);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting review:', error);
                            Alert.alert('Error', 'Failed to delete review. Please try again.');
                        }
                    },
                },
            ]
        );
    };

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
                        Edit review
                    </DefaultText>
                )
            }}
            headerRight={{
                component: (
                    <IconButton
                        style={{
                            width:48,
                            height:48,
                            backgroundColor:colors.accents.error
                        }}
                        color={colors.text.primary}
                        icon='trash-outline'
                        onPress={isDeleting ? null : handleDeletePress}
                    />
                )
            }}
        />
    )
}

export default ProductScreenEditReviewScreenHeader;