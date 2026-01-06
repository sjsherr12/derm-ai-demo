import { useNavigation } from "@react-navigation/native";
import DefaultButton from "components/Buttons/DefaultButton";
import DefaultText from "components/Text/DefaultText";
import { useRedirect } from "context/RedirectContext";
import * as Haptics from 'expo-haptics'
const { default: colors } = require("config/colors");
const { default: DefaultStyles } = require("config/styles");
const { View, StyleSheet } = require("react-native");
import {Ionicons} from '@expo/vector-icons'

const HomeScreenScanShortcut = ({
    scanEligibility,
}) => {
    const navigation = useNavigation();
    
    const getScanDisplayInfo = () => {
        if (!scanEligibility) {
            return {
                canScan: false,
                title: 'Loading scan status...',
                description: 'Checking scan availability...',
                timeMessage: 'Please wait'
            };
        }

        if (scanEligibility.canScan) {
            return {
                canScan: true,
                title: scanEligibility.isFirstScan ? 'Ready for your first scan!' : 'Time to scan!',
                description: scanEligibility.isFirstScan ? 
                    'Take your first photo to get detailed insights about your skin and receive personalized product recommendations.' :
                    'It has been 3 days since your last scan. Scan now for updated skin insights and personalized adjustments to your routine.',
                timeMessage: scanEligibility.message || 'Ready to scan'
            };
        } else {
            const daysText = scanEligibility.daysRemaining === 1 ? 'day' : 'days';
            return {
                canScan: false,
                title: 'Scan cooldown active',
                description: `You can scan again in ${scanEligibility.daysRemaining || 'a few'} ${daysText}. Continue following your routine and check back soon!`,
                timeMessage: scanEligibility.message || 'Check back later'
            };
        }
    };

    const scanInfo = getScanDisplayInfo();
    
    return scanInfo.canScan ? (
        <View
            style={scanAvailableStyles.container}
        >
            <View
                style={scanAvailableStyles.topContainer}
            >
                <DefaultText
                    numberOfLines={1}
                    style={scanAvailableStyles.title}
                >
                    {scanInfo.title}
                </DefaultText>
                <Ionicons
                    name='time-outline'
                    color={colors.text.primary}
                    size={28}
                />
            </View>
            <DefaultText
                style={scanAvailableStyles.caption}
            >
                {scanInfo.description}
            </DefaultText>
            <DefaultButton
                title='Go to scan'
                endAdornment={
                    <Ionicons
                        name='arrow-forward'
                        color={colors.text.secondary}
                        size={24}
                    />
                }
                style={{
                    marginTop:4,
                    borderRadius:64,
                    height:50,
                }}
                extraStyles={{
                    button: {
                        height:50,
                    },
                }}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
                onPress={() => navigation.navigate('FaceScan')}
            />
        </View>
    ) : (
        <View
            style={scanReminderStyles.container}
        >
            <View
                style={scanReminderStyles.contentContainer}
            >
                <DefaultText
                    style={scanReminderStyles.title}
                >
                    {scanInfo.title}
                </DefaultText>

                <DefaultText
                    style={scanReminderStyles.caption}
                >
                    {scanInfo.description}
                </DefaultText>

                <DefaultButton
                    isActive
                    title='Go to analysis'
                    style={{
                        width:'50%',
                        height:40,
                        marginTop:8,
                    }}
                    extraStyles={{
                        button: {
                            height:40,
                            width:'50%',
                        },
                        text: {
                            width:'200%',
                            fontSize:DefaultStyles.text.caption.small,
                        }
                    }}
                    hapticType={Haptics.ImpactFeedbackStyle.Soft}
                    onPress={() => navigation.navigate('Analysis')}
                />
            </View>
        </View>
    )
}

export default HomeScreenScanShortcut;

const scanAvailableStyles = StyleSheet.create({
    container: {
        gap:20,
        borderRadius:16,
        backgroundColor:colors.background.primary,
        padding:DefaultStyles.container.paddingHorizontal,
        boxShadow:'0px 6px 12px rgba(0,0,0,.02)'
    },
    topContainer: {
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between'
    },
    title: {
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.primary,
        fontWeight:'600',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.primary,
    }
})

const scanReminderStyles = StyleSheet.create({
    container: {
        borderRadius:12,
        padding:DefaultStyles.container.paddingBottom,
        borderWidth:1,
        borderColor:colors.accents.stroke,
    },
    contentContainer: {
        gap:12,
    },
    title: {
        color:colors.text.secondary,
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600'
    },
    caption: {
        color:colors.text.lighter,
        fontSize:DefaultStyles.text.caption.xsmall,
    }
})