import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import colors from '../../../config/colors';
import DefaultStyles from '../../../config/styles';
import DefaultText from 'components/Text/DefaultText';

const checkpoints = [
    {
        id: '1',
        title: 'Weeks 1 - 6',
        description: 'Begin your journey with your first scan, diagnosis, and routine.',
        icon: 'check',
        iconLibrary: 'Octicons'
    },
    {
        id: '2',
        title: 'Weeks 7 - 12',
        description: 'Notice visible changes as your plan adapts to your skin’s progress.',
        icon: 'check',
        iconLibrary: 'Octicons'
    },
    {
        id: '3',
        title: 'Weeks 13 - 18+',
        description: 'See long-term improvements and guidance to maintain healthy skin.',
        icon: 'check',
        iconLibrary: 'Octicons'
    }
];

const ProgressTransition = () => {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            Animated.timing(progressAnim, {
                toValue: checkpoints.length,
                duration: 2400,
                useNativeDriver: false,
            }).start();
        };

        const timer = setTimeout(startAnimation, 200);
        return () => clearTimeout(timer);
    }, []);

    const DottedLine = ({ index }) => {
        const isCompleted = progressAnim.interpolate({
            inputRange: [index, index + 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });
        
        return (
            <View style={styles.lineContainer}>
                <View style={styles.dottedLine}>
                    {[...Array(5)].map((_, i) => (
                        <Animated.View 
                            key={i} 
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: isCompleted.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [colors.background.light, colors.background.secondary],
                                    }),
                                }
                            ]} 
                        />
                    ))}
                </View>
            </View>
        );
    };

    const CheckpointItem = ({ checkpoint, index, first, second, third }) => {

        const isCompleted = progressAnim.interpolate({
            inputRange: [index, index + 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });

        return (
            <View style={[
                styles.checkpointContainer, 
                first && styles.firstCheckpointSpacing,
                second && styles.secondCheckpointSpacing,
                third && styles.thirdCheckpointSpacing
            ]}>
                <View style={styles.checkpointContent}>
                    <Animated.View
                        style={[
                            styles.circleContainer,
                            {
                                backgroundColor: isCompleted.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [colors.background.light, colors.background.secondary],
                                }),
                            },
                        ]}
                    >
                        <View>
                            <Animated.View
                                style={{
                                    opacity: isCompleted.interpolate({
                                        inputRange: [0, 0.5],
                                        outputRange: [1, 0],
                                        extrapolate: 'clamp',
                                    }),
                                    position: 'absolute',
                                }}
                            >
                                <Octicons
                                    name={checkpoint.icon}
                                    size={24}
                                    color="black"
                                />
                            </Animated.View>
                            <Animated.View
                                style={{
                                    opacity: isCompleted.interpolate({
                                        inputRange: [0.5, 1],
                                        outputRange: [0, 1],
                                        extrapolate: 'clamp',
                                    }),
                                }}
                            >
                                <Octicons
                                    name={checkpoint.icon}
                                    size={28}
                                    color="white"
                                />
                            </Animated.View>
                        </View>
                    </Animated.View>

                    <Animated.View 
                        style={[
                            styles.textContainer,
                            {
                                opacity: isCompleted.interpolate({
                                    inputRange: [0, 0.3, 1],
                                    outputRange: [0.3, 0.6, 1],
                                    extrapolate: 'clamp',
                                }),
                                transform: [{
                                    translateX: isCompleted.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                        extrapolate: 'clamp',
                                    })
                                }]
                            }
                        ]}
                    >
                        <DefaultText style={styles.checkpointTitle}>{checkpoint.title}</DefaultText>
                        <DefaultText style={styles.checkpointDescription}>{checkpoint.description}</DefaultText>
                    </Animated.View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.roadmapContainer}>
                {checkpoints.map((checkpoint, index) => (
                    <View key={checkpoint.id} style={styles.itemWrapper}>
                        <CheckpointItem
                            checkpoint={checkpoint}
                            index={index}
                            first={index == 0}
                            second={index == 1}
                            third={index == 2}
                        />
                        {index < checkpoints.length - 1 && (
                            <DottedLine index={index} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    roadmapContainer: {
        borderWidth:1.5,
        borderRadius:20,
        width: '100%',
        padding:20,
        borderColor:colors.accents.stroke
    },
    itemWrapper: {
        width: '100%',
    },
    checkpointContainer: {
        width: '100%',
    },
    firstCheckpointSpacing: {
        marginBottom: 14,
    },
    secondCheckpointSpacing: {
        marginTop: 14,
        marginBottom: 14,
    },
    thirdCheckpointSpacing: {
        marginTop: 14,
    },
    checkpointContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    circleContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        height: 60,
        flexDirection:'column',
        justifyContent: 'space-between',
    },
    checkpointTitle: {
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    checkpointDescription: {
        fontSize: DefaultStyles.text.caption.xsmall,
        color: colors.text.lighter,
        lineHeight: 16,
    },
    lineContainer: {
        width: '100%',
        height: 36,
        paddingLeft: 29.4,
    },
    dottedLine: {
        width: 2,
        height: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});

export default ProgressTransition;