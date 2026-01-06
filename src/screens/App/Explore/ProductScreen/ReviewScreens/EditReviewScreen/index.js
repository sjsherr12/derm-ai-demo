import DefaultStyles from "config/styles";
import { Animated, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, View, Alert } from "react-native";
import ProductScreenEditReviewScreenHeader from "./header";
import { StyleSheet } from "react-native";
import colors from "config/colors";
import DefaultText from "components/Text/DefaultText";
import { useData } from "context/global/DataContext";
import { getProductCategory } from "utils/products";
import StarRating from "components/Common/StarRating";
import { useRef, useState, useEffect } from "react";
import * as Haptics from 'expo-haptics'
import {Ionicons} from '@expo/vector-icons'
import DefaultTextInput from "components/Text/DefaultTextInput";
import { TouchableWithoutFeedback } from "react-native";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import DefaultButton from "components/Buttons/DefaultButton";
import { useNavigation } from "@react-navigation/native";

const ProductScreenEditReviewScreen = ({
    route,
}) => {
    const {reviewId} = route?.params;
    const {products, updateReview, deleteReview, userReviews} = useData();
    const navigation = useNavigation();

    // Find the review to edit
    const reviewToEdit = userReviews.find(review => review.id === reviewId);
    const product = products[reviewToEdit?.productId];
    const productCategory = getProductCategory(product);

    const [rating, setRating] = useState(null)
    const [review, setReview] = useState(null)
    const [wouldRecommend, setWouldRecommend] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const scrollRef = useRef(null)
    const scrollTimeoutRef = useRef(null);

    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
    })

    // Pre-populate form with existing review data
    useEffect(() => {
        if (reviewToEdit) {
            setRating(reviewToEdit.rating);
            setReview(reviewToEdit.review || null);
            setWouldRecommend(reviewToEdit.wouldRecommend || false);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [reviewToEdit]);

    // Check if any changes have been made
    const hasChanges = () => {
        if (!reviewToEdit) return false;
        
        const originalReview = reviewToEdit.review || null;
        const currentReview = review ? review.trim() : null;
        
        return (
            rating !== reviewToEdit.rating ||
            currentReview !== originalReview ||
            wouldRecommend !== (reviewToEdit.wouldRecommend || false)
        );
    };

    const handleSelectRecommend = () => {
        setWouldRecommend(prev => !prev)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
    }

    const handleSubmit = async () => {
        if (!rating) {
            Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
            return;
        }

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            const reviewData = {
                productId: reviewToEdit.productId,
                rating,
                review: review ? review.trim() : null,
                wouldRecommend
            };

            await updateReview(reviewId, reviewData);
            
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Alert.alert(
                'Review Updated', 
                'Your review has been updated successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error updating review:', error);
            Alert.alert(
                'Error', 
                'Failed to update review. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    if (isLoading || !reviewToEdit || !product) {
        return (
            <View style={DefaultStyles.outer}>
                <SafeAreaView style={DefaultStyles.safeArea}>
                    <ProductScreenEditReviewScreenHeader />
                    <View style={styles.loadingContainer}>
                        <DefaultText style={styles.loadingText}>
                            {!reviewToEdit ? 'Review not found' : 'Loading review...'}
                        </DefaultText>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <ProductScreenEditReviewScreenHeader
                    onDeleteReview={deleteReview}
                    reviewId={reviewId}
                    isDeleting={isDeleting}
                />
                
                <KeyboardAvoidingView
                    style={{flex:1}}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            ref={scrollRef}
                            contentContainerStyle={DefaultStyles.scrollContainer}
                            keyboardShouldPersistTaps='handled'
                        >
                            <View
                                style={styles.ratingContainer}
                            >
                                <View
                                    style={productStyles.container}
                                >
                                    <Image
                                        source={{uri:product?.imageUrl}}
                                        style={{
                                            width:75,
                                            height:75,
                                            resizeMode:'contain'
                                        }}
                                    />
                                    <View
                                        style={productStyles.textContainer}
                                    >
                                        <DefaultText
                                            style={productStyles.brand}
                                        >
                                            {product?.brand}
                                        </DefaultText>
        
                                        <DefaultText
                                            numberOfLines={1}
                                            style={productStyles.title}
                                        >
                                            {product?.name}
                                        </DefaultText>
                                        <DefaultText
                                            style={productStyles.caption}
                                        >
                                            {productCategory}
                                        </DefaultText>
                                    </View>
                                </View>

                                <View
                                    style={styles.giveRatingContainer}
                                >
                                    <DefaultText
                                        style={styles.title}
                                    >
                                        How did you like it?
                                    </DefaultText>

                                    <StarRating
                                        size={44}
                                        rating={rating}
                                        onChange={setRating}
                                        style={{gap:4}}
                                    />

                                    <DefaultText>
                                        Select a rating from 1 to 5.
                                    </DefaultText>
                                </View>
                            </View>

                            <Pressable
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                onPress={handleSelectRecommend}
                            >
                                <Animated.View
                                    style={[
                                        styles.container,
                                        {transform:[{scale}]}
                                    ]}
                                >
                                    <View
                                        style={styles.flexContainer}
                                    >
                                        <DefaultText
                                            style={styles.caption}
                                        >
                                            Recommend this product?
                                        </DefaultText>

                                        <Ionicons
                                            name={wouldRecommend ? 'checkmark-circle-sharp' : 'ellipse-outline'}
                                            color={wouldRecommend ? colors.background.primary : colors.accents.stroke}
                                            size={24}
                                            style={{
                                                marginLeft:'auto',
                                            }}
                                        />
                                    </View>
                                </Animated.View>
                            </Pressable>

                            <View
                                style={styles.container}
                            >
                                <DefaultText
                                    style={styles.title}
                                >
                                    Edit review
                                </DefaultText>

                                <DefaultTextInput
                                    multiline
                                    numberOfLines={5}
                                    placeholder='What did you think about this product?'
                                    value={review}
                                    onChangeText={setReview}
                                    style={styles.reviewInput}
                                    onFocus={() => {
                                        // Clear existing timeout
                                        if (scrollTimeoutRef.current) {
                                            clearTimeout(scrollTimeoutRef.current);
                                        }
                                        
                                        scrollTimeoutRef.current = setTimeout(() => {
                                            scrollRef.current?.scrollToEnd({animated:true})
                                        }, 100)
                                    }}
                                />
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>

                <View
                    style={styles.bottomContainer}
                >
                    <DefaultButton
                        title={isSubmitting ? 'Updating...' : 'Update Review'}
                        isActive
                        disabled={isSubmitting || rating === null || !hasChanges()}
                        onPress={handleSubmit}
                        style={{
                            borderRadius:64,
                        }}
                    />
                </View>
            </SafeAreaView>
        </View>
    )
}

export default ProductScreenEditReviewScreen;

const styles = StyleSheet.create({
    ratingContainer: {
        borderRadius:24,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        boxShadow:'0px 6px 12px rgba(0,0,0,.025)',
    },
    container: {
        gap:24,
        borderRadius:24,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        paddingVertical:DefaultStyles.container.paddingHorizontal,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
        boxShadow:'0px 6px 12px rgba(0,0,0,.025)',
    },
    bottomContainer: {
        padding:DefaultStyles.container.paddingHorizontal,
        borderTopColor:colors.accents.stroke,
        borderTopWidth:1.5,
    },
    giveRatingContainer: {
        gap:16,
        padding:DefaultStyles.container.paddingHorizontal,
        alignItems:'center',
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
    },
    title: {
        fontWeight:'bold',
        color:colors.text.secondary,
        fontSize:24,
    },
    caption: {
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
    },
    reviewInput: {
        fontSize:DefaultStyles.text.caption.small,
        minHeight:100,
        padding:DefaultStyles.container.paddingTop,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        borderRadius:12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DefaultStyles.container.paddingHorizontal,
    },
    loadingText: {
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.lighter,
        textAlign: 'center',
    },
})

const productStyles = StyleSheet.create({
    container: {
        flex:1,
        flexDirection:'row',
        alignItems:'center',
        gap:16,
        borderBottomWidth:1.5,
        borderBottomColor:colors.accents.stroke,
        padding:DefaultStyles.container.paddingBottom,
    },
    textContainer: {
        flex:1,
        gap:10,
        minWidth:0,
    },
    brand: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
        fontWeight:'bold',
    },
    title: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary,
        fontWeight:'600',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
        fontWeight:'500'
    },
})