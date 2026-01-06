import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DefaultText from 'components/Text/DefaultText';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';

const EmptyRoutineGraphic = ({ 
    isMorningRoutine = true, 
    size = 'large',
    showText = true 
}) => {
    const isLarge = size === 'large';
    const iconSize = isLarge ? 80 : 60;
    const containerSize = isLarge ? 160 : 120;

    return (
        <View style={styles.container}>
            <View style={[
                styles.graphicContainer, 
                { 
                    width: containerSize, 
                    height: containerSize 
                }
            ]}>
                <View style={styles.iconBackground}>
                    <Ionicons
                        name={isMorningRoutine ? 'sunny-outline' : 'moon-outline'}
                        size={iconSize}
                        color={colors.text.lighter}
                        style={isMorningRoutine ? styles.sunIcon : styles.moonIcon}
                    />
                </View>
            </View>

            {showText && (
                <View style={styles.textContainer}>
                    <DefaultText style={styles.title}>
                        Empty Routine
                    </DefaultText>
                    <DefaultText style={styles.subtitle}>
                        Start building your {isMorningRoutine ? 'morning' : 'evening'} skincare routine by adding products
                    </DefaultText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 6,
        paddingBottom: 10,
    },
    graphicContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 18,
    },
    iconBackground: {
        width: '100%',
        height: '100%',
        borderRadius: 80,
        backgroundColor: colors.background.screen,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.text.lighter,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.6,
    },
    sunIcon: {
        transform: [{ rotate: '0deg' }],
    },
    moonIcon: {
        transform: [{ rotate: '-15deg' }],
    },
    textContainer: {
        alignItems: 'center',
        maxWidth: 280,
    },
    title: {
        fontSize: DefaultStyles.text.title.xsmall,
        fontWeight: '600',
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.lighter,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default EmptyRoutineGraphic;