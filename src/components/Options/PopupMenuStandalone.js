import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Modal, Dimensions, Animated } from 'react-native';
import { PanGestureHandler as RNGHPanGestureHandler, GestureHandlerRootView as RNGHGestureHandlerRootView } from 'react-native-gesture-handler';
import DefaultText from 'components/Text/DefaultText';
import { Ionicons } from '@expo/vector-icons';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PopupMenuStandalone = ({
    visible = false,
    onClose,
    options = [],
    anchorPosition,
    style = {},
    hapticType = Haptics.ImpactFeedbackStyle.Soft
}) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [pressedIndex, setPressedIndex] = useState(null);
    const [menuItemLayouts, setMenuItemLayouts] = useState([]);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const lastHoveredRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            if (anchorPosition) {
                calculateMenuPosition();
            }
            
            // Reset values first
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
            backdropAnim.setValue(0);
            
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 250,
                    friction: 25,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 200,
                    friction: 10,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const calculateMenuPosition = () => {
        if (!anchorPosition) return;

        const menuWidth = 200;
        const menuHeight = options.length * 44;
        const padding = 16;

        let left = anchorPosition.x;
        let top = anchorPosition.y + anchorPosition.height + 4;

        if (left + menuWidth > screenWidth - padding) {
            left = screenWidth - menuWidth - padding;
        }
        
        if (left < padding) {
            left = padding;
        }

        if (top + menuHeight > screenHeight - padding) {
            top = anchorPosition.y - menuHeight - 4;
            if (top < padding) {
                top = anchorPosition.y + anchorPosition.height + 4;
            }
        }

        setMenuPosition({ top, left });
    };

    const handleSelect = async (option, index) => {
        if (hapticType) {
            Haptics.impactAsync(hapticType);
        }
        
        const isObject = typeof option === 'object';
        if (isObject && option.onPress) {
            await option.onPress();
        }
        
        onClose?.();
        setHoveredIndex(null);
        lastHoveredRef.current = null;
    };

    const handlePanGesture = (event) => {
        const { y } = event.nativeEvent;
        
        let newHoveredIndex = null;
        for (let i = 0; i < menuItemLayouts.length; i++) {
            const layout = menuItemLayouts[i];
            if (layout && y >= layout.y && y <= layout.y + layout.height) {
                newHoveredIndex = i;
                break;
            }
        }
        
        if (newHoveredIndex !== hoveredIndex) {
            setHoveredIndex(newHoveredIndex);
            
            if (newHoveredIndex !== null && lastHoveredRef.current !== null && hapticType) {
                Haptics.impactAsync(hapticType);
            }
            lastHoveredRef.current = newHoveredIndex;
        }
    };

    const handlePanEnd = (event) => {
        if (hoveredIndex !== null) {
            handleSelect(options[hoveredIndex], hoveredIndex);
        }
        setHoveredIndex(null);
        lastHoveredRef.current = null;
    };

    const handleMenuItemLayout = (index, layout) => {
        setMenuItemLayouts(prev => {
            const newLayouts = [...prev];
            newLayouts[index] = layout;
            return newLayouts;
        });
    };

    const renderMenuOption = (option, index) => {
        const isObject = typeof option === 'object';
        const optionText = isObject ? option.name : option;
        const optionIcon = isObject ? option.icon : null;

        return (
            <Pressable
                key={index}
                style={[
                    styles.menuItem,
                    (index !== options?.length - 1 &&
                        {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.accents.stroke,
                        }
                    ),
                    hoveredIndex === index && styles.menuItemHovered,
                    pressedIndex === index && styles.menuItemPressed,
                    style.menuItem
                ]}
                onPress={() => handleSelect(option, index)}
                onPressIn={() => setPressedIndex(index)}
                onPressOut={() => setPressedIndex(null)}
                onLayout={(event) => {
                    const { x, y, width, height } = event.nativeEvent.layout;
                    handleMenuItemLayout(index, { x, y, width, height });
                }}
            >
                <DefaultText
                    style={[
                        styles.menuItemText,
                        hoveredIndex === index && styles.menuItemTextHovered,
                        pressedIndex === index && styles.menuItemTextPressed,
                        style.menuItemText
                    ]}
                >
                    {optionText}
                </DefaultText>
                
                <View style={styles.rightSection}>
                    {optionIcon && (
                        <Ionicons
                            name={optionIcon}
                            size={16}
                            color={
                                hoveredIndex === index || pressedIndex === index
                                    ? colors.background.primary
                                    : colors.text.secondary
                            }
                            style={styles.optionIcon}
                        />
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <RNGHGestureHandlerRootView style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.overlay,
                        {
                            opacity: backdropAnim,
                        },
                    ]}
                >
                    <Pressable
                        style={styles.overlay}
                        onPress={onClose}
                    >
                    <RNGHPanGestureHandler
                        onGestureEvent={handlePanGesture}
                        onHandlerStateChange={(event) => {
                            if (event.nativeEvent.state === 5) {
                                handlePanEnd(event);
                            }
                        }}
                    >
                        <Animated.View
                            style={[
                                styles.menu,
                                {
                                    top: menuPosition.top,
                                    left: menuPosition.left,
                                    opacity: opacityAnim,
                                    transform: [
                                        {
                                            scale: scaleAnim,
                                        },
                                    ],
                                },
                                style.menu
                            ]}
                        >
                            {options.map((option, index) => renderMenuOption(option, index))}
                        </Animated.View>
                    </RNGHPanGestureHandler>
                    </Pressable>
                </Animated.View>
            </RNGHGestureHandlerRootView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)'
    },
    menu: {
        overflow: 'hidden',
        position: 'absolute',
        backgroundColor: colors.background.screen,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.accents.stroke,
        minWidth: 200,
        maxWidth: screenWidth - 32,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingLeft: 16,
        paddingRight:8,
    },
    menuItemHovered: {
        backgroundColor: colors.background.light,
        opacity: 0.8,
    },
    menuItemPressed: {
        backgroundColor: colors.background.light,
        opacity: 0.6,
    },
    menuItemText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        fontWeight: '500',
        flex: 1,
    },
    menuItemTextHovered: {
        color: colors.background.primary,
        fontWeight: '600',
    },
    menuItemTextPressed: {
        color: colors.background.primary,
        fontWeight: '600',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        marginRight: 8,
    },
});

export default PopupMenuStandalone;