import { useEffect, useCallback } from 'react';
import reviewPromptService from '../services/ReviewPromptService';

/**
 * Hook to easily integrate review prompting throughout the app
 * 
 * @returns {Object} Object containing review prompt functions
 */
const useReviewPrompt = () => {
    
    // Initialize the service when hook is first used
    useEffect(() => {
        reviewPromptService.initialize();
    }, []);

    /**
     * Record a positive user action and potentially trigger a review prompt
     * @param {string} actionType - Type of action for analytics (optional)
     * @returns {Promise<boolean>} Whether a review prompt was shown
     */
    const recordPositiveAction = useCallback(async (actionType = 'generic') => {
        await reviewPromptService.recordPositiveAction(actionType);
        return await reviewPromptService.checkForReviewOpportunity();
    }, []);

    /**
     * Manually trigger a review prompt (if eligible)
     * @returns {Promise<boolean>} Whether a review prompt was shown
     */
    const promptForReview = useCallback(async () => {
        return await reviewPromptService.promptForReview();
    }, []);

    /**
     * Mark that the user has responded to a review prompt
     * This prevents future prompts from showing
     */
    const markUserResponded = useCallback(async () => {
        await reviewPromptService.markUserResponded();
    }, []);

    /**
     * Check if the user is eligible for a review prompt
     * @returns {Promise<boolean>} Whether user is eligible
     */
    const shouldPromptForReview = useCallback(async () => {
        return await reviewPromptService.shouldPromptForReview();
    }, []);

    /**
     * Get current review service statistics (useful for debugging)
     * @returns {Promise<Object>} Current stats
     */
    const getReviewStats = useCallback(async () => {
        return await reviewPromptService.getStats();
    }, []);

    return {
        recordPositiveAction,
        promptForReview,
        markUserResponded,
        shouldPromptForReview,
        getReviewStats,
    };
};

export default useReviewPrompt;