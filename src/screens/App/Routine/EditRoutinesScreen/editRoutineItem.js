const { default: IconButton } = require("components/Buttons/IconButton")
const { default: DefaultText } = require("components/Text/DefaultText")
const { View } = require("react-native")
const { default: RoutineScreenRoutineProduct } = require("../RoutineScreen/routineProduct")
import {Ionicons} from '@expo/vector-icons'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import DefaultButton from 'components/Buttons/DefaultButton'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import DefaultStyles from 'config/styles'
import colors from 'config/colors'
import { RoutineProductTypes } from 'constants/products'
import { RoutineProductUsageFrequencies } from 'constants/products'
import DefaultTextInput from 'components/Text/DefaultTextInput'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const EditRoutinesScreenEditItem = ({
    routineItem,
    setRoutineItem,
}) => {
    const [routineType, setRoutineType] = useState(null)
    const [usageFrequency, setUsageFrequency] = useState(null)
    const [directions, setDirections] = useState('')

    useEffect(() => {
        if (routineItem) {
            setRoutineType(routineItem?.routineInfo?.routineType)
            setUsageFrequency(routineItem?.routineInfo?.usageFrequency)
            setDirections(routineItem?.routineInfo?.directions)
        }
    }, [routineItem])

    return (
        <View
            style={[
                styles.container,
            ]}
        >
            <View
                style={[
                    styles.flexContainer,
                    {marginBottom:DefaultStyles.container.paddingBottom,}
                ]}
            >
                <DefaultText
                    style={styles.title}
                >
                    Edit Routine Step
                </DefaultText>

                <IconButton
                    style={styles.closeIconButton}
                    icon='close'
                    size={16}
                    onPress={() => setRoutineItem(null)}
                />
            </View>

            <RoutineScreenRoutineProduct
                key={routineItem}
                productInfo={routineItem?.productInfo}
                routineInfo={routineItem?.routineInfo}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                expandable={false}
            />

            <View
                style={styles.flexContainer}
            >
                <View
                    style={styles.expandable}
                >
                    <DefaultText
                        style={styles.expandable.text}

                    >
                        Routine: {RoutineProductTypes[routineItem?.routineInfo?.routineType]}
                    </DefaultText>

                    <Ionicons
                        name='chevron-forward'
                        color={colors.text.secondary}
                        size={12}
                    />
                </View>

                <View
                    style={styles.expandable}
                >
                    <DefaultText
                        style={styles.expandable.text}
                    >
                        Usage: {RoutineProductUsageFrequencies.find(rpuf => rpuf.value === routineItem?.routineInfo?.usageFrequency).title}
                    </DefaultText>
                    
                    <Ionicons
                        name='chevron-forward'
                        color={colors.text.secondary}
                        size={12}
                    />
                </View>
            </View>

            <DefaultTextInput
                value={directions}
                onChangeText={setDirections}
                style={styles.directionsInput}
                placeholder='Directions...'
                multiline
                numberOfLines={5}
            />

            <View
                style={styles.bottomContainer}
            >
                <DefaultButton
                    isActive
                    title='Save changes'
                />
                <DefaultText
                    style={styles.remove}
                >
                    Delete from routine
                </DefaultText>
            </View>
        </View>
    )
}

export default EditRoutinesScreenEditItem;

const styles = StyleSheet.create({
    container: {
        gap:16,
        flex:1,
        padding:DefaultStyles.container.paddingHorizontal,
        paddingTop:0,
        backgroundColor:colors.background.screen,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
        justifyContent:'space-between'
    },
    title: {
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.large,
    },
    closeIconButton: {
        width:32,
        height:32,
        backgroundColor:colors.background.light,
    },
    expandable: {
        flex:1,
        borderRadius:12,
        padding:DefaultStyles.container.paddingTop,
        borderWidth:1,
        borderColor:colors.accents.stroke,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        text: {
            fontSize:DefaultStyles.text.caption.xsmall,
            color:colors.text.secondary,
        }
    },
    directionsInput: {
        fontSize:DefaultStyles.text.caption.small,
        minHeight:100,
        padding:DefaultStyles.container.paddingTop,
        borderWidth:1,
        borderColor:colors.accents.stroke,
        borderRadius:12,
    },
    bottomContainer: {
        gap:24,
        marginTop:'auto'
    },
    remove: {
        textAlign:'center',
        width:'100%',
        color:'#f00',

    }
})