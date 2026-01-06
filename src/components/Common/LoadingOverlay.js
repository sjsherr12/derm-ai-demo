import React from 'react';
import { View, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import colors from '../../config/colors';

export default function LoadingOverlay({ visible = false }) {
    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
        >
            <View style={styles.overlay}>
                <View style={styles.indicatorWrapper}>
                    <ActivityIndicator size="large" />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.25)', // dim background
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorWrapper: {
        padding: 24,
        borderRadius: 12,
        backgroundColor: colors.background.screen
    }
});
