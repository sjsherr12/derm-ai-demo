import DefaultText from "components/Text/DefaultText"
import React, { useRef, useState, useEffect } from "react"
import * as Haptics from 'expo-haptics'
import DefaultButton from "components/Buttons/DefaultButton"
const { default: colors } = require("config/colors")
const { default: DefaultStyles } = require("config/styles")
const { StyleSheet, View, Image, Pressable, Animated, Modal } = require("react-native")
import {Ionicons} from '@expo/vector-icons'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Skeleton from "components/Common/Skeleton"
import DefaultBottomSheet from "components/Containers/DefaultBottomSheet"
import { SkincareProductCategories } from "constants/products"
import { RoutineProductUsageFrequencies } from "constants/products"
import { useRedirect } from "context/RedirectContext"
import { useNavigation } from "@react-navigation/native"
import { getProductCategory } from "utils/products"
import useScalePressAnimation from "hooks/useScalePressAnimation"
import { MenuView } from "@react-native-menu/menu"
import { BlurView } from 'expo-blur'

const RoutineScreenRoutineProduct = ({
    onPress,
    productInfo,
    routineInfo,
    displayDirections,
    endAdornment,
    badge,
    onDelete,
    useNativeDriver,
    isCompleted = false,
    inDemo,
    blur,
}) => {
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        useNativeDriver: true,
    });

    // Animated values for completion state
    const borderWidthAnim = useRef(new Animated.Value(isCompleted ? 3 : 1.5)).current;
    const borderColorAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
    const badgeColorAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;

    const LeftComponent = productInfo?.imageUrl? Image : Skeleton;
    const productCategory = getProductCategory(productInfo)
    const productUsageFrequency = RoutineProductUsageFrequencies.find(rpuf => rpuf.value === routineInfo?.usageFrequency)?.title

    const disableFeatures = !productInfo || inDemo || blur

    // Animate completion state changes
    useEffect(() => {
        const toValue = isCompleted ? 1 : 0;
        const borderWidthToValue = isCompleted ? 3 : 1.5;
        
        Animated.parallel([
            Animated.timing(borderWidthAnim, {
                toValue: borderWidthToValue,
                duration: 400,
                useNativeDriver: false,
            }),
            Animated.timing(borderColorAnim, {
                toValue,
                duration: 400,
                useNativeDriver: false,
            }),
            Animated.timing(badgeColorAnim, {
                toValue,
                duration: 400,
                useNativeDriver: false,
            })
        ]).start();
    }, [isCompleted]);

    // Interpolate colors based on animation values
    const animatedBorderColor = borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.accents.stroke, colors.background.secondary]
    });

    const animatedBadgeBackgroundColor = badgeColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.background.primary, colors.background.secondary]
    });

    const handleContainerPress = () => {
        // if (hapticType) {
        //     Haptics.impactAsync(hapticType)
        // }
        if (onPress) {
            onPress();
        }
    }

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleContainerPress}
            disabled={disableFeatures}
        >
            <Animated.View
                style={{
                    transform:[{scale}],
                }}
            >
                <Animated.View
                    style={[
                        styles.container,
                        {
                            borderWidth: borderWidthAnim,
                            borderColor: animatedBorderColor,
                        }
                    ]}
                >
                {/* Blur overlay */}
                {blur && (
                    <>
                        <BlurView 
                            intensity={100}
                            style={styles.blurOverlay}
                        />
                        <View style={styles.lockContainer}>
                            <DefaultText style={styles.lockEmoji}>🔒</DefaultText>
                        </View>
                    </>
                )}
                
                <View style={styles.wrapperContainer}>
                    <View style={styles.mainContainer}>
                        <LeftComponent
                            source={{uri:productInfo?.imageUrl}}
                            style={{
                                width:72,
                                height:72,
                                borderRadius:8,
                                resizeMode:'contain'
                            }}
                        />

                        <View style={styles.textContainer}>
                            <View style={styles.brandContainer}>
                                <DefaultText 
                                    style={styles.brand}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {productInfo?.brand || <Skeleton width={75} height={15} />}
                                </DefaultText>
                            </View>

                            <DefaultText
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={styles.title}
                            >
                                {productInfo?.name || <Skeleton width={125} height={20} />}
                            </DefaultText>
                            <DefaultText 
                                style={styles.caption}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {productCategory}{routineInfo && ` · ${productUsageFrequency}`}
                            </DefaultText>
                        </View>

                        {badge && (
                            <>
                                {productInfo ? (
                                    <Animated.View
                                        style={[
                                            styles.badgeContainer,
                                            { backgroundColor: animatedBadgeBackgroundColor }
                                        ]}
                                    >
                                        <DefaultText style={styles.badgeText}>
                                            {badge}
                                        </DefaultText>
                                    </Animated.View>
                                ) : (
                                    <Skeleton
                                        width={60}
                                        height={20}
                                        borderRadius={16}
                                        style={{
                                            position:'absolute',
                                            top:6,
                                            right:6,
                                        }}
                                    />
                                )}
                            </>
                        )}

                        {endAdornment}
                    </View>

                    {displayDirections && routineInfo?.directions && 
                        <React.Fragment>
                            <View style={DefaultStyles.separator} />

                            <View style={styles.directionsContainer}>
                                <DefaultText
                                    style={{
                                        fontWeight:'800'
                                    }}
                                >
                                    Notes:{' '}
                                    <DefaultText
                                        style={{
                                            fontWeight:'normal'
                                        }}
                                    >
                                        {routineInfo.directions}
                                    </DefaultText>
                                </DefaultText>
                            </View>
                        </React.Fragment>
                    }
                </View>
                </Animated.View>
            </Animated.View>
        </Pressable>
    )
}

