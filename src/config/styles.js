import { StyleSheet } from "react-native";
import colors from "./colors";

const createSafeAreaStyles = (insets) => ({
    safeAreaTop: {
        paddingTop: insets.top,
    },
    safeAreaBottom: {
        paddingBottom: insets.bottom,
    },
    safeAreaBottomWithTabBar: {
        paddingBottom: insets.bottom + 80, // 90px tab bar height + safe area bottom
    },
    safeAreaHorizontal: {
        paddingLeft: insets.left,
        paddingRight: insets.right,
    },
    safeAreaAll: {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
    },
});

const DefaultStyles = StyleSheet.create({
    outer: {
        flex:1,
        backgroundColor:colors.background.screen,
    },
    safeArea: {
        flex:1,
        backgroundColor:colors.background.screen,
    },
    container: {
        flex:1,
        gap:16,
        paddingHorizontal:24,
        paddingTop:12,
        paddingBottom:16,
        backgroundColor:colors.background.screen,
    },
    tabScrollContainer: {
        padding:16,
        paddingBottom:100,
        gap:16,
    },
    scrollContainer: {
        padding:16,
        paddingBottom:40,
        gap:16,
    },
    separator: {
        flex:1,
        minHeight:1.5,
        maxHeight:1.5,
        backgroundColor:colors.accents.stroke,
        borderRadius:64,
    },
    text: {
        title: {
            large:38,
            medium:34,
            small:30,
            xsmall:26,

            header: {
                color:colors.text.secondary,
                fontSize:16, // caption.small
                fontWeight:'600',
            }
        },
        caption: {
            xlarge:22,
            large: 20,
            medium: 18,
            small: 16,
            msmall: 14,
            xsmall: 12,
        },
    },
    button:{
        icon: {
            width:48,
            height:48,
            borderWidth:1.5,
            borderColor:colors.accents.stroke,
        },
        iconFilled: {
            width:48,
            height:48,
            backgroundColor:colors.background.light,
        },
        signUpOption:{
            text:{
                fontSize:16,
                fontWeight:'600',
            }
        },
    }
})

export default DefaultStyles;
export { createSafeAreaStyles };