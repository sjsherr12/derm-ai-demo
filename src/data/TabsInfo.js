import { Feather, MaterialIcons, Ionicons, FontAwesome5, FontAwesome6, FontAwesome, Octicons } from '@expo/vector-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircleUser, faCompass } from '@fortawesome/free-regular-svg-icons';
import { faCircleUser as faCircleUserSolid, faCompass as faCompassSolid } from '@fortawesome/free-solid-svg-icons';
import colors from 'config/colors';
import AccountScreen from 'screens/App/Account/AccountScreen';
import AnalysisScreen from 'screens/App/Analysis/AnalysisScreen';
import ExploreScreen from 'screens/App/Explore/ExploreScreen';
import RoutineScreen from 'screens/App/Routine/RoutineScreen';
import SkinHelpChatInterface from '../screens/App/SkinHelp/ChatInterface'

const TabsInfo = [
    {
        name: 'Analysis',
        label: 'Home',
        screen: AnalysisScreen,
        icon: ({ color, focused }) => (
            <FontAwesomeIcon 
                icon={focused ? faCompassSolid : faCompass} 
                color={focused ? colors.background.primary : color} 
                size={26} 
            />
        )
    },
    {
        name: 'Routines',
        label: 'Routine',
        screen: RoutineScreen,
        icon: ({ color, focused }) => (
            <FontAwesome6 name="list-alt" color={focused ? colors.background.primary : color} size={26} />
        )
    },
    {
        name: 'Camera',
        isCamera: true // Now acts as a trigger, not a tab screen
    },
    {
        name: 'Explore',
        label: 'Explore',
        screen: ExploreScreen,
        icon: ({ color, focused }) => (
            <FontAwesome6 name="magnifying-glass" color={focused ? colors.background.primary : color} size={24} />
        )
    },
    {
        name: 'SkinHelp',
        label: 'Skin Help',
        screen: SkinHelpChatInterface,
        icon: ({ color, focused }) => (
            <FontAwesome6
                name='wand-magic-sparkles'
                color={focused ? colors.background.primary : color} 
                size={20} 
            />
        )
    }
];

export default TabsInfo;