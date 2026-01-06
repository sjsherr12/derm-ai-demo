import { useMemo } from 'react';
import { usePersistentSafeAreaInsets } from 'context/SafeAreaContext';
import { createSafeAreaStyles } from 'config/styles';

export const useSafeAreaStyles = () => {
    const insets = usePersistentSafeAreaInsets();
    
    return useMemo(() => createSafeAreaStyles(insets), [insets]);
};