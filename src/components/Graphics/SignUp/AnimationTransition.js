import { Text, View, StyleSheet, SafeAreaView } from 'react-native';
import { Image } from 'react-native'
import AnimatedGraph from './AnimatedGraph';
import SkincareRoutineTransition from './SkincareRoutineTransition';
import ProgressTransition from './ProgressTransition';
import DefaultStyles from "../../../config/styles";
import colors from "../../../config/colors";

const AnimationTransition = ({
    question
}) => {

    return (
        <View style={styles.wrapper}>
            {question?.id === 'SkinCharacteristicsTransition' && (
                <AnimatedGraph />
            )}
            {question?.id === 'SkincareRoutineTransition' && (
                <SkincareRoutineTransition />
            )}
            {question?.id === 'PersonalizePlatformTransition' && (
                <ProgressTransition />
            )}
        </View>
    )
}

export default AnimationTransition;

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
})