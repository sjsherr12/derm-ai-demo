import { RoutineProductTypes } from "constants/products";
import { ProductSafetyRatings } from "constants/products";
import { ProductSkinHarshnesses } from "../constants/products";

export const getRoutineTimeOfDay = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 17) {
        return RoutineProductTypes.indexOf('Morning')
    } else {
        return RoutineProductTypes.indexOf('Evening');
    }
};

export const getSafetyRating = (safetyScore) => {
    return ProductSafetyRatings.find(rating => 
        safetyScore >= rating.min && safetyScore <= rating.max
    )
}

export const getSkinHarshness = (skinHarshness) => {
    return ProductSkinHarshnesses.find(
        harshness => harshness.value === skinHarshness
    )
}

export const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getTodayDateString = () => {
    return getLocalDateString(new Date());
};

export const isToday = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

export const calculateStreak = (morningCompletions = [], eveningCompletions = []) => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if today is completed first (don't break streak if not completed yet)
    const todayString = getLocalDateString(currentDate);
    const todayHasMorning = morningCompletions.some(completion => {
        const completionDate = getLocalDateString(new Date(completion));
        return completionDate === todayString;
    });
    const todayHasEvening = eveningCompletions.some(completion => {
        const completionDate = getLocalDateString(new Date(completion));
        return completionDate === todayString;
    });
    
    // If today is completed, include it in streak
    if (todayHasMorning && todayHasEvening) {
        streak++;
    }
    
    // Start checking from yesterday onwards
    currentDate.setDate(currentDate.getDate() - 1);

    for (let i = 0; i < 365; i++) {
        const dateString = getLocalDateString(currentDate);
        
        const hasMorning = morningCompletions.some(completion => {
            const completionDate = getLocalDateString(new Date(completion));
            return completionDate === dateString;
        });
        
        const hasEvening = eveningCompletions.some(completion => {
            const completionDate = getLocalDateString(new Date(completion));
            return completionDate === dateString;
        });

        if (hasMorning && hasEvening) {
            streak++;
        } else {
            break;
        }

        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
};

export const calculateIndividualStreak = (completions = []) => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if today is completed first (don't break streak if not completed yet)
    const todayString = getLocalDateString(currentDate);
    const todayHasCompletion = completions.some(completion => {
        const completionDate = getLocalDateString(new Date(completion));
        return completionDate === todayString;
    });
    
    // If today is completed, include it in streak
    if (todayHasCompletion) {
        streak++;
    }
    
    // Start checking from yesterday onwards
    currentDate.setDate(currentDate.getDate() - 1);

    for (let i = 0; i < 365; i++) {
        const dateString = getLocalDateString(currentDate);
        
        const hasCompletion = completions.some(completion => {
            const completionDate = getLocalDateString(new Date(completion));
            return completionDate === dateString;
        });

        if (hasCompletion) {
            streak++;
        } else {
            break;
        }

        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
};

export const getRoutineCompletionStatus = (morningCompletions, eveningCompletions, routineType) => {
    const today = getTodayDateString();
    const morningIndex = RoutineProductTypes.indexOf('Morning');
    
    const todayMorningCompleted = morningCompletions.some(completion => {
        const converted = getLocalDateString(new Date(completion));
        return converted === today;
    });
    
    const todayEveningCompleted = eveningCompletions.some(completion => {
        const converted = getLocalDateString(new Date(completion));
        return converted === today;
    });

    if (routineType === morningIndex) {
        return todayMorningCompleted ? 'completed' : 'available';
    } else {
        return todayEveningCompleted ? 'completed' : 'available';
    }
};