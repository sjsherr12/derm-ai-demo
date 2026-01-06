import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { convertSkinConcernSeverityIdToName } from 'utils/analysis';
import DefaultText from '../Text/DefaultText';

const TrendChart = ({ trends = [], visibleConcerns = [], concernColors = {}, mini = false, cardWidth }) => {
    const {width}=useWindowDimensions();

    const containerWidth = mini ? (cardWidth || width * 0.4) : width - (DefaultStyles.container.paddingBottom * 4);
    const chartHeight = mini ? 120 : 300;
    const chartWidth = mini ? containerWidth - (DefaultStyles.container.paddingBottom * 2) : containerWidth - (DefaultStyles.container.paddingHorizontal * 2)

    // Ensure trends is always an array
    const trendsArray = Array.isArray(trends) ? trends : [];
    const visibleConcernsArray = Array.isArray(visibleConcerns) ? visibleConcerns : [];

    // Filter trends based on visible concerns
    let activeTrends = trendsArray.filter(trend => 
        visibleConcernsArray.length === 0 || visibleConcernsArray.includes(trend?.key)
    );


    if (activeTrends.length === 0) {
        return (
            <View
                style={{
                    width: containerWidth,
                    height: chartHeight,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.accents.stroke,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <DefaultText style={{ color: '#666', fontSize: 16 }}>No data to display</DefaultText>
            </View>
        );
    }

    // Get all unique dates and sort them
    const allDates = [...new Set(activeTrends.flatMap(trend => {
        if (!trend || !Array.isArray(trend.data)) {
            return [];
        }
        return trend.data.map(point => {
            if (!point || !point.date) {
                return null;
            }
            try {
                return point.date.toISOString();
            } catch (error) {
                return null;
            }
        }).filter(Boolean);
    }))].sort();

    // Early return if no dates available
    if (allDates.length === 0) {
        return (
            <View
                style={{
                    width: containerWidth-32,
                    height: chartHeight,
                    backgroundColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <DefaultText style={{ color: '#666', fontSize: 16 }}>No data to display</DefaultText>
            </View>
        );
    }

    // Smoothing function for large datasets
    const smoothData = (data, windowSize = 3) => {
        if (data.length <= windowSize) return data;
        
        const smoothedData = [];
        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let count = 0;
            
            // Calculate moving average within the window
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(data.length - 1, i + Math.floor(windowSize / 2));
            
            for (let j = start; j <= end; j++) {
                sum += data[j].value;
                count++;
            }
            
            smoothedData.push({
                ...data[i],
                value: Math.round(sum / count)
            });
        }
        
        return smoothedData;
    };

    // Create main data array with just labels and a placeholder value
    const mainData = allDates.map((dateStr, index) => {
        const date = new Date(dateStr);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        
        return {
            value: 0, // Placeholder value, will be overridden by dataSet
            label: label,
            labelTextStyle: { color: 'rgba(85, 85, 85, 1)', fontSize: 12 },
        };
    });

    // Determine if we should show all data points and apply smoothing
    const showAllDataPoints = allDates.length < 6;
    const shouldSmooth = allDates.length > 15; // Apply smoothing for datasets with more than 15 points
    const smoothingWindow = allDates.length > 50 ? 5 : 3; // Larger window for very large datasets
    
    // Create data sets for ALL trends (no special treatment for first trend)
    const additionalDataSets = activeTrends.map((trend, trendIndex) => {
        const trendColor = concernColors[trend?.key] || '#666666';
        
        // First, create the raw data array
        const rawData = allDates.map((dateStr, dateIndex) => {
            if (!Array.isArray(trend?.data)) {
                return { value: 0 };
            }
            const point = trend.data.find(p => {
                try {
                    return p?.date?.toISOString() === dateStr;
                } catch (error) {
                    return false;
                }
            });
            
            return {
                value: point ? point.value : 0,
                dateIndex,
            };
        });
        
        // Apply smoothing if dataset is large enough
        const processedData = shouldSmooth ? smoothData(rawData, smoothingWindow) : rawData;
        
        // Convert back to the format expected by the chart
        const finalData = processedData.map((item, index) => {
            const isLastPoint = index === processedData.length - 1;
            return {
                value: item.value,
                hideDataPoint: showAllDataPoints ? false : !isLastPoint,
            };
        });
        
        return {
            data: finalData,
            color: trendColor,
            thickness: 3,
            curved: true,
            areaChart: true,
            startFillColor: `${trendColor}50`,
            endFillColor: `${trendColor}99`,
            startOpacity: 0.25,
            endOpacity: 0.05,
            dataPointsColor: trendColor,
            dataPointsRadius: 4,
            dataPointsWidth: 2,
            hideDataPoints: false,
            showDataPointOnPress: true,
        };
    });

    return (
        <View style={mini ? { alignItems: 'center', justifyContent: 'center' } : {}}>
            <LineChart
                data={mainData || []}
                dataSet={additionalDataSets || []}
                width={chartWidth}
                height={chartHeight - (mini ? 20 : DefaultStyles.container.paddingBottom*2)}
                color={'transparent'}
                thickness={0}
                curved={true}
                hideDataPoints={true}
                backgroundColor={'#fff'}
                rulesType={'dashed'}
                rulesColor={'#e2e2e2ff'}
                dashWidth={4}
                dashGap={6}
                showVerticalLines={!mini}
                verticalLinesColor={'#f0f0f0'}
                xAxisColor={colors.accents.stroke}
                yAxisColor={colors.accents.stroke}
                hideAxesAndRules={false}
                hideYAxisText={mini}
                yAxisTextStyle={{
                    color: colors.text.darker,
                    fontSize: mini ? 0 : 12,
                }}
                yAxisLabelSuffix=""
                showYAxisIndices={false}
                hideRules={false}
                yAxisLabelWidth={mini ? 0 : undefined}
                yAxisOffset={mini ? 0 : undefined}
                xAxisThickness={2}
                yAxisThickness={1.5}
                noOfSections={5}
                maxValue={100}
                stepValue={20}
                initialSpacing={0}
                xAxisLabelTextsMarginFromXAxis={0}
                rotateLabel={false}
                xAxisLabelsVerticalShift={0}
                xAxisIndicesHeight={0}
                xAxisIndicesWidth={0}
                hideXAxisText={mini}
                xAxisTextNumberOfLines={0}
                showXAxisIndices={false}
                xAxisOffset={0}
                adjustToWidth={true}
                disableScroll={true}
                animateOnDataChange={true}
                animationDuration={500}
            />
        </View>
    );
};

export default TrendChart;