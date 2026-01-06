import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from 'services/firebase/firebase';

const PRODUCTS_STORAGE_KEY = '@skincare_products';
const LAST_SYNC_KEY = '@products_last_sync';
const PRODUCTS_METADATA_KEY = '@products_metadata';

const ProductCacheContext = createContext(null);

export const ProductCacheProvider = ({ children }) => {
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const initializingRef = useRef(false);

    // Helper function to find latest createdAt or updatedAt timestamp from products
    const findLatestTimestamp = useCallback((productsData) => {
        if (!productsData || Object.keys(productsData).length === 0) return null;
        
        let latestTimestamp = null;
        Object.values(productsData).forEach(product => {
            // Check both createdAt and updatedAt fields
            const timestamps = [product.createdAt, product.updatedAt].filter(Boolean);
            
            timestamps.forEach(timestampField => {
                // Handle both Firestore Timestamp and ISO string formats
                let timestamp;
                if (timestampField.toDate) {
                    // Firestore Timestamp
                    timestamp = timestampField.toDate();
                } else if (typeof timestampField === 'string') {
                    // ISO string
                    timestamp = new Date(timestampField);
                } else if (timestampField.seconds) {
                    // Firestore Timestamp as plain object
                    timestamp = new Date(timestampField.seconds * 1000);
                }
                
                if (timestamp && (!latestTimestamp || timestamp > latestTimestamp)) {
                    latestTimestamp = timestamp;
                }
            });
        });
        
        return latestTimestamp;
    }, []);

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
            // Clear corrupted data but don't clear cache entirely
            try {
                await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
                await AsyncStorage.removeItem(LAST_SYNC_KEY);
                await AsyncStorage.removeItem(PRODUCTS_METADATA_KEY);
            } catch (cleanupError) {
                console.error('Error cleaning up corrupted storage:', cleanupError);
            }
        }
        return null;
    }, []);

    // Save products to storage
    const saveToStorage = useCallback(async (productsData) => {
        try {
            await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(productsData));
            await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
            
            // Save metadata
            const metadata = {
                totalProducts: Object.keys(productsData).length,
                lastUpdated: new Date().toISOString(),
            };
            await AsyncStorage.setItem(PRODUCTS_METADATA_KEY, JSON.stringify(metadata));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }, []);

    // Download all products from Firestore
    const downloadAllProducts = useCallback(async () => {
        try {
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

            return productsData;
        } catch (error) {
            console.error('Error downloading products:', error);
            throw error;
        }
    }, [saveToStorage]);

    // Check if newer products exist (your smart approach!)
    const checkForNewerProducts = useCallback(async () => {
        try {
            // Always calculate from cached products (single source of truth)
            const latestCachedTimestamp = findLatestTimestamp(products);

            if (!latestCachedTimestamp) {
                // No cached products or no timestamps, assume we need to check
                return true;
            }
            
            // Query for products with createdAt > latest cached timestamp
            const newerCreatedQuery = query(
                collection(db, 'products'),
                where('createdAt', '>', latestCachedTimestamp),
                limit(1)
            );
            
            // Query for products with updatedAt > latest cached timestamp  
            const newerUpdatedQuery = query(
                collection(db, 'products'),
                where('updatedAt', '>', latestCachedTimestamp),
                limit(1)
            );
            
            // Run both queries in parallel
            const [createdSnapshot, updatedSnapshot] = await Promise.all([
                getDocs(newerCreatedQuery),
                getDocs(newerUpdatedQuery)
            ]);
            
            const hasNewerProducts = !createdSnapshot.empty || !updatedSnapshot.empty;

            console.log(hasNewerProducts)
            
            if (hasNewerProducts) {
                console.log('📦 New/updated products detected:', {
                    newProducts: createdSnapshot.size,
                    updatedProducts: updatedSnapshot.size
                });
            }

            return hasNewerProducts;
        } catch (error) {
            console.error('Error checking for newer products:', error);
            // Return true on error to be safe and trigger a sync
            return true;
        }
    }, [findLatestTimestamp, products]);

    // Download only new products and merge with existing cache
    const downloadNewProducts = useCallback(async () => {
        try {
            // Always calculate from cached products (single source of truth)
            const latestCachedTimestamp = findLatestTimestamp(products);
            if (!latestCachedTimestamp) {
                return await downloadAllProducts();
            }

            // Query for products with createdAt > latest cached timestamp
            const newProductsQuery = query(
                collection(db, 'products'),
                where('createdAt', '>', latestCachedTimestamp),
                orderBy('createdAt', 'asc')
            );
            
            // Query for products with updatedAt > latest cached timestamp
            const updatedProductsQuery = query(
                collection(db, 'products'),
                where('updatedAt', '>', latestCachedTimestamp),
                orderBy('updatedAt', 'asc')
            );
            
            // Run both queries in parallel
            const [newSnapshot, updatedSnapshot] = await Promise.all([
                getDocs(newProductsQuery),
                getDocs(updatedProductsQuery)
            ]);
            
            if (newSnapshot.empty && updatedSnapshot.empty) {
                return products; // Return existing products
            }
            
            console.log('🔄 Syncing products:', {
                newProducts: newSnapshot.size,
                updatedProducts: updatedSnapshot.size
            });
            
            // Create new products object with existing products
            const newProductsData = { ...products };
            
            // Add/update products from both queries
            newSnapshot.docs.forEach(doc => {
                newProductsData[doc.id] = {
                    id: doc.id,
                    ...doc.data(),
                };
            });
            
            updatedSnapshot.docs.forEach(doc => {
                newProductsData[doc.id] = {
                    id: doc.id,
                    ...doc.data(),
                };
            });
            
            // Update state and save to storage
            setProducts(newProductsData);
            await saveToStorage(newProductsData);
            
            console.log('✅ Product cache updated successfully');

            return newProductsData;
        } catch (error) {
            console.error('Error downloading new products:', error);
            throw error;
        }
    }, [findLatestTimestamp, downloadAllProducts, products, saveToStorage]);

    // Initialize cache - loads once on app startup
    const initializeCache = useCallback(async () => {
        if (initializingRef.current || isInitialized) return;
        
        initializingRef.current = true;
        setLoading(true);
        
        try {
            console.log('🔄 ProductCache: Initializing cache...');
            
            // Try to load from storage first
            const cachedProducts = await loadFromStorage();
            
            if (!cachedProducts || Object.keys(cachedProducts).length === 0) {
                console.log('📦 ProductCache: No cached products found, downloading from Firestore...');
                // No cache exists, download from Firestore
                await downloadAllProducts();
                console.log('✅ ProductCache: Downloaded products from Firestore');
            } else {
                console.log('📦 ProductCache: Loaded', Object.keys(cachedProducts).length, 'products from cache');
            }
            
            setIsInitialized(true);
        } catch (error) {
            console.error('❌ ProductCache: Error initializing cache:', error);
            // Try to use any cached data we might have as fallback
            try {
                const fallbackProducts = await loadFromStorage();
                if (fallbackProducts && Object.keys(fallbackProducts).length > 0) {
                    console.log('📦 ProductCache: Using fallback cached products:', Object.keys(fallbackProducts).length);
                    setIsInitialized(true);
                } else {
                    console.log('❌ ProductCache: No fallback products available, will retry on next app launch');
                    // Don't set isInitialized to true - allow retry on next launch
                }
            } catch (fallbackError) {
                console.error('❌ ProductCache: Fallback loading failed:', fallbackError);
                // Still don't set isInitialized - allow retry
            }
        } finally {
            setLoading(false);
            initializingRef.current = false;
        }
    }, [isInitialized, loadFromStorage, downloadAllProducts]);

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

    // Initialize cache on mount
    useEffect(() => {
        initializeCache();
    }, [initializeCache]);


    // Check and update products if needed (main function to call on app focus)
    const checkAndUpdateProducts = useCallback(async () => {
        try {
            if (!isInitialized) {
                console.log('📦 ProductCache: Cannot check for updates - cache not initialized');
                return false;
            }

            // If we have no products at all, download everything
            if (!products || Object.keys(products).length === 0) {
                console.log('📦 ProductCache: No products in cache, downloading all products...');
                await downloadAllProducts();
                return true;
            }

            console.log('🔄 ProductCache: Checking for newer products...');
            const hasNewerProducts = await checkForNewerProducts();
            
            if (hasNewerProducts) {
                console.log('📦 ProductCache: Newer products found, downloading...');
                await downloadNewProducts();
                return true; // Products were updated
            } else {
                console.log('✅ ProductCache: Products are up to date');
                return false; // No updates needed
            }
        } catch (error) {
            console.error('❌ ProductCache: Error checking and updating products:', error);
            return false;
        }
    }, [isInitialized, checkForNewerProducts, downloadNewProducts, products, downloadAllProducts]);

    return (
        <ProductCacheContext.Provider value={{
            products,
            loading,
            isInitialized,
            initializeCache,
            downloadAllProducts,
            getCacheMetadata,
            checkAndUpdateProducts,
            checkForNewerProducts,
            downloadNewProducts,
        }}>
            {children}
        </ProductCacheContext.Provider>
    );
};

export const useProductCache = () => {
    const context = useContext(ProductCacheContext);
    if (!context) {
        throw new Error('useProductCache must be used within a ProductCacheProvider');
    }
    return context;
};