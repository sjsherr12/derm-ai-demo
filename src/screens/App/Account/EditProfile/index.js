import UserProfileImage from "components/Common/UserProfileImage"
import DefaultText from "components/Text/DefaultText"
import colors from "config/colors"
import { useAuth } from "context/global/AuthContext"
import {Ionicons, FontAwesome6, Entypo} from '@expo/vector-icons'
import React, { useMemo, useState } from "react"
import { useData } from "context/global/DataContext"
import DefaultTextInput from "components/Text/DefaultTextInput"
import { Genders } from "constants/signup"
import { AgeGroups } from "constants/signup"
import DefaultButton from "components/Buttons/DefaultButton"
import { updateProfile } from "firebase/auth"
import * as Haptics from 'expo-haptics'
import { useNavigation } from "@react-navigation/native"
import SignUpQuestions from "data/SignUpQuestions"
import useScalePressAnimation from "hooks/useScalePressAnimation"
import * as ImagePicker from 'expo-image-picker'
import { storage } from 'services/firebase/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { MenuView } from '@react-native-menu/menu'
const { default: DefaultStyles } = require("config/styles")
const { View, StyleSheet, SafeAreaView, ScrollView, Image, Pressable, Animated } = require("react-native")
const { default: EditProfileScreenHeader } = require("./header")

const ProfileQuestionShortcut = ({
    id,
    name,
    value
}) => {
    const navigation = useNavigation();

    const question = useMemo(() => SignUpQuestions.find(q => q.id === id), [id])

    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })

    const handlePress = () => {
        navigation.navigate('ProfileQuestion', {
            question
        })
    }

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.flexContainer,
                    {transform:[{scale}]}
                ]}
            >
                <DefaultText
                    style={styles.text}
                >
                    {name}
                </DefaultText>

                <DefaultText
                    style={[
                        styles.caption,
                        {
                            marginLeft:'auto'
                        }
                    ]}
                >
                    {value}
                </DefaultText>

                <Entypo
                    name='chevron-right'
                    color={colors.text.secondary}
                    size={20}
                />
            </Animated.View>
        </Pressable>
    )
}

