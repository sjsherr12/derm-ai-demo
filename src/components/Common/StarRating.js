import React, { useRef, useEffect } from 'react';
import { View, Pressable, PanResponder } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors from 'config/colors';

const StarRating = ({
    rating,
    max = 5,
    size = 20,
    color = colors.accents.warning,
    onChange,
    style,
}) => {
    const containerRef = useRef(null);
    const layoutRef = useRef({ x: 0, width: 0 });
    const lastSelectedRef = useRef(rating);

    // measure layout once mounted
    useEffect(() => {
        if (containerRef.current) {
            const timeoutId = setTimeout(() => {
                containerRef.current?.measure((x, y, width, height, pageX) => {
                    layoutRef.current = { x: pageX, width };
                });
            }, 100); // give it time to layout
            
            return () => clearTimeout(timeoutId);
        }
    }, []);

    const triggerChange = (newRating) => {
        if (newRating !== lastSelectedRef.current) {
            lastSelectedRef.current = newRating;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            onChange?.(newRating);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                handleTouch(evt.nativeEvent.pageX);
            },
            onPanResponderMove: (evt) => {
                handleTouch(evt.nativeEvent.pageX);
            },
        })
    ).current;

    const handleTouch = (pageX) => {
        const { x, width } = layoutRef.current;
        if (!onChange || width === 0) return;

        const relativeX = pageX - x;
        const starWidth = width / max;
        let newRating = Math.ceil(relativeX / starWidth);
        newRating = Math.max(1, Math.min(max, newRating));
        triggerChange(newRating);
    };

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.25 && rating % 1 <= 0.75;
    const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0);

    const stars = [];

    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <FontAwesome key={`full-${i}`} name="star" size={size} color={color} />
        );
    }

    if (hasHalfStar) {
        stars.push(
            <FontAwesome key="half" name="star-half-full" size={size} color={color} />
        );
    }

    for (let i = 0; i < emptyStars; i++) {
        stars.push(
            <FontAwesome key={`empty-${i}`} name="star-o" size={size} color={color} />
        );
    }

    return (
        <View
            ref={containerRef}
            style={[
                style,
                {
                    flexDirection:'row',
                }
            ]}
            {...(onChange ? panResponder.panHandlers : {})}
        >
            {onChange
                ? stars.map((star, index) => (
                      <Pressable key={index} onPress={() => triggerChange(index + 1)}>
                          {star}
                      </Pressable>
                  ))
                : stars}
        </View>
    );
};

export default StarRating;
