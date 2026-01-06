import { useNavigation } from "@react-navigation/native"
import colors from "config/colors"
import DefaultStyles from "config/styles"
import { Animated, Pressable, StyleSheet } from "react-native"
import { getUserFirstName } from "utils/user"
import {Ionicons, FontAwesome6} from '@expo/vector-icons'
import { lighten } from "utils/lighten"
const { default: IconButton } = require("components/Buttons/IconButton")
const { default: DefaultTabHeader } = require("components/Containers/DefaultTabHeader")
const { default: DefaultText } = require("components/Text/DefaultText")
const { useAuth } = require("context/global/AuthContext")
const { useCallback, useRef } = require("react")
const { View, Image } = require("react-native")
import * as Haptics from 'expo-haptics'
import useScalePressAnimation from "hooks/useScalePressAnimation"

const RoutineScreenHeader = ({
    activeTab,
    currentStreak
}) => {
    const navigation = useNavigation();
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
    })

    return (
        <DefaultTabHeader
            headerLeft={{component:(
                <View style={{
                    gap:20,
                    flexDirection:'row',
                    alignItems:'center',
                }}>
                    <DefaultText
                        style={styles.headerTitle}
                        numberOfLines={1}
                        ellipsizeMode='tail'
                    >
                        My Routines
                    </DefaultText>
                </View>
            )}}
            headerRight={{
                component:(
                    <View
                        style={styles.headerRightContainer}
                    >
                        <Pressable
                            // onPressIn={handlePressIn}
                            // onPressOut={handlePressOut}
                            // onPress={() => navigation.navigate('RoutineProgress', {
                            //     tab: activeTab
                            // })}
                        >
                            <Animated.View
                                style={[
                                    styles.streakContainer,
                                    {transform:[{scale}]}
                                ]}
                            >
                                <Ionicons
                                    size={18}
                                    color='#ff7400'
                                    name='flame'
                                    style={{
                                        backgroundColor:'#ffde1a',
                                        borderRadius:64,
                                    }}
                                />
                                <DefaultText>
                                    {currentStreak}
                                </DefaultText>
                            </Animated.View>
                        </Pressable>
                        <IconButton
                            iconComponent={<FontAwesome6 name="plus" size={20} color="white" />}
                            size={24}
                            color={colors.text.primary}
                            style={{
                                width:48,
                                height:48,
                                backgroundColor:colors.background.primary,
                                marginLeft:'auto'
                            }}
                            onPress={() => navigation.navigate('AddProductModal', {
                                screen: 'AddProductSelect',
                                params: {
                                    routineType: activeTab,
                                }
                            })}
                        />
                    </View>
                ),
                style: {
                    flex:.75,
                }
            }}
        />
    )
}

export default RoutineScreenHeader;

const styles = StyleSheet.create({
    headerTitle: {
        fontSize:DefaultStyles.text.title.small,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    userProfile: {
        width: 36,
        height: 36,
        borderRadius: 64,
    },
    headerRightContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:10,
        marginLeft:'auto',
    },
    streakContainer: {
        height:48,
        gap:8,
        paddingHorizontal:16,
        borderRadius:64,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        flexDirection:'row',
        alignItems:'center',
    }
})