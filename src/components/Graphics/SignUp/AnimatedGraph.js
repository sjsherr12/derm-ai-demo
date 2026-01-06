import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import colors from '../../../config/colors';
import DefaultText from 'components/Text/DefaultText';
import DefaultStyles from 'config/styles';

const { width: screenWidth } = Dimensions.get('window');
const GRAPH_WIDTH = screenWidth - 88; // 48 + 40 for margins
const GRAPH_HEIGHT = 190;
const PADDING = 20;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const AnimatedGraph = () => {
    const traditionLineAnim = useRef(new Animated.Value(0)).current;
    const dermAILineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations
        Animated.sequence([
            Animated.delay(200),
            Animated.timing(traditionLineAnim, {
                toValue: 1,
                duration: 1100,
                useNativeDriver: false,
            }),
        ]).start();

        Animated.sequence([
            Animated.delay(300),
            Animated.timing(dermAILineAnim, {
                toValue: 1,
                duration: 1300,
                useNativeDriver: false,
            }),
        ]).start();
    }, []);

    // Mathematical coordinate system mapping
    const mapX = (mathX) => PADDING + (mathX / 13) * (GRAPH_WIDTH - 2 * PADDING);
    const mapY = (mathY) => GRAPH_HEIGHT - PADDING - (mathY / 12) * (GRAPH_HEIGHT - 2 * PADDING);

    // Mathematical equations
    const dermAIEquation = (x) => 9 / (1 + Math.exp(-0.9 * (x - 5))) + 0.88618;
    const traditionalEquation = (x) => 5 * Math.exp(-Math.pow(x - 5, 2) / 16) + 0;

    // Generate path points
    const generatePathPoints = (equation, steps = 100) => {
        const points = [];
        for (let i = 0; i <= steps; i++) {
            const mathX = (i / steps) * 13;
            const mathY = equation(mathX);
            const screenX = mapX(mathX);
            const screenY = mapY(mathY);
            points.push({ mathX, mathY, screenX, screenY });
        }
        return points;
    };

    const traditionalPoints = generatePathPoints(traditionalEquation);
    const dermAIPoints = generatePathPoints(dermAIEquation);

    // Create SVG path strings
    const createSVGPath = (points) => {
        let path = `M ${points[0].screenX} ${points[0].screenY}`;
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].screenX} ${points[i].screenY}`;
        }
        return path;
    };

    const traditionalPath = createSVGPath(traditionalPoints);
    const dermAIPath = createSVGPath(dermAIPoints);

    // Calculate path length for proper animation
    const calculatePathLength = (points) => {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].screenX - points[i - 1].screenX;
            const dy = points[i].screenY - points[i - 1].screenY;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    };

    const traditionalPathLength = calculatePathLength(traditionalPoints);
    const dermAIPathLength = calculatePathLength(dermAIPoints);

    // Grid lines
    const renderGridLines = () => {
        const lines = [];
        for (let i = 1; i <= 5; i++) {
            const y = (GRAPH_HEIGHT - 1 * PADDING) * (i / 6) + PADDING;
            lines.push(
                <View key={i} style={[styles.gridLine, { top: y }]} />
            );
        }
        return lines;
    };

    // Animated path with stroke-dasharray animation
    const AnimatedPath = Animated.createAnimatedComponent(Path);

    return (
        <View style={styles.container}>
            <View style={styles.borderedContainer}>
                <DefaultText style={styles.title}>Your Skin Improvement</DefaultText>
                
                <View style={styles.graphWrapper}>
                    <View style={styles.graphContainer}>
                        {/* Grid lines */}
                        <View style={styles.gridContainer}>
                            {renderGridLines()}
                        </View>
                        
                        {/* X-axis line */}
                        <View style={styles.xAxis} />
                        
                        {/* Traditional line with animation */}
                        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={styles.svgLayer}>
                            <AnimatedPath
                                d={traditionalPath}
                                stroke="#E36580"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray={traditionalPathLength}
                                strokeDashoffset={traditionLineAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [traditionalPathLength, 0]
                                })}
                            />
                        </Svg>
                        
                        {/* Derm AI line with animation */}
                        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={styles.svgLayer}>
                            <AnimatedPath
                                d={dermAIPath}
                                stroke={colors.background.primary}
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray={dermAIPathLength}
                                strokeDashoffset={dermAILineAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [dermAIPathLength, 0]
                                })}
                            />
                        </Svg>
                        
                        {/* Static endpoints */}
                        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={styles.svgLayer}>
                            {/* Derm AI start circle (always visible) */}
                            <Circle
                                cx={dermAIPoints[0].screenX}
                                cy={dermAIPoints[0].screenY}
                                r="5"
                                fill="white"
                                stroke={colors.background.primary}
                                strokeWidth="2.5"
                            />
                        </Svg>
                        
                        {/* Animated endpoints */}
                        <Animated.View style={[
                            styles.svgLayer,
                            {
                                opacity: traditionLineAnim.interpolate({
                                    inputRange: [0, 0.01, 1],
                                    outputRange: [0, 1, 1]
                                })
                            }
                        ]}>
                            <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
                                <AnimatedCircle
                                    cx={traditionLineAnim.interpolate({
                                        inputRange: Array.from({length: 101}, (_, i) => i / 100),
                                        outputRange: traditionalPoints.map(p => p.screenX)
                                    })}
                                    cy={traditionLineAnim.interpolate({
                                        inputRange: Array.from({length: 101}, (_, i) => i / 100),
                                        outputRange: traditionalPoints.map(p => p.screenY)
                                    })}
                                    r="4"
                                    fill="white"
                                    stroke="#E36580"
                                    strokeWidth="2"
                                />
                            </Svg>
                        </Animated.View>
                        
                        <Animated.View style={[
                            styles.svgLayer,
                            {
                                opacity: dermAILineAnim.interpolate({
                                    inputRange: [0, 0.01, 1],
                                    outputRange: [0, 1, 1]
                                })
                            }
                        ]}>
                            <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
                                <AnimatedCircle
                                    cx={dermAILineAnim.interpolate({
                                        inputRange: Array.from({length: 101}, (_, i) => i / 100),
                                        outputRange: dermAIPoints.map(p => p.screenX)
                                    })}
                                    cy={dermAILineAnim.interpolate({
                                        inputRange: Array.from({length: 101}, (_, i) => i / 100),
                                        outputRange: dermAIPoints.map(p => p.screenY)
                                    })}
                                    r="5"
                                    fill="white"
                                    stroke={colors.background.primary}
                                    strokeWidth="2.5"
                                />
                            </Svg>
                        </Animated.View>
                        
                        {/* Axis labels */}
                        <View style={styles.axisLabels}>
                            <DefaultText style={styles.axisLabel}>Month 1</DefaultText>
                            <DefaultText style={styles.axisLabel}>Month 6</DefaultText>
                        </View>
                    </View>
                </View>
                
                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#E36580' }]} />
                        <DefaultText style={styles.legendText}>Other Routines</DefaultText>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: colors.background.primary }]} />
                        <DefaultText style={styles.legendText}>Derm AI Routines</DefaultText>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    borderedContainer: {
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        borderRadius: 24,
        padding: 24,
        flexDirection: 'column',
    },
    title: {
        fontSize: DefaultStyles.text.caption.xlarge,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    graphWrapper: {
        flexDirection: 'column',
        marginTop:-12,
    },
    graphContainer: {
        width: GRAPH_WIDTH,
        height: GRAPH_HEIGHT + 20,
    },
    gridContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: GRAPH_HEIGHT,
    },
    gridLine: {
        position: 'absolute',
        left: PADDING,
        right: PADDING,
        height: 1,
        backgroundColor: colors.text.lighter,
        opacity: 0.3,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.text.lighter,
    },
    xAxis: {
        position: 'absolute',
        bottom: PADDING,
        left: PADDING,
        right: PADDING,
        height: 2,
        backgroundColor: colors.text.secondary,
        borderRadius:6,
    },
    svgLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    axisLabels: {
        position: 'absolute',
        bottom: 0,
        left: PADDING,
        right: PADDING,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    axisLabel: {
        fontSize: 14,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
        marginTop: 32,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 3,
    },
    legendText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        fontWeight: '400',
    },
});

export default AnimatedGraph;