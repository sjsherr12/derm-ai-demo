import DefaultStyles from "config/styles";
import { Image, SafeAreaView, StyleSheet, View, FlatList, ActivityIndicator, Pressable, Animated } from "react-native";
import AccountReviewsScreenHeader from "./header";
import { useData } from "context/global/DataContext";
import colors from "config/colors";
import { useAuth } from "context/global/AuthContext";
import DefaultText from "components/Text/DefaultText";
import React, { useMemo } from "react";
import { getProductCategory } from "utils/localProductQueries";
import StarRating from "components/Common/StarRating";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import { useNavigation } from "@react-navigation/native";
import EmptyComponentGeneric from "../../../../components/Graphics/EmptyGeneric";

const EditReviewShortcut = ({
    review
}) => {

    const navigation = useNavigation();
    const {user} = useAuth();
    const {products} = useData();
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })

    const reviewedProduct = useMemo(
        () => products?.[review?.productId], 
        [review?.productId]
    )

    const productCategory = useMemo(
        () => getProductCategory(reviewedProduct),
        [reviewedProduct]
    )

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('EditReview', {
                reviewId: review?.id
            })}
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
                    <Image
                        source={{
                            uri:reviewedProduct?.imageUrl
                        }}
                        style={styles.imageContainer}
                    />
                    <View
                        style={productStyles.infoContainer}
                    >
                        <DefaultText
                            style={productStyles.brand}
                        >
                            {reviewedProduct?.brand} · {productCategory}
                        </DefaultText>

                        <DefaultText
                            numberOfLines={1}
                            style={productStyles.title}
                        >
                            {reviewedProduct?.name}
                        </DefaultText>

                        <View
                            style={[
                                styles.flexContainer,
                                {gap:6}
                            ]}
                        >
                            <StarRating
                                rating={review?.rating || 5}
                                size={16}
                            />
                            <DefaultText
                                style={productStyles.category}
                            >
                                on {review?.createdAt?.toDate().toLocaleDateString()}
                            </DefaultText>
                        </View>
                    </View>
                </View>

                {review?.review && 
                    <React.Fragment>
                        <View
                            style={DefaultStyles.separator}
                        />

                        <DefaultText>
                            "{review.review}"
                        </DefaultText>
                    </React.Fragment>
                }
            </Animated.View>
        </Pressable>
    )
}

const AccountReviewsScreen = ({

}) => {

    const {user} = useAuth();
    const {
        userReviews,
        userReviewsLoading,
        userReviewsLoadingMore,
        userReviewsHasMore,
        loadMoreUserReviews
    } = useData();

    const renderReviewItem = ({ item }) => (
        <EditReviewShortcut
            review={item}
        />
    );

    const renderFooter = () => {
        if (userReviewsLoadingMore) {
            return (
                <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator
                        size="small"
                        color={colors.background.primary}
                    />
                    <DefaultText style={styles.loadingMoreText}>
                        Loading more reviews...
                    </DefaultText>
                </View>
            );
        }
        
        return null;
    };

    const renderEmptyState = () => (
        <EmptyComponentGeneric
            title='No reviews yet'
            description='Start reviewing products to see them here.'
            icon='star-outline'
        />
    );

    if (userReviewsLoading) {
        return (
            <View style={DefaultStyles.outer}>
                <SafeAreaView style={DefaultStyles.safeArea}>
                    <AccountReviewsScreenHeader />
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.background.primary}
                        />
                        <DefaultText style={styles.loadingText}>
                            Loading your reviews...
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
                <AccountReviewsScreenHeader />

                <FlatList
                    data={userReviews.sort((a, b) => b.createdAt - a.createdAt)}
                    renderItem={renderReviewItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    onEndReached={loadMoreUserReviews}
                    onEndReachedThreshold={0.1}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </View>
    )
}

export default AccountReviewsScreen;

const styles = StyleSheet.create({
    itemContainer: {
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:12,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        gap:16,
        marginBottom: 16,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    imageContainer: {
        width:75,
        height:75,
    },
    listContainer: {
        padding: DefaultStyles.container.paddingHorizontal,
        paddingBottom: DefaultStyles.tabScrollContainer.paddingBottom,
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
        marginTop: 8,
        textAlign: 'center',
    },
    loadingMoreContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    loadingMoreText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.lighter,
        marginLeft: 8,
    },
    endOfListContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    endOfListText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.lighter,
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    emptyText: {
        fontSize: DefaultStyles.text.caption.large,
        fontWeight: '600',
        color: colors.text.lighter,
        textAlign: 'center',
        marginBottom: 14,
    },
    emptySubtext: {
        fontSize: DefaultStyles.text.caption.medium,
        color: colors.text.lighter,
        textAlign: 'center',
        lineHeight:24,
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
    infoContainer: {
        gap:10,
        flex:1,
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
