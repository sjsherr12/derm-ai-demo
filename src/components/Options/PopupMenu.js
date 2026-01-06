import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, View, Modal, Animated, TouchableWithoutFeedback, Dimensions } from 'react-native';
import DefaultText from 'components/Text/DefaultText';
import { FontAwesome6 } from '@expo/vector-icons';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import * as Haptics from 'expo-haptics';

const PopupMenu = ({
    selectedIndex,
    options = [],
    onSelect, 
    placeholder = "Select an option",
    style = {},
    hapticType = Haptics.ImpactFeedbackStyle.Soft
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const triggerRef = useRef(null);
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const rotationAnim = useRef(new Animated.Value(0)).current;

    const selectedOption = selectedIndex !== null && selectedIndex !== undefined ? options[selectedIndex] : null;

    const measureTrigger = () => {
        if (triggerRef.current) {
            triggerRef.current.measureInWindow((x, y, width, height) => {
                setTriggerLayout({ x, y, width, height });
            });
        }
    };

    const openModal = () => {
        // Trigger haptic feedback
        if (hapticType) {
            Haptics.impactAsync(hapticType);
        }

        // Measure first, then open modal after a small delay to ensure layout is complete
        measureTrigger();
        setTimeout(() => {
            setIsOpen(true);
            
            // Animate opening - simple fade only
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(rotationAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 10);
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(rotationAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsOpen(false);
        });
    };

    const handleOptionSelect = (index) => {
        if (hapticType) {
            Haptics.impactAsync(hapticType);
        }
        
        // Close modal first with animation, then call onSelect after animation completes
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(rotationAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsOpen(false);
            // Call onSelect after the modal is closed to avoid useInsertionEffect error
            setTimeout(() => {
                onSelect(index);
            }, 0);
        });
    };

    const chevronRotation = rotationAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg'],
    });

    const renderOption = (option, index) => {
        const isSelected = selectedIndex === index;
        const isLast = index === options.length - 1;

        return (
            <View key={index}>
                <Pressable
                    style={styles.optionContainer}
                    onPress={() => handleOptionSelect(index)}
                    android_ripple={{ color: colors.background.light }}
                >
                    <DefaultText style={styles.optionText}>
                        {option?.title || option}
                    </DefaultText>
                    {isSelected && (
                        <FontAwesome6 
                            name="check" 
                            size={16} 
                            color={colors.background.primary} 
                        />
                    )}
                </Pressable>
                {!isLast && <View style={DefaultStyles.separator} />}
            </View>
        );
    };

    const dropdownStyle = {
        position: 'absolute',
        left: triggerLayout.x,
        top: triggerLayout.y + triggerLayout.height + 66,
        width: 240,
        maxHeight: 200,
    };

    return (
        <>
            <Pressable
                ref={triggerRef}
                style={[styles.trigger, style.trigger]}
                onPress={isOpen ? closeModal : openModal}
                onLayout={() => {
                    // Ensure we have the layout when needed
                    if (isOpen) {
                        measureTrigger();
                    }
                }}
            >
                <DefaultText style={[styles.triggerText, style.triggerText]}>
                    {selectedOption?.title || selectedOption || placeholder}
                </DefaultText>
                <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                    <FontAwesome6 name="chevron-right" size={16} color={colors.text.secondary} />
                </Animated.View>
            </Pressable>

            <Modal
                visible={isOpen}
                transparent
                animationType="none"
                onRequestClose={closeModal}
            >
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <Animated.View
                                style={[
                                    styles.dropdown,
                                    dropdownStyle,
                                    {
                                        opacity: fadeAnim,
                                    },
                                ]}
                            >
                                {options.map((option, index) => renderOption(option, index))}
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.accents.stroke,
        backgroundColor: colors.background.light,
        minHeight: 44,
    },
    triggerText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        fontWeight: '500',
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    dropdown: {
        backgroundColor: colors.background.screen,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
        paddingVertical:4,
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.secondary,
        fontWeight: '500',
        flex: 1,
    },
});

export default PopupMenu;