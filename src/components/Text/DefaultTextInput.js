const { TextInput, AccessibilityInfo } = require("react-native");

const DefaultTextInput = (props) => (
    <TextInput
        {...props}
        allowFontScaling={false}
    />
)

export default DefaultTextInput