import { IngredientSafetyRatings } from 'constants/ingredients';
import { getFirestore, doc, getDoc, collection, query, getDocs, where } from 'firebase/firestore';

/**
 * Fetches ingredient information from Firestore
 * @param {string} ingredientId - The ID of the ingredient to fetch
 * @returns {Promise<Object|null>} - The ingredient data or null if not found
 */
export const getIngredientInfo = async (ingredientId) => {
    try {
        const db = getFirestore();
        const ingredientRef = doc(db, 'ingredients', ingredientId);
        const ingredientSnap = await getDoc(ingredientRef);
        
        if (ingredientSnap.exists()) {
            return {
                id: ingredientSnap.id,
                ...ingredientSnap.data()
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('🧪 getIngredientInfo: Error fetching ingredient:', ingredientId, error);
        throw error;
    }
};

/**
 * Fetches multiple ingredients by their IDs
 * @param {string[]} ingredientIds - Array of ingredient IDs to fetch
 * @returns {Promise<Object[]>} - Array of ingredient data objects
 */
export const getMultipleIngredients = async (ingredientIds) => {
    try {
        const db = getFirestore();
        const ingredients = await Promise.all(
            ingredientIds.map(async (id) => {
                const ingredientRef = doc(db, 'ingredients', id);
                const ingredientSnap = await getDoc(ingredientRef);
                
                if (ingredientSnap.exists()) {
                    return {
                        id: ingredientSnap.id,
                        ...ingredientSnap.data()
                    };
                } else {
                    return null;
                }
            })
        );
        
        // Filter out null values
        const validIngredients = ingredients.filter(ingredient => ingredient !== null);
        return validIngredients;
    } catch (error) {
        console.error('🧪 getMultipleIngredients: Error fetching', ingredientIds.length, 'ingredients:', error);
        throw error;
    }
};

/**
 * Searches for ingredients by name or function
 * @param {string} searchTerm - The term to search for
 * @param {number} limitCount - Maximum number of results to return
 * @returns {Promise<Object[]>} - Array of matching ingredients
 */
export const searchIngredients = async (searchTerm, limitCount = 10) => {
    try {
        const db = getFirestore();
        const ingredientsRef = collection(db, 'ingredients');
        
        // Simple search by name (case-insensitive)
        const q = query(
            ingredientsRef,
            where('name', '>=', searchTerm.toLowerCase()),
            where('name', '<=', searchTerm.toLowerCase() + '\uf8ff')
        );
        
        const querySnapshot = await getDocs(q);
        const results = [];
        
        querySnapshot.forEach((doc) => {
            if (results.length < limitCount) {
                results.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });

        return results;
    } catch (error) {
        console.error('🧪 searchIngredients: Error searching ingredients with term:', searchTerm, error);
        throw error;
    }
};

export const getIngredientSafetyRating = (ingredient) => (
    IngredientSafetyRatings.find((isr => isr.value === ingredient?.safetyScore))
)