import DefaultText from "components/Text/DefaultText";
import colors from "config/colors";
import DefaultStyles from "config/styles";
import { CommonAllergens } from "constants/signup";
import { SkinTypes } from "constants/signup";
import { SkinConcerns } from "constants/signup";
import React from "react";
import { StyleSheet, View } from "react-native";
import {Ionicons, FontAwesome6} from '@expo/vector-icons'

const matches = [
    {
        title:'It’s a match!',
        color:colors.background.primary,
        icon:'check'
    },
    {
        title:'Decent Match!',
        color:colors.accents.warning,
        icon:'circle-minus'
    },
    {
        title:'Not a match!',
        color:colors.accents.error,
        icon:'xmark'
    }
]

const ProductScreenSkinMatchTab = ({
    product,
    userData,
    match,
    overlappingSkinConcerns,
    overlappingSkinTypes,
    conflictingSensitivities
}) => {

    const overlappingSkinConcernsMatch = overlappingSkinConcerns && !(overlappingSkinConcerns?.length) ? match === 1 ? 1 : 2 : 0;
    const overlappingSkinTypesMatch = overlappingSkinTypes && !(overlappingSkinTypes?.length) ? match === 1 ? 1 : 2 : 0;
    const conflictingSensitivitiesMatch = conflictingSensitivities?.length ? 2 : 0;

    // Check if user only has "None" selected for sensitivities
    const hasOnlyNoneSensitivity = userData?.profile?.skinInfo?.sensitivities?.length === 1 &&
                                    userData?.profile?.skinInfo?.sensitivities[0] === 0;

    const analyzedItems = [
        {
            title:'Skin Concerns',
            match: overlappingSkinConcernsMatch,
            matches: !!(overlappingSkinConcernsMatch) ? product?.skinConcerns : overlappingSkinConcerns,
            values: SkinConcerns,
        },
        {
            title:'Skin Types',
            match:overlappingSkinTypesMatch,
            matches: !!(overlappingSkinTypesMatch) ? product?.skinTypes : overlappingSkinTypes,
            values: SkinTypes,
        },
        {
            title:'Sensitivities',
            match:conflictingSensitivitiesMatch,
            matches: !!(conflictingSensitivitiesMatch) ? conflictingSensitivities : userData?.profile?.skinInfo?.sensitivities,
            values: CommonAllergens.map(allergen => ({
                ...allergen,
                title: `${!!(conflictingSensitivitiesMatch) ? 'Contains' : 'No'} ${allergen.title}`,
                description: `This product contains${!!(conflictingSensitivitiesMatch) ? '' : ' no'} ${allergen.title.toLowerCase()}, which you’re sensitive to.`
            })),
        }
    ]

    return (
        <React.Fragment>
            <View
                style={styles.itemContainer}
            >
                <DefaultText
                    style={styles.text}
                >
                    We checked the compatibility of <DefaultText style={{fontWeight: 'bold'}}>{product?.brand || 'this brand’s'}</DefaultText> <DefaultText style={{fontWeight: 'bold'}}>{product?.name || 'product'}</DefaultText> with your skin profile. Here's your personalized breakdown:
                </DefaultText>
            </View>

            {analyzedItems.map((item, idx) => {
                const matchInfo = matches[item.match];
                const prefix = !!item.match ? 'Different' : 'Matched'

                // Skip sensitivities section if user only has "None" selected
                if (item.title === 'Sensitivities' && hasOnlyNoneSensitivity) {
                    return null;
                }

                if (item.matches) {
                    return (
                        <View
                            key={idx}
                            style={[
                                styles.matchContainer,
                                {
                                    borderColor:matchInfo.color,
                                }
                            ]}
                        >
                            <DefaultText
                                style={styles.title}
                            >
                                {prefix} {item.title}
                            </DefaultText>

                            {item.matches.map((match, idx) => {
                                const itemMatchInfo = item.values.find(v => v.value === match);

                                return (
                                    <React.Fragment
                                        key={idx}
                                    >
                                        <View
                                            style={styles.flexContainer}
                                        >
                                            <View
                                                style={[
                                                    styles.icon,
                                                    {
                                                        backgroundColor: matchInfo.color
                                                    }
                                                ]}
                                            >
                                                <FontAwesome6
                                                    name={matchInfo.icon}
                                                    size={20}
                                                    color={colors.text.primary}
                                                />
                                            </View>

                                            <View
                                                style={{
                                                    flex:1,
                                                    gap:4,
                                                }}
                                            >
                                                <DefaultText
                                                    style={styles.caption}
                                                >
                                                    {itemMatchInfo.title}
                                                </DefaultText>
                                                <DefaultText
                                                    style={styles.description}
                                                >
                                                    {itemMatchInfo.description}
                                                </DefaultText>
                                            </View>
                                        </View>

                                        {(item.matches.length > idx+1) &&
                                            <View
                                                style={DefaultStyles.separator}
                                            />
                                        }
                                    </React.Fragment>
                                )
                            })}
                        </View>
                    )
                }
            })}
        </React.Fragment>
    )
}

export default ProductScreenSkinMatchTab;

const styles = StyleSheet.create({
    itemContainer: {
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        borderRadius:16,
        padding:DefaultStyles.container.paddingBottom,
    },
    flexContainer: {
        flex:1,
        flexDirection:'row',
        alignItems:'center',
        gap:16,
    },
    matchContainer: {
        borderWidth:2.5,
        borderRadius:16,
        gap:16,
        padding:DefaultStyles.container.paddingBottom
    },
    title: {
        fontSize:DefaultStyles.text.caption.large,
        fontWeight:'800',
        color:colors.text.secondary,
    },
    caption: {
        alignSelf:'flex-start',
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'600',
        color:colors.text.secondary
    },
    text: {
        alignSelf:'flex-start',
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.secondary
    },
    description: {
        alignSelf:'flex-start',
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter
    },
    icon: {
        justifyContent:'center',
        alignItems:'center',
        width:40,
        height:40,
        borderRadius:64,
    }
})