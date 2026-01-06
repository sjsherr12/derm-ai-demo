import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, orderBy, limit, documentId } from 'firebase/firestore';
import { db } from 'services/firebase/firebase';

const PRODUCTS_STORAGE_KEY = '@skincare_products';
const LAST_SYNC_KEY = '@products_last_sync';
const PRODUCTS_METADATA_KEY = '@products_metadata';

const useProductCache = () => {
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Helper function to find latest createdAt timestamp from products
    const findLatestCreatedAt = useCallback((productsData) => {
        if (!productsData || Object.keys(productsData).length === 0) return null;
        
        let latestTimestamp = null;
        Object.values(productsData).forEach(product => {
            if (product.createdAt) {
                // Handle both Firestore Timestamp and ISO string formats
                let timestamp;
                if (product.createdAt.toDate) {
                    // Firestore Timestamp
                    timestamp = product.createdAt.toDate();
                } else if (typeof product.createdAt === 'string') {
                    // ISO string
                    timestamp = new Date(product.createdAt);
                } else if (product.createdAt.seconds) {
                    // Firestore Timestamp as plain object
                    timestamp = new Date(product.createdAt.seconds * 1000);
                }
                
                if (timestamp && (!latestTimestamp || timestamp > latestTimestamp)) {
                    latestTimestamp = timestamp;
                }
            }
        });
        
        return latestTimestamp;
    }, []);

    // Save products to AsyncStorage
    const saveProductsToStorage = useCallback(async (productsData, syncTime = null) => {
        try {
            await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(productsData));
            
            if (syncTime) {
                await AsyncStorage.setItem(LAST_SYNC_KEY, syncTime.toISOString());
            }
            
            // Save metadata
            const metadata = {
                totalProducts: Object.keys(productsData).length,
                lastUpdated: new Date().toISOString(),
            };
            await AsyncStorage.setItem(PRODUCTS_METADATA_KEY, JSON.stringify(metadata));
        } catch (error) {
            console.error('Error saving products to storage:', error);
        }
    }, []);

    // Load products from AsyncStorage
    const loadProductsFromStorage = useCallback(async () => {
        try {
            const [productsJson, lastSyncJson] = await Promise.all([
                AsyncStorage.getItem(PRODUCTS_STORAGE_KEY),
                AsyncStorage.getItem(LAST_SYNC_KEY)
            ]);

            if (productsJson) {
                let productsData;
                try {
                    productsData = JSON.parse(productsJson);
                    
                    // Validate the data structure
                    if (typeof productsData !== 'object' || productsData === null || Array.isArray(productsData)) {
                        throw new Error('Invalid products data structure');
                    }
                    
                    // Check if we have at least some products
                    if (Object.keys(productsData).length === 0) {
                        console.warn('Empty products cache found');
                        return null;
                    }
                    
                } catch (parseError) {
                    console.error('Corrupted products cache detected, clearing...', parseError);
                    await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
                    await AsyncStorage.removeItem(LAST_SYNC_KEY);
                    await AsyncStorage.removeItem(PRODUCTS_METADATA_KEY);
                    return null;
                }
                
                setProducts(productsData);
                
                if (lastSyncJson) {
                    try {
                        setLastSyncTime(new Date(lastSyncJson));
                    } catch (dateError) {
                        console.warn('Invalid last sync time, ignoring:', dateError);
                        setLastSyncTime(null);
                    }
                }
                
                console.log(`Loaded ${Object.keys(productsData).length} products from cache`);
                return productsData;
            }
            
            return null;
        } catch (error) {
            console.error('Error loading products from storage:', error);
            // Clear potentially corrupted storage
            try {
                await Promise.all([
                    AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY),
                    AsyncStorage.removeItem(LAST_SYNC_KEY),
                    AsyncStorage.removeItem(PRODUCTS_METADATA_KEY)
                ]);
                console.log('Cleared potentially corrupted storage');
            } catch (cleanupError) {
                console.error('Error clearing corrupted storage:', cleanupError);
            }
            return null;
        }
    }, []);

    // Download all products from Firestore
    const downloadAllProducts = useCallback(async () => {
        setLoading(true);
        try {
            console.log('Downloading all products from Firestore...');
            const productsRef = collection(db, 'products');
            const snapshot = await getDocs(productsRef);
            
            const productsData = {};
            snapshot.docs.forEach(doc => {
                productsData[doc.id] = {
                    id: doc.id,
                    ...doc.data(),
                };
            });

            const syncTime = new Date();
            await saveProductsToStorage(productsData, syncTime);
            setProducts(productsData);
            
            console.log(`Downloaded and cached ${Object.keys(productsData).length} products`);
            return productsData;
        } catch (error) {
            console.error('Error downloading products:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [saveProductsToStorage]);

    // Sync updated products since last sync
    const syncUpdatedProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Use the latest createdAt timestamp from actual cached products
            const latestCachedTimestamp = findLatestCreatedAt(products);
            if (!latestCachedTimestamp) {
                console.log('No cached products or timestamps, performing full download');
                return await downloadAllProducts();
            }

            console.log('Syncing products created after:', latestCachedTimestamp);
            const productsRef = collection(db, 'products');
            const q = query(
                productsRef,
                where('createdAt', '>', latestCachedTimestamp),
                orderBy('createdAt', 'desc')
            );
            
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                console.log('No updated products found');
                setLoading(false);
                return;
            }

            // Get current products state to avoid stale closure
            setProducts(currentProducts => {
                const updatedProducts = { ...currentProducts };
                let updateCount = 0;
                
                snapshot.docs.forEach(doc => {
                    updatedProducts[doc.id] = {
                        id: doc.id,
                        ...doc.data(),
                    };
                    updateCount++;
                });

                console.log(`Synced ${updateCount} updated products`);
                
                // Save to storage
                const syncTime = new Date();
                saveProductsToStorage(updatedProducts, syncTime);
                
                return updatedProducts;
            });
            
        } catch (error) {
            console.error('Error syncing updated products:', error);
            // If createdAt query fails, fall back to full download
            if (error.code === 'failed-precondition' || error.message.includes('createdAt')) {
                console.log('createdAt field not available, performing full download');
                return await downloadAllProducts();
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, [findLatestCreatedAt, products, downloadAllProducts, saveProductsToStorage]);

    // Initialize product cache
    const initializeProductCache = useCallback(async () => {
        if (isInitialized) return;
        
        setLoading(true);
        try {
            // First try to load from storage
            const cachedProducts = await loadProductsFromStorage();
            
            if (cachedProducts && Object.keys(cachedProducts).length > 0) {
                // Products loaded from cache, now sync any updates
                console.log('Products loaded from cache, checking for updates...');
                try {
                    await syncUpdatedProducts();
                } catch (syncError) {
                    console.warn('Failed to sync updates, using cached data:', syncError);
                    // Continue with cached data even if sync fails
                }
            } else {
                // No cached products, download all
                console.log('No cached products found, downloading all...');
                await downloadAllProducts();
            }
            
            setIsInitialized(true);
        } catch (error) {
            console.error('Error initializing product cache:', error);
            // On error, try to use cached data if available
            try {
                const cachedProducts = await loadProductsFromStorage();
                if (cachedProducts && Object.keys(cachedProducts).length > 0) {
                    console.log('Using cached products due to initialization error');
                    setIsInitialized(true);
                } else {
                    // Final fallback - try one more download attempt
                    console.log('Attempting final download as fallback...');
                    await downloadAllProducts();
                    setIsInitialized(true);
                }
            } catch (fallbackError) {
                console.error('Complete initialization failure:', fallbackError);
                // Mark as initialized anyway to prevent infinite retries
                setIsInitialized(true);
            }
        } finally {
            setLoading(false);
        }
    }, [isInitialized, loadProductsFromStorage, syncUpdatedProducts, downloadAllProducts]);

    // Clear cache (for testing/debugging)
    const clearCache = useCallback(async () => {
        // Prevent multiple concurrent clear operations
        if (loading) {
            console.log('Cache clear already in progress, skipping');
            return;
        }
        
        setLoading(true);
        try {
            await Promise.all([
                AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY),
                AsyncStorage.removeItem(LAST_SYNC_KEY),
                AsyncStorage.removeItem(PRODUCTS_METADATA_KEY)
            ]);
            setProducts({});
            setLastSyncTime(null);
            setIsInitialized(false);
            console.log('Product cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // Get cache metadata
    const getCacheMetadata = useCallback(async () => {
        try {
            const metadataJson = await AsyncStorage.getItem(PRODUCTS_METADATA_KEY);
            return metadataJson ? JSON.parse(metadataJson) : null;
        } catch (error) {
            console.error('Error getting cache metadata:', error);
            return null;
        }
    }, []);

    return {
        products,
        loading,
        lastSyncTime,
        isInitialized,
        initializeProductCache,
        syncUpdatedProducts,
        downloadAllProducts,
        clearCache,
        getCacheMetadata,
    };
};

export default useProductCache;