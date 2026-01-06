import StarRating from "components/Common/StarRating";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { StyleSheet, View } from "react-native";
import { timeAgo } from "utils/date";
import { lighten } from "utils/lighten";
import {Ionicons} from '@expo/vector-icons'

const AllReviewsScreenIndividualReview = ({
    review
}) => {
    const createdAt = review?.createdAt?.toDate();
    const safeDate = isNaN(createdAt.getTime()) ? new Date() : createdAt;

    return (
        <View
            style={styles.container}
        >
            <View
                style={styles.topContainer}
            >
                <DefaultText
                    style={styles.ratingText}
                >
                    {parseFloat(review?.rating).toFixed(1)}
                </DefaultText>

                <StarRating
                    rating={review?.rating}
                    size={18}
                    style={{
                        gap:2,
                        marginLeft:2
                    }}
                />

                <DefaultText
                    style={styles.createdDate}
                >
                    {timeAgo(safeDate)}
                </DefaultText>
            </View>

            <DefaultText
                style={styles.reviewText}
            >
                "{review?.review}"
            </DefaultText>

            {review?.wouldRecommend &&
                <View
                    style={styles.wouldRecommendPill}
                >
                    <DefaultText
                        style={styles.wouldRecommendText}
                    >
                        Would recommend
                    </DefaultText>
                    <Ionicons
                        color={colors.text.primary}
                        size={16}
                        name='checkmark'
                    />
                </View>
            }
        </View>
    )
}

export default AllReviewsScreenIndividualReview;

const styles = StyleSheet.create({
    container: {
        gap:16,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        padding:DefaultStyles.container.paddingBottom,
        backgroundColor:colors.background.screen,
        boxShadow:'0px 2px 4px rgba(0,0,0,.025)'
    },
    topContainer: {
        gap:8,
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
    },
    ratingText: {
        fontWeight:'600',
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.caption.small,
    },
    reviewText: {
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.caption.small,
    },
    createdDate: {
        marginLeft:'auto',
        fontWeight:'600',
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
    },
    wouldRecommendPill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 64,
        flexDirection:'row',
        alignItems:'center',
        backgroundColor: colors.background.primary,
        gap:6,
    },
    wouldRecommendText: {
        color:colors.text.primary,
    }
})