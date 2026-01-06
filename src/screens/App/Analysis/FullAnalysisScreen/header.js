import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DefaultText from 'components/Text/DefaultText';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import { BlurView } from 'expo-blur';
import useScalePressAnimation from 'hooks/useScalePressAnimation';
import DefaultTabHeader from 'components/Containers/DefaultTabHeader';
import IconButton from 'components/Buttons/IconButton';
import BlurredIconButton from 'components/Buttons/BlurredIconButton';
import { MenuView } from '@react-native-menu/menu';

const imageNames = [
    'Front View',
    'Left View',
    'Right View',
]

const FullAnalysisScreenHeader = ({
    currentImageIndex,
    setCurrentImageIndex,
    scrollOffset
}) => {
    const route = useRoute();
    const navigation = useNavigation();
    const { diagnosisId } = route.params || {};
    const insets = useSafeAreaInsets();
    
    // Animated values
    const backgroundOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const buttonTransition = useRef(new Animated.Value(0)).current;
    const blurOpacity = useRef(new Animated.Value(1)).current;
    
    // Calculate progress values
    const headerProgress = useMemo(() => {
        if (scrollOffset < 300) return 0;
        if (scrollOffset > 450) return 1;
        return (scrollOffset - 300) / (450 - 300);
    }, [scrollOffset]);
    
    const buttonProgress = useMemo(() => {
        if (scrollOffset < 325) return 0;
        if (scrollOffset > 425) return 1;
        return (scrollOffset - 325) / (425 - 325);
    }, [scrollOffset]);
    
    const textProgress = useMemo(() => {
        return scrollOffset >= 450 ? 1 : 0;
    }, [scrollOffset]);
    
    const blurProgress = useMemo(() => {
        // Inverse of textProgress - blur is visible when text isn't
        return scrollOffset < 450 ? 1 : 0;
    }, [scrollOffset]);
    
    // Animate values based on scroll
    useEffect(() => {
        Animated.timing(backgroundOpacity, {
            toValue: headerProgress,
            duration: 0,
            useNativeDriver: false,
        }).start();
    }, [headerProgress]);
    
    useEffect(() => {
        Animated.timing(buttonTransition, {
            toValue: buttonProgress,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, [buttonProgress]);
    
    useEffect(() => {
        Animated.timing(textOpacity, {
            toValue: textProgress,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [textProgress]);
    
    useEffect(() => {
        Animated.timing(blurOpacity, {
            toValue: blurProgress,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [blurProgress]);

    return (
        <Animated.View
            style={{
                paddingTop: insets.top,
                backgroundColor: backgroundOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']
                }),
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex:1,
            }}
        >
            <View style={[
                styles.headerContent,
                {
                    borderBottomWidth:scrollOffset > 450 ? 1.5 : 0,
                    borderBottomColor:colors.accents.stroke,
                }
            ]}>
                <View style={styles.iconButton}>
                    <Animated.View 
                        style={{
                            opacity: buttonTransition.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0]
                            }),
                            position: 'absolute'
                        }}
                    >
                        <BlurredIconButton
                            style={DefaultStyles.button.icon}
                            icon='arrow-back'
                            tint='light'
                            intensity={50}
                            color={colors.text.primary}
                            onPress={() => navigation.goBack()}
                        />
                    </Animated.View>
                    
                    <Animated.View 
                        style={{
                            opacity: buttonTransition.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1]
                            })
                        }}
                    >
                        <IconButton
                            style={DefaultStyles.button.icon}
                            icon='arrow-back'
                            color={colors.text.secondary}
                            onPress={() => navigation.goBack()}
                        />
                    </Animated.View>
                </View>
                
                <View 
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        flexDirection:'row',
                        justifyContent:'center',
                    }}
                >
                    <Animated.View 
                        style={{
                            opacity: blurOpacity,
                            position:'absolute'
                        }}
                    >
                        <MenuView
                            actions={imageNames.map((name, idx) => ({
                                id: name,
                                title: name,
                                image: 'photo',
                                imageColor:colors.text.secondary
                            }))}
                            onPressAction={({ nativeEvent }) => {
                                setCurrentImageIndex(imageNames.indexOf(nativeEvent.event))
                            }}
                        >
                            <BlurView 
                                intensity={60} 
                                tint="light" 
                                style={styles.centerBlurView}
                            >
                                <DefaultText
                                    numberOfLines={1}
                                    style={[
                                        DefaultStyles.text.title.header,
                                        {
                                            color: colors.text.primary
                                        }
                                    ]}
                                >
                                    {imageNames[currentImageIndex]}
                                </DefaultText>

                                <Ionicons
                                    name='chevron-down'
                                    color={colors.text.primary}
                                    size={18}
                                />
                            </BlurView>
                        </MenuView>
                    </Animated.View>

                    <Animated.View 
                        style={{
                            opacity: textOpacity,
                        }}
                    >
                        <DefaultText
                            numberOfLines={1}
                            style={DefaultStyles.text.title.header}
                        >
                            Facial Analysis
                        </DefaultText>
                    </Animated.View>
                </View>
                
                <View style={styles.iconButton}>
                    <Animated.View 
                        style={{
                            opacity: buttonTransition.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0]
                            }),
                            position: 'absolute'
                        }}
                    >
                        <BlurredIconButton
                            style={DefaultStyles.button.icon}
                            icon='share-outline'
                            tint='light'
                            intensity={50}
                            color={colors.text.primary}
                            onPress={() => navigation.navigate('ShareAnalysis', {
                                diagnosisId
                            })}
                        />
                    </Animated.View>
                    
                    <Animated.View 
                        style={{
                            opacity: buttonTransition.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1]
                            })
                        }}
                    >
                        <IconButton
                            style={DefaultStyles.button.icon}
                            icon='share-outline'
                            color={colors.text.secondary}
                            onPress={() => navigation.navigate('ShareAnalysis', {
                                diagnosisId
                            })}
                        />
                    </Animated.View>
                </View>
{/*                 
                <View style={styles.rightSpacer} /> */}
            </View>
        </Animated.View>
    );
};
export default FullAnalysisScreenHeader;

const styles = StyleSheet.create({
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: DefaultStyles.container.paddingHorizontal,
        paddingHorizontal:16,
    },
    iconButton: {
        width:48,
        height:48,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    rightSpacer: {
        width: 48,
    },
    centerBlurView: {
        gap:8,
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: 64,
        overflow:'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection:'row',
    }
});