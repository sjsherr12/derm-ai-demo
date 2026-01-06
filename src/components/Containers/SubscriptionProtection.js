import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from 'context/global/AuthContext';
import DefaultText from 'components/Text/DefaultText';
import DefaultButton from 'components/Buttons/DefaultButton';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';

const SubscriptionProtection = ({ 
    children, 
    fallbackMessage = "This feature requires Derm AI Pro.",
    showUpgrade = true,
    onUpgradePress,
    style 
}) => {
    const { hasProAccess, subscriptionLoading, user } = useAuth();

    if (subscriptionLoading) {
        return (
            <View style={[styles.container, style]}>
                <DefaultText style={styles.loadingText}>
                    Checking subscription...
                </DefaultText>
            </View>
        );
    }

    if (!user || !hasProAccess) {
        return (
            <View style={[styles.container, style]}>
                <View style={styles.fallbackContainer}>
                    <DefaultText style={styles.fallbackText}>
                        {fallbackMessage}
                    </DefaultText>
                    {showUpgrade && onUpgradePress && (
                        <DefaultButton
                            title="Upgrade to Pro"
                            isActive
                            onPress={onUpgradePress}
                            style={styles.upgradeButton}
                        />
                    )}
                </View>
            </View>
        );
    }

    return children;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DefaultStyles.container.paddingHorizontal,
    },
    fallbackContainer: {
        alignItems: 'center',
        gap: 20,
    },
    fallbackText: {
        fontSize: 16,
        textAlign: 'center',
        color: colors.text.darker,
        lineHeight: 22,
    },
    loadingText: {
        fontSize: 16,
        color: colors.text.darker,
    },
    upgradeButton: {
        borderRadius: 64,
        paddingHorizontal: 32,
    },
});

export default SubscriptionProtection;