import { createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QuestionScreen from "../screens/SignUp/QuestionScreen";
import IntroductionScreen from "../screens/SignUp/IntroductionScreen";
import SignUpQuestions from "../data/SignUpQuestions"
import { SignUpFlowProvider } from "../context/SignUpFlowContext";
import GeneratePlanScreen from "../screens/SignUp/GeneratePlanScreen";
import PaywallScreen from "../screens/SignUp/PaywallScreen";
import { SafeAreaView, Text, View } from "react-native";
import DefaultStyles from "../config/styles";
import ReadyToGenerateScreen from "screens/SignUp/ReadyToGenerateScreen";
import GeneratedPlanScreen from "screens/SignUp/GeneratedPlanScreen";
import CreateAccountScreen from "screens/SignUp/CreateAccountScreen";
import TryForFreeScreen from "../screens/SignUp/TryForFreeScreen";
import OneTimeOfferLastChanceScreen from "../screens/SignUp/OneTimeOfferScreen";
import ScanScreen from "../screens/App/Scan/FaceScan";
import ScanScreenAddNotes from "../screens/App/Scan/FaceScan/notes";

const Stack = createNativeStackNavigator();

const SignUpNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown:false,
                gestureEnabled:false,
                animation:'fade',
                animationDuration:50,
            }}
        >
            <Stack.Screen name='Introduction' component={IntroductionScreen} />

            <Stack.Screen name='FaceScan'
                component={ScanScreen}
                options={{
                    header:null,
                    animation:'fade_from_bottom',
                    animationDuration:250,
                    gestureEnabled:true,
                }}
            />

            <Stack.Screen
                name='FaceScanNotes'
                component={ScanScreenAddNotes}
                options={{
                    header:null,
                    presentation:'pageSheet',
                }}
            />

            {SignUpQuestions.map((question, idx) => (
                <Stack.Screen
                    key={idx}
                    name={question.id}
                    component={question?.Screen || QuestionScreen}
                />
            ))}

            <Stack.Screen
                name='ReadyToGenerate'
                component={ReadyToGenerateScreen} 
                options={{
                    animation:'ios_from_right',
                    gestureEnabled:false,
                    animationDuration:500,
                }}
            />
            
            <Stack.Screen name='GeneratePlan' component={GeneratePlanScreen} />
            <Stack.Screen name='GeneratedPlan' component={GeneratedPlanScreen} />

            <Stack.Screen name='TryForFree' component={TryForFreeScreen}
                options={{
                    animation:'ios_from_right',
                    gestureEnabled:false,
                    animationDuration:500,
                }}
            />
            <Stack.Screen name='Paywall' component={PaywallScreen}
                options={{
                    animation:'ios_from_right',
                    gestureEnabled:false,
                    animationDuration:500,
                }}
            />
            <Stack.Screen name='OneTimeOffer' component={OneTimeOfferLastChanceScreen}
                options={{
                    animation:'slide_from_bottom',
                    animationDuration:300,
                    gestureEnabled:false,
                }}
            />
            <Stack.Screen name='CreateAccount' component={CreateAccountScreen}
                options={{
                    animation:'ios_from_right',
                    gestureEnabled:false,
                    animationDuration:500,
                }}
            />
        </Stack.Navigator>
    )
}

export default SignUpNavigator;