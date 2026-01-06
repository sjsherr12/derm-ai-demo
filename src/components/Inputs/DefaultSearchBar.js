import { merge } from "lodash"
import { InputAccessoryView, StyleSheet, TextInput, View } from "react-native"
import colors from "../../config/colors";
import { Platform } from "react-native";
import DefaultTextInput from "components/Text/DefaultTextInput";

const DefaultSearchBar = ({
    ref, 
    value,
    onChangeText,
    onPress,
    onFocus,
    onBlur,
    onSubmitEditing,
    placeholder,
    autoCorrect,
    autoFocus,
    style,
    startAdornment,
    endAdornment,
}) => {
    return (
        <View style={[styles.container, style?.container]}>
            {startAdornment}
            <DefaultTextInput
                ref={ref}
                autoCorrect={autoCorrect}
                autoFocus={autoFocus}
                value={value}
                onChangeText={onChangeText}
                onSubmitEditing={onSubmitEditing}
                onPress={onPress}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={placeholder}
                style={[styles.searchBar, style?.searchBar]}
                returnKeyType='done'
            />
            {endAdornment}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        gap:14,
        paddingHorizontal:16,
        flexDirection:'row',
        alignItems:'center',
        flex:1,
        borderWidth:1.5,
        borderRadius:32,
        borderColor:colors.accents.stroke,
    },
    searchBar: {
        flex:1,
        fontSize:18,
        paddingVertical:14,
        fontWeight:'400'
    }
})

export default DefaultSearchBar;