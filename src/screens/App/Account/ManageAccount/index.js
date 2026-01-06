import colors from "config/colors"
import ManageAccountScreenHeader from "./header"
import DefaultText from "components/Text/DefaultText"
import DefaultButton from "components/Buttons/DefaultButton"
import {Ionicons} from '@expo/vector-icons'
import React, { useCallback, useMemo, useState, useEffect } from "react"
import { useNavigation } from "@react-navigation/native"
import DefaultBottomSheet from "components/Containers/DefaultBottomSheet"
import IconButton from "components/Buttons/IconButton"
import * as Haptics from 'expo-haptics'
import { useAuth } from "context/global/AuthContext"
import { SupportEmail } from "constants/auth"
import { deleteUser, GoogleAuthProvider, OAuthCredential, reauthenticateWithCredential, signInWithPopup, signOut } from "firebase/auth"
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "services/firebase/firebase"
import { useData } from "../../../../context/global/DataContext"
import { httpsCallable } from "firebase/functions"
import { auth, functions } from "../../../../services/firebase/firebase"
import LoadingOverlay from "../../../../components/Common/LoadingOverlay"
const { default: DefaultStyles } = require("config/styles")
const { View, ScrollView, StyleSheet, Alert, Modal, Switch } = require("react-native")
const { SafeAreaView } = require("react-native-safe-area-context")

const ManageAccountScreen = () => {
    
    const {user} = useAuth();
    const {userData, setUserData, constants} = useData();
    const [deleting, setDeleting] = useState(false);
    const [optedIntoDataCollection, setOptedIntoDataCollection] = useState(userData?.extra?.dataCollection?.optedIntoDataCollection);

    const toggleOptIntoDataCollection = useCallback(
        async (value) => {
            setOptedIntoDataCollection(value);
            const data = {
                optedIntoDataCollection: value
            };

            // only add these if value is truthy
            if (value) {
                data.optedInAt = serverTimestamp();
                data.privacyPolicyVersion = '2025-10-06';
            }

            // Update local state
            setUserData(prevUserData => ({
                ...prevUserData,
                extra: {
                    ...prevUserData?.extra,
                    dataCollection: {
                        ...prevUserData?.extra?.dataCollection,
                        ...data
                    }
                }
            }));

            await setDoc(
                doc(db, `users/${user.uid}`),
                {
                    extra: {
                        dataCollection: data
                    }
                },
                { merge: true }
            );
        }, [user.uid, setUserData]
    )

    const handleConfirmDeletion = () => {
        Alert.alert(
            'Delete Account',
            `Are you sure you want to delete your account? This action is irreversible, nobody can recover your data after you proceed.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true)
                        const deleteUserAccountFunction = httpsCallable(functions, 'deleteUserAccount');
                        await deleteUserAccountFunction();
                        await signOut(auth)
                        setDeleting(false)
                    },
                },
            ]
        )
    }

    const handleOptInDataCollectionInfoAlert = useCallback(
        () => {
            Alert.alert(
                'Help us improve Derm AI',
                'By opting in, you’ll allow us to use your anonymized app data to make Derm AI more accurate and helpful for everyone. Your information stays private and secure, but your contribution helps us improve skincare recommendations for the whole community.'
            )
        }, []
    )

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
                edges={['top']}
            >
                <ManageAccountScreenHeader />
                
                <ScrollView
                    contentContainerStyle={DefaultStyles.scrollContainer}
                >
                    <View
                        style={styles.itemContainer}
                    >
                        <DefaultText
                            style={styles.title}
                        >
                            Delete Account
                        </DefaultText>

                        <DefaultText
                            style={styles.text}
                        >
                            Permanently remove your account and all associated data including scans, analyses, and skincare routines.
                        </DefaultText>

                        <View style={DefaultStyles.separator} />

                        <View
                            style={styles.flexContainer}
                        >
                            <DefaultText
                                style={styles.text}
                            >
                                Help us improve Derm AI
                            </DefaultText>
                            <IconButton
                                style={styles.iconButton}
                                icon='help-circle-outline'
                                size={24}
                                onPress={handleOptInDataCollectionInfoAlert}
                            />
                            <Switch
                                value={optedIntoDataCollection}
                                onValueChange={toggleOptIntoDataCollection}
                                trackColor={{
                                    true: colors.background.primary
                                }}
                                style={{
                                    marginLeft:'auto'
                                }}
                            />
                        </View>

                        <View style={DefaultStyles.separator} />

                        <DefaultButton
                            title='Delete Account'
                            onPress={handleConfirmDeletion}
                            style={{
                                height:50,
                                color:colors.text.primary,
                                backgroundColor:colors.accents.error,
                                marginTop:DefaultStyles.container.paddingTop
                            }}
                            extraStyles={{
                                button: {
                                    height:50
                                }
                            }}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>

            <LoadingOverlay
                visible={deleting}
            />
        </View>
    )
}

export default ManageAccountScreen;

const styles = StyleSheet.create({
    title: {
        fontSize:DefaultStyles.text.title.xsmall,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        lineHeight:22,
    },
    itemContainer: {
        gap:12,
        borderWidth:1,
        borderColor:colors.accents.stroke,
        borderRadius:12,
        padding:DefaultStyles.container.paddingBottom,
    },
    topContainer: {
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:4,
    },
    iconButton: {
        width:32,
        height:32,
    },
})