import { Animated, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from "react-native"
import DefaultStyles from "../../../../../config/styles"
import ProductScreenReportProductMistakeHeader from "./header";
import SkincareCollection from '../../../../../assets/media/graphics/skincare_collection_orange.png'
import DefaultText from "../../../../../components/Text/DefaultText";
import colors from "../../../../../config/colors";
import DefaultButton from "../../../../../components/Buttons/DefaultButton";
import DefaultTextInput from "../../../../../components/Text/DefaultTextInput";
import { useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../../../../context/global/AuthContext";
import { db } from "../../../../../services/firebase/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import * as Haptics from 'expo-haptics';

const MAX_WORDS = 250;

const ProductScreenReportProductMistake = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { productId } = route?.params;
    const { user } = useAuth();

    const scrollRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const [reportContent, setReportContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    const getWordCount = (text) => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const wordCount = getWordCount(reportContent);
    const isValid = reportContent.trim().length > 0 && wordCount <= MAX_WORDS;

    const handleReportContentChange = (text) => {
        const words = getWordCount(text);
        if (words <= MAX_WORDS) {
            setReportContent(text);
        }
    };

    const handleSubmit = async () => {
        if (!isValid || isSubmitting || !user) return;

        // Validate content before submission
        const trimmedContent = reportContent.trim();
        if (!trimmedContent) {
            Alert.alert('Invalid Report', 'Please describe the issue before submitting.');
            return;
        }

        const words = getWordCount(trimmedContent);
        if (words > MAX_WORDS) {
            Alert.alert('Report Too Long', `Please limit your report to ${MAX_WORDS} words or less.`);
            return;
        }

        try {
            setIsSubmitting(true);

            // Check if user has already submitted a report for this product
            const reportsRef = collection(db, 'reports');
            const existingReportQuery = query(
                reportsRef,
                where('reportedBy', '==', user.uid),
                where('productId', '==', productId)
            );
            const existingReports = await getDocs(existingReportQuery);

            if (!existingReports.empty) {
                Alert.alert(
                    'Already Reported',
                    'You have already submitted a report for this product.',
                    [{ text: 'OK' }]
                );
                setIsSubmitting(false);
                return;
            }

            // Submit the report
            await addDoc(reportsRef, {
                createdAt: serverTimestamp(),
                reportedBy: user.uid,
                productId: productId,
                description: trimmedContent
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Alert.alert(
                'Report Submitted',
                'Your report has been submitted! Thank you for helping improve Derm AI.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert(
                'Error',
                'Failed to submit report. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <ProductScreenReportProductMistakeHeader
                />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            ref={scrollRef}
                            contentContainerStyle={DefaultStyles.scrollContainer}
                            keyboardShouldPersistTaps='handled'
                        >
                            <Image
                                source={SkincareCollection}
                                style={styles.heroImage}
                                resizeMode='contain'
                            />

                            <View
                                style={styles.textContainer}
                            >
                                <DefaultText
                                    style={styles.title}
                                >
                                    Something wrong with this product?
                                </DefaultText>

                                <DefaultText
                                    style={styles.caption}
                                >
                                    Describe the issue, and we'll look into it as soon as possible.
                                </DefaultText>
                            </View>

                            <View style={styles.inputContainer}>
                                <DefaultTextInput
                                    style={styles.reportInput}
                                    value={reportContent}
                                    onChangeText={handleReportContentChange}
                                    placeholder='Describe the issue...'
                                    multiline
                                    numberOfLines={3}
                                    onFocus={() => {
                                        // Clear any existing timeout
                                        if (scrollTimeoutRef.current) {
                                            clearTimeout(scrollTimeoutRef.current);
                                        }

                                        // Scroll to input after keyboard appears
                                        scrollRef.current?.scrollToEnd({ animated: true });
                                    }}
                                />
                                <DefaultText style={[
                                    styles.wordCount,
                                    wordCount > MAX_WORDS && styles.wordCountError
                                ]}>
                                    {wordCount}/{MAX_WORDS} words
                                </DefaultText>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>

                <View
                    style={styles.bottomContainer}
                >
                    <DefaultButton
                        title={isSubmitting ? 'Submitting...' : 'Submit'}
                        disabled={!isValid || isSubmitting}
                        isActive={isValid && !isSubmitting}
                        onPress={handleSubmit}
                        style={{
                            borderRadius:64,
                        }}
                        extraStyles={{
                            text: {
                                fontSize:DefaultStyles.text.caption.small,
                            }
                        }}
                        hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    />
                </View>
            </SafeAreaView>
        </View>
    )
}

export default ProductScreenReportProductMistake;

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    heroImage: {
        width:'100%',
        height:150,
    },
    title: {
        fontWeight:'600',
        fontFamily:'HedvigLettersSerif',
        fontSize:DefaultStyles.text.title.small,
        color:colors.text.secondary,
        textAlign:'center',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.darker,
        textAlign:'center'
    },
    textContainer: {
        justifyContent:'center',
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        gap:16,
    },
    bottomContainer: {
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        paddingBottom:DefaultStyles.container.paddingBottom,
    },
    inputContainer: {
        marginTop:DefaultStyles.container.paddingTop,
        gap:8,
    },
    reportInput: {
        fontSize: DefaultStyles.text.caption.small,
        minHeight: 100,
        padding: DefaultStyles.container.paddingTop,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        borderRadius: 12,
        backgroundColor: colors.background.screen,
    },
    wordCount: {
        fontSize: DefaultStyles.text.caption.xsmall,
        color: colors.text.darker,
        textAlign: 'right',
    },
    wordCountError: {
        color: colors.accents.error,
    },
})