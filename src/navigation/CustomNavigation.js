import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/global/AuthContext";
import AppNavigator from "./AppNavigator";
import SignUpNavigator from "./SignUpNavigator";

const CustomNavigation = () => {
    const {user, loading} = useAuth();

    if (loading) return null;

    const shouldShowApp = user && !user?.isAnonymous;

    return shouldShowApp ? 
        <AppNavigator key="app" /> : 
        <SignUpNavigator key="signup" />
}

export default CustomNavigation;