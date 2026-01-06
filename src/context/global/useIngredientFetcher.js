import { useCallback, useRef, useEffect } from 'react';
import { useData } from './DataContext';
import { getMultipleIngredients } from '../../utils/ingredients';

const useIngredientFetcher = () => {
    const { ingredients, setIngredients } = useData();

    // Use ref to access current ingredients without causing callback recreation
    const ingredientsRef = useRef(ingredients);

    // Keep ref in sync with state
    useEffect(() => {
        ingredientsRef.current = ingredients;
    }, [ingredients]);

    /**
     * Fetches ingredients that are not already cached
     * @param {string[]} ingredientIds - Array of ingredient IDs to fetch
     * @returns {Promise<Object[]>} - Array of fetched ingredient objects
     */
    const fetchMissingIngredients = useCallback(async (ingredientIds) => {
        if (!ingredientIds || ingredientIds.length === 0) {
            return [];
        }

        try {
            // Use ref to get current ingredients without causing dependency changes
            const currentIngredients = ingredientsRef.current;

            // Filter out ingredients that are already cached
            const missingIds = ingredientIds.filter(id => !currentIngredients[id]);

            if (missingIds.length === 0) {
                // All ingredients are already cached
                return ingredientIds.map(id => currentIngredients[id]).filter(Boolean);
            }

            // Fetch missing ingredients
            const fetchedIngredients = await getMultipleIngredients(missingIds);

            // Create new ingredients object to add to cache
            const newIngredients = {};
            fetchedIngredients.forEach(ingredient => {
                if (ingredient && ingredient.id) {
                    newIngredients[ingredient.id] = ingredient;
                }
            });

            // Update global ingredients cache
            setIngredients(prev => ({ ...prev, ...newIngredients }));

            // Return all requested ingredients (cached + newly fetched)
            const allIngredients = { ...currentIngredients, ...newIngredients };
            const result = ingredientIds.map(id => allIngredients[id]).filter(Boolean);
            return result;

        } catch (error) {
            console.error('🧪 useIngredientFetcher: Error fetching', ingredientIds.length, 'ingredients:', error);
            throw error;
        }
    }, [setIngredients]);

    /**
     * Fetches ingredients for a specific product
     * @param {Object} product - Product object containing ingredients array
     * @returns {Promise<Object[]>} - Array of ingredient objects for the product
     */
    const fetchProductIngredients = useCallback(async (product) => {
        if (!product || !product.ingredients || !Array.isArray(product.ingredients)) {
            console.log('🧪 useIngredientFetcher: Product has no ingredients or invalid format');
            return [];
        }

        console.log('🧪 useIngredientFetcher: Fetching ingredients for product:', product.name || product.id, '- ingredient count:', product.ingredients.length);
        const result = await fetchMissingIngredients(product.ingredients);
        console.log('🧪 useIngredientFetcher: Product ingredients fetch complete for:', product.name || product.id);
        return result;
    }, [fetchMissingIngredients]);

    /**
     * Gets cached ingredients by IDs (does not fetch if missing)
     * @param {string[]} ingredientIds - Array of ingredient IDs
     * @returns {Object[]} - Array of cached ingredient objects
     */
    const getCachedIngredients = useCallback((ingredientIds) => {
        if (!ingredientIds || ingredientIds.length === 0) return [];

        const currentIngredients = ingredientsRef.current;
        return ingredientIds
            .map(id => currentIngredients[id])
            .filter(Boolean);
    }, []);

    /**
     * Checks if all ingredients are cached
     * @param {string[]} ingredientIds - Array of ingredient IDs to check
     * @returns {boolean} - True if all ingredients are cached
     */
    const areIngredientsCached = useCallback((ingredientIds) => {
        if (!ingredientIds || ingredientIds.length === 0) return true;

        const currentIngredients = ingredientsRef.current;
        return ingredientIds.every(id => currentIngredients[id]);
    }, []);

    return {
        fetchMissingIngredients,
        fetchProductIngredients,
        getCachedIngredients,
        areIngredientsCached,
        ingredients // Direct access to cached ingredients
    };
};

export default useIngredientFetcher;