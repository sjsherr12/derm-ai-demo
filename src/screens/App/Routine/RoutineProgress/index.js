import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DefaultStyles from "../../../../config/styles";
import { SafeAreaView } from "react-native-safe-area-context";
import RoutineProgressScreenHeader from "./header";
import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import TopTabBar from "../../../../components/Options/TopTabBar";
import { RoutineProductTypes } from "../../../../constants/products";
import * as Haptics from 'expo-haptics'
import {Ionicons} from '@expo/vector-icons'
import colors from "../../../../config/colors";
import DefaultText from "../../../../components/Text/DefaultText";
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation";

const StreakFire = require('../../../../assets/media/routine/streak.png')

const RoutineProgressScreen = ({

}) => {

    const route = useRoute();
    const initialActiveTab = route?.params?.tab ?? 0
    const [tab, setTab] = useState(initialActiveTab)

    const {
        handlePressIn: handlePressInStreak,
        handlePressOut: handlePressOutStreak,
        scale: scaleStreak
    } = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:150,
    })

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
                edges={['top']}
            >
                <RoutineProgressScreenHeader
                />

                <View
                    style={styles.topContainer}
                >
                    <TopTabBar
                        tabs={RoutineProductTypes}
                        activeTab={tab}
                        onChange={setTab}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    />
                </View>

                <ScrollView
                    style={DefaultStyles.scrollContainer}
                >
                    <View
                        style={styles.flexContainer}
                    >
                        <Pressable
                            onPressIn={handlePressInStreak}
                            onPressOut={handlePressOutStreak}
                            style={{
                                flex:1,
                                width:'50%',
                            }}
                        >
                            <Animated.View
                                style={{
                                    ...styles.itemContainer,
                                    transform:[{scale:scaleStreak}]
                                }}
                            >
                                <View
                                    style={styles.streakContainer}
                                >
                                    <Image
                                        style={styles.streakImage}
                                        source={StreakFire}
                                    />
                                    <DefaultText
                                        style={styles.streakNumberStroke}
                                    >
                                        16
                                    </DefaultText>
                                    <DefaultText
                                        style={styles.streakNumber}
                                    >
                                        16
                                    </DefaultText>
                                </View>

                                <DefaultText
                                    style={styles.streakText}
                                >
                                    day streak
                                </DefaultText>
                            </Animated.View>
                        </Pressable>

                        <Pressable
                            style={{
                                flex:1,
                                width:'50%',
                            }}
                        >
                            <View
                                style={styles.itemContainer}
                            >

                            </View>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

export default RoutineProgressScreen;

const styles = StyleSheet.create({
    topContainer: {
        padding:DefaultStyles.container.paddingBottom,
        paddingBottom:0,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    itemContainer: {
        gap:16,
        flex:1,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
        paddingVertical:DefaultStyles.container.paddingTop,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        alignItems:'center',
    },
    streakContainer: {
        position:'relative',
        marginTop:-DefaultStyles.container.paddingTop,
        marginBottom:-8,
    },
    streakImage: {
        width:100,
        height:100,
    },
    streakNumberStroke: {
        color:colors.accents.warning,
        fontSize:40,
        fontWeight:'900',
        position:'absolute',
        bottom:-8,
        alignSelf:'center',
        textAlign:'center',
        width:'100%',
        textShadowColor:colors.accents.warning,
        textShadowOffset:{width:0,height:0},
        textShadowRadius:8,
    },
    streakNumber: {
        color:colors.text.primary,
        fontSize:40,
        fontWeight:'700',
        position:'absolute',
        bottom:-8,
        alignSelf:'center',
        textAlign:'center',
        width:'100%',
    },
    streakText: {
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'600',
        color:colors.accents.warning,
    }
})