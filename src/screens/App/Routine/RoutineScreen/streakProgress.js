import DefaultStyles from "config/styles"
import { useEffect, useRef, useMemo } from "react"
import dayjs from 'dayjs';
import colors from 'config/colors';
import DefaultButton from "components/Buttons/DefaultButton";
import * as Haptics from 'expo-haptics'
import { RoutineProductTypes } from "constants/products";
import {Ionicons} from '@expo/vector-icons'
const { default: DefaultText } = require("components/Text/DefaultText")
const { StyleSheet, ScrollView, TouchableOpacity } = require("react-native")
const { View } = require("react-native")

const RoutineScreenStreakProgress = ({
    currentStreak,
    morningCompletions = [],
    eveningCompletions = [],
    selectedTab = 0,
    onClose
}) => {
    const animationRef = useRef(null);
    
    const currentWeek = useMemo(() => {
        const today = dayjs();
        const startOfThisWeek = today.startOf('week');
        const week = [];

        for (let d = 0; d < 7; d++) {
            week.push(startOfThisWeek.add(d, 'day'));
        }

        return week;
    }, []);

    const renderDay = (date, index, dayLetter) => {
        const dateString = date.format('YYYY-MM-DD');
        const isToday = date.isSame(dayjs(), 'day');
        const isFuture = date.isAfter(dayjs(), 'day');
        
        // Get completions for the selected tab only
        const currentTabCompletions = selectedTab === 0 ? morningCompletions : eveningCompletions;
        
        const hasCompletion = currentTabCompletions.some(completion => {
            const completionDate = dayjs(completion).format('YYYY-MM-DD');
            return completionDate === dateString;
        });

        let circleStyle = [styles.calendarCircle];
        if (hasCompletion) {
            circleStyle.push(styles.calendarCircleCompleted);
        }

        // Determine text style based on day type
        let textStyle = [styles.calendarHeaderText];
        if (isToday) {
            textStyle.push(styles.calendarHeaderTextToday);
        } else if (isFuture) {
            textStyle.push(styles.calendarHeaderTextFuture);
        }

        return (
            <View key={`${date.toString()}-${index}`} style={styles.calendarColumn}>
                <DefaultText style={textStyle}>
                    {dayLetter}
                </DefaultText>
                <View style={styles.calendarDayContainer}>
                    <View style={circleStyle} />
                </View>
            </View>
        );
    };

    return (
        <View 
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <View
                style={styles.flexContainer}
            >
                <DefaultText
                    style={{
                        fontSize:DefaultStyles.text.title.xsmall,
                        fontWeight:'600',
                        color:colors.text.secondary,
                    }}
                >
                    {RoutineProductTypes[selectedTab]} Routine
                </DefaultText>

                <View
                    style={styles.streakContainer}
                >
                    <Ionicons
                        size={18}
                        color='#ff7400'
                        name='flame'
                        style={{
                            backgroundColor:'#ffde1a',
                            borderRadius:64,
                        }}
                    />
                    <DefaultText>
                        {currentStreak}
                    </DefaultText>
                </View>
            </View>

            <View
                style={styles.animationContainer}
            >
                <View style={styles.largeIconContainer}>
                    <Ionicons
                        size={100}
                        color='#ff7400'
                        name='flame'
                    />
                </View>
            </View>

            <View style={styles.streakTextContainer}>
                <DefaultText style={styles.caption}>
                    {currentStreak} Day streak
                </DefaultText>
            </View>

            <View style={styles.calendarSection}>
                <View style={styles.calendarWeek}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => 
                        renderDay(currentWeek[index], index, day)
                    )}
                </View>
            </View>

            <DefaultText
                style={styles.motivationCaption}
            >
                Every day matters for hitting your skincare goals!
            </DefaultText>

            <DefaultButton
                title='Continue'
                onPress={onClose}
                isActive={true}
                style={{
                    borderRadius:64,
                }}
                hapticType={Haptics.ImpactFeedbackStyle.Soft}
            />
        </View>
    )
}

export default RoutineScreenStreakProgress;

const styles = StyleSheet.create({
    container: {
        alignItems:'center',
        padding:DefaultStyles.container.paddingHorizontal,
    },
    flexContainer: {
        width:'100%',
        flexDirection:'row',
        alignItems:'center',
    },
    streakContainer: {
        marginLeft:'auto',
        flexDirection:'row',
        alignItems:'center',
        padding:12,
        gap:8,
        borderRadius:64,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
    },
    animationContainer: {
        alignItems:'center',
        marginVertical: 20,
    },
    largeIconContainer: {
        backgroundColor:'#ffde1a',
        borderRadius:80,
        padding:10,
        alignItems:'center',
        justifyContent:'center',
    },
    streakTextContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 20,
    },
    streakCount: {
        fontSize:50,
        fontWeight:'bold',
        color:'#ff9a00',
    },
    caption: {
        fontSize:DefaultStyles.text.title.xsmall,
        fontWeight:'500',
        color:'#ff9a00',
    },
    calendarSection: {
        width: '100%',
        marginBottom: 30,
        marginTop: 12,
    },
    calendarWeek: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-start',
    },
    calendarColumn: {
        alignItems: 'center',
        flex: 1,
        gap: 14,
    },
    calendarHeaderText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text.secondary,
        textAlign: 'center',
    },
    calendarHeaderTextToday: {
        color: '#ff9a00',
        fontWeight: '600',
    },
    calendarHeaderTextFuture: {
        color: colors.text.lighter,
    },
    calendarDayContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarCircle: {
        width: 24,
        height: 24,
        borderRadius: 20,
        backgroundColor: colors.accents.stroke,
    },
    calendarCircleCompleted: {
        backgroundColor: colors.background.primary,
    },
    motivationCaption: {
        width:'90%',
        fontSize: DefaultStyles.text.caption.medium,
        fontWeight: '400',
        color: colors.text.darker,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
})