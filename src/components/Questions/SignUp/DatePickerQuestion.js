import { useState } from 'react';
import { View, Button, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSignUpFlow } from '../../../context/SignUpFlowContext';

const DatePickerQuestion = ({ question }) => {
    const [date, setDate] = useState(new Date());
    const {answers, answerCurrent} = useSignUpFlow();

    return (
        <View>
            <DateTimePicker
                value={answers[question.id] || date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, selectedDate) => {
                    setDate(selectedDate);
                    answerCurrent(question.id, selectedDate)
                }}
                style={styles.datePicker}
            />
        </View>
    );
};
export default DatePickerQuestion;

const styles = StyleSheet.create({
    datePicker: {
        width:'100%',
        boxShadow:'0px 12px 24px rgba(0,0,0,.05)',
        borderRadius:16,
    }
})