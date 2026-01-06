import { SkincareProductCategories } from "constants/products";
import { average, collection, doc, getAggregateFromServer, getDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "services/firebase/firebase";

export const getAverageProductRating = async (productId) => {
    const reviewsRef = collection(db, 'reviews')
    const q = query(reviewsRef, where('productId', '==', productId))
    const snapshot = await getAggregateFromServer(q, {
        averageRating: average('rating')
    })
    return snapshot.data().averageRating;
}

// DEPRECATED: Use getLocalProductById from DataContext instead
export const getProductInfo = async (productId) => {
    console.warn('getProductInfo is deprecated. Use getLocalProductById from DataContext instead.');
    const snapshot = await getDoc(doc(db, `products/${productId}`))
    if (snapshot.exists()) {
        return {
            id: snapshot.id,
            ...snapshot.data(),
        }
    }
    return null;
}

export const getProductCategory = (product) => {
    const match = SkincareProductCategories.find(spc => spc.value === product?.category);
    return match?.title ?? 'Unknown';
};

// Simple fuzzy search function
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

// Calculate search score for sorting
const calculateScore = (product, searchTerm) => {
    if (!searchTerm) return 0;
    
    const name = product.name || '';
    const brand = product.brand || '';
    const searchLower = searchTerm.toLowerCase();
    
    let score = 0;
    
    // Exact matches get highest score
    if (name.toLowerCase().includes(searchLower)) score += 100;
    if (brand.toLowerCase().includes(searchLower)) score += 80;
    
    // Fuzzy matches get lower score
    if (fuzzyMatch(name, searchTerm)) score += 50;
    if (fuzzyMatch(brand, searchTerm)) score += 30;
    
    // Boost score if match is at the beginning
    if (name.toLowerCase().startsWith(searchLower)) score += 50;
    if (brand.toLowerCase().startsWith(searchLower)) score += 30;
    
    return score;
};

// DEPRECATED: Use searchLocalProducts from DataContext instead
export const searchProducts = async (searchTerm, limitCount = 20) => {
    console.warn('searchProducts is deprecated. Use searchLocalProducts from DataContext instead.');
    try {
        const productsRef = collection(db, 'products');
        
        // Get products (increase limit for better search results)
        const q = query(productsRef, limit(limitCount * 3));
        const snapshot = await getDocs(q);
        
        let products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        if (!searchTerm || searchTerm.trim() === '') {
            // If no search term, return first products (can be sorted by any field later)
            return products.slice(0, limitCount);
        }

        // Filter and score products based on search term
        const searchResults = products
            .map(product => ({
                ...product,
                score: calculateScore(product, searchTerm)
            }))
            .filter(product => product.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limitCount)
            .map(({ score, ...product }) => product); // Remove score from final result

        return searchResults;
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
};