import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import {Ionicons} from '@expo/vector-icons'
import { useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from 'expo-haptics'
import EmptyRoutineGraphic from "components/Graphics/EmptyRoutineGraphic";
import CompressedProductItem from "components/Products/CompressedProductItem";
import useScalePressAnimation from "hooks/useScalePressAnimation";

const HomeScreenRoutineShortcut = ({
    isMorningRoutine,
    products,
    length,
}) => {
    const navigation = useNavigation();
    const isEmpty = !products || products.length === 0;

    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
    })

    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        console.log((!!isMorningRoutine+0))
        if (isEmpty) {
            navigation.navigate('EditRoutines', { 
                initialTab: (!isMorningRoutine+0)
            });
        } else {
            navigation.navigate('Routines', {
                initialTab: (!isMorningRoutine+0),
            });
        }
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
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
                            {isMorningRoutine ? 'Morning' : 'Evening'} Routine
                        </DefaultText>

                        <Ionicons
                            name={isMorningRoutine ? 'sunny-outline' : 'moon-outline'}
                            size={isMorningRoutine ? 28 : 24}
                            style={{transform:'rotate(270deg)'}}
                        />
                    </View>

                    <DefaultText
                        style={styles.containerCaption}
                    >
                        {(new Date()).toLocaleDateString('en-US', {
                            year:'numeric',
                            month:'long',
                            day:'numeric',
                            weekday:'long'
                        })}
                    </DefaultText>
                </View>

                {isEmpty ? (
                    <EmptyRoutineGraphic 
                        isMorningRoutine={isMorningRoutine}
                        size="medium"
                        showText={false}
                    />
                ) : (
                    <View
                        style={styles.productsContainer}
                    >
                        {products?.slice(0,length).map((product, idx) => (
                            <View
                                key={idx}
                                style={styles.productContainer}
                            >
                                <CompressedProductItem
                                    productInfo={product?.productInfo}
                                />
                            </View>
                        ))}
                    </View>
                )}

                <DefaultText
                    style={styles.textShortcut}
                >
                    {isEmpty ? 'Create Routine' : 'View Routine'}
                </DefaultText>
            </Animated.View>
        </Pressable>
    )
}

export default HomeScreenRoutineShortcut;

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
    productContainer: {
        gap:16,
        flexDirection:'row',
        alignItems:'center',
        borderBottomWidth:1,
        borderBottomColor:colors.accents.stroke,
    },
    productImage: {
        borderRadius:6,
        width:50,
        height:50,
    },
    productInfoContainer: {
        flex:1,
        gap:4,
        paddingRight:DefaultStyles.container.paddingHorizontal,
    },
    productTitle: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        fontWeight:'600',
    },
    productDescription: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
    },
    textShortcut: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        width:'100%',
        textAlign:'center',
    }
})