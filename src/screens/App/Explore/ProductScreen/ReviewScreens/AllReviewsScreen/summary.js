import StarRating from "components/Common/StarRating"
import DefaultText from "components/Text/DefaultText"
import colors from "config/colors"
import DefaultStyles from "config/styles"
import { SkincareProductCategories } from "constants/products"
import RatingDistribution from "./distribution"
import Skeleton from "components/Common/Skeleton"
import { getProductCategory } from "utils/products"
import { useData } from "context/global/DataContext"

const { View, StyleSheet, Image } = require("react-native")

const AllReviewsScreenReviewsSummary = ({
    product,
}) => {
    const { getProductReviews, getProductAverageRating } = useData();
    const allReviews = getProductReviews ? getProductReviews(product?.id) : [];
    const averageRating = getProductAverageRating ? getProductAverageRating(product?.id) : 0;
    const productCategory = getProductCategory(product)
    const percentRecommended = allReviews?.length? `${Math.round(
        (allReviews.filter(r => r.wouldRecommend).length / allReviews.length) * 100
    )}%` : '0%'

    return (
        <View
            style={styles.container}
        >
            <View
                style={productStyles.container}
            >
                <Image
                    source={{uri:product?.imageUrl}}
                    style={{
                        width:75,
                        height:75,
                        resizeMode:'contain',
                    }}
                />
                <View
                    style={productStyles.infoContainer}
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
                        style={productStyles.category}
                    >
                        {productCategory}
                    </DefaultText>
                </View>
            </View>

            <View
                style={styles.padding}
            >
                <View
                    style={reviewSummaryStyles.container}
                >
                    <View
                        style={reviewSummaryStyles.ratingContainer}
                    >
                        <DefaultText
                            style={reviewSummaryStyles.ratingText}
                        >
                            {parseFloat(averageRating).toFixed(1)}
                        </DefaultText>

                        <View
                            style={{gap:4}}
                        >
                            <StarRating
                                rating={averageRating}
                                size={12}
                            />
                            <DefaultText
                                style={reviewSummaryStyles.ratingCaption}
                            >
                                {allReviews?.length} review{allReviews?.length !== 1 && 's'}
                            </DefaultText>
                        </View>
                    </View>

                    <View
                        style={reviewSummaryStyles.ratingContainer}
                    >
                        <DefaultText
                            style={reviewSummaryStyles.ratingText}
                        >
                            {percentRecommended}
                        </DefaultText>

                        <View
                            style={{gap:4}}
                        >
                            <DefaultText
                                style={reviewSummaryStyles.ratingCaption}
                            >
                                recommend{"\n"}this product
                            </DefaultText>
                        </View>
                    </View>
                </View>
                
                <RatingDistribution
                    reviews={allReviews}
                />
            </View>
        </View>
    )
}

export default AllReviewsScreenReviewsSummary

const styles = StyleSheet.create({
    container: {
        boxShadow:'0px 6px 12px rgba(0,0,0,.025)',
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        borderRadius:16,
    },
    padding: {
        padding:DefaultStyles.container.paddingBottom,
        gap:16,
    }
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
        gap:8,
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

const reviewSummaryStyles = StyleSheet.create({
    container: {
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
    },
    ratingContainer: {
        flexDirection:'row',
        alignItems:'center',
        gap:10,
    },
    ratingText: {
        fontSize:DefaultStyles.text.title.small,
        fontWeight:'bold',
        color:colors.text.secondary,
    },
    ratingCaption: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,        
    }
})