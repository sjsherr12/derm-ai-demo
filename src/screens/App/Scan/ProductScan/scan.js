import { CameraView } from "expo-camera";
import BlurredIconButton from "../../../../components/Buttons/BlurredIconButton";
import * as Haptics from 'expo-haptics'
import { Alert, Animated, Pressable, SafeAreaView, StyleSheet, View, Image, InteractionManager, ActivityIndicator } from "react-native";
import { BlurView } from 'expo-blur';
import DefaultStyles from "../../../../config/styles";
import colors from "../../../../config/colors";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import DefaultText from "../../../../components/Text/DefaultText";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker'
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation";
import TopTabBar from "../../../../components/Options/TopTabBar";
import DefaultBottomSheet from "../../../../components/Containers/DefaultBottomSheet";
import ProductScanScreenProductResults from "./results";
import { useData } from "../../../../context/global/DataContext";
import productScanService from "../../../../services/productScanService";
import TextDivider from "../../../../components/Common/TextDivider";
import IconButton from "../../../../components/Buttons/IconButton";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../services/firebase/firebase';

const ProductScanScreenTakePhoto = () => {

    const [photo, setPhoto] = useState(null)
    const cameraRef = useRef(null);
    const barcodeProcessedRef = useRef(false);
    const navigation = useNavigation();
    const {products, canUserScan, incrementScanAttempt} = useData();
    const [productResults, setProductResults] = useState([])
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [snapping, setSnapping] = useState(false);
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [cameraReady, setCameraReady] = useState(false)
    const [isUsingBarcode, setIsUsingBarcode] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [detectedBarcode, setDetectedBarcode] = useState(null);
    const [barcodeQuerying, setBarcodeQuerying] = useState(false);
    const { handlePressIn: handlePhotoPress, handlePressOut: handlePhotoRelease, scale: photoScale } = useScalePressAnimation({
        minScale: 0.95,
        maxScale: 1,
    });

    const containerHeight = useRef(new Animated.Value(1)).current;
    const containerWidth = useRef(new Animated.Value(1)).current;
    const flexOpacity = useRef(new Animated.Value(1)).current;

    // Simple scan line animation
    const scanLinePosition = useRef(new Animated.Value(0)).current;
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [overlayReady, setOverlayReady] = useState(false);

    useEffect(() => {
        const duration = 250;
        setFlashEnabled(false)

        if (isUsingBarcode) {
            Animated.parallel([
                Animated.timing(flexOpacity, {
                    toValue: 0,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
                Animated.timing(containerHeight, {
                    toValue: 0,
                    duration,
                    useNativeDriver: false,
                }),
                Animated.timing(containerWidth, {
                    toValue: .5,
                    duration,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(flexOpacity, {
                    toValue: 1,
                    duration: duration / 2,
                    delay: duration / 2,
                    useNativeDriver: true,
                }),
                Animated.timing(containerHeight, {
                    toValue: 1,
                    duration,
                    useNativeDriver: false,
                }),
                Animated.timing(containerWidth, {
                    toValue: 1,
                    duration,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [isUsingBarcode]);

    const getScanTitle = () => {
        if (processing) return 'Processing Scan...';
        else {
            if (isUsingBarcode) return 'Scan Barcode';
            else return 'Scan Product'
        }
    };
    
    const title = getScanTitle();
    const snappingDisabled = !cameraReady || snapping

    const mappedProductResults = useMemo(() => {
        if (!productResults || !products) return [];
        return productResults.map(productId => products[productId]).filter(Boolean);
    }, [productResults, products]);

    // Function to query products by barcode
    const queryProductByBarcode = useCallback(async (barcode) => {
        if (!barcode) return null;

        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('barcodes', 'array-contains', barcode));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Return the first matching product's document ID
                return querySnapshot.docs[0].id;
            }
            return null;
        } catch (error) {
            console.error('Error querying product by barcode:', error);
            throw error;
        }
    }, []);


    const handleCloseBottomSheet = useCallback(() => {
        setShowBottomSheet(false);
        setProductResults([]);
    }, []);

    const handleInfoAlert = useCallback(() => {
        let description = isUsingBarcode ?
            'Point your camera at a product barcode (EAN/UPC) to instantly find it in our database. Make sure the barcode is clearly visible and focused.' :
            'Take a photo of a product to identify ingredients and find matches in our database. For best results, capture the product label clearly with good lighting.';

        Alert.alert(title, description);
    }, [processing, title])

    const handleBarcodeDetected = useCallback(async (scanningResult) => {
        // Only process if barcode mode is enabled
        if (!isUsingBarcode) return;

        if (scanningResult?.data && !barcodeProcessedRef.current && !barcodeQuerying) {
            barcodeProcessedRef.current = true;
            setDetectedBarcode(scanningResult.data);
            setBarcodeQuerying(true);

            try {
                const productId = await queryProductByBarcode(scanningResult.data);

                if (productId) {
                    // Product found - navigate to product screen
                    setBarcodeQuerying(false);
                    navigation.navigate('Product', { productId });
                    // Reset after navigation
                    setTimeout(() => {
                        barcodeProcessedRef.current = false;
                        setDetectedBarcode(null);
                    }, 500);
                } else {
                    // No product found - show alert and keep blocked until dismissed
                    setBarcodeQuerying(false);
                    Alert.alert(
                        'No Products Found',
                        'We could not find a product with that barcode in our database.',
                        [{
                            text: 'OK',
                            style: 'default',
                            onPress: () => {
                                // Only reset after user dismisses the alert
                                setDetectedBarcode(null);
                                setTimeout(() => {
                                    barcodeProcessedRef.current = false;
                                }, 500);
                            }
                        }]
                    );
                }
            } catch (error) {
                console.error('Error processing barcode:', error);
                setBarcodeQuerying(false);
                Alert.alert(
                    'Error',
                    'Failed to search for product. Please try again.',
                    [{
                        text: 'OK',
                        style: 'default',
                        onPress: () => {
                            // Only reset after user dismisses the alert
                            setDetectedBarcode(null);
                            setTimeout(() => {
                                barcodeProcessedRef.current = false;
                            }, 500);
                        }
                    }]
                );
            }
        }
    }, [isUsingBarcode, barcodeQuerying, queryProductByBarcode, navigation]);

    const processImageWithOCR = async (imageUri) => {
        if (!imageUri || !products) return;

        // Check rate limiting before processing
        const canScan = await incrementScanAttempt();
        if (!canScan) {
            Alert.alert('Scanning Limit Reached', 'You have reached your daily scanning limit. Your limit will be reset tomorrow.');
            return;
        }

        try {
            setFlashEnabled(false)
            setProcessing(true);

            // Use InteractionManager to defer heavy computation and allow animations to continue
            InteractionManager.runAfterInteractions(async () => {
                try {
                    const result = await productScanService.scanAndMatchProducts(imageUri, products, 3);

                    if (result.success && result.matches && result.matches.length > 0) {
                        const productIds = result.matches.map(match => match.productId);
                        setProductResults(productIds);
                        setShowBottomSheet(true);
                    } else {
                        Alert.alert('No Products Found', 'Could not identify any products from the image. Please try again with a clearer image.');
                        setProductResults([]);
                        setShowBottomSheet(false);
                    }
                } catch (error) {
                    Alert.alert('Processing Error', error.message || 'Failed to process image. Please try again.');
                    setProductResults([]);
                    setShowBottomSheet(false);
                } finally {
                    setProcessing(false);
                }
            });

        } catch (error) {
            Alert.alert('Processing Error', error.message || 'Failed to start image processing. Please try again.');
            setProductResults([]);
            setShowBottomSheet(false);
            setProcessing(false);
        }
    };

    const handleSelectFromCameraRoll = async () => {
        try {
            // Reset states for new scan
            setOverlayReady(false);
            setContainerDimensions({ width: 0, height: 0 });
            scanLinePosition.setValue(0);
            setProductResults([]);
            setShowBottomSheet(false);

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const uri = result.assets[0].uri;
                setPhoto(uri);
                await processImageWithOCR(uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to select image from camera roll');
        }
    };

    const handleTakePhoto = async () => {
        if (cameraRef.current && cameraReady) {
            try {
                // Reset states for new scan
                setOverlayReady(false);
                setContainerDimensions({ width: 0, height: 0 });
                scanLinePosition.setValue(0);
                setProductResults([]);
                setShowBottomSheet(false);

                setSnapping(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });
                const uri = photo?.uri;
                setPhoto(uri);
                if (uri) {
                    await processImageWithOCR(uri);
                }
            } catch (error) {
                Alert.alert('Error taking photo:', error);
            } finally {
                setSnapping(false)
            }
        }
    };

    // Reset all states when processing changes
    useEffect(() => {
        if (!processing) {
            setOverlayReady(false);
            scanLinePosition.setValue(0);
            setContainerDimensions({ width: 0, height: 0 });
        }
    }, [processing, scanLinePosition]);

    // Fixed scan line animation: down -> up -> down and stop
    useEffect(() => {
        let animation;

        if (processing && overlayReady && containerDimensions.height > 0) {
            scanLinePosition.setValue(0);

            animation = Animated.sequence([
                // First pass: down
                Animated.timing(scanLinePosition, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                // Second pass: up
                Animated.timing(scanLinePosition, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                // Third pass: down and stop at bottom
                Animated.timing(scanLinePosition, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ]);

            animation.start();
        }

        return () => {
            if (animation) {
                animation.stop();
            }
        };
    }, [processing, overlayReady, containerDimensions.height, scanLinePosition]);

    return (
        <>
            <CameraView
                ref={cameraRef}
                style={DefaultStyles.outer}
                onCameraReady={() => setCameraReady(true)}
                facing='back'
                enableTorch={flashEnabled}
                focusable={true}
                barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                }}
                onBarcodeScanned={handleBarcodeDetected}
            >
                <SafeAreaView
                    style={styles.container}
                >
                    <View
                        style={styles.topContainer}
                    >
                        <BlurredIconButton
                            icon='close-outline'
                            size={28}
                            hapticType={Haptics.ImpactFeedbackStyle.Medium}
                            disabled={processing}
                            onPress={() => navigation.goBack()}
                            style={{
                                outer: {
                                    marginRight:'auto',
                                    opacity: processing ? 0.5 : 1
                                }
                            }}
                        />

                        <DefaultText
                            style={styles.title}
                        >
                            {title}
                        </DefaultText>

                        <BlurredIconButton
                            icon='information'
                            size={24}
                            hapticType={Haptics.ImpactFeedbackStyle.Medium}
                            onPress={handleInfoAlert}
                            style={{
                                outer: {
                                    marginLeft:'auto',
                                    opacity: processing ? 0.5 : 1
                                }
                            }}
                        />
                    </View>

                    <View
                        style={styles.mainContainer}
                    >
                        <Animated.View
                            style={[
                                styles.animatedContainer,
                                {
                                    padding:!isUsingBarcode && !canUserScan() ? 0 : DefaultStyles.container.paddingHorizontal,
                                    flex: containerHeight.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 1],
                                    }),
                                    minHeight: containerHeight.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [150, 0],
                                    }),
                                    width: containerWidth.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['50%', '100%'],
                                    }),
                                }
                            ]}
                        >
                            {!isUsingBarcode && !canUserScan() ? (
                                // Rate limit overlay - only for photo scanning
                                <View style={styles.rateLimitOverlay}>
                                    <DefaultText style={styles.rateLimitText}>
                                        Scanning limit reached.{'\n'}Your limit will be reset tomorrow.
                                    </DefaultText>
                                </View>
                            ) : (
                                <Animated.View
                                    style={[
                                        styles.flexContainer,
                                        {
                                            opacity: flexOpacity,
                                        }
                                    ]}
                                >
                                    <BlurredIconButton
                                        intensity={100}
                                        tint='light'
                                        icon='image'
                                        size={24}
                                        onPress={handleSelectFromCameraRoll}
                                        hapticType={Haptics.ImpactFeedbackStyle.Medium}
                                        disabled={processing}
                                        style={{
                                            outer: {
                                                opacity: processing ? 0.5 : 1
                                            }
                                        }}
                                    />

                                    <Pressable
                                        onPressIn={handlePhotoPress}
                                        onPressOut={handlePhotoRelease}
                                        onPress={handleTakePhoto}
                                        disabled={snappingDisabled || processing}
                                    >
                                        <Animated.View style={[
                                            styles.captureButton,
                                            {
                                                transform: [{ scale: photoScale }],
                                                opacity: (snappingDisabled || processing) ? .5 : 1
                                            }
                                        ]}>
                                            <View style={styles.captureButtonInner} />
                                        </Animated.View>
                                    </Pressable>

                                    <BlurredIconButton
                                        icon={flashEnabled ? 'sunny' : 'sunny-outline'}
                                        color={flashEnabled ? colors.background.primary : colors.text.primary}
                                        size={24}
                                        style={{
                                            outer: {
                                                opacity: processing ? 0.5 : 1
                                            },
                                            button: {
                                                backgroundColor:flashEnabled && '#fff'
                                            },
                                        }}
                                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                        onPress={() => setFlashEnabled(prev => !prev)}
                                        disabled={processing}
                                    />
                                </Animated.View>
                            )}
                        </Animated.View>
                    </View>

                    <View
                        style={styles.bottomContainer}
                    >
                        <TopTabBar
                            tabs={['Photo', 'Barcode']}
                            activeTab={isUsingBarcode+0}
                            onChange={(idx) => setIsUsingBarcode(idx === 1)}
                            hapticType={Haptics.ImpactFeedbackStyle.Soft}
                            colorFill={colors.background.screen}
                            disabled={barcodeQuerying}
                        />
                    </View>
                </SafeAreaView>
            </CameraView>

            {processing && photo && (
                <BlurView
                    intensity={20}
                    style={styles.processingOverlay}
                    onLayout={() => {
                        // Set overlay ready after the blur view has laid out
                        setTimeout(() => setOverlayReady(true), 50);
                    }}
                >
                    <Image source={{ uri: photo }} style={styles.processingBackground} blurRadius={8} />
                    <SafeAreaView style={styles.processingContainer}>
                        <View style={styles.topContainer}>
                            <BlurredIconButton
                                icon='close-outline'
                                size={28}
                                hapticType={Haptics.ImpactFeedbackStyle.Medium}
                                disabled={processing}
                                onPress={() => navigation.goBack()}
                                style={{
                                    outer: {
                                        marginRight:'auto',
                                        opacity: processing ? 0.5 : 1
                                    }
                                }}
                            />

                            <DefaultText style={styles.title}>
                                {title}
                            </DefaultText>

                            <BlurredIconButton
                                icon='information'
                                size={24}
                                style={{
                                    outer: {
                                        marginLeft:'auto',
                                        opacity: processing ? 0.5 : 1
                                    }
                                }}
                                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                onPress={handleInfoAlert}
                                disabled={processing}
                            />
                        </View>

                        <View style={styles.processingMainContainer}>
                            <View
                                style={styles.processingImageContainer}
                                onLayout={(event) => {
                                    const { width, height } = event.nativeEvent.layout;
                                    setContainerDimensions({ width, height });
                                }}
                            >
                                <Image source={{ uri: photo }} style={styles.processingImage} />
                                {processing && overlayReady && containerDimensions.height > 0 && (
                                    <>
                                        {/* Simple floating scan line */}
                                        <Animated.View
                                            style={[
                                                styles.simpleScanLine,
                                                {
                                                    transform: [{
                                                        translateY: scanLinePosition.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [16, containerDimensions.height - 16], // 16px padding from edges
                                                        })
                                                    }]
                                                }
                                            ]}
                                        />

                                        {/* Activity indicator in corner */}
                                        <View style={styles.processingIndicator}>
                                            <ActivityIndicator
                                                size="small"
                                                color={colors.text.primary}
                                            />
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={styles.bottomContainer}>
                        </View>
                    </SafeAreaView>
                </BlurView>
            )}

            {barcodeQuerying && (
                <BlurView
                    intensity={20}
                    style={styles.barcodeLoadingOverlay}
                >
                    <View style={styles.barcodeLoadingContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.text.secondary}
                        />
                        <DefaultText style={styles.barcodeLoadingText}>
                            Searching for product...
                        </DefaultText>
                    </View>
                </BlurView>
            )}

            <DefaultBottomSheet
                isOpen={showBottomSheet}
                onClose={handleCloseBottomSheet}
            >
                <ProductScanScreenProductResults
                    productResults={mappedProductResults}
                    onClose={handleCloseBottomSheet}
                    onUseBarcode={() => {
                        setIsUsingBarcode(true)
                        handleCloseBottomSheet();
                    }}
                />
            </DefaultBottomSheet>
        </>
    )
}

export default ProductScanScreenTakePhoto;

const styles = StyleSheet.create({
    title: {
        fontSize:DefaultStyles.text.caption.large,
        color:colors.text.primary,
        fontWeight:'600',
        textShadowColor:'rgba(0,0,0,.5)',
        textShadowRadius:8,
        textShadowOffset:2,
        padding:4,
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.primary
    },
    container: {
        flex:1,
        gap:16,
    },
    mainContainer:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    animatedContainer: {
        borderRadius:16,
        borderWidth:2,
        borderColor:colors.background.screen,
        justifyContent:'flex-end',
    },
    flexContainer: {
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
    },
    topContainer: {
        alignItems:'center',
        gap: DefaultStyles.container.paddingHorizontal,
        flexDirection:'row',
        justifyContent:'space-between',
        padding:DefaultStyles.container.paddingHorizontal,
    },
    bottomContainer: {
        width:'100%',
        alignItems:'center',
        padding:DefaultStyles.container.paddingHorizontal,
        paddingBottom: DefaultStyles.container.paddingBottom,
    },
    captureButton: {
        width: 75,
        height: 75,
        borderRadius: 64,
        backgroundColor: 'rgba(255,255,255,.5)',
        alignItems: 'center',
        justifyContent: 'center',

    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 64,
        backgroundColor: colors.background.screen,
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    processingBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    processingContainer: {
        flex: 1,
        gap: 16,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    processingMainContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
    },
    processingImageContainer: {
        width: '100%',
        flex: 1,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.background.screen,
        overflow: 'hidden',
        minHeight: 150,
    },
    processingImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    processingText: {
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.primary,
        fontWeight: '600',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,.5)',
        textShadowRadius: 8,
        textShadowOffset: { width: 2, height: 2 },
        padding: 4,
    },
    simpleScanLine: {
        position: 'absolute',
        left: 16,
        right: 16,
        height: 2,
        backgroundColor: '#ffffff',
        borderRadius: 1,
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
    },
    processingIndicator: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 8,
    },
    barcodeLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    barcodeLoadingContainer: {
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 40,
    },
    barcodeLoadingText: {
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.secondary,
        fontWeight: '500',
        textAlign: 'center',
    },
    rateLimitOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 16,
        padding:DefaultStyles.container.paddingHorizontal,
    },
    rateLimitText: {
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.primary,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 22,
    },
})