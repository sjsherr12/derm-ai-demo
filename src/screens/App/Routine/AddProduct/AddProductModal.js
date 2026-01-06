import React from 'react';
import AddProductSelectScreen from './AddProductSelectScreen';
import EditRoutineItemScreen from '../EditRoutineItemScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const AddProductStack = createNativeStackNavigator();

const AddProductModal = () => {
    return (
        <AddProductStack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: 'transparent' },
                cardStyleInterpolator: ({ current, layouts }) => {
                    return {
                        cardStyle: {
                            transform: [
                                {
                                    translateX: current.progress.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [layouts.screen.width, 0],
                                    }),
                                },
                            ],
                        },
                    };
                },
            }}
        >
            <AddProductStack.Screen 
                name="AddProductSelect" 
                component={AddProductSelectScreen} 
            />
            <AddProductStack.Screen 
                name="AddProductEdit" 
                component={EditRoutineItemScreen} 
            />
        </AddProductStack.Navigator>
    );
};

export default AddProductModal;