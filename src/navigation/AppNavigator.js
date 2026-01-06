import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppTabs from "./AppTabs";
import NotificationsScreen from "screens/App/Home/NotificationsScreen";

import ProductScreen from "screens/App/Explore/ProductScreen";
import ProductScreenAllReviewsScreen from "screens/App/Explore/ProductScreen/ReviewScreens/AllReviewsScreen";
import ProductScreenWriteReviewScreen from "screens/App/Explore/ProductScreen/ReviewScreens/WriteReviewScreen";
import AddProductModal from "screens/App/Routine/AddProduct/AddProductModal";
import EditRoutineItemScreen from "screens/App/Routine/EditRoutineItemScreen";
import IngredientsScreen from "screens/App/Explore/ProductScreen/IngredientsScreen";
import FullAnalysisScreen from "screens/App/Analysis/FullAnalysisScreen";
import ScanHistoryScreen from "screens/App/Analysis/ScanHistory";
import RecommendationsScreen from "screens/App/Analysis/Recommendations";
import FiltersScreen from "screens/App/Explore/FiltersScreen";
import ProductBrandScreen from "screens/App/Explore/ProductBrandScreen";
import EditProfileScreen from "screens/App/Account/EditProfile";
import ProfileQuestionScreen from "screens/App/Account/ProfileQuestion";
import EditSkinProfileScreen from "screens/App/Account/EditSkinProfile";
import ReferralProgramScreen from "screens/App/Account/ReferralProgram";
import AccountReviewsScreen from "screens/App/Account/AccountReviews";
import ProductScreenEditReviewScreen from "screens/App/Explore/ProductScreen/ReviewScreens/EditReviewScreen";
import EditNotificationPreferencesScreen from "screens/App/Account/Notifications";
import ManageAccountScreen from "screens/App/Account/ManageAccount";
import AnalysisScreenCategoryScreen from "../screens/App/Analysis/CategoryScreen";
import ExploreScreenSavedProductsScreen from "../screens/App/Explore/SavedScreen";
import RecommendationHistoryScreen from "../screens/App/Analysis/RecommendationHistory";
import FullRecommendationsScreen from "../screens/App/Analysis/FullRecommendationsScreen";
import PaywallScreen from "../screens/SignUp/PaywallScreen";
import AccountScreen from "../screens/App/Account/AccountScreen";
import PreviousChatsScreen from "../screens/App/SkinHelp/PreviousChats";
import ChatHistoryScreen from "../screens/App/SkinHelp/ChatHistory";
import NewScanScreen from "../screens/App/Scan/NewScan";
import ScanScreen from "../screens/App/Scan/FaceScan";
import ProductScanScreen from "../screens/App/Scan/ProductScan";
import ScanScreenAddNotes from "../screens/App/Scan/FaceScan/notes";
import ProductScreenReportProductMistake from "../screens/App/Explore/ProductScreen/ReportMistake";
import ShareAnalysisScreen from "../screens/App/Analysis/ShareAnalysis";
import RoutineProgressScreen from "../screens/App/Routine/RoutineProgress";
import FullProductImageScreen from "../screens/App/Explore/ProductScreen/FullProductImage";
import CompareProductsScreen from "../screens/App/Explore/ProductScreen/CompareProducts";

const Stack = createNativeStackNavigator();

