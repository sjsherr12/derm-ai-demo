import IconButton from "components/Buttons/IconButton";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { Animated, Linking, ScrollView, StyleSheet, View } from "react-native";
import { getIngredientSafetyRating } from "utils/ingredients";
import {Ionicons, Entypo} from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { IngredientFunctions } from "constants/ingredients";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useData } from "context/global/DataContext";
import { CommonIngredientConcerns } from "constants/ingredients";
import { CommonIngredientConcernRankings } from "constants/ingredients";
import { Pressable } from "react-native";
import { useRef, useState } from "react";
import IngredientScreenIngredientFunctionItem from "./function";

const IngredientsScreenIngredientDetailedInfo = ({
    ingredient,
    onClose,
}) => {

    const safetyRating = getIngredientSafetyRating(ingredient);

    return (
        <View
            style={styles.container}
        >
            <View
                style={[
                    styles.flexContainer,
                    {
                        gap:4,
                    }
                ]}
            >
                <DefaultText
                    style={styles.title}
                    numberOfLines={1}
                >
                    {ingredient?.name}
                </DefaultText>

                <IconButton
                    style={styles.iconButton}
                    icon='close'
                    size={16}
                    color={colors.text.darker}
                    onPress={onClose}
                />
            </View>

            <View
                style={[
                    styles.ratingContainer,
                    {backgroundColor:safetyRating?.color}
                ]}
            >
                <DefaultText
                    style={styles.ratingText}
                >
                    Overall Rating: {safetyRating?.name}
                </DefaultText>
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingBottom:48,
                    gap:24,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={styles.itemContainer}
                >
                    <View
                        style={styles.flexContainer}
                    >
                        <Entypo
                            name='text'
                            color={colors.text.secondary}
                            size={16}
                        />
                        <DefaultText
                            style={styles.caption}
                        >
                            Description
                        </DefaultText>
                    </View>
                    
                    <DefaultText
                        style={styles.text}
                    >
                        {ingredient?.description ?? 'No description found.'}
                    </DefaultText>
                </View>

                <View
                    style={styles.itemContainer}
                >
                    <View
                        style={styles.flexContainer}
                    >
                        <Ionicons
                            name='settings-outline'
                            color={colors.text.secondary}
                            size={16}
                        />
                        <DefaultText
                            style={styles.caption}
                        >
                            Functions
                        </DefaultText>
                    </View>

                    {ingredient?.functions?.sort((a, b) => Number(a) - Number(b)).map((fnc, idx) => (
                        <IngredientScreenIngredientFunctionItem
                            key={idx}
                            functionType={fnc}
                        />
                    ))}
                </View>

                <View
                    style={styles.itemContainer}
                >
                    <View
                        style={styles.flexContainer}
                    >
                        <Ionicons
                            name='medical-outline'
                            color={colors.text.secondary}
                            size={18}
                        />
                        <DefaultText
                            style={styles.caption}
                        >
                            Health Concerns
                        </DefaultText>
                    </View>

                    {ingredient?.concerns?.map((fnc, idx) => {
                        const severityInfo = CommonIngredientConcernRankings.find(cicr => cicr.value === fnc)
                        const concernInfo = CommonIngredientConcerns[idx];

                        return (
                            <View
                                key={idx}
                                style={styles.flexContainer}
                            >
                                <DefaultText
                                    style={styles.smallTitle}
                                >
                                    {concernInfo.name}
                                </DefaultText>

                                <View
                                    style={[
                                        styles.pill,
                                        {
                                            marginLeft:'auto',
                                            backgroundColor: severityInfo?.color
                                        }
                                    ]}
                                >
                                    <DefaultText
                                        style={[
                                            styles.text,
                                            {color:fnc ? colors.text.primary : colors.text.secondary}
                                        ]}
                                    >
                                        {severityInfo?.name}
                                    </DefaultText>
                                </View>
                            </View>
                        )
                    })}
                </View>

                {ingredient?.references?.length > 0 && (
                    <View
                        style={styles.itemContainer}
                    >
                        <View
                            style={styles.flexContainer}
                        >
                            <Ionicons
                                name='open-outline'
                                color={colors.text.secondary}
                                size={18}
                            />
                            <DefaultText
                                style={styles.caption}
                            >
                                References
                            </DefaultText>
                        </View>

                        {ingredient?.references?.map((reference, idx) => {
                            const referenceUrl = `https://www.google.com/search?q=${encodeURIComponent(reference)}`
                            return (
                                <DefaultText
                                    key={idx}
                                    style={[
                                        styles.text,
                                        {
                                            fontWeight:'550',
                                            textDecorationLine:'underline',
                                        }
                                    ]}
                                    onPress={() => Linking.openURL(referenceUrl)}
                                >
                                    {reference}
                                </DefaultText>
                            )
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

export default IngredientsScreenIngredientDetailedInfo;

const styles = StyleSheet.create({
    container: {
        gap:24,
        flex:1,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        backgroundColor:colors.background.screen,
    },
    flexContainer: {
        gap:12,
        flexDirection:'row',
        alignItems:'center',
    },
    itemContainer: {
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:12,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        gap:14,
    },
    ratingContainer: {
        padding:14,
        width:'100%',
        borderRadius:64,
    },
    title: {
        width:'90%',
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.secondary,
        fontWeight:'600'
    },
    caption: {
        fontSize:DefaultStyles.text.caption.large,
        color:colors.text.secondary,
        fontWeight:'600'
    },
    smallTitle: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        fontWeight:'500'
    },
    ratingText: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.primary,
        textAlign:'center',
    },
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
        lineHeight:18
    },
    iconButton: {
        width:32,
        height:32,
        marginLeft:'auto',
        backgroundColor:colors.background.light,
    },
    pill: {
        paddingHorizontal:8,
        paddingVertical:4,
        borderRadius:64,
    }
})