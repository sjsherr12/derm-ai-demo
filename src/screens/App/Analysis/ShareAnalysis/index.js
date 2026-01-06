import { Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, View, Share, Alert } from "react-native";
import DefaultStyles from "../../../../config/styles";
import ShareAnalysisScreenHeader from "./header";
import { useRoute } from "@react-navigation/native";
import { useData } from "../../../../context/global/DataContext";
import DefaultText from "../../../../components/Text/DefaultText";
import { convertSkinConcernSeverityIdToName, getSeverityRating } from "../../../../utils/analysis";
import colors from "../../../../config/colors";
import { SkinConcerns } from "../../../../constants/signup";
import SkinConcernShortcut from "../../../../components/Options/ConcernShortcut";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DefaultButton from "../../../../components/Buttons/DefaultButton";
import {FontAwesome6, Ionicons} from '@expo/vector-icons'
import FadeScaleView from "../../../../components/Containers/FadeScaleView";
import {captureRef} from 'react-native-view-shot'
import Logo from '../../../../assets/logos/icon.png'
import GradientProgressBar from "../../../../components/Graphics/SignUp/GradientProgressBar";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const ShareAnalysisScreen = () => {

    const route = useRoute();
    const {diagnosisId} = route?.params;
    const {diagnoses} = useData();
    const diagnosis = diagnoses?.find((diag => diag?.id === diagnosisId)) ?? diagnoses[0]
    const overallSeverity = diagnosis?.severities?.overall ?? 100;
    const overallSeverityInfo = getSeverityRating(overallSeverity)
    const concernCustomWidth = useMemo(
        () => (SCREEN_WIDTH-(DefaultStyles.container.paddingBottom*5)-4)/2, []
    );
    const viewRef = useRef();

    const handleShare = async () => {
        try {
            const uri = await captureRef(viewRef, {
                format: "png",
                quality: 1,
            });

            await Share.share({
                url: uri,
                message: `Check out my skin analysis results from Derm AI! I got a ${overallSeverity}% overall score!`,
            });
        } catch (error) {
            Alert.alert("Error", "Failed to share image");
            console.error(error);
        }
    };

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <View
                    style={{
                        flex:1,
                        gap:16,
                        paddingTop:DefaultStyles.container.paddingTop,
                    }}
                >
                    <ShareAnalysisScreenHeader
                    />

                    <ScrollView
                        contentContainerStyle={styles.container}
                    >
                        <FadeScaleView
                            ref={viewRef}
                            style={{
                                width:'100%',
                                padding:DefaultStyles.container.paddingBottom,
                                backgroundColor:colors.background.screen,
                            }}
                        >
                            <View
                                style={styles.contentContainer}
                            >
                                <DefaultText
                                    style={styles.title}
                                >
                                    Skin Analysis
                                </DefaultText>
                                <Image
                                    source={{
                                        uri:diagnosis?.facialScans?.front,
                                    }}
                                    style={styles.imageContainer}
                                    resizeMode='cover'
                                />

                                <DefaultText
                                    style={{
                                        ...styles.overallPill,
                                        backgroundColor:overallSeverityInfo.color
                                    }}
                                >
                                    Overall Score: {overallSeverity}%
                                </DefaultText>

                                <View
                                    style={styles.wrapContainer}
                                >
                                    {SkinConcerns.slice(1).sort().map((concern, idx) => {
                                        const severity = diagnosis?.severities?.[concern.severityId];
                                        const concernName = convertSkinConcernSeverityIdToName(concern.severityId);
                                        const severityInfo = getSeverityRating(severity);

                                        return (
                                            <View
                                                key={idx}
                                                style={{
                                                    ...styles.itemContainer,
                                                    gap:8,
                                                    padding:12,
                                                    width: concernCustomWidth,
                                                    position: 'relative'
                                                }}
                                            >
                                                <View
                                                    style={styles.flexContainer}
                                                >
                                                    <DefaultText
                                                        style={{
                                                            ...styles.caption,
                                                            alignSelf:'flex-start',
                                                            fontWeight:'400'
                                                        }}
                                                    >
                                                        {concernName}
                                                    </DefaultText>

                                                    <DefaultText
                                                        style={{
                                                            ...styles.caption,
                                                            fontWeight:'600',
                                                            marginLeft:'auto'
                                                        }}
                                                    >
                                                        {severity}%
                                                    </DefaultText>
                                                </View>

                                                <View
                                                    style={styles.flexContainer}
                                                >
                                                    <GradientProgressBar
                                                        progress={severity / 100}
                                                        height={6}
                                                        borderRadius={16}
                                                        colorA={severityInfo.color}
                                                        colorB={severityInfo.color}
                                                    />
                                                </View>
                                            </View>
                                        )
                                    })}
                                </View>
                            </View>
                        </FadeScaleView>
                    </ScrollView>

                    <View
                        style={{
                            width:'100%',
                            paddingHorizontal:DefaultStyles.container.paddingBottom
                        }}
                    >
                        <DefaultButton
                            title='Share'
                            isActive
                            style={{
                                borderRadius:64
                            }}
                            onPress={handleShare}
                            endAdornment={
                                <FontAwesome6
                                    name='arrow-up-from-bracket'
                                    size={18}
                                    color={colors.text.primary}
                                />
                            }
                        />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default ShareAnalysisScreen;

const styles = StyleSheet.create({
    title: {
        fontWeight:'700',
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.title.small,
    },
    container: {
        justifyContent:'center',
        alignItems:'center',
        flex:1,
    },
    itemContainer: {
        padding:8,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    contentContainer: {
        gap:16,
        alignItems:'center',
        width:'100%',
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        padding:DefaultStyles.container.paddingBottom,
        backgroundColor:colors.background.screen,
    },
    faceImage: {
        width:175,
        height:175,
        borderRadius:512,
    },
    overallPill: {
        width:'100%',
        color:colors.text.primary,
        fontWeight:'700',
        textAlign:'center',
        fontSize:DefaultStyles.text.caption.small,
        paddingHorizontal:16,
        paddingVertical:16,
        borderRadius:12,
    },
    wrapContainer: {
        flexDirection:'row',
        flexWrap:'wrap',
        gap:16,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    imageContainer: {
        width:175,
        resizeMode:'cover',
        borderRadius:512,
        aspectRatio:1,
        marginHorizontal:'auto',
    },
})