const AppNavigator = ({
    navigation
}) => {
    return (
        <Stack.Navigator
        >
            <Stack.Screen
                name='Analysis'
                component={AppTabs}
                options={{
                    header:null,
                }}
            />
            
            <Stack.Screen
                name='FullAnalysis'
                component={FullAnalysisScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='ShareAnalysis'
                component={ShareAnalysisScreen}
                options={{
                    header:null,
                    presentation:'pageSheet'
                }}
            />

            <Stack.Screen
                name='AnalysisCategory'
                component={AnalysisScreenCategoryScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='NewScan'
                component={NewScanScreen}
                options={{
                    header:null,
                    animation:'fade',
                    animationDuration:100,
                    presentation:'transparentModal',
                }}
            />

            <Stack.Screen
                name='FaceScan'
                component={ScanScreen}
                options={{
                    header:null,
                    animation:'fade_from_bottom',
                    animationDuration:250,
                    gestureEnabled:false,
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

            <Stack.Screen
                name='ProductScan'
                component={ProductScanScreen}
                options={{
                    header:null,
                    animation:'fade_from_bottom',
                    animationDuration:250,
                    gestureEnabled:false,
                }}
            />

            <Stack.Screen
                name='ScanHistory'
                component={ScanHistoryScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='RecommendationHistory'
                component={RecommendationHistoryScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='FullRecommendations'
                component={FullRecommendationsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='Notifications'
                component={NotificationsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                    gestureEnabled:true,
                }}
            />

            <Stack.Screen
                name='Routines'
                component={AppTabs}
                options={{
                    header:null,
                }}
            />

            <Stack.Screen
                name='RoutineProgress'
                component={RoutineProgressScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='AddProductModal'
                component={AddProductModal}
                options={{
                    header:null,
                    presentation:'pageSheet'
                }}
            />

            <Stack.Screen
                name='EditRoutineItem'
                component={EditRoutineItemScreen}
                options={{
                    header:null,
                    presentation:'pageSheet',
                }}
            />
            
            <Stack.Screen
                name='Recommendations'
                component={RecommendationsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='Explore'
                component={AppTabs}
                options={{
                    header:null,
                }}
            />

            <Stack.Screen
                name='Filters'
                component={FiltersScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='ProductBrandFilter'
                component={ProductBrandScreen}
                options={{
                    header:null,
                    presentation:'pageSheet',
                }}
            />

            <Stack.Screen
                name='SavedProducts'
                component={ExploreScreenSavedProductsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='Product'
                component={ProductScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='FullProductImage'
                component={FullProductImageScreen}
                options={{
                    header:null,
                    animation:'fade',
                    animationDuration:200,
                    gestureEnabled:false
                }}
            />

            <Stack.Screen
                name='CompareProducts'
                component={CompareProductsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='AllReviews'
                component={ProductScreenAllReviewsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='WriteReview'
                component={ProductScreenWriteReviewScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='EditReview'
                component={ProductScreenEditReviewScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='IngredientsScreen'
                component={IngredientsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='ReportProductMistake'
                component={ProductScreenReportProductMistake}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='Account'
                component={AccountScreen}
                options={{
                    header:null,
                    animation:'slide_from_bottom',
                    animationDuration:400,
                    gestureEnabled:true,
                    gestureDirection:'vertical'
                }}
            />

            <Stack.Screen
                name='EditProfile'
                component={EditProfileScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='ReferralProgram'
                component={ReferralProgramScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='EditSkinProfile'
                component={EditSkinProfileScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='EditNotificationPreferences'
                component={EditNotificationPreferencesScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='AccountReviews'
                component={AccountReviewsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='ManageAccount'
                component={ManageAccountScreen}
                options={{
                    header:null,
                    animation:'slide_from_right'
                }}
            />

            <Stack.Screen
                name='ProfileQuestion'
                component={ProfileQuestionScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='SkinHelp'
                component={AppTabs}
                options={{
                    header:null,
                }}
            />

            <Stack.Screen
                name='PreviousChats'
                component={PreviousChatsScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='ChatHistory'
                component={ChatHistoryScreen}
                options={{
                    header:null,
                    animation:'slide_from_right',
                }}
            />

            <Stack.Screen
                name='InAppPaywall'
                component={PaywallScreen}
                options={{
                    header:null,
                    gestureEnabled:false,
                    animation:'slide_from_bottom',
                    animationDuration:500,
                }}
            />
        </Stack.Navigator>
    )
}

export default AppNavigator;