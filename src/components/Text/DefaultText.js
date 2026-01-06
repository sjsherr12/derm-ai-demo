import { Text, StyleSheet } from 'react-native';

const DefaultText = (props) => (
  <Text
    {...props}
    allowFontScaling={false}
    style={[styles.text, props.style]} 
  />
);

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Inter',
  },
});

export default DefaultText;
