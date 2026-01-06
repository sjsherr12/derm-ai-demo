import colors from "config/colors";

export const SkincareAnalysisSeverities = [
    {
        name:'Extreme',
        min:0,
        max:29,
        color:colors.accents.error,
    },
    {
        name:'Severe',
        min:30,
        max:49,
        color:colors.accents.severe,
    },
    {
        name:'Moderate',
        min:50,
        max:69,
        color:colors.accents.warning,
    },
    {
        name:'Fine',
        min:70,
        max:85,
        color:colors.accents.info,
    },
    {
        name:'Great',
        min:86,
        max:100,
        color:colors.accents.success
    }
]