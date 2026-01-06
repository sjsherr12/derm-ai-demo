import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, Animated, ScrollView, StatusBar, Pressable, Modal, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import DefaultStyles from "config/styles";
import colors from 'config/colors';
import FullAnalysisScreenHeader from './header';
import { useData } from 'context/global/DataContext';
import { useAuth } from 'context/global/AuthContext';
import DefaultText from 'components/Text/DefaultText';
import { getSeverityRating } from 'utils/analysis';
import { SkinConcerns } from 'constants/signup';
import GradientProgressBar from 'components/Graphics/SignUp/GradientProgressBar';
import { convertSkinConcernSeverityIdToName } from 'utils/analysis';
import { lighten } from '../../../../utils/lighten';
import Svg, { Circle } from 'react-native-svg';
import ProductCardItem from '../../../../components/Products/ProductCardItem';
import {Ionicons} from '@expo/vector-icons'
import ConcernSeverityBreakdowns from '../../../../data/ConcernBreakdowns';
import useScalePressAnimation from '../../../../hooks/useScalePressAnimation';
import IconButton from '../../../../components/Buttons/IconButton';
import { LinearGradient } from 'expo-linear-gradient';
import gradient from '../../../../utils/gradient';
import DefaultButton from '../../../../components/Buttons/DefaultButton';
import SkinConcernShortcut from '../../../../components/Options/ConcernShortcut';
import { SkincareProductCategories } from '../../../../constants/products';
import AnalysisScreenCategoryScreenShortcut from '../CategoryScreen/shortcut';
import AnalysisScreenProductsTabNoProductRecommendationsAvailable from '../AnalysisScreen/Tabs/ProductsTab/noProducts';
import DefaultBottomSheet from '../../../../components/Containers/DefaultBottomSheet';
import { deleteDiagnosis } from '../../../../utils/diagnoses';

const { width: SCREEN_WIDTH, height: screenHeight } = Dimensions.get('window');
const IMAGE_HEIGHT = screenHeight * 0.65; // 50% of screen height

const CIRCLE_SIZE = 80;
const STROKE_WIDTH = 16;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SkinConcernBreakdown = ({
    concernData,
    onClose
}) => {
    const concernName = convertSkinConcernSeverityIdToName(concernData?.severityId)
    const severityColor = useMemo(
        () => concernData?.severityInfo?.color,
        [concernData]
    )
    const concernBreakdown = useMemo(
        () => concernData && ConcernSeverityBreakdowns[concernData?.severityId][concernData?.severityInfo?.name],
        [concernData]
    )

    return (
        <View
            style={modalStyles.container}
        >
            <View
                style={styles.flexContainer}
            >
                <LinearGradient
                    style={modalStyles.severityContainer}
                    colors={gradient(severityColor, .9)}
                >
                    <DefaultText
                        style={modalStyles.severityText}
                    >
                        {concernData.severity}
                    </DefaultText>
                </LinearGradient>

                <View
                    style={{
                        gap:6
                    }}
                >
                    <DefaultText
                        style={modalStyles.title}
                    >
                        {concernName}
                    </DefaultText>
                    <View
                        style={[
                            styles.flexContainer,
                            {
                                gap:4
                            }
                        ]}
                    >
                        <Ionicons
                            color={severityColor}
                            size={20}
                            name='checkmark-circle'
                        />
                        <DefaultText
                            style={[
                                modalStyles.caption,
                                {
                                    color:severityColor,
                                }
                            ]}
                        >
                            {concernData.severityInfo.name}
                        </DefaultText>
                    </View>
                </View>

                <IconButton
                    size={24}
                    icon='close'
                    color={colors.text.darker}
                    style={{
                        width:24,
                        height:24,
                        marginLeft:'auto',
                        marginBottom:'auto'
                    }}
                    onPress={onClose}
                />
            </View>

            <View style={DefaultStyles.separator} />

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={modalStyles.subtitle}
                >
                    {concernBreakdown.title}
                </DefaultText>
                <DefaultText
                    style={styles.text}
                >
                    {concernBreakdown.description}
                </DefaultText>
            </View>

            <View style={DefaultStyles.separator} />

            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={modalStyles.subtitle}
                >
                    Recommendations
                </DefaultText>
                <View style={{ gap: 6 }}>
                    {concernBreakdown.recommendations.map((rec, idx) => (
                        <View
                            key={idx}
                            style={{
                                flexDirection:'row',
                                gap:10,
                                alignItems:'flex-start'
                            }}
                        >
                            <View
                                style={{
                                    width:8,
                                    height:8,
                                    borderRadius:64,
                                    marginTop:6,
                                    backgroundColor:severityColor,
                                    flexShrink: 0
                                }}
                            />
                            
                            <DefaultText
                                style={[styles.text, { flex: 1, flexShrink: 1 }]}
                            >
                                {rec}
                            </DefaultText>
                        </View>
                    ))}
                </View>
            </View>

            <DefaultButton
                title='Got it'
                style={{
                    marginTop:DefaultStyles.container.paddingTop,
                    color:colors.text.primary,
                    backgroundColor:severityColor,
                    borderRadius:64,
                }}
                onPress={onClose}
            />
        </View>
    )
}

