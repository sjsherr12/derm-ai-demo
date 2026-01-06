import { Animated, Pressable, ScrollView, StyleSheet, View } from "react-native"
import DefaultStyles from "../../../../config/styles"
import colors from "../../../../config/colors"
import DefaultText from "../../../../components/Text/DefaultText"
import IconButton from "../../../../components/Buttons/IconButton"
import ProductCardItem from "../../../../components/Products/ProductCardItem"
import RoutineScreenRoutineProduct from "../../Routine/RoutineScreen/routineProduct"
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons'
import { useNavigation } from "@react-navigation/native"
import TextDivider from "../../../../components/Common/TextDivider"
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation"
import { useRedirect } from "../../../../context/RedirectContext"

const ClickableOption = ({
    option
}) => {
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:100,
    })
    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={option.onPress}
            style={{
                flex:1,
                width:'100%',
            }}
        >
            <Animated.View
                style={[
                    styles.optionContainer,
                    {transform:[{scale}]}
                ]}
            >
                {option.icon}
                <DefaultText
                    style={styles.caption}
                >
                    {option.name}
                </DefaultText>
            </Animated.View>
        </Pressable>
    )
}

const ProductScanScreenProductResults = ({
    productResults,
    onClose,
    onUseBarcode,
}) => {

    const {replace} = useRedirect();
    const navigation = useNavigation();

    const options = [
        {
            name: 'Scan Barcode',
            icon: <MaterialCommunityIcons
                name='barcode-scan'
                size={24}
                color={colors.text.secondary}
            />,
            onPress: onUseBarcode
        },
        {
            name: 'Manual Search',
            icon: <Ionicons
                name='search'
                size={24}
                color={colors.text.secondary}
            />,
            onPress: () => {
                navigation.goBack();
                setTimeout(() => replace('Explore'), 200)
            }
        }
    ]

    return (
        <View
            style={styles.container}
        >
            <View
                style={styles.flexContainer}
            >
                <DefaultText
                    style={styles.title}
                    numberOfLines={1}
                >
                    Product Results
                </DefaultText>

                <IconButton
                    style={styles.iconButton}
                    icon='close'
                    size={16}
                    color={colors.text.darker}
                    onPress={onClose}
                />
            </View>

            <DefaultText
                style={styles.text}
            >
                Select the product you’re looking for:
            </DefaultText>

            <View
                style={styles.scrollContainer}
            >
                {productResults?.length? (
                    <>
                        {productResults?.map((product, idx) => (
                            <RoutineScreenRoutineProduct
                                key={idx}
                                productInfo={product}
                                onPress={() => navigation.navigate('Product', {
                                    productId: product?.id
                                })}
                                endAdornment={
                                    <Ionicons
                                        name='chevron-forward'
                                        size={24}
                                        color={colors.text.secondary}
                                    />
                                }
                            />
                        ))}
                    </>
                ) : (<></>)}
            </View>

            <TextDivider
                text='or'
            />

            <View
                style={{
                    ...styles.flexContainer,
                    paddingVertical:DefaultStyles.container.paddingTop,
                }}
            >
                {options.map((option, idx) => (
                    <ClickableOption
                        key={idx}
                        option={option}
                    />
                ))}
            </View>
        </View>
    )
}

export default ProductScanScreenProductResults;

const styles = StyleSheet.create({
    container: {
        flex:1,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        gap:8,
    },
    flexContainer: {
        gap:16,
        width:'100%',
        justifyContent:'space-between',
        alignItems:'center',
        flexDirection:'row',
    },
    iconButton: {
        width:32,
        height:32,
        marginLeft:'auto',
        backgroundColor:colors.background.light,
    },
    title: {
        flex:1,
        alignSelf:'flex-start',
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.secondary,
        fontWeight:'600'
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
    },
    caption: {
        fontWeight:'700',
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.caption.small,
    },
    scrollContainer: {
        width:'100%',
        flex:1,
        gap:16,
        paddingTop:DefaultStyles.container.paddingBottom,
        paddingBottom:4,
    },
    optionContainer: {
        flex:1,
        width:'100%',
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        borderRadius:12,
        paddingVertical:DefaultStyles.container.paddingHorizontal,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
        alignItems:'center',
        gap:16,
    }
})