import colors from "config/colors";
import {FontAwesome6, MaterialCommunityIcons} from '@expo/vector-icons'

export const IngredientFunctions = [
    {
        title: 'Anti-Acne',
        value: 0,
        description: 'Reduces breakouts by unclogging pores, regulating sebum, and inhibiting acne-causing bacteria.'
    },
    {
        title: 'Cell-Communicating',
        value: 1,
        description: 'Signals skin cells to behave more like healthy, younger cells, supporting overall skin renewal.'
    },
    {
        title: 'Exfoliation',
        value: 2,
        description: 'Removes dead skin cells to improve skin texture and support cell turnover.'
    },
    {
        title: 'Brightening',
        value: 3,
        description: 'Reduces hyperpigmentation, evens skin tone, and enhances radiance.'
    },
    {
        title: 'Skin-Identical',
        value: 4,
        description: 'Mimics natural components of the skin to support barrier repair and hydration.'
    },
    {
        title: 'Soothing',
        value: 5,
        description: 'Calms irritation, inflammation, and redness in sensitive or stressed skin.'
    },
    {
        title: 'Antibacterial',
        value: 6,
        description: 'Prevents or reduces bacterial growth, supporting clearer and healthier skin.'
    },
    {
        title: 'Buffering',
        value: 7,
        description: 'Helps maintain a stable pH in the formulation for optimal skin compatibility.'
    },
    {
        title: 'Chelating',
        value: 8,
        description: 'Binds metal ions to improve product stability and prevent ingredient degradation.'
    },
    {
        title: 'Emollient',
        value: 9,
        description: 'Softens and smooths the skin by filling in micro-cracks and sealing in moisture.'
    },
    {
        title: 'Emulsifying',
        value: 10,
        description: 'Helps mix oil and water components in a formula to maintain a stable texture.'
    },
    {
        title: 'Humectant',
        value: 11,
        description: 'Draws water into the skin for deep, long-lasting hydration.'
    },
    {
        title: 'Fragrance',
        value: 12,
        description: 'Adds scent to a product to enhance user experience.'
    },
    {
        title: 'Preservative',
        value: 13,
        description: 'Prevents microbial growth to maintain product safety and shelf life.'
    },
    {
        title: 'Solvent',
        value: 14,
        description: 'Dissolves other ingredients to help create a smooth and uniform product.'
    },
    {
        title: 'Cleansing',
        value: 15,
        description: 'Removes dirt, oil, and impurities from the skin’s surface.'
    },
    {
        title: 'Viscosity Control',
        value: 16,
        description: 'Modifies the thickness or flow of a product for easier application and stability.'
    },
    {
        title: 'Antistatic',
        value: 17,
        description: 'Reduces static electricity in hair products to prevent flyaways and frizz.'
    },
    {
        title: 'Skin Protectant',
        value: 18,
        description: 'Forms a protective barrier to shield skin from environmental aggressors.'
    },
    {
        title: 'Skin Conditioning',
        value: 19,
        description: 'Improves the overall appearance and feel of the skin by moisturizing or softening it.'
    },
    {
        title: 'Masking',
        value: 20,
        description: 'Reduces or neutralizes unpleasant odors in a cosmetic formulation.'
    },
    {
        title: 'Antioxidant',
        value: 21,
        description: 'Neutralizes free radicals and helps protect skin from oxidative stress and environmental damage.'
    },
    {
        title: 'Astringent',
        value: 22,
        description: 'Tightens skin and reduces the appearance of pores and oiliness.'
    },
    {
        title: 'Oral Care',
        value: 23,
        description: 'Supports dental hygiene and may reduce oral bacteria or freshen breath.'
    },
    {
        title: 'Tonic',
        value: 24,
        description: 'Invigorates or refreshes the skin, often found in toners and aftershaves.'
    },
    {
        title: 'UV Protection',
        value: 25,
        description: 'Absorbs or blocks ultraviolet rays to protect skin from sun damage.'
    },
    {
        title: 'Hair Conditioning',
        value: 26,
        description: 'Improves the softness, manageability, and appearance of hair.'
    },
    {
        title: 'Even Tone',
        value: 27,
        description: 'Helps reduce discoloration and uneven pigmentation.'
    },
    {
        title: 'Barrier Support',
        value: 28,
        description: 'Strengthens the skin’s natural defenses and reduces moisture loss.'
    },
    {
        title: 'Texture Enhancing',
        value: 29,
        description: 'Improves formula feel, spreadability, and overall cosmetic elegance.'
    },
    {
        title: 'Wound Healing',
        value: 30,
        description: 'Promotes the skin’s recovery from minor damage, inflammation, or breakouts.'
    }
];

export const IngredientSafetyRatings = [
    {
        name: 'Perfect',
        value: 1,
        color:colors.accents.success
    },
    {
        name: 'Fine',
        value: 2,
        color:colors.accents.info
    },
    {
        name: 'Questionable',
        value:3,
        color:colors.accents.warning
    },
    {
        name:'Concerning',
        value:4,
        color:colors.accents.severe
    },
    {
        name:'Avoid',
        value:5,
        color:colors.accents.error
    }
]

export const CommonIngredientConcerns = [
    {
        name: 'Carcinogenicity',
        description:'Assesses potential cancer-causing effects.',
        icon:'dna',
        IconComponent: MaterialCommunityIcons,
    },
    {
        name: 'Allergy or Irritation Risk',
        description:'Evaluates risk of skin sensitivity or allergies.',
        icon:'alert-circle-outline',
        IconComponent: MaterialCommunityIcons,
    },
    {
        name: 'Reproductive Toxicity',
        description:'Measures likelihood of reproductive issues.',
        icon:'disease',
        IconComponent: FontAwesome6,
    },
    {
        name: 'Use Restriction',
        description:'Indicates limitations on ingredient use or regulation.',
        icon:'alert-circle-outline',
        IconComponent: MaterialCommunityIcons,
    }
]

export const CommonIngredientConcernRankings = [
    {
        name: 'Unknown',
        value:-1,
    },
    {
        name:'None',
        value:0,
        color:'#f4f4f4'
    },
    {
        name:'Low',
        value:1,
        color:colors.accents.success
    },
    {
        name:'Moderate',
        value:2,
        color:colors.accents.warning
    },
    {
        name:'High',
        value:3,
        color:colors.accents.error
    }
]