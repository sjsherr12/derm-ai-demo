import DefaultStyles from "config/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import {Feather, Ionicons, FontAwesome, FontAwesome6, MaterialCommunityIcons} from '@expo/vector-icons'
import colors from "config/colors";
import IconButton from "components/Buttons/IconButton";
import SignUpQuestions from "data/SignUpQuestions";
import FadeScaleView from "components/Containers/FadeScaleView";
import { useSignUpFlow } from "context/SignUpFlowContext";
import ConditionalScrollView from "components/Containers/ConditionalScrollView";
import * as Haptics from 'expo-haptics'
import DefaultButton from "components/Buttons/DefaultButton";
import DefaultText from "components/Text/DefaultText";
import GradientProgressBar from "components/Graphics/SignUp/GradientProgressBar";
import { SkincareAnalysisSeverities } from "constants/analysis";
import { getSeverityRating } from "utils/analysis";
import { lighten } from "utils/lighten";
import { RoutineProductTypes } from "constants/products";
import { SkinConcerns } from "constants/signup";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaStyles } from "hooks/useSafeAreaStyles";
import { convertSkinConcernSeverityIdToName } from "../../utils/analysis";
import { SkincareProductCategories } from "../../constants/products";
import ProductCardItem from "../../components/Products/ProductCardItem";
import { useData } from "../../context/global/DataContext";
import { useRedirect } from "../../context/RedirectContext";
import { BlurView } from "expo-blur";
import Progress from '../../assets/media/demos/cropped_progress.png'

const SCREEN_WIDTH = Dimensions.get('window').width;

const completePlanPerks = [
    {
        bolded: 'Advanced diagnosis',
        text: 'metrics and analysis using AI fit to your skin'
    },
    {
        bolded: 'Personalized routines',
        text: 'tailored to your skin profile and concerns'
    },
    {
        bolded: 'AI-powered recommendations',
        text: 'and specialized skin matching technology'
    },
    {
        bolded: 'Daily routine guidance',
        text: 'with detailed instructions for morning and evening'
    },
    {
        bolded: 'Skin progress tracking',
        text: 'over time and statistical insights'
    },
    {
        bolded: 'Ingredient breakdowns',
        text: 'and product scoring for every single product'
    }
];

const milestones = [
    {
        "title": "Week 2 - Early Improvements",
        "description": "Your skin starts to feel smoother and more hydrated. Any breakouts may look calmer, with less redness and irritation."
    },
    {
        "title": "Week 4 - Noticeable Changes",
        "description": "Texture looks more even and breakouts are less frequent. A natural glow is emerging, and subtle improvements may be visible to others."
    },
    {
        "title": "Week 8 - Significant Progress",
        "description": "Most active breakouts have settled down, with fewer new ones appearing. Skin tone looks more balanced and overall clarity is visibly improved."
    },
    {
        "title": "Week 12 - Clear, Confident Skin",
        "description": "Your skin looks clearer, even-toned, and radiant. Breakouts are rare, post-acne marks appear lighter, and your skin feels healthier than ever."
    }
]

