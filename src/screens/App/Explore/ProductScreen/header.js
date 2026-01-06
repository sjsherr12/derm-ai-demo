import { useNavigation } from "@react-navigation/native"
import IconButton from "components/Buttons/IconButton"
import DefaultTabHeader from "components/Containers/DefaultTabHeader"
import DefaultText from "components/Text/DefaultText"
import colors from "config/colors"
import DefaultStyles from "config/styles"
import { useState, useRef } from "react"
import { Share, StyleSheet, View, Animated } from "react-native"
import { MenuView } from '@react-native-menu/menu'
import * as Haptics from 'expo-haptics'
import { FontAwesome, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';

const ProductScreenHeader = ({
    product,
    isProductLiked,
    toggleLikedProduct,
}) => {
    const navigation = useNavigation();

    const handleLikePress = async () => {
        await toggleLikedProduct();
    };

    return (
        <DefaultTabHeader
            headerLeft={{
                component: (
                    <IconButton
                        style={styles.iconButton}
                        icon='arrow-back'
                        color={colors.text.secondary}
                        onPress={() => navigation.goBack()}
                    />
                )
            }}
            header={{
                component: (
                    <DefaultText
                        numberOfLines={1}
                        style={DefaultStyles.text.title.header}
                    >
                        Product Details
                    </DefaultText>
                )
            }}
            headerRight={{
                component: (
                    <View
                        style={styles.flexContainer}
                    >
                        <IconButton
                            style={styles.iconButton}
                            iconComponent={isProductLiked ? <FontAwesome name="heart" size={18} color={colors.accents.error} /> : <FontAwesome6 name="heart" size={18} color="black" />}
                            onPress={handleLikePress}
                            hapticType={Haptics.ImpactFeedbackStyle.Medium}
                            noScale
                        />
                        <IconButton
                            style={styles.iconButton}
                            iconComponent={<FontAwesome6 name="arrow-up-from-bracket" size={16} color="black" />}
                            color={colors.text.secondary}
                            size={18}
                            onPress={async () => {
                                await Share.share({
                                    message: `Check out this product on Derm AI! ${product?.buyLink}`
                                });
                            }}
                        />
                    </View>
                )
            }}
            style={{
                paddingHorizontal:DefaultStyles.container.paddingBottom,
            }}
        />
    )
}

export default ProductScreenHeader;

const styles = StyleSheet.create({
    flexContainer: {
        gap:8,
        flexDirection:'row',
        alignItems:'center',
    },
    iconButton: {
        width:44,
        height:44,
        borderRadius:64,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    }
})