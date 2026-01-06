import { Animated, Image, Pressable, StyleSheet, View } from "react-native"
import DefaultStyles from "../../../../config/styles"
import colors from "../../../../config/colors"
import { lighten } from "../../../../utils/lighten"
import DefaultText from "../../../../components/Text/DefaultText"
import {Ionicons, Entypo} from '@expo/vector-icons'
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation"
import { useNavigation } from "@react-navigation/native"
import FadeScaleView from "../../../../components/Containers/FadeScaleView"

const AnalysisScreenCategoryScreenShortcut = ({ category, categoryProducts, image }) => {

    const navigation = useNavigation();
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.9,
        maxScale:1,
        duration:150,
        useNativeDriver:true
    })

    return (
        <FadeScaleView
        >
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => navigation.navigate('AnalysisCategory', {
                    category,
                    categoryProducts
                })}
            >
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor:lighten(category.color, .9),
                            borderColor:lighten(category.color, .5),
                            transform:[{scale}]
                        }
                    ]}
                >
                    <Image
                        source={{
                            uri:image
                        }}
                        style={[
                            styles.imageContainer,
                            {
                                borderColor:lighten(category.color, .5)
                            }
                        ]}
                    />

                    <View
                        style={{
                            flex:1,
                            gap:6,
                        }}
                    >
                        <DefaultText
                            style={styles.title}
                        >
                            {category?.pluralTitle}
                        </DefaultText>

                        <DefaultText
                            style={styles.text}
                        >
                            {category.description}
                        </DefaultText>
                    </View>

                    <Entypo
                        name='chevron-right'
                        color={colors.text.dark}
                        size={24}
                    />
                </Animated.View>
            </Pressable>
        </FadeScaleView>
    );
};

export default AnalysisScreenCategoryScreenShortcut;

const styles = StyleSheet.create({
    container: {
        flex:1,
        borderRadius: 16,
        padding:DefaultStyles.container.paddingBottom,
        flexDirection:'row',
        alignItems:'center',
        borderWidth:2,
        gap:14,
    },
    imageContainer: {
        width:80,
        height:80,
        borderRadius:8,
        borderWidth:2,
        padding:8,
        backgroundColor:'white',
        resizeMode:'contain'
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
});