import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // or any star icon
import colors from 'config/colors';
import DefaultText from 'components/Text/DefaultText';

const getRatingDistribution = (reviews) => {
    const distribution = [0, 0, 0, 0, 0]; // Index 0 = 1-star, index 4 = 5-star

    reviews.forEach(({ rating }) => {
        if (rating >= 1 && rating <= 5) {
            distribution[rating - 1]++;
        }
    });

    const total = reviews.length;
    return distribution.map(count => (total > 0 ? count / total : 0));
};

const RatingDistribution = ({ reviews }) => {
    const distribution = getRatingDistribution(reviews); // array of percentages [1*, 2*, ..., 5*]

    return (
        <View style={{ gap: 8 }}>
            {[5, 4, 3, 2, 1].map((rating, index) => {
                const percent = distribution[rating - 1]; // flip since array is 1*–5*
                return (
                    <View key={rating} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <DefaultText
                            style={{
                                fontWeight:'600',
                                width: 12,
                                textAlign: 'center'
                            }}
                        >
                            {rating}
                        </DefaultText>
                        <FontAwesome name="star" size={14} color={colors.accents.warning} style={{ marginHorizontal:8 }} />
                        <View style={{
                            flex: 1,
                            height: 8,
                            backgroundColor: '#eee',
                            borderRadius: 12,
                            overflow: 'hidden',
                        }}>
                            <View style={{
                                width: `${percent * 100}%`,
                                height: '100%',
                                backgroundColor: colors.accents.warning,
                            }} />
                        </View>
                        <DefaultText style={{ width: 40, textAlign: 'right', marginLeft: 6 }}>{Math.round(percent * 100)}%</DefaultText>
                    </View>
                );
            })}
        </View>
    );
};

export default RatingDistribution;