import DefaultText from "components/Text/DefaultText";
import { StyleSheet } from "react-native";
import { Animated, Pressable, View } from "react-native";
import {Ionicons, MaterialIcons} from '@expo/vector-icons'
import DefaultStyles from "config/styles";
import colors from "config/colors";
import { useRef } from "react";
import { lighten } from "utils/lighten";
import { darken } from "utils/darken";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from 'expo-haptics'
import useScalePressAnimation from "hooks/useScalePressAnimation";

const HomeScreenAnalysisSummaryShortcut = ({
    timeSinceLastScan,
    summarizedData,
}) => {
    const navigation = useNavigation();

    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
    })

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                navigation.navigate('Analysis')
            }}
        >
            <Animated.View
                style={[styles.container, {transform:[{scale}]}]}
            >
                <View
                    style={styles.topContainer}
                >
                    <View
                        style={styles.titleContainer}
                    >
                        <DefaultText
                            numberOfLines={1}
                            style={styles.containerTitle}
                        >
                            Analysis summary
                        </DefaultText>

                        <MaterialIcons
                            name='auto-graph'
                            size={28}
                        />
                    </View>

                    <DefaultText
                        style={styles.containerCaption}
                    >
                        Your last scan was on {(new Date((new Date().getTime())-timeSinceLastScan)).toLocaleDateString()}.
                    </DefaultText>
                </View>

                <View
                    style={styles.concernsContainer}
                >
                    {summarizedData?.concerns?.map((concern, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.concernContainer,
                                {backgroundColor:lighten(concern?.severityColor, .9)},
                                {borderColor:lighten(concern?.severityColor, .75)}
                            ]}
                        >
                            <DefaultText
                                style={[
                                    styles.severityText,
                                    {marginBottom:16,}
                                ]}
                            >
                                {concern?.severity*100}%
                            </DefaultText>

                            <DefaultText
                                style={styles.severityText}
                            >
                                {concern?.title}
                            </DefaultText>
                            <DefaultText
                                style={styles.severityStatus}
                            >
                                {concern?.status}
                            </DefaultText>
                        </View>
                    ))}
                </View>

                <View
                    style={[
                        styles.highlightContainer,
                        {backgroundColor:lighten('#00ff00', .95)}
                    ]}
                >
                    <View
                        style={[
                            styles.highlightIcon,
                            {backgroundColor:darken('#00ff00', .5)}
                        ]}
                    >
                        <Ionicons
                            name='arrow-up'
                            color={colors.text.primary}
                            size={16}
                        />
                    </View>
                    <View
                        style={styles.highlightInfo}
                    >
                        <DefaultText
                            style={styles.highlightTitle}
                        >
                            {summarizedData?.highlight?.title}
                        </DefaultText>
                        <DefaultText
                            style={styles.highlightDescription}
                        >
                            {summarizedData?.highlight?.description}
                        </DefaultText>
                    </View>
                </View>

                <View
                    style={[
                        styles.highlightContainer,
                        {backgroundColor:lighten('#0000ff', .95)}
                    ]}
                >
                    <View
                        style={[
                            styles.highlightIcon,
                            {backgroundColor:darken('#0000ff', .5)}
                        ]}
                    >
                        <Ionicons
                            name='bulb-outline'
                            color={colors.text.primary}
                            size={16}
                        />
                    </View>
                    <View
                        style={styles.highlightInfo}
                    >
                        <DefaultText
                            style={styles.highlightTitle}
                        >
                            {summarizedData?.tip?.title}
                        </DefaultText>
                        <DefaultText
                            style={styles.highlightDescription}
                        >
                            {summarizedData?.tip?.description}
                        </DefaultText>
                    </View>
                </View>

                <DefaultText
                    style={styles.textShortcut}
                >
                    View Analysis
                </DefaultText>
            </Animated.View>
        </Pressable>
    )
}

export default HomeScreenAnalysisSummaryShortcut;

const styles = StyleSheet.create({
    container: {
        gap:16,
        padding:DefaultStyles.container.paddingHorizontal,
        paddingBottom:DefaultStyles.container.paddingBottom,
        borderRadius:12,
        boxShadow:'0px 0px 32px rgba(0,0,0,.05)',
        borderWidth:1,
        borderColor:colors.accents.stroke,
    },
    topContainer: {
        gap:12,
        width:'100%',
        marginBottom:16,
    },
    titleContainer: {
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
    },
    containerTitle: {
        flex:1,
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.secondary,
        fontWeight:'600',
    },
    containerCaption: {
        fontSize:14,
        color:colors.text.darker,
    },
    textShortcut: {
        marginTop:8,
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        width:'100%',
        textAlign:'center',
    },
    concernsContainer: {
        gap:16,
        flexDirection:'row',
        width:'100%',
        alignItems:'center'
    },
    concernContainer: {
        flex:1,
        gap:4,
        padding:16,
        borderWidth:1,
        borderColor:colors.accents.stroke,
        borderRadius:12,
        alignItems:'center',
    },
    severityText: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600',
    },
    severityStatus: {
        fontSize:DefaultStyles.text.caption.xsmall,
    },
    highlightContainer: {
        gap:16,
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:12,
    },
    highlightIcon: {
        width:32,
        height:32,
        borderRadius:64,
        justifyContent:'center',
        alignItems:'center',
    },
    highlightInfo: {
        gap:4,
        flex:1,
    },
    highlightTitle: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600'
    },
    highlightDescription: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
    }
})