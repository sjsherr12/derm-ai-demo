import DefaultStyles from "config/styles";
import { ScrollView, View, SafeAreaView, RefreshControl, StyleSheet } from "react-native";
import ProductScreenAllReviewsHeader from "./header";
import AllReviewsScreenReviewsSummary from "./summary";
import { useData } from "context/global/DataContext";
import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "services/firebase/firebase";
import { getAverageProductRating } from "utils/products";
import AllReviewsScreenIndividualReview from "./review";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultButton from "components/Buttons/DefaultButton";
import {Ionicons, FontAwesome6} from '@expo/vector-icons'
import { useNavigation } from "@react-navigation/native";
import DefaultBottomSheet from "components/Containers/DefaultBottomSheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "context/global/AuthContext";

const ProductScreenAllReviewsScreen = ({
    route
}) => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { productId } = route?.params;
    const { products, getProductReviews } = useData();
    const [refreshing, setRefreshing] = useState(false);
    const product = products[productId];
    const allReviews = getProductReviews ? getProductReviews(productId) : [];
    
    // Check if current user has a review for this product
    const userExistingReview = useMemo(() => {
        if (!user || !allReviews) return null;
        return allReviews.find(review => review.user === user.uid);
    }, [user, allReviews]);
    
    const hasUserReview = Boolean(userExistingReview);

    // No longer needed - reviews are fetched globally by useReviewFetcher

    const handleRefresh = () => {
        setRefreshing(true);
        // Reviews will refresh automatically via useReviewFetcher
        setTimeout(() => setRefreshing(false), 500);
    };


    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
            >
                <ProductScreenAllReviewsHeader />
                <ScrollView
                    contentContainerStyle={DefaultStyles.scrollContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                >
                    <AllReviewsScreenReviewsSummary
                        product={product}
                        allReviews={allReviews}
                    />

                    {allReviews?.map((review, idx) => (review?.review &&
                        <AllReviewsScreenIndividualReview
                            key={idx}
                            review={review}
                        />
                    ))}
                </ScrollView>

                <View
                    style={styles.bottomContainer}
                >
                    <DefaultButton
                        isActive
                        title={hasUserReview ? 'Edit your review' : 'Write a review'}
                        endAdornment={
                            <Ionicons
                                name='pencil'
                                size={20}
                                color={colors.text.primary}
                            />
                        }
                        onPress={() => {
                            if (hasUserReview) {
                                navigation.navigate('EditReview', {
                                    productId,
                                    reviewId: userExistingReview.id
                                });
                            } else {
                                navigation.navigate('WriteReview', {
                                    productId
                                });
                            }
                        }}
                    />
                </View>
            </SafeAreaView>
        </View>
    )
}

export default ProductScreenAllReviewsScreen;

const styles = StyleSheet.create({
    title: {
        fontWeight:'600',
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.title.small,
    },
    bottomContainer: {
        padding:DefaultStyles.container.paddingHorizontal,
        borderTopWidth:1.5,
        borderTopColor:colors.accents.stroke,
    }
})