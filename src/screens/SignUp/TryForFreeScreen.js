import { useNavigation } from "@react-navigation/native";
import DefaultStyles from "../../config/styles";
import { useSafeAreaStyles } from "../../hooks/useSafeAreaStyles";
import DefaultText from "../../components/Text/DefaultText";
import Purchases from "react-native-purchases";
import { useState, useRef, useEffect } from "react";
import { Alert, Image, StyleSheet, View, ScrollView, Dimensions, Animated } from "react-native";
import colors from "../../config/colors";
import IconButton from "../../components/Buttons/IconButton";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingOverlay from "../../components/Common/LoadingOverlay";
import Scan from '../../assets/media/demos/scan.png'
import Analysis from '../../assets/media/demos/analysis.png'
import Recommendations from '../../assets/media/demos/recommendations.png'
import Progress from '../../assets/media/demos/progress.png'
import Product from '../../assets/media/demos/product.png'
import DefaultButton from "../../components/Buttons/DefaultButton";
import {FontAwesome6} from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRedirect } from "../../context/RedirectContext";

const sellPoints = [
    {
        name: 'glowing skin',
        image: Scan,
    },
    {
        name: 'skin analysis',
        image: Analysis
    },
    {
        name: 'a new routine',
        image: Recommendations
    },
    {
        name: 'real progress',
        image: Progress
    },
    {
        name: 'product info',
        image: Product,
    }
]

const TryForFreeScreen = () => {
    const {replace} = useRedirect();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;

    const handleScroll = (event) => {
        const contentOffset = event.nativeEvent.contentOffset;
        const viewSize = event.nativeEvent.layoutMeasurement;
        const pageNum = Math.round(contentOffset.x / viewSize.width);

        setCurrentIndex(pageNum);
    };

    return (
        <View style={DefaultStyles.outer}>
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <View
                    style={styles.topContainer}
                >
                    <DefaultText
                        style={styles.title}
                    >
                        We want you to get{'\n'}
                        <DefaultText
                            style={{
                                color:colors.background.primary,
                            }}
                        >
                            {sellPoints[currentIndex].name}
                        </DefaultText> for free.
                    </DefaultText>
                </View>
                
                <View
                    style={styles.container}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleScroll}
                        decelerationRate="fast"
                        style={{ flex: 1, width: '100%' }}
                        contentContainerStyle={{ alignItems: 'center' }}
                    >
                        {sellPoints.map((sellPoint, index) => (
                            <View key={index} style={{ width: screenWidth, alignItems: 'center', flex: 1 }}>
                                <Image
                                    source={sellPoint.image}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        flex: 1,
                                    }}
                                    resizeMode='contain'
                                />
                            </View>
                        ))}
                    </ScrollView>
                    <View
                        style={styles.dotContainer}
                    >
                        {sellPoints.map((_, index) => (
                            <View
                                key={index}
                                style={{
                                    width: 8,
                                    height: 8,
                                    backgroundColor: index === currentIndex ? colors.text.secondary : colors.background.light,
                                    borderRadius: 16,
                                }}
                            />
                        ))}
                    </View>
                </View>

                <View
                    style={styles.bottomContainer}
                >
                    <View
                        style={styles.flexContainer}
                    >
                        <FontAwesome6
                            name='check'
                            size={18}
                            color={colors.text.secondary}
                        />
                        <DefaultText
                            style={styles.subtitle}
                        >
                            No payment due now
                        </DefaultText>
                    </View>
                    <DefaultButton
                        title='Try for free'
                        isActive
                        style={{
                            borderRadius:64,
                        }}
                        extraStyles={{
                            text: {
                                fontWeight:'700',
                            }
                        }}
                        onPress={() => replace('Paywall')}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    />

                    <DefaultText
                        style={styles.subtext}
                    >
                        3-day free trial, then just $3.33/mo
                    </DefaultText>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default TryForFreeScreen;

const styles = StyleSheet.create({
    restorePurchase: {
        fontSize:DefaultStyles.text.caption.xsmall,
        fontWeight:'600',
        color:colors.text.lighter,
        textAlign:'right',
    },
    iconButton: {
        width:48,
        height:48,
        backgroundColor:colors.background.light,
    },
    topContainer: {
        gap:16,
        alignItems:'center',
        width:'100%',
        padding:DefaultStyles.container.paddingHorizontal,
    },
    title: {
        fontSize:DefaultStyles.text.title.medium,
        fontWeight:'700',
        color:colors.text.secondary,
        textAlign:'center',
        lineHeight:48,
    },
    subtitle: {
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    subtext: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
        textAlign:'center',
    },
    container: {
        gap:16,
        width:'100%',
        alignItems:'center',
        flex:1,
        paddingBottom:DefaultStyles.container.paddingBottom,
    },
    bottomContainer: {
        gap:16,
        padding:DefaultStyles.container.paddingHorizontal,
        paddingBottom:0,
        borderTopLeftRadius:32,
        borderTopRightRadius:32,
        boxShadow:'0px -30px 32px rgba(0,0,0,.05)',
    },
    dotContainer: {
        display:'flex',
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        gap:8,
        width:'100%',
        marginBottom:8,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
        justifyContent:'center',
        gap:12,
    }
})