export default RoutineScreenRoutineProduct;

const styles = StyleSheet.create({
    mainContentWrapper: {
        backgroundColor: colors.background.screen, // Ensures content covers delete button
        zIndex: 2, // Places main content above delete button
    },
    container: {
        borderRadius:14,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        backgroundColor: colors.background.screen, // Add background to prevent see-through
        width:'100%',
        position:'relative',
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 14,
        zIndex: 10,
        overflow: 'hidden',
    },
    lockContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 11,
    },
    lockEmoji: {
        fontSize: 64,
    },
    deleteContainer: {
        position: 'absolute',
        right: -14,
        top: 0,
        bottom: 0,
        width: 80,
        backgroundColor: colors.accents.error,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        zIndex: 1, // Places delete button below main content
    },
    deleteButton: {
        width: 80,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContainer: {
        gap:16,
        padding:DefaultStyles.container.paddingTop,
        flexDirection:'row',
        alignItems:'center',
    },
    directionsContainer: {
        padding:DefaultStyles.container.paddingBottom,
    },
    textContainer: {
        flex:1,
        gap:10,
    },
    brandContainer: {
        maxWidth: '70%', 
    },
    brand: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
        fontWeight:'bold',
    },
    title: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        fontWeight:'600',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
        fontWeight:'500'
    },
    directions: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.secondary,
    },
    badgeContainer: {
        paddingHorizontal:12,
        paddingVertical:5,
        borderRadius:16,
        position:'absolute',
        top:6,
        right:6,
    },
    badgeText: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.primary,
        fontWeight:'500'
    },
    expandedContainer: {
        gap:20,
        padding:DefaultStyles.container.paddingBottom,
        borderTopWidth:1,
        borderTopColor:colors.accents.stroke,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        paddingBottom: 40, // Position above bottom
    },
    modalContent: {
        backgroundColor: colors.background.screen,
        borderRadius: 24, // Full border radius since it's not touching bottom
        padding: 24,
        marginHorizontal: 20, // Add horizontal margins
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalCloseButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 20,
        backgroundColor: colors.background.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: DefaultStyles.text.title.xsmall,
        fontWeight: '600',
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalCaption: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.darker,
        textAlign: 'center',
        marginBottom: 38,
    },
    confirmButton: {
        width: '100%',
        borderRadius:50,
        color:'#fff'
    },
})