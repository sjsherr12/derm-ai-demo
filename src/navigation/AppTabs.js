const { createBottomTabNavigator } = require("@react-navigation/bottom-tabs");
const { default: useTabFocusAnimation } = require("context/TabFocusAnimation");
const { default: TabsInfo } = require("data/TabsInfo");
import { useNavigation } from '@react-navigation/native';
import IconButton from 'components/Buttons/IconButton';
import Entypo from '@expo/vector-icons/Entypo';
import DefaultText from '../components/Text/DefaultText';
import colors from 'config/colors';
import * as Haptics from 'expo-haptics'
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const Tab = createBottomTabNavigator();

const TabBarCurve = () => {
    return (
        <>
            {/* White circle background */}
            <View style={{
                position: 'absolute',
                top:6,
                width: 80,
                height: 66,
                backgroundColor: colors.background.screen,
                alignSelf: 'center',
                zIndex: 0,
                backgroundColor:'white'
            }} />
            
            {/* Border circle */}
            <View style={{
                position: 'absolute',
                top: -11,
                width: 76,
                height: 76,
                borderRadius: 35,
                borderWidth: 1.25,
                borderColor: colors.accents.stroke,
                backgroundColor: 'white',
                alignSelf: 'center',
                zIndex: -1,
            }} />
        </>
    );
};

const NullComponent = () => null;

const AppTabs = () => {
    const navigation = useNavigation();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: colors.background.primary,
                tabBarInactiveTintColor: '#bbb',
                tabBarStyle: {
                    borderTopWidth: 1.2,
                    paddingTop: 2,
                    height: 90,
                    borderTopColor: colors.accents.stroke,
                    backgroundColor: 'white',
                    position: 'absolute',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                
                animation:'fade',
                headerShown: false,
            }}
        >
            {TabsInfo.map((tab, idx) => {
                const isCamera = tab.isCamera;

                if (isCamera) {
                    return (
                        <Tab.Screen
                            key={tab.name}
                            name={tab.name}
                            component={NullComponent}
                            options={{
                                tabBarButton: (props) => (
                                    <View
                                        style={{
                                            position: 'relative',
                                            top: -8, // pushes button upward
                                            alignItems: 'center',
                                            overflow: 'visible',
                                        }}
                                    >
                                        <TabBarCurve />

                                        <IconButton
                                            iconComponent={<Entypo name="camera" size={26} color={colors.text.primary} />}
                                            color={colors.text.primary}
                                            onPress={() => navigation.navigate('NewScan')}
                                            hapticType={Haptics.ImpactFeedbackStyle.Soft}
                                            style={{
                                                width: 58,
                                                height: 58,
                                                borderRadius: 32,
                                                backgroundColor: colors.background.primary,
                                            }}
                                        />
                                    </View>
                                )
                            }}
                        />
                    );
                }

                return (
                    <Tab.Screen
                        key={tab.name}
                        name={tab.name}
                        component={tab.screen}
                        options={({ route, navigation }) => ({
                            tabBarLabel: ({ focused }) => (
                                <DefaultText style={{
                                    marginTop: 5,
                                    fontWeight: focused ? '600' : '500',
                                    fontSize: 11,
                                    color: focused ? colors.background.primary : '#bbb',
                                    textAlign: 'center',
                                }}>
                                    {tab.label}
                                </DefaultText>
                            ),
                            tabBarIcon: tab.icon,
                        })}
                    />
                );
            })}
        </Tab.Navigator>
    );
};

export default AppTabs;