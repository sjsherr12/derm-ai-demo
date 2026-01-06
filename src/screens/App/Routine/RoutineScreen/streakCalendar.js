import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import dayjs from 'dayjs';
import DefaultStyles from 'config/styles';
import colors from 'config/colors';
import { isRoutineCompletedToday } from 'utils/streaks';
import DefaultText from '../../../../components/Text/DefaultText';

const SCREEN_WIDTH = 
    Dimensions.get('window').width - 
    (DefaultStyles.tabScrollContainer.padding*2) // what were using currently for side padding, need to remove
;

const RoutineScreenStreakCalendar = ({ completedDays = [], morningCompletions = [], eveningCompletions = [], selectedTab = 0 }) => {
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    const weeks = useMemo(() => {
        const today = dayjs();
        const startOfThisWeek = today.startOf('week'); // Sunday
        const weeksArray = [];

        for (let i = 0; i < 5; i++) { // current week + 4 past weeks
            const startOfWeek = startOfThisWeek.subtract(i, 'week');
            const week = [];

            for (let d = 0; d < 7; d++) {
                week.push(startOfWeek.add(d, 'day'));
            }

            weeksArray.unshift(week); // push from past → current
        }

        return weeksArray;
    }, []);

    const renderDay = (date) => {
        const dayInitial = date.format('dd')[0]; // S, M, ...
        const dayNumber = date.date();
        const isToday = date.isSame(dayjs(), 'day');

        const dateString = date.format('YYYY-MM-DD');
        
        // Get completions for the selected tab only
        const currentTabCompletions = selectedTab === 0 ? morningCompletions : eveningCompletions;
        
        const hasCompletion = currentTabCompletions.some(completion => {
            const completionDate = dayjs(completion).format('YYYY-MM-DD');
            return completionDate === dateString;
        });

        const isFuture = date.isAfter(dayjs(), 'day');

        let circleStyle = [styles.dayCircle, styles.incomplete];
        let textStyle = [styles.dayInitial];
        let numberStyle = [styles.dayNumber];

        if (hasCompletion) {
            circleStyle = [styles.dayCircle, styles.completed];
            textStyle.push(styles.completedText);
        } else if (isToday) {
            circleStyle = [styles.dayCircle, styles.today];
        } else if (isFuture) {
            circleStyle = [styles.dayCircle, styles.future];
            textStyle.push(styles.futureText);
            numberStyle = [styles.disabledDayNumber];
        }

        return (
            <View key={date.toString()} style={styles.dayItem}>
                <View style={circleStyle}>
                    <DefaultText style={textStyle}>{dayInitial}</DefaultText>
                </View>
                <DefaultText style={numberStyle}>{dayNumber}</DefaultText>
            </View>
        );
    };

    return (
        <FlatList
            horizontal
            pagingEnabled
            data={weeks}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
                <View style={styles.weekContainer}>
                    {item.map(renderDay)}
                </View>
            )}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
                const index = Math.round(
                    e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
                );
                setCurrentWeekIndex(index);
            }}
            initialScrollIndex={weeks.length - 1}
            getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index
            })}
        />
    );
};

const styles = StyleSheet.create({
    weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: SCREEN_WIDTH,
        paddingVertical: 12,
    },
    dayItem: {
        alignItems: 'center',
    },
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    dayInitial: {
        fontWeight: '600',
        color: colors.text.secondary,
    },
    dayNumber: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    disabledDayNumber: {
        fontSize: 14,
        color: colors.text.lighter,
    },
    completed: {
        backgroundColor: colors.background.primary,
    },
    completedText: {
        color:colors.text.primary,
    },
    partiallyCompleted: {
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.background.primary,
    },
    partialText: {
        color: colors.text.primary,
    },
    partialIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.background.primary,
    },
    future: {
        backgroundColor:'transparent',
        borderColor:'transparent',
        opacity:.3,
    },
    futureText: {
        color:colors.text.lighter
    },
    incomplete: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.text.lighter,
    },
    today: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.text.secondary,
    },
});

export default RoutineScreenStreakCalendar;