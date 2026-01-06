import { SkincareProductCategories } from "constants/products";

// Helper to check if products data is valid
const isValidProductsData = (products) => {
    return products && typeof products === 'object' && !Array.isArray(products);
};

// Create compressed category search map for efficient matching
const categorySearchMap = SkincareProductCategories.map(cat => ({
    value: cat.value,
    searchTerms: [
        cat.title.toLowerCase(),
        cat.displayLabel.toLowerCase(),
        cat.pluralTitle.toLowerCase(),
        ...cat.title.toLowerCase().split(' '),
    ].filter((v, i, a) => a.indexOf(v) === i) // unique values only
}));

// Simple fuzzy search function (moved from products.js)
const fuzzyMatch = (text, pattern) => {
    if (!text || !pattern) return false;

    text = text.toLowerCase();
    pattern = pattern.toLowerCase();

    // Exact match
    if (text.includes(pattern)) return true;

    // Check if all characters in pattern exist in text in order
    let patternIndex = 0;
    for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
        if (text[i] === pattern[patternIndex]) {
            patternIndex++;
        }
    }
    return patternIndex === pattern.length;
};

// Calculate search score for sorting with improved brand+product and category matching
const calculateScore = (product, searchTerm) => {
    if (!searchTerm) return 0;

    const name = (product.name || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    // Create combined text for brand+product searches
    const brandPlusName = `${brand} ${name}`.trim();

    // Get category name for this product
    const categoryMatch = SkincareProductCategories.find(cat => cat.value === product.category);
    const categoryName = categoryMatch ? categoryMatch.title.toLowerCase() : '';
    const categoryPlural = categoryMatch ? categoryMatch.pluralTitle.toLowerCase() : '';

    let score = 0;

    // === HIGHEST PRIORITY: Exact combined brand+product match ===
    if (brandPlusName.includes(searchLower)) {
        score += 200; // Highest score for exact brand+product match
    }

    // === HIGH PRIORITY: Exact name/brand matches ===
    if (name.includes(searchLower)) score += 100;
    if (brand.includes(searchLower)) score += 80;

    // === CATEGORY MATCHING: Match category names ===
    // Exact category match
    if (categoryName && (categoryName === searchLower || categoryPlural === searchLower)) {
        score += 150;
    }
    // Partial category match (e.g., "clean" matches "cleanser")
    else if (categoryName && (categoryName.includes(searchLower) || searchLower.includes(categoryName))) {
        score += 120;
    }
    // Fuzzy category match
    else if (categoryName && fuzzyMatch(categoryName, searchTerm)) {
        score += 90;
    }

    // === TOKEN-BASED MATCHING: Split search into words ===
    const searchTokens = searchLower.split(/\s+/).filter(t => t.length > 0);
    if (searchTokens.length > 1) {
        let tokenMatchScore = 0;
        let brandTokens = brand.split(/\s+/);
        let nameTokens = name.split(/\s+/);

        // Check if all tokens appear in brand+name combination
        const allTokensMatch = searchTokens.every(token =>
            brandPlusName.includes(token)
        );

        if (allTokensMatch) {
            tokenMatchScore += 180; // High score for all tokens present
        }

        // Check individual token matches
        searchTokens.forEach(token => {
            if (brand.includes(token)) tokenMatchScore += 40;
            if (name.includes(token)) tokenMatchScore += 50;
            if (brandTokens.some(bt => bt.startsWith(token))) tokenMatchScore += 30;
            if (nameTokens.some(nt => nt.startsWith(token))) tokenMatchScore += 35;
        });

        score += tokenMatchScore;
    }

    // === FUZZY MATCHES: Lower priority ===
    if (fuzzyMatch(name, searchTerm)) score += 50;
    if (fuzzyMatch(brand, searchTerm)) score += 30;
    if (fuzzyMatch(brandPlusName, searchTerm)) score += 70;

    // === BOOST: Starting matches ===
    if (name.startsWith(searchLower)) score += 50;
    if (brand.startsWith(searchLower)) score += 30;
    if (brandPlusName.startsWith(searchLower)) score += 60;

    return score;
};

// Get product by ID from local state
export const getProductById = (products, productId) => {
    if (!isValidProductsData(products)) {
        return null;
    }
    return products[productId] || null;
};

// Get multiple products by IDs
export const getProductsByIds = (products, productIds) => {
    if (!isValidProductsData(products) || !Array.isArray(productIds)) {
        return [];
    }
    return productIds
        .map(id => products[id])
        .filter(product => product !== undefined);
};

// Filter products by skin concerns
export const filterProductsByConcern = (products, skinConcerns, limitCount = 20) => {
    if (!isValidProductsData(products)) {
        return [];
    }
    
    if (!Array.isArray(skinConcerns) || skinConcerns.length === 0) {
        return Object.values(products).slice(0, limitCount);
    }
    
    return Object.values(products)
        .filter(product => {
            return product.skinConcerns && 
                   Array.isArray(product.skinConcerns) &&
                   skinConcerns.some(concern => product.skinConcerns.includes(concern));
        })
        .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
        .slice(0, limitCount);
};

// Filter products by skin type
export const filterProductsBySkinType = (products, skinType, limitCount = 20) => {
    if (!skinType) {
        return Object.values(products).slice(0, limitCount);
    }
    
    return Object.values(products)
        .filter(product => {
            return product.skinTypes && 
                   Array.isArray(product.skinTypes) &&
                   product.skinTypes.includes(skinType);
        })
        .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
        .slice(0, limitCount);
};

// Get personalized products based on user skin profile with sophisticated matching
export const getPersonalizedProducts = (products, userSkinInfo, dislikedProducts = [], limitCount = 10) => {
    if (!isValidProductsData(products)) {
        return [];
    }
    
    if (!userSkinInfo) {
        console.warn('No user skin info provided for personalized products');
        return [];
    }

    const { skinConcerns, skinType, sensitivities } = userSkinInfo;
    const allProducts = Object.values(products);

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

    // Remove the scoring metadata before returning
    return finalProducts.map(({ personalizedScore, isValid, ...product }) => product);
};

// Search products locally with improved matching and scoring
export const searchProductsLocally = (products, searchTerm, limitCount = 20) => {
    const productsArray = Object.values(products);

    if (!searchTerm || searchTerm.trim() === '') {
        // If no search term, return first products sorted by safety score
        return productsArray
            .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
            .slice(0, limitCount);
    }

    // Trim the search term to handle untrimmed edges
    const trimmedSearchTerm = searchTerm.trim();

    // Filter and score products based on search term
    const searchResults = productsArray
        .map(product => ({
            ...product,
            score: calculateScore(product, trimmedSearchTerm)
        }))
        .filter(product => product.score > 0)
        .sort((a, b) => {
            // Primary sort: by search relevance score (descending)
            // This ensures most relevant matches appear first
            const scoreDiff = b.score - a.score;
            if (scoreDiff !== 0) {
                return scoreDiff;
            }
            // Secondary sort: by safety score (descending) as tiebreaker
            return (b.safetyScore || 0) - (a.safetyScore || 0);
        })
        .slice(0, limitCount)
        .map(({ score, ...product }) => product); // Remove score from final result

    return searchResults;
};

// Filter products by category
export const filterProductsByCategory = (products, category, limitCount = 20) => {
    if (!category) {
        return Object.values(products).slice(0, limitCount);
    }
    
    return Object.values(products)
        .filter(product => product.category === category)
        .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
        .slice(0, limitCount);
};

// Get products with high safety scores
export const getHighSafetyProducts = (products, minSafetyScore = 70, limitCount = 20) => {
    return Object.values(products)
        .filter(product => (product.safetyScore || 0) >= minSafetyScore)
        .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
        .slice(0, limitCount);
};

// Get products for specific routine type (morning/evening)
export const getRoutineProducts = (products, routineType, limitCount = 20) => {
    // This would need to be customized based on your product data structure
    // For now, return all products sorted by safety score
    return Object.values(products)
        .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
        .slice(0, limitCount);
};

// Get product category name
export const getProductCategory = (product) => {
    const match = SkincareProductCategories.find(spc => spc.value === product?.category);
    return match?.title ?? 'Unknown';
};

// Get trending products with pseudo-random weighted by quality
export const getTrendingProducts = (products, limitCount = 25) => {
    if (!isValidProductsData(products)) {
        return [];
    }

    const highQualityProducts = Object.values(products)
        .filter(product => (product.safetyScore || 0) >= 60); // Only decent quality products
    
    // Create a weighted random sort that favors higher safety scores
    return highQualityProducts
        .map(product => ({
            ...product,
            // Add random weight but bias toward higher safety scores
            randomWeight: Math.random() * (1 + (product.safetyScore || 0) / 100)
        }))
        .sort((a, b) => b.randomWeight - a.randomWeight) // Sort by weighted random
        .slice(0, limitCount)
        .map(({ randomWeight, ...product }) => product.id); // Remove the weight property
};

// Advanced filtering with multiple criteria
export const filterProductsAdvanced = (products, filters, limitCount = 20) => {
    const {
        skinConcerns,
        skinType,
        sensitivities,
        category,
        minSafetyScore,
        maxPrice,
        brand,
        excludeIds = []
    } = filters;

    let filteredProducts = Object.values(products).filter(product => {
        // Exclude specific product IDs
        if (excludeIds.includes(product.id)) return false;

        // Category filter
        if (category && product.category !== category) return false;

        // Safety score filter
        if (minSafetyScore && (product.safetyScore || 0) < minSafetyScore) return false;

        // Price filter (if price data is available)
        if (maxPrice && product.price && product.price > maxPrice) return false;

        // Brand filter
        if (brand && product.brand !== brand) return false;

        // Skin concerns filter
        if (skinConcerns?.length > 0) {
            if (!product.skinConcerns || !Array.isArray(product.skinConcerns) ||
                !skinConcerns.some(concern => product.skinConcerns.includes(concern))) {
                return false;
            }
        }

        // Skin type filter
        if (skinType) {
            if (!product.skinTypes || !Array.isArray(product.skinTypes) ||
                !product.skinTypes.includes(skinType)) {
                return false;
            }
        }

        // Sensitivities filter (exclude products with user sensitivities)
        if (sensitivities?.length > 0) {
            if (product.sensitivities && Array.isArray(product.sensitivities) &&
                sensitivities.some(sensitivity => product.sensitivities.includes(sensitivity))) {
                return false;
            }
        }

        return true;
    });

    // Sort by safety score descending
    filteredProducts.sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0));

    return filteredProducts.slice(0, limitCount);
};