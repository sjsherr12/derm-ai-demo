import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PersistentSafeAreaContext = createContext();

export const PersistentSafeAreaProvider = ({ children }) => {
    const insets = useSafeAreaInsets();
    const [persistentInsets, setPersistentInsets] = useState(insets);

    useEffect(() => {
        if (insets.top > 0 || insets.bottom > 0) {
            setPersistentInsets(insets);
        }
    }, [insets]);

    return (
        <PersistentSafeAreaContext.Provider value={persistentInsets}>
            {children}
        </PersistentSafeAreaContext.Provider>
    );
};

export const usePersistentSafeAreaInsets = () => {
    const context = useContext(PersistentSafeAreaContext);
    if (!context) {
        throw new Error('usePersistentSafeAreaInsets must be used within PersistentSafeAreaProvider');
    }
    return context;
};