const EditProfileScreen = ({

}) => {
    const {user} = useAuth();
    const {userData} = useData();
    const navigation = useNavigation();
    const [saving, setSaving] = useState(false)
    const [fullName, setFullName] = useState(user?.displayName ?? '')
    const [uploadingImage, setUploadingImage] = useState(false)

    const userGender = useMemo(() => Genders.find(g => g.value === userData?.profile?.gender)?.title, [userData?.profile?.gender])
    const userAgeGroup = useMemo(() => AgeGroups.find(g => g.value === userData?.profile?.age)?.title, [userData?.profile?.age])

    const profileQuestions = useMemo(() => [
        {
            id:'GenderQuestion',
            name:'Gender',
            value:userGender,
        },
        {
            id:'AgeQuestion',
            name:'Age group',
            value:userAgeGroup,
        }
    ], [
        userGender, 
        userAgeGroup
    ])

    const canSave = useMemo(() => (fullName.trim() !== user?.displayName), [fullName, user?.displayName])

    const handleImagePicker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await uploadProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error in handleImagePicker:', error);
            alert('Failed to select image from camera roll');
        }
    };

    const handleCameraPicker = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await uploadProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error in handleCameraPicker:', error);
            alert('Failed to take photo');
        }
    };

    const uploadProfileImage = async (imageUri) => {
        try {
            setUploadingImage(true);

            console.log('=== PROFILE IMAGE UPLOAD DEBUG START ===');
            console.log('Profile upload input:', { imageUri, userId: user.uid });
            console.log('Storage instance:', { bucket: storage._bucket });

            const response = await fetch(imageUri);
            console.log('Profile fetch response:', { ok: response.ok, status: response.status });

            const blob = await response.blob();
            console.log('Profile blob:', { size: blob.size, type: blob.type });

            const fileExtension = imageUri.split('.').pop() || 'jpg';
            const fileName = `profile_${Date.now()}.${fileExtension}`;
            const storagePath = `users/${user.uid}/profile/${fileName}`;
            const imageRef = ref(storage, storagePath);

            console.log('Profile storage path:', { path: storagePath, fullPath: imageRef.fullPath });

            console.log('Starting profile upload...');
            await uploadBytes(imageRef, blob);
            console.log('Profile upload successful');

            const downloadURL = await getDownloadURL(imageRef);
            console.log('Profile download URL obtained:', downloadURL);

            await updateProfile(user, {
                photoURL: downloadURL
            });

            console.log('=== PROFILE IMAGE UPLOAD DEBUG SUCCESS ===');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        } catch (error) {
            console.error('=== PROFILE IMAGE UPLOAD DEBUG FAILURE ===');
            console.error('Profile error:', error);
            console.error('Profile error details:', {
                name: error.name,
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };


    const accountCreationDateFormatted = (
        new Date(parseInt(user?.metadata?.createdAt))
    ).toLocaleDateString('en-US', {
        month:'long',
        year:'numeric'
    })

    const handleSave = async () => {
        if (canSave) {
            setSaving(true);

            await updateProfile(user, {
                displayName: fullName.trim()
            })

            navigation.goBack();

            setSaving(false)
        }
    }

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <EditProfileScreenHeader

                />

                <ScrollView
                    contentContainerStyle={DefaultStyles.scrollContainer}
                >
                    <View
                        style={styles.topContainer}
                    >
                        <MenuView
                            title="Change Profile Picture"
                            actions={[
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
                            <Pressable
                                style={styles.imageOverlay}
                                disabled={uploadingImage}
                            >
                                <UserProfileImage
                                    width={110}
                                    height={110}
                                    image={user?.photoURL}
                                    style={{
                                        opacity: uploadingImage ? 0.5 : 1,
                                    }}
                                />

                                <View
                                    style={styles.editIcon}
                                >
                                    <FontAwesome6
                                        name={uploadingImage ? 'hourglass' : 'pencil'}
                                        size={14}
                                        color={colors.text.primary}
                                    />
                                </View>
                            </Pressable>
                        </MenuView>

                        <DefaultText
                            style={styles.pictureCaption}
                        >
                            User since {accountCreationDateFormatted}
                        </DefaultText>
                    </View>

                    <View
                        style={styles.mainContainer}
                    >
                        <View
                            style={styles.itemContainer}
                        >
                            <DefaultText
                                style={styles.inputTitle}
                            >
                                Full name
                            </DefaultText>

                            <DefaultTextInput
                                value={fullName}
                                onChangeText={setFullName}
                                returnKeyType='done'
                                style={[
                                    styles.inputContainer,
                                    styles.inputCaption,
                                ]}
                            />
                        </View>

                        <View
                            style={[
                                styles.itemContainer,
                                {paddingVertical:0}
                            ]}
                        >
                            {profileQuestions.map((q, idx) => (
                                <React.Fragment
                                    key={idx}
                                >
                                    <ProfileQuestionShortcut
                                        id={q.id}
                                        name={q.name}
                                        value={q.value}
                                    />

                                    {profileQuestions.length > idx+1 &&
                                        <View style={DefaultStyles.separator} />
                                    }
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                <View
                    style={styles.bottomContainer}
                >
                    <DefaultButton
                        title='Save'
                        isActive
                        disabled={!canSave || saving}
                        onPress={handleSave}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        style={{
                            borderRadius:64,
                        }}
                    />
                </View>
            </SafeAreaView>
        </View>
    )
}

export default EditProfileScreen;

const styles = StyleSheet.create({
    topContainer: {
        marginTop:DefaultStyles.container.paddingTop,
        marginBottom:DefaultStyles.container.paddingBottom,
        gap:24,
        alignItems:'center',
    },
    itemContainer: {
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        padding:DefaultStyles.container.paddingBottom,
        flex:1,
    },
    mainContainer: {
        flex:1,
        gap:20,
    },
    bottomContainer: {
        padding:DefaultStyles.container.paddingHorizontal,
        borderTopColor:colors.accents.stroke,
        borderTopWidth:1.5,
    },
    inputContainer: {
        paddingTop:DefaultStyles.container.paddingTop,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:6,
        paddingVertical:18,
    },
    imageOverlay: {
        position:'relative',
    },
    inputCaption: {
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'500',
        color:colors.text.secondary
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600',
        color:colors.text.secondary
    },
    inputTitle: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.dark
    },
    pictureCaption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary
    },
    editIcon: {
        backgroundColor:colors.background.primary,
        borderRadius:64,
        width:32,
        height:32,
        position:'absolute',
        bottom:0,
        right:0,
        boxShadow:'0px 6px 12px rgba(0,0,0,.05)',
        justifyContent:'center',
        alignItems:'center',
    }
})