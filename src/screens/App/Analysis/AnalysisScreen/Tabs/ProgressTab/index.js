import React, { useState, useMemo } from "react";
import TrendGraph from "components/Graphics/TrendGraph";
import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { SkinConcerns } from "constants/signup";
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import FadeScaleView from "../../../../../../components/Containers/FadeScaleView";

// Individual concern card component
const ConcernCard = ({ concern, severityTrends, concernColor, cardWidth }) => {
    // Get trend data for this specific concern
    const trendData = severityTrends.map(entry => ({
        date: new Date(entry.date),
        value: entry.severities[concern.severityId] || 0
    }));

    // Calculate percentage change from first point to most recent point in time period
    const calculateChange = () => {
        if (!trendData || trendData.length === 0) return null;
        
        // If only one data point, return neutral state
        if (trendData.length === 1) {
            return {
                change: 0,
                percentChange: 0,
                isImprovement: null, // Neutral state
                isSinglePoint: true
            };
        }
        
        // Sort by date to get chronological order
        const sortedData = [...trendData].sort((a, b) => new Date(a.date) - new Date(b.date));
        const earliest = sortedData[0]; // First point in time period
        const latest = sortedData[sortedData.length - 1]; // Most recent point
        
        if (!earliest || !latest) return null;
        
        const latestValue = latest.value;
        const earliestValue = earliest.value;
        const change = latestValue - earliestValue;
        const percentChange = earliestValue !== 0 ? Math.round((change / earliestValue) * 100) : 0;
        
        return {
            change,
            percentChange,
            isImprovement: change > 0, // Higher values = improvement in severity scores
            isSinglePoint: false
        };
    };

    const change = calculateChange();
    const trendColor = change?.isSinglePoint ? colors.text.lighter : 
                      (change?.isImprovement ? colors.accents.success : colors.accents.error);

    return (
        <>
            <View style={styles.concernHeader}>
                <DefaultText style={styles.concernTitle}>{concern.displayConcern}</DefaultText>
                {change && (
                    <DefaultText style={[styles.changeText, { color: trendColor }]}>
                        {change.isSinglePoint ? '' : (change.isImprovement ? '+' : '')}{change.percentChange}%
                    </DefaultText>
                )}
            </View>
            <TrendGraph 
                trends={[{ key: concern.severityId, data: trendData }]}
                visibleConcerns={[]}
                concernColors={{ [concern.severityId]: trendColor }}
                mini={true}
                cardWidth={cardWidth}
            />
        </>
    );
};

const AnalysisScreenProgressTab = ({
    severityTrends,
}) => {
    const { width } = useWindowDimensions();
    const [selectedTimeRange, setSelectedTimeRange] = useState(0); // Default to "This Week"
    
    // Calculate card width: (screen width - horizontal padding - gap) / 2
    const cardWidth = (width - (DefaultStyles.container.paddingBottom * 3)) / 2;

    // Get all skin concerns except "No main concerns" (value: 0)
    const allConcerns = SkinConcerns.filter(concern => concern.value !== 0);

    // Filter severity trends based on selected time range
    const filteredSeverityTrends = useMemo(() => {
        if (!severityTrends || severityTrends.length === 0) return [];
        
        const now = new Date();
        let cutoffDate;
        
        switch (selectedTimeRange) {
            case 0: // This Week (last 7 days)
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 1: // This Month (last 30 days)
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 2: // This Year (last 365 days)
                cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 3: // All Time
            default:
                return severityTrends;
        }
        
        return severityTrends.filter(trend => {
            const trendDate = new Date(trend.date);
            return trendDate >= cutoffDate;
        });
    }, [severityTrends, selectedTimeRange]);

    return (
        <View style={styles.container}>
            <SegmentedControl
                values={['This Week', 'This Month', 'This Year', 'All Time']}
                selectedIndex={selectedTimeRange}
                onChange={(event) => {
                    setSelectedTimeRange(event.nativeEvent.selectedSegmentIndex);
                }}
            />

            <View style={styles.gridContainer}>
                {allConcerns.map((concern) => (
                    <FadeScaleView key={concern.severityId} style={[styles.concernCard, { width: cardWidth }]}>
                        <ConcernCard
                            concern={concern}
                            severityTrends={filteredSeverityTrends}
                            cardWidth={cardWidth}
                        />
                    </FadeScaleView>
                ))}
            </View>
        </View>
    );
}

export default AnalysisScreenProgressTab;

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    flexContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    concernCard: {
        padding: DefaultStyles.container.paddingBottom,
        paddingBottom:8,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
    },
    concernHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    concernTitle: {
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '600',
        color: colors.text.secondary,
        flex: 1,
    },
    changeText: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '700',
        marginLeft: 'auto',
    },
    itemContainer: {
        padding: DefaultStyles.container.paddingBottom,
        borderRadius: 16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    title: {
        fontSize:DefaultStyles.text.caption.xlarge,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    helper: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '500',
        color: colors.background.primary,
        marginRight:8
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
        marginTop: DefaultStyles.container.paddingBottom,
    },
    resetButton: {
        padding: 4,
        marginLeft: 4,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'500',
        color:colors.text.secondary,
    },
    text: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
        marginLeft:'auto',
        fontWeight:'600'
    }
});