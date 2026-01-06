import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from 'services/firebase/firebase';

const PRODUCTS_STORAGE_KEY = '@skincare_products';
const LAST_SYNC_KEY = '@products_last_sync';

const useSimpleProductCache = (user) => {
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const initializingRef = useRef(false);

    // Load products from storage
    const loadFromStorage = useCallback(async () => {
        try {
            const productsJson = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (productsJson) {
                const productsData = JSON.parse(productsJson);
                if (typeof productsData === 'object' && !Array.isArray(productsData) && Object.keys(productsData).length > 0) {
                    setProducts(productsData);
                    return productsData;
                }
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            // Clear corrupted data
            await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
            await AsyncStorage.removeItem(LAST_SYNC_KEY);
        }
        return null;
    }, []);

    // Save products to storage
    const saveToStorage = useCallback(async (productsData) => {
        try {
            await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(productsData));
            await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }, []);

    // Download all products
    const downloadAllProducts = useCallback(async () => {
        try {
            console.log('Downloading all products...');
            const snapshot = await getDocs(collection(db, 'products'));
            const productsData = {};
            
            snapshot.docs.forEach(doc => {
                productsData[doc.id] = {
                    id: doc.id,
                    ...doc.data(),
                };
            });

            setProducts(productsData);
            await saveToStorage(productsData);
            console.log(`Downloaded ${Object.keys(productsData).length} products`);
            
            return productsData;
        } catch (error) {
            console.error('Error downloading products:', error);
            throw error;
        }
    }, [saveToStorage]);

    // Initialize cache - only for authenticated users
    const initializeCache = useCallback(async () => {
        if (!user) {
            console.log('No authenticated user, skipping product cache initialization');
            return;
        }
        
        if (initializingRef.current || isInitialized) return;
        
        initializingRef.current = true;
        setLoading(true);
        
        try {
            console.log('Initializing product cache for authenticated user');
            // Try to load from storage first
            const cachedProducts = await loadFromStorage();
            
            if (!cachedProducts || Object.keys(cachedProducts).length === 0) {
                // No cache, download from Firestore
                await downloadAllProducts();
            }
            
            setIsInitialized(true);
        } catch (error) {
            console.error('Error initializing cache:', error);
            // Try to use any cached data we might have
            const fallbackProducts = await loadFromStorage();
            if (fallbackProducts && Object.keys(fallbackProducts).length > 0) {
                console.log('Using fallback cached products');
                setIsInitialized(true);
            }
        } finally {
            setLoading(false);
            initializingRef.current = false;
        }
    }, [user, isInitialized, loadFromStorage, downloadAllProducts]);

    // Clear cache
    const clearCache = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
            await AsyncStorage.removeItem(LAST_SYNC_KEY);
            setProducts({});
            setIsInitialized(false);
            console.log('Cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }, []);

    // Auto-initialize when user becomes available, clear when user logs out
    useEffect(() => {
        if (user && !isInitialized && !initializingRef.current) {
            initializeCache();
        } else if (!user && (isInitialized || Object.keys(products).length > 0)) {
            // User logged out, clear products and cache
            console.log('User logged out, clearing product cache');
            setProducts({});
            setIsInitialized(false);
            clearCache();
        }
    }, [user, isInitialized, initializeCache, products, clearCache]);

    return {
        products,
        loading,
        isInitialized,
        initializeCache,
        downloadAllProducts,
        clearCache,
    };
};

export default useSimpleProductCache;