import React from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import DefaultText from 'components/Text/DefaultText';
import Entypo from '@expo/vector-icons/Entypo';
import colors from 'config/colors';
import DefaultStyles from 'config/styles';
import useScalePressAnimation from '../../../../hooks/useScalePressAnimation';

const ProductBrandShortcut = ({ selectedBrands, onPress }) => {
    const hasSelectedBrands = selectedBrands && selectedBrands.length > 0;
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:150,
    })
    
    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
        >
            <Animated.View
                style={[
                    styles.container, 
                    hasSelectedBrands && styles.containerWithBrands,
                    {transform:[{scale}]}
                ]}
            >
                <View style={styles.content}>
                    <DefaultText style={styles.title}>
                        Product Brand
                    </DefaultText>
                    <Entypo
                        name="chevron-right"
                        size={22}
                        color="black"
                    />
                </View>
                
                {hasSelectedBrands && (
                    <View style={styles.selectedBrandsContainer}>
                        <DefaultText
                            style={styles.selectedText}
                            numberOfLines={2}
                        >
                            {selectedBrands.join(' • ')}
                        </DefaultText>
                    </View>
                )}
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        paddingHorizontal:DefaultStyles.container.paddingBottom,
        paddingVertical:22
    },
    containerWithBrands: {
        gap: 16,
    },
    content: {
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
    },
    selectedBrandsContainer: {
        flex: 1,
        gap: 8,
    },
    title: {
        fontSize: DefaultStyles.text.caption.large,
        fontWeight: '700',
        color: colors.text.secondary,
    },
    selectedText: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '500',
        color: colors.background.primary,
        flexWrap: 'wrap',
    },

});

export default ProductBrandShortcut;