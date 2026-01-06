import * as Haptics from 'expo-haptics'
import {Ionicons} from '@expo/vector-icons'
const { default: DefaultButton } = require("components/Buttons/DefaultButton")
const { default: DefaultText } = require("components/Text/DefaultText")
const { default: colors } = require("config/colors")
const { default: DefaultStyles } = require("config/styles")
const { default: useScalePressAnimation } = require("hooks/useScalePressAnimation")
const { useState } = require("react")
const { Pressable, View, Animated, ActivityIndicator } = require("react-native")
const { StyleSheet } = require("react-native")
const { Modal } = require("react-native")

const AnalysisScreenProductsTabRemoveProductRecommendation = ({
    visible,
    onClose,
    confirmRemoveProduct
}) => {
    const [loading, setLoading] = useState(false);
    const [dontRecommendAgain, setDontRecommendAgain] = useState(false);
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:150,
    });

    const handleDontRecommendAgain = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        setDontRecommendAgain(prev => !prev)
    }

    const handleRemove = async () => {
        setLoading(true);
        await confirmRemoveProduct(dontRecommendAgain)
        setLoading(false);
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.modalBackdrop}
                onPress={onClose}
            >
                <Pressable 
                    style={styles.modalContent}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View 
                        style={styles.container}
                        showsVerticalScrollIndicator={false}
                    >
                        <DefaultText
                            style={styles.title}
                        >
                            Remove recommendation
                        </DefaultText>

                        <DefaultText
                            style={styles.text}
                        >
                            Are you sure you want to remove this product from your routine recommendations?
                        </DefaultText>

                        <Pressable
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                            onPress={handleDontRecommendAgain}
                        >
                            <Animated.View
                                style={[
                                    styles.itemContainer,
                                    {transform:[{scale}]}
                                ]}
                            >
                                <View
                                    style={styles.flexContainer}
                                >
                                    <DefaultText
                                        style={styles.text}
                                    >
                                        Don’t recommend product again
                                    </DefaultText>

                                    <Ionicons
                                        name={dontRecommendAgain ? 'checkmark-circle-sharp' : 'ellipse-outline'}
                                        color={dontRecommendAgain ? colors.background.primary : colors.accents.stroke}
                                        size={24}
                                        style={{
                                            marginLeft:'auto',
                                        }}
                                    />
                                </View>
                            </Animated.View>
                        </Pressable>

                        <View
                            style={[
                                styles.flexContainer,
                                {marginTop:12}
                            ]}
                        >
                            <DefaultButton
                                title='Cancel'
                                onPress={onClose}
                                style={{
                                    flex:.5,
                                    borderRadius:64,
                                    backgroundColor:colors.background.light,
                                    height:50,
                                }}
                                extraStyles={{
                                    button: {
                                        height:50,
                                    },
                                }}
                                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                            />
                            <DefaultButton
                                disabled={loading}
                                title={loading ? 
                                    <View
                                        style={{
                                            width:'100%',
                                            justifyContent:'center'
                                        }}
                                    >
                                        <ActivityIndicator />
                                        
                                    </View>
                                    :
                                    'Remove'
                                }
                                onPress={handleRemove}
                                isActive={true}
                                style={{
                                    flex:.5,
                                    borderRadius:64,
                                    backgroundColor:loading ? colors.background.light : colors.accents.error,
                                    height:50,
                                }}
                                extraStyles={{
                                    button: {
                                        height:50,
                                    }
                                }}
                                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                            />
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

export default AnalysisScreenProductsTabRemoveProductRecommendation;

const styles = StyleSheet.create({
    // Modal styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.background.screen,
        borderRadius: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    container: {
        gap:16,
        padding:DefaultStyles.container.paddingHorizontal,
    },
    flexContainer: {
        gap:16,
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
    },
    itemContainer: {
        borderTopWidth:1,
        borderBottomWidth:1,
        borderColor:colors.accents.stroke,
        paddingVertical:12,
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    text: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.darker,
    },
})