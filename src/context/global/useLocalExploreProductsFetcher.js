import { useState, useCallback } from 'react';
import { getPersonalizedProducts } from '../../utils/localProductQueries';

const useLocalExploreProductsFetcher = (products) => {
    const [loading, setLoading] = useState(false);

    /**
     * Fetches personalized products from local cache based on user's skin profile
     * @param {Object} userSkinInfo - User's skin information
     * @param {number[]} userSkinInfo.skinConcerns - Array of skin concern IDs
     * @param {number} userSkinInfo.skinType - User's skin type ID
     * @param {number[]} userSkinInfo.sensitivities - Array of sensitivity IDs to avoid
     * @param {string[]} dislikedProducts - Array of product IDs to exclude
     * @param {number} limitCount - Maximum number of products to return (default: 10)
     * @returns {Promise<string[]>} - Array of personalized product IDs
     */
    const fetchPersonalizedProducts = useCallback(async (userSkinInfo, dislikedProducts = [], limitCount = 10) => {
        if (!userSkinInfo) {
            console.warn('No user skin info provided for personalized products');
            return [];
        }

        if (Object.keys(products).length === 0) {
            console.warn('Products not loaded in cache yet');
            return [];
        }

        setLoading(true);
        try {
            // Use local product query function
            const personalizedProducts = getPersonalizedProducts(products, userSkinInfo, dislikedProducts, limitCount);
            
            console.log('🎯 useLocalExploreProductsFetcher: Found', personalizedProducts.length, 'personalized products from LOCAL CACHE (no Firebase reads)');
            
            // Return only product IDs for compatibility
            return personalizedProducts.map(product => product.id);
        } catch (error) {
            console.error('Error fetching personalized products from cache:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [products]);

    /**
     * Optimized version that uses the same local filtering logic
     * @param {Object} userSkinInfo - User's skin information
     * @param {string[]} dislikedProducts - Array of product IDs to exclude
     * @param {number} limitCount - Maximum number of products to return (default: 10)
     * @returns {Promise<string[]>} - Array of personalized product IDs
     */
    const fetchPersonalizedProductsOptimized = useCallback(async (userSkinInfo, dislikedProducts = [], limitCount = 10) => {
        // Both functions now use the same local logic, so they're identical
        return await fetchPersonalizedProducts(userSkinInfo, dislikedProducts, limitCount);
    }, [fetchPersonalizedProducts]);

    return {
        fetchPersonalizedProducts,
        fetchPersonalizedProductsOptimized,
        loading
    };
};

export default useLocalExploreProductsFetcher;