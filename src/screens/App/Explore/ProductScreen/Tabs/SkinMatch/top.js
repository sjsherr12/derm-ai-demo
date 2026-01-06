import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { Genders } from "constants/signup";
import { useData } from "context/global/DataContext";
import React from "react";
import {Ionicons, FontAwesome6} from '@expo/vector-icons'
import { Animated, Image, StyleSheet, View } from "react-native";
import DefaultButton from "components/Buttons/DefaultButton";
import { getUserPlaceholderProfile } from "utils/user";

const ProductScreenSkinMatchTabTopSection = ({
    product,
    userData,
    latestScan,
    matchInfo,
    userImagePosition,
    productImagePosition,
    contentOpacity,
}) => {
    
    const placeholderProfile = getUserPlaceholderProfile(userData)

    return (
        <View
            style={styles.container}
        >
            <Animated.View
                style={{
                    opacity: contentOpacity,
                }}
            >
                <DefaultText
                    style={styles.title}
                >
                    Matching Analysis Results
                </DefaultText>
            </Animated.View>

            <View
                style={styles.flexContainer}
            >
                <Animated.Image
                    source={
                        latestScan?.facialScans?.front
                            ? { uri: latestScan.facialScans?.front }
                            : placeholderProfile
                    }
                    resizeMode='cover'
                    style={[
                        styles.imageContainer,
                        {
                            transform: [{ translateX: userImagePosition }],
                        }
                    ]}
                />
                <Animated.View
                    style={[
                        styles.matchContainer,
                        {
                            opacity: contentOpacity,
                        }
                    ]}
                >
                    <View
                        style={[
                            styles.matchIcon,
                            {backgroundColor:matchInfo.color}
                        ]}
                    >
                        <FontAwesome6
                            name={matchInfo.icon}
                            color='#fff'
                            size={28}
                        />
                    </View>
                </Animated.View>
                <Animated.Image
                    source={{
                        uri:product?.imageUrl
                    }}
                    style={[
                        styles.imageContainer,
                        {
                            padding:8,
                            transform: [{ translateX: productImagePosition }],
                        }
                    ]}

                    resizeMode='contain'
                />
            </View>

            <Animated.View
                style={{
                    opacity: contentOpacity,
                    width: '100%',
                }}
            >
                <DefaultButton
                    title={matchInfo?.title || 'Match Result'}
                    style={{
                        backgroundColor:matchInfo?.color,
                        color:colors.text.primary,
                        height:50,
                    }}
                    extraStyles={{
                        button: {
                            height:50
                        }
                    }}
                />
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'700',
        color:colors.text.secondary,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
        position:'relative',
    },
    container: {
        gap:24,
        width:'100%',
        alignItems:'center',
    },
    imageContainer: {
        width:'48%',
        aspectRatio:1,
        borderRadius:14,
        borderWidth:2,
        borderColor:colors.accents.stroke,
    },
    matchContainer: {
        width:64,
        height:64,
        position:'absolute',
        top:'50%',
        left:'50%',
        transform: [{ translateX: -32 }, { translateY: -32 }],
        boxShadow:'0px 6px 12px rgba(0,0,0,.05)',
        borderRadius:64,
        backgroundColor:colors.background.screen,
        zIndex:2,
        justifyContent:'center',
        alignItems:'center',
    },
    matchIcon: {
        justifyContent:'center',
        alignItems:'center',
        width:48,
        height:48,
        borderRadius:64,
    }
})

export default ProductScreenSkinMatchTabTopSection;