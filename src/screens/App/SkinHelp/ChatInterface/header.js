import { StyleSheet, View, Alert, Keyboard, Linking, Platform } from "react-native";
import DefaultTabHeader from "../../../../components/Containers/DefaultTabHeader";
import DefaultText from "../../../../components/Text/DefaultText";
import DefaultStyles from "../../../../config/styles";
import { useNavigation } from "@react-navigation/native";
import colors from "../../../../config/colors";
import IconButton from "../../../../components/Buttons/IconButton";
import * as ImagePicker from 'expo-image-picker';
import { MenuView } from '@react-native-menu/menu';

const SkinHelpChatInterfaceHeader = ({ onImageAttach, canAttachImage }) => {

    const navigation = useNavigation();


    const handleImagePicker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                onImageAttach(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error in handleImagePicker:', error);
            alert('Failed to select image from camera roll');
        }
    };

    const handleCameraPicker = async () => {
        try {
            // Request camera permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                // Show detailed alert with options
                Alert.alert(
                    'Camera Permission Required',
                    `To take photos, Derm AI needs access to your camera. Please enable camera permissions in your device settings.\n\n${
                        Platform.OS === 'ios'
                            ? 'Go to Settings > Derm AI > Camera and enable access.'
                            : 'Go to Settings > Apps > Derm AI > Permissions > Camera and enable access.'
                    }`,
                    [
                        {
                            text: 'Close',
                            style: 'cancel'
                        },
                        {
                            text: 'Open Settings',
                            onPress: () => Linking.openSettings()
                        }
                    ]
                );
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                onImageAttach(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error in handleCameraPicker:', error);
            alert('Failed to take photo');
        }
    };


    return (
        <DefaultTabHeader
            headerLeft={{component:(
                <DefaultText
                    style={styles.headerTitle}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                >
                    Skin Help
                </DefaultText>
            )}}
            headerRight={{
                component:(
                    <View
                        style={styles.headerRightContainer}
                    >
                        {canAttachImage ? (
                            <MenuView
                                title="Attach Item"
                                actions={[
                                    // {
                                    //     id: 'product',
                                    //     title: 'Add Product',
                                    //     titleColor: colors.text.primary,
                                    //     image: 'plus',
                                    //     imageColor: colors.text.secondary,
                                    // },
                                    {
                                        id: 'camera',
                                        title: 'Take Photo',
                                        titleColor: colors.text.primary,
                                        image: 'camera',
                                        imageColor: colors.text.secondary,
                                    },
                                    {
                                        id: 'library',
                                        title: 'Choose from Library',
                                        image: 'photo',
                                        imageColor: colors.text.secondary,
                                    },
                                ]}
                                onPressAction={({ nativeEvent }) => {
                                    if (nativeEvent.event === 'camera') {
                                        handleCameraPicker();
                                    } else if (nativeEvent.event === 'library') {
                                        handleImagePicker();
                                    }
                                }}
                                shouldOpenOnLongPress={false}
                            >
                                <IconButton
                                    size={24}
                                    icon='add'
                                    color={colors.text.secondary}
                                    style={DefaultStyles.button.icon}
                                />
                            </MenuView>
                        ) : (
                            <IconButton
                                size={24}
                                icon='add'
                                color={colors.text.secondary + '50'}
                                style={[DefaultStyles.button.icon, { opacity: 0.5 }]}
                                onPress={() => {
                                    Alert.alert('Daily Limit Reached', 'You can attach one image per day to your chats.');
                                }}
                            />
                        )}
                        <IconButton
                            size={24}
                            icon='document-text-outline'
                            color={colors.text.secondary}
                            style={DefaultStyles.button.icon}
                            onPress={() => {
                                Keyboard.dismiss();
                                navigation.navigate('PreviousChats');
                            }}
                        />
                    </View>
                ),
                style: {
                    flex:.5,
                }
            }}
        />
    )
}

export default SkinHelpChatInterfaceHeader;

const styles = StyleSheet.create({
    headerTitle: {
        fontSize:DefaultStyles.text.title.small,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    headerRightContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
        marginLeft:'auto',
    },
})