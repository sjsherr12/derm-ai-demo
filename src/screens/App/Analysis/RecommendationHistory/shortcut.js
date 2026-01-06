import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import colors from "../../../../config/colors";
import DefaultStyles from "../../../../config/styles";
import {Ionicons} from '@expo/vector-icons'
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation";
import DefaultText from "../../../../components/Text/DefaultText";
import { useData } from "../../../../context/global/DataContext";
import { useNavigation } from "@react-navigation/native";

const RecommendationHistoryShortcut = ({
    diagnosis
}) => {

    const {products} = useData();
    const navigation = useNavigation();
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })

    const firstProduct = products?.[diagnosis?.routineRecommendations[0]];
    const imagesForCollage = diagnosis?.routineRecommendations?.slice(0,4)?.map(productId => products?.[productId].imageUrl);

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('FullRecommendations', {
                routineRecommendations: diagnosis?.routineRecommendations
            })}
        >
            <Animated.View
                style={[
                    styles.container,
                    {transform:[{scale}]}
                ]}
            >
                <View style={styles.imageContainer}>
                    {imagesForCollage?.map((imageUrl, index) => (
                        <Image
                            key={index}
                            source={{ uri: imageUrl }}
                            style={[styles.collageImage, styles[`position${index}`]]}
                        />
                    ))}
                </View>
                <View
                    style={{
                        flex:1,
                        gap:8
                    }}
                >
                    <DefaultText
                        style={styles.title}
                    >
                        {(new Date(diagnosis?.createdAt)).toLocaleDateString()} recommendations
                    </DefaultText>

                    <DefaultText
                        style={styles.text}
                    >
                        Including products like {firstProduct.name} from {firstProduct?.brand}.
                    </DefaultText>
                </View>

                <Ionicons
                    name='chevron-forward'
                    size={24}
                    color={colors.text.secondary}
                />
            </Animated.View>
        </Pressable>
    )
}

export default RecommendationHistoryShortcut;

const styles = StyleSheet.create({
    container: {
        borderWidth:1.5,
        borderRadius:12,
        borderColor:colors.accents.stroke,
        padding:DefaultStyles.container.paddingBottom,
        gap:16,
        flexDirection:'row',
        alignItems:'center',
    },
    imageContainer: {
        width:100,
        height:100,
        borderRadius:8,
        borderWidth:2,
        borderColor:colors.accents.stroke,
        backgroundColor:'white',
        position:'relative',
    },
    collageImage: {
        width:36,
        height:36,
        resizeMode:'cover',
        position:'absolute'
    },
    position0: {
        top:8,
        left:8,
    },
    position1: {
        top:8,
        right:8,
    },
    position2: {
        bottom:8,
        left:8,
    },
    position3: {
        bottom:8,
        right:8,
    },
    title: {
        color:colors.text.dark,
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.medium,
    },
    text: {
        alignSelf:'flex-start',
        color:colors.text.darker,
        fontWeight:'400',
        fontSize:14,
    }
})