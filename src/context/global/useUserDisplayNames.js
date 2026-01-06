import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'services/firebase/firebase';

/**
 * Hook to manage user display names cache
 * Note: This is a temporary solution. Ideally, displayName should be stored 
 * in Firestore user documents for easier access.
 */
const useUserDisplayNames = () => {
    const [userDisplayNames, setUserDisplayNames] = useState({});
    const [loadingUIDs, setLoadingUIDs] = useState(new Set());

    const getUserDisplayName = async (uid) => {
        if (!uid) return null;
        
        // Return cached result if available
        if (userDisplayNames[uid] !== undefined) {
            return userDisplayNames[uid];
        }

        // Avoid duplicate requests
        if (loadingUIDs.has(uid)) {
            return null;
        }

        setLoadingUIDs(prev => new Set([...prev, uid]));

        try {
            // Try to fetch from Firestore user document first
            // (in case displayName was stored there in the future)
            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);
            
            let displayName = null;
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Check if displayName is stored in Firestore (future enhancement)
                displayName = userData.displayName || null;
            }
            
            // Cache the result (even if null)
            setUserDisplayNames(prev => ({
                ...prev,
                [uid]: displayName
            }));
            
            return displayName;
        } catch (error) {
            console.error('Error fetching user display name:', error);
            // Cache null result to avoid repeated failed requests
            setUserDisplayNames(prev => ({
                ...prev,
                [uid]: null
            }));
            return null;
        } finally {
            setLoadingUIDs(prev => {
                const newSet = new Set(prev);
                newSet.delete(uid);
                return newSet;
            });
        }
    };

    const getUserFirstName = (uid) => {
        const displayName = userDisplayNames[uid];
        if (!displayName) return null;
        return displayName.split(' ')[0] || null;
    };

    const isLoading = (uid) => {
        return loadingUIDs.has(uid);
    };

    return {
        getUserDisplayName,
        getUserFirstName,
        isLoading,
        // Trigger fetching for a UID
        fetchUserDisplayName: getUserDisplayName
    };
};

export default useUserDisplayNames;