import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import useScalePressAnimation from "hooks/useScalePressAnimation";
import { convertSkinConcernSeverityIdToName } from "utils/analysis";
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';

const { View, StyleSheet, Image, Pressable, ScrollView, Animated } = require("react-native");

const Option = memo(({
    option,
    setState,
    imagePadding = 0
}) => {
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.95,
        maxScale:1,
        duration:100,
    });

    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
        setState(option.value)
    }, [setState, option.value])

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.groupItem,
                    {transform:[{scale}]}
                ]}
            >
                {option?.icon ? (
                    <View style={[styles.imageContainer, styles.iconContainer, { padding: imagePadding }]}>
                        <Ionicons
                            name={option.icon}
                            size={54}
                            color={colors.background.primary}
                        />
                    </View>
                ) : (
                    <Image
                        source={option?.image}
                        style={[styles.imageContainer, { padding: imagePadding }]}
                        resizeMode='cover'
                    />
                )}
                <DefaultText
                    style={styles.caption}
                >
                    {option.name}
                </DefaultText>
            </Animated.View>
        </Pressable>
    )
});

const ExploreScreenSearchByGroupedItems = memo(({
    title,
    options,
    filterType,
    setAppliedFilters,
    imagePadding = 0
}) => {

    const addFilter = useCallback((value) => {
        setAppliedFilters(prev => ({
            ...prev,
            [filterType]: [...prev[filterType], value]
        }));
    }, [setAppliedFilters, filterType]);

    return (
        <View
            style={styles.groupedItemsContainer}
        >
            <DefaultText
                style={styles.title}
            >
                {title}
            </DefaultText>

            <ScrollView
                contentContainerStyle={{
                    gap:16,
                    paddingHorizontal:DefaultStyles.container.paddingHorizontal,
                }}
                style={{
                    marginHorizontal:-DefaultStyles.container.paddingHorizontal,
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
            >
                {options.map((option, idx) => (
                    <Option
                        key={idx}
                        option={option}
                        setState={addFilter}
                        imagePadding={imagePadding}
                    />
                ))}
            </ScrollView>
        </View>
    )
});

export default ExploreScreenSearchByGroupedItems;

const styles = StyleSheet.create({
    groupedItemsContainer: {
        gap:16,
        borderTopWidth:1.5,
        borderBottomWidth:1.5,
        borderColor:colors.accents.stroke,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        paddingVertical:DefaultStyles.container.paddingBottom,
        backgroundColor:'#fafafa'
    },
    imageContainer: {
        width:112,
        height:112,
        borderRadius:12,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        backgroundColor:colors.background.screen,
        overflow: 'hidden',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'500',
        color:colors.text.secondary,
        marginLeft:2
    },
    groupItem: {
        gap:12,
    }
})