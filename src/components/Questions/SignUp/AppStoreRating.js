import { useEffect, useState, useRef } from "react";
import { Animated, Pressable, StyleSheet, View, ScrollView, Dimensions } from "react-native";
import * as StoreReview from 'expo-store-review'
import { useSignUpFlow } from "context/SignUpFlowContext";
import DefaultStyles from "config/styles";
import colors from "config/colors";
import DefaultText from "components/Text/DefaultText";
import {Ionicons} from '@expo/vector-icons'
import StarRating from "components/Common/StarRating";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import * as Haptics from 'expo-haptics'

const reasonsToReview = [
    {
        title:'Help others find us',
        caption:'Your review truly helps others find our app.',
        icon:'people-outline'
    },
    {
        title:'Support the app',
        caption: 'Reviews help us improve and add features.',
        icon:'phone-portrait-outline'
    }
]

const testimonials = [
    {
        name:'Alyssa P.',
        rating: 5,
        review:'I’ve struggled with breakouts for years and tried everything. Derm AI actually helped me figure out which ingredients were making things worse — and what to use instead. My skin finally looks balanced.'
    },
    {
        name:'Marcus T.',
        rating: 5,
        review:'I’ve been into skincare for years, but I still found myself guessing when it came to ingredients. Derm AI is super specific and makes me feel like I actually understand what I’m putting on my skin.'
    },
    {
        name:'Leila A.',
        rating: 5,
        review:'My sister convinced me to try this after I broke out from a new cleanser. I had no idea that some products could be bad for me. Derm AI makes it easy to figure that stuff out without watching 10 videos.'
    },
    {
        name:'Chris D.',
        rating: 5,
        review:'After scanning my face, Derm AI highlighted areas of inflammation and pinpointed that I was over‑exfoliating. Seeing a visual map of my skin really helped me understand the problem.'
    }
]

const AppStoreRating = ({question}) => {
    const {answers, answerCurrent} = useSignUpFlow();
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
    })
    
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;

    const promptAppStoreRating = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
        StoreReview.requestReview();
        answerCurrent(question.id, true)
    }
    
    useEffect(() => {
        if (!answers[question?.id]) {
            promptAppStoreRating();
        }
    }, [])

    return (
        <View
            style={styles.container}
        >
            {reasonsToReview.map((reason, idx) => (
                <View
                    key={idx}
                    style={styles.itemContainer}
                >
                    <View
                        style={styles.flexContainer}
                    >
                        <View
                            style={{
                                width:36,
                                height:36,
                                backgroundColor:colors.background.light,
                                borderRadius:64,
                                justifyContent:'center',
                                alignItems:'center',
                            }}
                        >
                            <Ionicons
                                name={reason.icon}
                                color={colors.text.secondary}
                                size={18}
                            />
                        </View>

                        <View
                            style={{
                                flex:1,
                                gap:6,
                            }}
                        >
                            <DefaultText
                                style={styles.caption}
                            >
                                {reason.title}
                            </DefaultText>

                            <DefaultText
                                style={styles.text}
                            >
                                {reason.caption}
                            </DefaultText>
                        </View>
                    </View>
                </View>
            ))}

            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={promptAppStoreRating}
            >
                <Animated.View
                    style={[
                        styles.rateContainer,
                        {
                            transform:[{scale}]
                        }
                    ]}
                >
                    <DefaultText
                        style={styles.title}
                    >
                        Rate your experience
                    </DefaultText>

                    <StarRating
                        rating={5}
                        size={30}
                        style={{
                            gap:8,
                        }}
                    />
                </Animated.View>
            </Pressable>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={screenWidth - 48 + 20}
                decelerationRate="fast"
                onScroll={(event) => {
                    const slideSize = screenWidth - 48 + 20;
                    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
                    setCurrentTestimonialIndex(index);
                }}
                scrollEventThrottle={16}
            >
                {testimonials.map((tst, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.itemContainer, 
                            {
                                width: screenWidth - 48,
                                marginRight: idx < testimonials.length - 1 ? 20 : 0,
                            }
                        ]}
                    >
                        <View
                            style={styles.flexContainer}
                        >
                            <DefaultText
                                style={styles.caption}
                            >
                                {tst.name}
                            </DefaultText>

                            <StarRating
                                rating={tst.rating}
                                size={18}
                                style={{
                                    gap:4,
                                    marginLeft:'auto'
                                }}
                            />
                        </View>

                        <DefaultText
                            style={styles.text}
                        >
                            {tst.review}
                        </DefaultText>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.dotIndicatorContainer}>
                {testimonials.map((_, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: currentTestimonialIndex === idx 
                                    ? colors.text.darker 
                                    : colors.background.light
                            }
                        ]}
                    />
                ))}
            </View>
        </View>
    )
}

export default AppStoreRating;

const styles = StyleSheet.create({
    container: {
        gap:12,
        justifyContent:'center',
    },
    itemContainer: {
        width:'100%',
        gap:10,
        padding:16,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    flexContainer: {
        gap:16,
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
    },
    dotIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    rateContainer: {
        alignItems:'center',
        justifyContent:'center',
        gap:10,
        paddingVertical:DefaultStyles.container.paddingBottom,
        width:'100%',
        backgroundColor:colors.background.secondary,
        boxShadow:'0px 6px 12px rgba(0,0,0,.05)',
        borderRadius:12,
        marginVertical:DefaultStyles.container.paddingTop,
    },
    title: {
        fontSize:DefaultStyles.text.caption.medium,
        color:colors.text.primary,
        fontWeight:'600',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        fontWeight:'500',
    },
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
        lineHeight:17,
    },
})