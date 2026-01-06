import colors from "config/colors";
import DefaultStyles from "config/styles";

const { View, StyleSheet } = require("react-native");

const DefaultTabHeader = ({
    headerLeft,
    headerRight,
    header,
    style,
}) => (
    <View style={[
        styles.headerContainer,
        ...(style ? [style] : []),
    ]}>
        <View
            style={[
                styles.side,
                {alignItems:'flex-start'},
                ...(headerLeft?.style ? [headerLeft.style] : [])
            ]}
        >
            {headerLeft?.component}
        </View>

        {header?.component && 
            <View 
                style={[
                    styles.center,
                    ...(header?.style ? [header.style] : [])
                ]}
            >
                {header?.component}
            </View>
        }

        <View
            style={[
                styles.side,
                {alignItems:'flex-end'},
                ...(headerRight?.style ? [headerRight.style] : [])
            ]}
        >
            {headerRight?.component}
        </View>
    </View>
);


export default DefaultTabHeader;

const styles = StyleSheet.create({
    headerContainer: {
        width:'100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal:DefaultStyles.container.paddingBottom,
        paddingVertical: DefaultStyles.container.paddingHorizontal,
        borderBottomColor: colors.accents.stroke,
        borderBottomWidth: 1.5,
        backgroundColor: colors.background.screen,
    },
    side: {
        flex: 1,
    },
    center: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