const GeneratedPlanScreen = ({

}) => {
    const safeAreaStyles = useSafeAreaStyles();
    const {replace} = useRedirect();
    const {diagnosis} = useSignUpFlow();
    
    // Product fetching state
    const [routineRecommendations, setRoutineRecommendations] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    
    const { getLocalProductById, productsInitialized } = useData();

    const skinAnalysisItems = diagnosis?.severities;
    
    // Extract overall severity separately
    const overallSeverity = skinAnalysisItems?.overall;
    const skinAnalysisItemWidth = (SCREEN_WIDTH-(DefaultStyles.container.paddingHorizontal*2)-(DefaultStyles.container.paddingBottom*3.25))/2
    
    // Get other severities excluding overall
    const otherSeverities = skinAnalysisItems ? 
        Object.entries(skinAnalysisItems).filter(([key]) => key !== 'overall') : [];
    
    // Get products from cache based on routine recommendations
    useEffect(() => {
        if (!diagnosis?.routineRecommendations || diagnosis.routineRecommendations.length === 0) {
            setRoutineRecommendations([]);
            return;
        }
        
        if (!productsInitialized || !getLocalProductById) {
            // Products cache not ready yet
            setLoadingProducts(true);
            return;
        }
        
        setLoadingProducts(true);
        try {
            console.log('Getting products from cache for routine recommendations:', diagnosis.routineRecommendations);
            
            // Get products from cache by IDs
            const validProducts = diagnosis.routineRecommendations
                .map(productId => getLocalProductById(productId))
                .filter(product => product !== null && product !== undefined);
            
            // Filter to show only 1 product per category
            const productsByCategory = {};
            validProducts.forEach(product => {
                if (!productsByCategory[product.category]) {
                    productsByCategory[product.category] = product;
                }
            });
            
            const uniqueProducts = Object.values(productsByCategory);
            
            console.log(`Found ${validProducts.length} products from cache, filtered to ${uniqueProducts.length} unique categories`);
            setRoutineRecommendations(uniqueProducts);
            
        } catch (error) {
            console.error('Error getting cached products:', error);
            setRoutineRecommendations([]);
        } finally {
            setLoadingProducts(false);
        }
    }, [diagnosis?.routineRecommendations, productsInitialized, getLocalProductById]);

    return (
        <View style={[DefaultStyles.outer, safeAreaStyles.safeAreaAll]}>
            <FadeScaleView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <IconButton
                        style={{
                            backgroundColor:colors.background.primary,
                            width:48,
                            height:48,
                        }}
                        size={32}
                        color={colors.text.primary}
                        iconComponent={
                            <FontAwesome6 name="check" size={24} color={colors.text.primary} />
                        }
                    />
                    
                    <View
                        style={{
                            gap:12
                        }}
                    >
                        <DefaultText
                            style={styles.title}
                        >
                            Congratulations!
                        </DefaultText>
                        <DefaultText
                            style={styles.text}
                        >
                            Your custom skincare plan is ready.
                        </DefaultText>
                    </View>
                        
                    {/* Overall Severity Box */}
                    {overallSeverity !== undefined && (
                        <View
                            style={{
                                ...styles.overallSeverityBox,
                                marginVertical:8,
                            }}
                        >
                            <Ionicons
                                name='sparkles'
                                size={18}
                                color={colors.text.primary}
                            />
                            <DefaultText
                                style={styles.overallSeverityText}
                            >
                                Overall Score: {overallSeverity} / 100
                            </DefaultText>
                        </View>
                    )}

                    <View
                        style={styles.itemContainer}
                    >
                        <View
                            style={styles.titleContainer}
                        >
                            <Ionicons
                                size={18}
                                color={colors.text.secondary}
                                name='sparkles'
                            />
                            <DefaultText
                                style={styles.caption}
                            >
                                Your skin analysis
                            </DefaultText>
                        </View>

                        <View
                            style={{
                                gap:16,
                                flexWrap:'wrap',
                                width:'100%',
                                flexDirection:'row',
                                marginBottom:8,
                            }}
                        >
                            {otherSeverities?.map(([key, value], idx) => {
                                const severity = value;
                                const concernName = convertSkinConcernSeverityIdToName(key)
                                const severityInfo = getSeverityRating(severity)

                                return (
                                    <View
                                        key={idx}
                                        style={{
                                            ...styles.itemContainer,
                                            width: skinAnalysisItemWidth,
                                            position: 'relative'
                                        }}
                                    >
                                        <BlurView
                                            intensity={10}
                                            style={styles.analysisBlurOverlay}
                                        />

                                        <DefaultText
                                            style={{
                                                ...styles.text,
                                                zIndex:20,
                                            }}
                                        >
                                            {concernName}
                                        </DefaultText>

                                        <View
                                            style={styles.flexContainer}
                                        >
                                            <GradientProgressBar
                                                progress={severity / 100}
                                                height={6}
                                                borderRadius={16}
                                                colorA={severityInfo.color}
                                                colorB={severityInfo.color}
                                            />
                                        </View>
                                    </View>
                                )
                            })}
                        </View>

                        <DefaultText
                            style={styles.subText}
                        >
                            Your exact skin scores will be revealed as soon as you create your account. You’re almost there!
                        </DefaultText>
                    </View>

                    <View
                        style={[
                            styles.itemContainer,
                            {
                                paddingHorizontal:0,
                            }
                        ]}
                    >
                        <View
                            style={[
                                styles.titleContainer,
                                {
                                    paddingHorizontal:DefaultStyles.container.paddingBottom,
                                }
                            ]}
                        >
                            <Ionicons
                                size={18}
                                color={colors.text.secondary}
                                name='list-outline'
                            />
                            <DefaultText
                                style={styles.caption}
                            >
                                Your custom routine
                            </DefaultText>
                        </View>

                        <ScrollView
                            horizontal
                            contentContainerStyle={styles.routineContainer}
                            showsHorizontalScrollIndicator={false}
                        >
                            {loadingProducts ? (
                                // Show skeleton loading cards
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <ProductCardItem
                                        key={`skeleton-${idx}`}
                                        isLoading={true}
                                        columns={2}
                                    />
                                ))
                            ) : (
                                routineRecommendations.map((product, idx) => (
                                    <ProductCardItem
                                        key={idx}
                                        columns={2}
                                        product={product}
                                        inDemo
                                        blur={idx>0}
                                    />
                                ))
                            )}
                        </ScrollView>

                        <DefaultText
                            style={{
                                ...styles.subText,
                                paddingTop:8,
                                paddingHorizontal:DefaultStyles.container.paddingBottom,
                            }}
                        >
                            Your new skincare routine will be revealed as soon as you create your account. You’re almost there!
                        </DefaultText>
                    </View>

                    <View
                        style={styles.itemContainer}
                    >
                        <View
                            style={styles.titleContainer}
                        >
                            <MaterialCommunityIcons
                                size={18}
                                color={colors.text.secondary}
                                name='chart-timeline-variant-shimmer'
                            />
                            <DefaultText
                                style={styles.caption}
                            >
                                Your future timeline
                            </DefaultText>
                        </View>

                        {milestones.map((milestone, idx) => (
                            <View
                                key={idx}
                                style={{
                                    ...styles.flexContainer,
                                    alignItems:'flex-start'
                                }}
                            >
                                <View
                                    style={{
                                        gap:12,
                                        padding:1,
                                        alignItems:'center',
                                    }}
                                >
                                    <View
                                        style={{
                                            width:16,
                                            height:16,
                                            backgroundColor:colors.background.secondary,
                                            borderRadius:64,
                                        }}
                                    />

                                    {idx < milestones.length - 1 &&
                                        <View
                                            style={{
                                                width:4,
                                                height:75,
                                                backgroundColor:colors.background.primary,
                                                borderRadius:64,
                                            }}
                                        />
                                    }
                                </View>

                                <View
                                    style={{
                                        flex:1,
                                        gap:8,
                                    }}
                                >
                                    <DefaultText
                                        style={{
                                            ...styles.text,
                                            fontWeight:'600'
                                        }}
                                    >
                                        {milestone.title}
                                    </DefaultText>
                                    
                                    <DefaultText
                                        style={styles.subText}
                                    >
                                        {milestone.description}
                                    </DefaultText>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* <View
                        style={styles.emphasizedContainer}
                    >
                        <View
                            style={styles.flexContainer}
                        >
                            <DefaultText
                                style={styles.text}
                            >
                                Alyssa, 28
                            </DefaultText>

                            <StarRating
                                rating={5}
                                size={18}
                                style={{
                                    gap:4,
                                    marginLeft:'auto',
                                }}
                            />
                        </View>

                        <DefaultText
                            style={styles.subText}
                        >
                            "I’ve struggled with breakouts for years and tried everything. Derm AI actually helped me figure out which ingredients were making things worse — and what to use instead. My skin finally looks balanced."
                        </DefaultText>

                        <View
                            style={{
                                ...styles.flexContainer,
                                marginTop:DefaultStyles.container.paddingTop,
                            }}
                        >
                            {beforeAfterImages.map((image, idx) => (
                                <View
                                    key={idx}
                                    style={{
                                        width:skinAnalysisItemWidth,
                                        borderRadius:16,
                                        overflow:'hidden',
                                        borderWidth:1,
                                        borderColor:colors.accents.stroke,
                                        alignItems:'center',
                                    }}
                                >
                                    <Image
                                        source={image.image}
                                        style={{
                                            width:skinAnalysisItemWidth,
                                            height:skinAnalysisItemWidth * (4/3)
                                        }}
                                        resizeMode='cover'
                                    />

                                    <DefaultText
                                        style={{
                                            paddingVertical:DefaultStyles.container.paddingTop,
                                            borderRadius:16,
                                            backgroundColor:colors.background.screen,
                                            fontSize:DefaultStyles.text.caption.small,
                                            fontWeight:'600',
                                            color:colors.text.secondary,
                                        }}
                                    >
                                        {image.title}
                                    </DefaultText>
                                </View>
                            ))}
                        </View>
                    </View> */}

                    <View
                        style={styles.demoContainer}
                    >
                        <DefaultText
                            style={styles.title}
                        >
                            Track your skin’s progress over time
                        </DefaultText>
                        <DefaultText
                            style={{
                                ...styles.subText,
                                textAlign:'center'
                            }}
                        >
                            Derm AI makes it easy to track your skin’s progress over time, with progress graphs and statistical insights.
                        </DefaultText>

                        <Image
                            source={Progress}
                            style={styles.demoImage}
                            resizeMode='contain'
                        />
                    </View>

                    <View
                        style={styles.emphasizedContainer}
                    >
                        <View
                            style={styles.titleContainer}
                        >
                            <DefaultText
                                style={styles.caption}
                            >
                                Unlock your custom plan:
                            </DefaultText>
                        </View>

                        {completePlanPerks.map((perk, idx) => (
                            <View
                                key={idx}
                                style={styles.flexContainer}
                            >
                                <IconButton
                                    style={{
                                        width:18,
                                        height:18,
                                        backgroundColor:colors.background.primary
                                    }}
                                    iconComponent={
                                        <FontAwesome6 name="check" size={12} color={colors.text.primary} />
                                    }
                                />
                                
                                <DefaultText style={styles.perkText}>
                                    <DefaultText style={styles.perkBolded}>{perk.bolded}</DefaultText>
                                    {' '}{perk.text}.
                                </DefaultText>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <View
                    style={styles.bottomContainer}
                >
                    <DefaultButton
                        isActive
                        title='Let’s get started'
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        onPress={() => replace('TryForFree')}
                        style={{
                            borderRadius:64,
                        }}
                    />
                </View>
            </FadeScaleView>
        </View>
    )
}

export default GeneratedPlanScreen;

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor:colors.background.screen,
        paddingTop:DefaultStyles.container.paddingTop,
    },
    topContainer: {
        width:'100%',
        padding:DefaultStyles.container.paddingHorizontal,
        paddingTop:0,
    },
    contentContainer: {
        gap:24,
        alignItems:'center',
        padding:DefaultStyles.container.paddingHorizontal,
        paddingTop:0,
    },
    routineContainer: {
        flexDirection:'row',
        gap:16,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
    },
    itemContainer: {
        width:'100%',
        gap:12,
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    emphasizedContainer: {
        width:'100%',

        padding:DefaultStyles.container.paddingBottom,
        gap:12,
        borderRadius:16,
        borderWidth:3,
        borderColor:colors.background.primary,
        backgroundColor:colors.background.screen
    },
    demoContainer: {
        gap:16,
        width:'100%',
        borderWidth:1.5,
        borderRadius:16,
        position:'relative',
        alignItems:'center',
        borderColor:colors.accents.stroke,
        backgroundColor:colors.background.screen,
        padding:DefaultStyles.container.paddingBottom,
        paddingBottom:0,
        paddingTop:DefaultStyles.container.paddingHorizontal,
    },
    demoImage: {
        marginTop:DefaultStyles.container.paddingHorizontal,
        width:'90%',
        height:250,
    },
    flexContainer: {
        gap:16,
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
    },
    titleContainer: {
        gap:16,
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
        marginBottom:8,
    },
    bottomContainer: {
        padding:DefaultStyles.container.paddingHorizontal,
        borderTopWidth:1.5,
        borderTopColor:colors.accents.stroke,
    },
    stackedTextContainer: {
        flex:1,
        gap:6
    },
    backIconButton: {
        width:44,
        height:44,
        backgroundColor:colors.background.light,
    },
    title: {
        fontSize:DefaultStyles.text.title.small,
        color:colors.text.secondary,
        fontWeight:'600',
        textAlign:'center',
    },
    underCaption:{
        fontSize:DefaultStyles.text.caption.medium,
        color:colors.text.secondary,
        fontWeight:'600',
        textAlign:'center',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.medium,
        color:colors.text.secondary,
        fontWeight:'700',
    },
    text: {
        alignSelf:'flex-start',
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
    },
    subText: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
    },
    pill: {
        alignSelf:'flex-start',
        paddingHorizontal:8,
        paddingVertical:4,
        borderRadius:64,
    },
    skinAnalysisItem: {
        gap:8,
        width:'100%',
    },
    overallSeverityBox: {
        alignItems:'center',
        justifyContent:'center',
        flexDirection:'row',
        gap:16,
        paddingHorizontal:24,
        paddingVertical:16,
        borderRadius:64,
        backgroundColor:colors.background.primary,
    },
    overallSeverityText: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'800',
        color:colors.text.primary,
        textAlign:'center',
    },
    perksList: {
        gap: 8,
    },
    perkItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.text.secondary,
        marginTop: 8,
    },
    perkText: {
        flex: 1,
        fontSize: DefaultStyles.text.caption.xsmall,
        color: colors.text.secondary,
        lineHeight:18,
    },
    perkBolded: {
        fontWeight: 'bold',
        color: colors.text.secondary,
    },
    borderOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: colors.accents.stroke,
    },
    analysisBlurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
        zIndex: 10,
        overflow: 'hidden',
    }
})