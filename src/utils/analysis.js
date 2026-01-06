import { SkincareAnalysisSeverities } from "constants/analysis"

export const getSeverityRating = (severeness) => {
    return SkincareAnalysisSeverities.find(severity => 
        severeness >= severity.min && severeness <= severity.max
    )
}

export const convertSkinConcernSeverityIdToName = (sevId) => {
    return sevId
        .split(/(?=[A-Z])/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}