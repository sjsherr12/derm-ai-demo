import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

const ConditionalScrollView = ({
    style,
    contentContainerStyle,
    showsVerticalScrollIndicator,
    children 
}) => {
    const [scrollEnabled, setScrollEnabled] = useState(false);
    const containerHeight = useRef(0);
    const contentHeight = useRef(0);

    const onLayoutContainer = (event) => {
        containerHeight.current = event.nativeEvent.layout.height;
        updateScrollState();
    };

    const onContentSizeChange = (width, height) => {
        contentHeight.current = height;
        updateScrollState();
    };

    const updateScrollState = () => {
        const shouldScroll = contentHeight.current > containerHeight.current;
        setScrollEnabled(shouldScroll);
    };

    return (
        <View onLayout={onLayoutContainer} style={{ flex: 1, }}>
            <ScrollView
                style={style}
                scrollEnabled={scrollEnabled}
                onContentSizeChange={onContentSizeChange}
                showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                contentContainerStyle={contentContainerStyle}
            >
                {children}
            </ScrollView>
        </View>
    );
};

export default ConditionalScrollView;
