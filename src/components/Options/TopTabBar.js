import colors from "config/colors";
import DefaultStyles from "config/styles";
import { merge } from "lodash";
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text } from "react-native";
import DefaultText from "components/Text/DefaultText";
const { View, StyleSheet } = require("react-native")

const TopTabBar = ({
    tabs,
    activeTab,
    onChange,
    style,
    colorFill,
    hapticType,
    buttonHeight=50
}) => {
    const containerRef = useRef(null);
    const tabRefs = useRef([]);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const textColorAnims = useRef(tabs.map((_, idx) => new Animated.Value(activeTab === idx ? 1 : 0))).current;
    const [tabPositions, setTabPositions] = useState([]);
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (tabPositions.length === tabs.length && tabPositions[activeTab]) {
            const { x, width } = tabPositions[activeTab];
            const padding = 2;

            // On initial layout, set position immediately without animation
            if (!hasInitialized.current) {
                slideAnim.setValue(x - padding);
                hasInitialized.current = true;
            } else {
                // Animate slide position (subtract padding since onLayout gives position relative to parent's content area)
                Animated.spring(slideAnim, {
                    toValue: x - padding,
                    useNativeDriver: true,
                    tension: 250,
                    friction: 25,
                }).start();
            }
        }

        // Animate text colors
        tabs.forEach((_, idx) => {
            Animated.timing(textColorAnims[idx], {
                toValue: activeTab === idx ? 1 : 0,
                duration: 250,
                useNativeDriver: false,
            }).start();
        });
    }, [activeTab, tabPositions]);

    // Reset initialization flag when tabPositions becomes empty (component remounted)
    useEffect(() => {
        if (tabPositions.length === 0) {
            hasInitialized.current = false;
        }
    }, [tabPositions]);

    const handleTabLayout = (idx, event) => {
        const { x, width } = event.nativeEvent.layout;
        setTabPositions(prev => {
            const newPositions = [...prev];
            newPositions[idx] = { x, width };
            return newPositions;
        });
    };

    const mergedStyles = merge({}, styles, style);
    const activeTabWidth = tabPositions[activeTab]?.width || 0;

    return (
        <View
            ref={containerRef}
            style={{
                ...mergedStyles.container,
                borderWidth:1.5,
                borderColor:colorFill?colorFill:colors.accents.stroke,
                backgroundColor:colorFill?colorFill:colors.background.screen,
                borderRadius:16,
                ...style,
            }}
        >
            {/* Sliding background indicator */}
            {activeTabWidth > 0 && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        left: 0,
                        width: activeTabWidth,
                        height: buttonHeight,
                        backgroundColor: colors.background.primary,
                        borderRadius: 12,
                        zIndex: 1,
                        transform: [
                            { translateX: slideAnim }
                        ],
                    }}
                />
            )}

            {/* Tab buttons */}
            {tabs.map((tab, idx) => {
                const textColor = textColorAnims[idx].interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.text.secondary, colors.text.primary],
                });

                return (
                    <View
                        key={idx}
                        style={{flex:1}}
                        onLayout={(e) => handleTabLayout(idx, e)}
                    >
                        {/* Background layer */}
                        <View
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: buttonHeight,
                                backgroundColor: colors.background.light,
                                borderRadius: 12,
                                zIndex: 0,
                            }}
                        />

                        {/* Pressable with text on top */}
                        <Pressable
                            onPress={() => {
                                onChange(idx);
                                if (hapticType) {
                                    Haptics.impactAsync(hapticType)
                                }
                            }}
                            style={{
                                height: buttonHeight,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 12,
                                zIndex: 2,
                            }}
                        >
                            <Animated.Text
                                allowFontScaling={false}
                                style={{
                                    color: textColor,
                                    fontSize: DefaultStyles.text.caption.small,
                                    fontWeight: '500',
                                }}
                            >
                                {tab}
                            </Animated.Text>
                        </Pressable>
                    </View>
                );
            })}
        </View>
    )
}

export default TopTabBar;

const styles = StyleSheet.create({
    container: {
        padding:4,
        gap:4,
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
        borderColor:colors.accents.stroke,
    },
    button: {
        borderRadius:12,
        height:50,
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
    }
})