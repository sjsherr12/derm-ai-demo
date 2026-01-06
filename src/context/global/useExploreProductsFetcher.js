import { useState, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from 'services/firebase/firebase';

const useExploreProductsFetcher = (products, setProducts) => {
    const [loading, setLoading] = useState(false);

    /**
     * Fetches personalized products based on user's skin profile using local cache
     * @param {Object} userSkinInfo - User's skin information
     * @param {number[]} userSkinInfo.skinConcerns - Array of skin concern IDs
     * @param {number} userSkinInfo.skinType - User's skin type ID
     * @param {number[]} userSkinInfo.sensitivities - Array of sensitivity IDs to avoid
     * @param {string[]} dislikedProducts - Array of product IDs to exclude
     * @param {number} limitCount - Maximum number of products to return (default: 10)
     * @returns {Promise<string[]>} - Array of personalized product IDs
     */
    const fetchPersonalizedProducts = useCallback(async (userSkinInfo, dislikedProducts = [], limitCount = 10) => {
        // Use the same sophisticated logic as the optimized version
        return await fetchPersonalizedProductsOptimized(userSkinInfo, dislikedProducts, limitCount);
    }, [fetchPersonalizedProductsOptimized]);

    /**
     * Fetches personalized products using sophisticated local matching from cached data
     * @param {Object} userSkinInfo - User's skin information
     * @param {string[]} dislikedProducts - Array of product IDs to exclude
     * @param {number} limitCount - Maximum number of products to return (default: 10)
     * @returns {Promise<string[]>} - Array of personalized product IDs
     */
    const fetchPersonalizedProductsOptimized = useCallback(async (userSkinInfo, dislikedProducts = [], limitCount = 10) => {
        if (!userSkinInfo) {
            console.warn('No user skin info provided for personalized products');
            return [];
        }

        const { skinConcerns, skinType, sensitivities } = userSkinInfo;

        setLoading(true);
        try {
            // Get all products from local cache
            const allProducts = Object.values(products);
            
            if (allProducts.length === 0) {
                console.warn('No products available in local cache');
                return [];
            }

            // Filter and score products based on user profile
            const scoredProducts = allProducts.map(product => {
                let score = 0;
                let isValid = true;

                // 1. Skin Type Match - must include user's skin type
                if (skinType) {
                    if (product.skinTypes && Array.isArray(product.skinTypes) && product.skinTypes.includes(skinType)) {
                        score += 50; // High weight for skin type compatibility
                    } else {
                        isValid = false; // Exclude if doesn't match skin type
                    }
                }

                // 2. Skin Concerns Match - count matching concerns and weight heavily
                if (skinConcerns && skinConcerns.length > 0 && product.skinConcerns && Array.isArray(product.skinConcerns)) {
                    const matchingConcerns = skinConcerns.filter(concern => product.skinConcerns.includes(concern));
                    if (matchingConcerns.length > 0) {
                        // Score increases with more matching concerns
                        score += matchingConcerns.length * 30; // 30 points per matching concern
                        // Bonus for high percentage match
                        const matchPercentage = matchingConcerns.length / skinConcerns.length;
                        score += matchPercentage * 20; // Up to 20 bonus points
                    }
                }

                // 3. Sensitivities Filter - EXCLUDE if contains any user sensitivities
                if (sensitivities && sensitivities.length > 0 && product.sensitivities && Array.isArray(product.sensitivities)) {
                    const hasSensitivity = sensitivities.some(sensitivity => product.sensitivities.includes(sensitivity));
                    if (hasSensitivity) {
                        isValid = false; // Hard exclude for sensitivities
                    }
                }

                // 4. Disliked Products Filter - EXCLUDE if in disliked list
                if (dislikedProducts && dislikedProducts.includes(product.id)) {
                    isValid = false;
                }

                // 5. Safety Score - add safety score to overall score
                const safetyScore = product.safetyScore || 0;
                score += safetyScore * 0.5; // Weight safety score at 50% of its value

                return {
                    ...product,
                    personalizedScore: score,
                    isValid
                };
            });

            // Filter out invalid products
            const validProducts = scoredProducts.filter(product => product.isValid);

            // Sort by personalized score (desc), then by safety score (desc) as tiebreaker
            validProducts.sort((a, b) => {
                if (a.personalizedScore !== b.personalizedScore) {
                    return b.personalizedScore - a.personalizedScore;
                }
                // Tiebreaker: safety score
                return (b.safetyScore || 0) - (a.safetyScore || 0);
            });

            // Filter out disliked products and slice to limit
            const finalProducts = validProducts
                .filter(product => !dislikedProducts?.includes(product.id))
                .slice(0, limitCount);
            
            console.log('🎯 useExploreProductsFetcher: Found', finalProducts.length, 'personalized products from', allProducts.length, 'LOCAL CACHE products (no Firebase reads)');
            
            // Return only product IDs
            return finalProducts.map(product => product.id);

        } catch (error) {
            console.error('Error fetching personalized products from cache:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [products]);

    return {
        fetchPersonalizedProducts,
        fetchPersonalizedProductsOptimized,
        loading
    };
};

export default useExploreProductsFetcher;