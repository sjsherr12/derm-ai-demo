import DefaultText from 'components/Text/DefaultText';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import React, { useRef, useState } from 'react';
import {
    View,
    FlatList,
    Image,
    Text,
    Dimensions,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const SPACING = -16;
const FULL_SIZE = height >= 800 ? width * .8 : height >= 750 ? width * .75 : height >= 700 ? width * .6 : width * .5;
const SCALE_DOWN = .75;
const ITEM_SPACING = SPACING * 2;

const renderHighlightedText = (captionData) => {
    if (typeof captionData === 'string') {
        return captionData;
    }
    
    const { text, highlights } = captionData;
    if (!highlights || highlights.length === 0) {
        return text;
    }

    let result = [];
    let lastIndex = 0;
    let keyCounter = 0;

    highlights.forEach((highlight) => {
        const index = text.toLowerCase().indexOf(highlight.toLowerCase(), lastIndex);
        if (index !== -1) {
            // Add text before highlight
            if (index > lastIndex) {
                result.push(text.substring(lastIndex, index));
            }
            // Add highlighted text
            result.push(
                <DefaultText key={keyCounter++} style={{ fontWeight: '800' }}>
                    {text.substring(index, index + highlight.length)}
                </DefaultText>
            );
            lastIndex = index + highlight.length;
        }
    });

    // Add remaining text
    if (lastIndex < text.length) {
        result.push(text.substring(lastIndex));
    }

    return result;
};

export default function ImageCarousel({
    data
}) {
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);

    return (
        <View style={styles.container}>
            <Animated.FlatList
                ref={flatListRef}
                data={data}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={FULL_SIZE + SPACING}
                decelerationRate="fast"
                bounces={false}
                contentContainerStyle={{
                    paddingHorizontal: (width - FULL_SIZE) / 2,
                }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                renderItem={({ item, index }) => {
                    const inputRange = [
                        (index - 1) * (FULL_SIZE + SPACING),
                        index * (FULL_SIZE + SPACING),
                        (index + 1) * (FULL_SIZE + SPACING),
                    ];

                    const scale = scrollX.interpolate({
                        inputRange,
                        outputRange: [SCALE_DOWN, 1, SCALE_DOWN],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            style={{
                                width: FULL_SIZE,
                                marginRight: index < data.length - 1 ? SPACING : 0,
                                transform: [{ scale }],
                            }}
                        >
                            <View style={styles.imageContainer}>
                                <Image
                                    source={item.image}
                                    style={styles.image}
                                    resizeMode="cover"
                                    config
                                />
                                <Svg
                                    height="100%"
                                    width="100%"
                                    style={styles.svg}
                                >
                                    <Defs>
                                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0.5" stopColor="transparent" stopOpacity="0" />
                                            <Stop offset="1" stopColor="black" stopOpacity="0.78" />
                                        </LinearGradient>
                                    </Defs>
                                    <Rect
                                        x="0"
                                        y="0"
                                        width="100%"
                                        height="100%"
                                        fill="url(#grad)"
                                    />
                                </Svg>
                                <DefaultText style={styles.caption}>
                                    {renderHighlightedText(item.caption)}
                                </DefaultText>
                            </View>
                        </Animated.View>
                    );
                }}
            />

            {/* Dot Indicators */}
            {/* <View style={styles.dotsContainer}>
                {data.map((_, i) => {
                    const dotScale = scrollX.interpolate({
                        inputRange: [
                            (i - 1) * (FULL_SIZE + SPACING),
                            i * (FULL_SIZE + SPACING),
                            (i + 1) * (FULL_SIZE + SPACING),
                        ],
                        outputRange: [1, 1.4, 1],
                        extrapolate: 'clamp',
                    });

                    const dotOpacity = scrollX.interpolate({
                        inputRange: [
                            (i - 1) * (FULL_SIZE + SPACING),
                            i * (FULL_SIZE + SPACING),
                            (i + 1) * (FULL_SIZE + SPACING),
                        ],
                        outputRange: [0.4, 1, 0.4],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    transform: [{ scale: dotScale }],
                                    opacity: dotOpacity,
                                },
                            ]}
                        />
                    );
                })}
            </View> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        position:'relative',
        justifyContent: 'flex-start',
        backgroundColor: '#eee',
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    svg: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        flex:1
    },
    caption: {
        position:'absolute',
        bottom:8,
        left:16,
        color: '#fff',
        textAlign: 'left',
        paddingVertical: 8,
        fontSize: DefaultStyles.text.caption.small,
        fontWeight:'500',
        width:'90%',
        lineHeight:28,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 5,
        backgroundColor: colors.text.darker,
        marginHorizontal: 6,
    },
});