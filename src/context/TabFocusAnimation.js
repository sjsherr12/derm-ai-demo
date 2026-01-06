const { useNavigation, useIsFocused } = require("@react-navigation/native");
const { useEffect } = require("react");

const useTabFocusAnimation = ({animation = 'fade'}) => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            navigation.setOptions({ animation: animation });
        }
    }, [isFocused, navigation]);
}

export default useTabFocusAnimation;