const AllSkinConcerns = ({
    severities,
    setConcernData
}) => {

    return (
        <View
            style={{
                gap:16,
            }}
        >
            <DefaultText
                style={styles.caption}
            >
                Skin Concerns
            </DefaultText>

            <View
                style={styles.wrapContainer}
            >
                {SkinConcerns.slice(1).sort().map((concern, idx) => {
                    const severity = severities?.[concern.severityId];
                    const concernName = convertSkinConcernSeverityIdToName(concern.severityId);
                    const severityInfo = getSeverityRating(severity);

                    return (
                        <SkinConcernShortcut
                            key={idx}
                            severity={severity}
                            concernName={concernName}
                            severityInfo={severityInfo}
                            onPress={() => setConcernData({
                                severity,
                                severityId: concern.severityId,
                                severityInfo,
                            })}
                        />
                    )
                })}
            </View>
        </View>
    )
}

const FullAnalysisScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { products, routineProducts, diagnoses, setDiagnoses, setMostRecentDiagnosis } = useData();
    const { user } = useAuth();
    const { diagnosisId } = route.params || {};

    const [scrollOffset, setScrollOffset] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0) // front
    const [isDeleting, setIsDeleting] = useState(false);

    const [concernData, setConcernData] = useState(null)
    const onCloseModal = useCallback(
        () => setConcernData(null), []
    )
    
    // Animated value for scroll position
    const scrollY = useRef(new Animated.Value(0)).current;
    
    // Listen to scroll changes and update state
    useEffect(() => {
        const listenerId = scrollY.addListener(({ value }) => {
            setScrollOffset(value);
        });
        
        return () => scrollY.removeListener(listenerId);
    }, [scrollY]);
    
    // Find the specific diagnosis by diagnosisId
    const selectedDiagnosis = useMemo(() => {
        if (!diagnosisId || !diagnoses.length) return null;
        return diagnoses.find(diagnosis => diagnosis.id === diagnosisId);
    }, [diagnosisId, diagnoses]);

    const facialScanImages = useMemo(
        () => [
            selectedDiagnosis?.facialScans?.front,
            selectedDiagnosis?.facialScans?.left,
            selectedDiagnosis?.facialScans?.right,
        ], [selectedDiagnosis]
    )

    const filteredRecommendations = useMemo(() => {
        if (!Array.isArray(selectedDiagnosis?.scanRecommendations)) return [];
        
        const existingIds = routineProducts?.map(item => item.routineInfo?.productId) || [];
        return selectedDiagnosis.scanRecommendations.filter(id => !existingIds.includes(id));
    }, [selectedDiagnosis?.scanRecommendations, routineProducts]);

    // Group by category - simple approach without over-optimization
    const productsByCategory = useMemo(() => {
        if (!filteredRecommendations.length) return [];
        
        const categoryMap = new Map();
        
        filteredRecommendations.forEach(productId => {
            const category = products?.[productId]?.category;
            if (category !== undefined) {
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, []);
                }
                categoryMap.get(category).push(productId);
            }
        });
        
        return Array.from(categoryMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([, productIds]) => productIds);
    }, [filteredRecommendations, products]);

    const overallSeverity = selectedDiagnosis?.severities?.overall;
    const overallSeverityInfo = getSeverityRating(overallSeverity);

    // Check if this diagnosis has routine recommendations (should not be deletable if it does)
    const canDelete = !selectedDiagnosis?.routineRecommendations;

    // Handle delete scan
    const handleDeleteScan = useCallback(() => {
        if (!user || !selectedDiagnosis) {
            Alert.alert('Error', 'Unable to delete scan');
            return;
        }

        // Check if the scan has routine recommendations
        if (selectedDiagnosis?.routineRecommendations) {
            Alert.alert(
                'Cannot Delete',
                'This scan has routine recommendations and cannot be deleted as it is vital to your routine.',
                [{ text: 'OK', style: 'default' }]
            );
            return;
        }

        Alert.alert(
            'Delete Scan',
            'Are you sure you want to delete this scan? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            // Delete from Firebase
                            await deleteDiagnosis(user.uid, selectedDiagnosis.id);

                            // Remove from local diagnoses state
                            const updatedDiagnoses = diagnoses.filter(d => d.id !== selectedDiagnosis.id);
                            setDiagnoses(updatedDiagnoses);

                            // Update mostRecentDiagnosis if this was the most recent one
                            if (updatedDiagnoses.length > 0) {
                                // Find the most recent diagnosis from the remaining ones
                                const mostRecent = updatedDiagnoses.reduce((latest, current) => {
                                    const latestDate = latest.createdAt instanceof Date ? latest.createdAt : new Date(latest.createdAt);
                                    const currentDate = current.createdAt instanceof Date ? current.createdAt : new Date(current.createdAt);
                                    return currentDate > latestDate ? current : latest;
                                });
                                setMostRecentDiagnosis(mostRecent);
                            } else {
                                setMostRecentDiagnosis(null);
                            }

                            // Navigate back
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting scan:', error);
                            Alert.alert('Error', 'Failed to delete scan. Please try again.');
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    }, [user, selectedDiagnosis, diagnoses, setDiagnoses, setMostRecentDiagnosis, navigation]);

    // Image scale animation when over-scrolling
    const imageScale = scrollY.interpolate({
        inputRange: [-200, 0],
        outputRange: [2, 1],
        extrapolateLeft: 'extend',
        extrapolateRight: 'clamp',
    });

    // Image translate animation for parallax effect
    const imageTranslateY = scrollY.interpolate({
        inputRange: [-200, 0, 200],
        outputRange: [100, 0, -100],
        extrapolateLeft: 'extend',
        extrapolateRight: 'extend',
    });

    return (
        <>
            <View style={styles.container}>
                <Animated.View style={[styles.imageContainer, {
                    transform: [
                        { scale: imageScale },
                        { translateY: imageTranslateY }
                    ]
                }]}>
                    <Image
                        source={{
                            uri: facialScanImages[currentImageIndex]
                        }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <View style={styles.imageOverlay} />
                </Animated.View>

                <FullAnalysisScreenHeader
                    currentImageIndex={currentImageIndex}
                    setCurrentImageIndex={setCurrentImageIndex}
                    scrollOffset={scrollOffset}
                />
                
                <Animated.ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    bounces={true}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                >
                    <View style={{ height: IMAGE_HEIGHT - 50 }} />

                    <View style={styles.contentCard}>
                        <View
                            style={styles.itemContainer}
                        >
                            <DefaultText style={styles.title}>
                                Your Scan Analysis
                            </DefaultText>
                            <DefaultText
                                style={[
                                    styles.subtitle,
                                    {
                                        textAlign:'center',
                                    }
                                ]}
                            >
                                for {(new Date(selectedDiagnosis?.createdAt)).toLocaleDateString()}
                            </DefaultText>
                        </View>

                        <View style={DefaultStyles.separator} />

                        <View
                            style={styles.flexContainer}
                        >
                            <DefaultText
                                style={styles.caption}
                            >
                                Overall Score
                            </DefaultText>

                            <DefaultText
                                style={[
                                    styles.pillText,
                                    {
                                        marginLeft:'auto',
                                        backgroundColor:overallSeverityInfo.color
                                    }
                                ]}
                            >
                                {overallSeverity} / 100
                            </DefaultText>
                        </View>

                        <View style={DefaultStyles.separator} />

                        <AllSkinConcerns
                            severities={selectedDiagnosis?.severities || []}
                            setConcernData={setConcernData}
                        />

                        <View style={DefaultStyles.separator} />

                        <View
                            style={styles.itemContainer}
                        >
                            <DefaultText
                                style={styles.caption}
                            >
                                Diagnosis
                            </DefaultText>

                            <DefaultText
                                style={styles.text}
                            >
                                {selectedDiagnosis?.diagnosis}
                            </DefaultText>
                        </View>

                        <View style={DefaultStyles.separator} />

                        <View
                            style={styles.itemContainer}
                        >
                            <DefaultText
                                style={styles.caption}
                            >
                                Summary
                            </DefaultText>

                            <DefaultText
                                style={styles.text}
                            >
                                {selectedDiagnosis?.summary}
                            </DefaultText>
                        </View>

                        <View style={DefaultStyles.separator} />

                        <View
                            style={styles.itemContainer}
                        >
                            <DefaultText
                                style={styles.caption}
                            >
                                Scan Recommendations
                            </DefaultText>
                            <DefaultText
                                style={styles.text}
                            >
                                Unlike routine recommendations, which are longer-term product suggestions, scan recommendations adapt to immediate skin trends. They offer a few products per category to address short-term needs.
                            </DefaultText>
                        </View>

                        {productsByCategory?.length ? (
                            <>
                                {productsByCategory.map((categoryProducts, idx) => {
                                    const firstProduct = products?.[categoryProducts[0]];
                                    const skincareProductCategory = SkincareProductCategories.find(spc => spc.value === firstProduct?.category);
                                    
                                    return (
                                        <AnalysisScreenCategoryScreenShortcut
                                            key={idx}
                                            image={firstProduct?.imageUrl}
                                            category={skincareProductCategory}
                                            categoryProducts={categoryProducts}
                                        />
                                    )
                                })}
                            </>
                        ) : (
                            <AnalysisScreenProductsTabNoProductRecommendationsAvailable />
                        )}

                        {canDelete && (
                            <>
                                <View style={DefaultStyles.separator} />

                                <DefaultButton
                                    title={isDeleting ? 'Deleting...' : 'Delete Scan'}
                                    disabled={isDeleting}
                                    onPress={handleDeleteScan}
                                    style={{
                                        color:colors.text.primary,
                                        backgroundColor:colors.accents.error,
                                    }}
                                />
                            </>
                        )}
                    </View>
                </Animated.ScrollView>
            </View>

            <DefaultBottomSheet
                isOpen={!!concernData}
                onClose={onCloseModal}
            >
                {concernData && (
                    <SkinConcernBreakdown
                        concernData={concernData}
                        onClose={onCloseModal}
                    />
                )}
            </DefaultBottomSheet>
        </>
    );
};

export default FullAnalysisScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.screen,
        position:'relative',
    },
    imageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: IMAGE_HEIGHT,
        overflow: 'hidden',
    },
    wrapContainer: {
        flex:1,
        flexDirection:'row',
        flexWrap:'wrap',
        gap:16,
    },
    itemContainer: {
        gap:12,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex:0,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    contentCard: {
        gap:24,
        backgroundColor: colors.background.screen,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: DefaultStyles.container.paddingHorizontal,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    title: {
        fontWeight: '800',
        color: colors.text.secondary,
        fontSize: DefaultStyles.text.title.small,
        textAlign: 'center',
    },
    caption: {
        fontWeight: '800',
        color: colors.text.secondary,
        fontSize: DefaultStyles.text.caption.large,
    },
    text: {
        fontWeight: '500',
        color: colors.text.darker,
        fontSize: 14,
        lineHeight:20
    },
    pillText: {
        paddingHorizontal:16,
        paddingVertical:8,
        borderRadius:64,
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'700',
        color:colors.text.primary,
    },
})

const modalStyles = StyleSheet.create({
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
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        paddingBottom:DefaultStyles.container.paddingBottom
    },
    severityContainer: {
        width:64,
        height:64,
        justifyContent:'center',
        alignItems:'center',
        borderRadius:64,
    },
    severityText: {
        fontWeight:'800',
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.primary
    },
    title: {
        fontWeight:'800',
        color:colors.text.dark,
        fontSize:DefaultStyles.text.title.xsmall,
    },
    subtitle: {
        fontWeight:'800',
        color:colors.text.dark,
        fontSize:DefaultStyles.text.caption.large,
    },
    caption: {
        fontWeight:'800',
        fontSize:DefaultStyles.text.caption.medium,
    },
})