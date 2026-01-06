import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';

const STORAGE_KEYS = {
    FIRST_LAUNCH: 'reviewService_firstLaunch',
    LAST_PROMPT: 'reviewService_lastPrompt', 
    PROMPT_COUNT: 'reviewService_promptCount',
    USER_RESPONDED: 'reviewService_userResponded',
    POSITIVE_ACTIONS: 'reviewService_positiveActions',
    SESSION_COUNT: 'reviewService_sessionCount',
};

class ReviewPromptService {
    constructor() {
        this.isInitialized = false;
        this.positiveActionCount = 0;
        this.sessionCount = 0;
        this.hasPromptedThisSession = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Set first launch date if not exists
            const firstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
            if (!firstLaunch) {
                await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, Date.now().toString());
            }

            // Load session count and increment
            const sessionCount = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
            this.sessionCount = sessionCount ? parseInt(sessionCount) + 1 : 1;
            await AsyncStorage.setItem(STORAGE_KEYS.SESSION_COUNT, this.sessionCount.toString());

            // Load positive action count
            const positiveActions = await AsyncStorage.getItem(STORAGE_KEYS.POSITIVE_ACTIONS);
            this.positiveActionCount = positiveActions ? parseInt(positiveActions) : 0;

            this.isInitialized = true;
        } catch (error) {
            console.warn('ReviewPromptService initialization failed:', error);
        }
    }

    async shouldPromptForReview() {
        try {
            await this.initialize();

            // Don't prompt if already prompted this session
            if (this.hasPromptedThisSession) return false;

            // Check if user has already responded to a review prompt
            const userResponded = await AsyncStorage.getItem(STORAGE_KEYS.USER_RESPONDED);
            if (userResponded === 'true') return false;

            // Check if app is available for review
            const isAvailable = await StoreReview.isAvailableAsync();
            if (!isAvailable) return false;

            // Timing constraints
            const firstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
            const daysSinceFirstLaunch = firstLaunch ? 
                (Date.now() - parseInt(firstLaunch)) / (1000 * 60 * 60 * 24) : 0;
            
            // Don't prompt if app installed less than 3 days ago
            if (daysSinceFirstLaunch < 3) return false;

            // Check last prompt time - don't prompt more than once every 14 days
            const lastPrompt = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT);
            if (lastPrompt) {
                const daysSinceLastPrompt = (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);
                if (daysSinceLastPrompt < 14) return false;
            }

            // Check prompt count - max 3 prompts total
            const promptCount = await AsyncStorage.getItem(STORAGE_KEYS.PROMPT_COUNT);
            if (promptCount && parseInt(promptCount) >= 3) return false;

            // Engagement-based triggers
            const engagementCriteria = [
                // Early adopter (good session count)
                this.sessionCount >= 7 && this.positiveActionCount >= 5,
                
                // Active user (high positive actions)
                this.positiveActionCount >= 15,
                
                // Long-term user (many sessions)
                this.sessionCount >= 20,
                
                // Super engaged (very high positive actions)
                this.positiveActionCount >= 30
            ];

            return engagementCriteria.some(criteria => criteria);
            
        } catch (error) {
            console.warn('Error checking review prompt eligibility:', error);
            return false;
        }
    }

    async promptForReview() {
        try {
            const shouldPrompt = await this.shouldPromptForReview();
            if (!shouldPrompt) return false;

            // Add haptic feedback
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            
            // Request review
            await StoreReview.requestReview();
            
            // Update tracking data
            this.hasPromptedThisSession = true;
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT, Date.now().toString());
            
            const currentCount = await AsyncStorage.getItem(STORAGE_KEYS.PROMPT_COUNT);
            const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
            await AsyncStorage.setItem(STORAGE_KEYS.PROMPT_COUNT, newCount.toString());
            
            return true;
        } catch (error) {
            console.warn('Error prompting for review:', error);
            return false;
        }
    }

    async recordPositiveAction(actionType = 'generic') {
        try {
            await this.initialize();
            this.positiveActionCount++;
            await AsyncStorage.setItem(STORAGE_KEYS.POSITIVE_ACTIONS, this.positiveActionCount.toString());

        } catch (error) {
            console.warn('Error recording positive action:', error);
        }
    }

    async markUserResponded() {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_RESPONDED, 'true');
        } catch (error) {
            console.warn('Error marking user responded:', error);
        }
    }

    // Method to check and potentially prompt based on positive actions
    async checkForReviewOpportunity() {
        // Only attempt every few positive actions to avoid spam
        if (this.positiveActionCount > 0 && this.positiveActionCount % 5 === 0) {
            return await this.promptForReview();
        }
        return false;
    }

    // Reset all data (useful for testing or user data reset)
    async reset() {
        try {
            await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
            this.positiveActionCount = 0;
            this.sessionCount = 0;
            this.hasPromptedThisSession = false;
            this.isInitialized = false;
        } catch (error) {
            console.warn('Error resetting review service data:', error);
        }
    }

    // Get current stats (useful for debugging/analytics)
    async getStats() {
        try {
            await this.initialize();
            const stats = {};
            
            for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
                const value = await AsyncStorage.getItem(storageKey);
                stats[key] = value;
            }
            
            stats.CURRENT_POSITIVE_ACTIONS = this.positiveActionCount;
            stats.CURRENT_SESSION_COUNT = this.sessionCount;
            stats.HAS_PROMPTED_THIS_SESSION = this.hasPromptedThisSession;
            
            return stats;
        } catch (error) {
            console.warn('Error getting review service stats:', error);
            return {};
        }
    }
}

// Export singleton instance
const reviewPromptService = new ReviewPromptService();
export default reviewPromptService;

// Export class for testing
export { ReviewPromptService };