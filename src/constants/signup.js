import {Ionicons} from '@expo/vector-icons'
import Constants from 'expo-constants'

export const Genders = [
    {
        title: 'Male',
        value: 0
    },
    {
        title: 'Female',
        value: 1
    },
    {
        title: 'Other',
        value: 2
    }
];

export const AgeGroups = [
    {
        title: 'Under 21',
        value: 0
    },
    {
        title: '21 to 30',
        value: 1
    },
    {
        title: '31 to 40',
        value: 2
    },
    {
        title: '41 to 50',
        value: 3
    },
    {
        title: '51 to 60',
        value: 4
    },
    {
        title: '61 or above',
        value: 5
    }
];

export const SkinTypes = [
    {
        title: 'Normal',
        displayLabel: 'Normal',
        value: 0,
        description: 'Well-balanced, not too oily or dry.',
        icon: 'star-outline'
    },
    // {
    //     title: 'Sensitive',
    //     value: 1,
    //     description: 'Easily irritated by certain products.',
    //     icon: 'hand-left-outline'
    // },
    {
        title: 'Oily',
        displayLabel: 'Oily',
        value: 2,
        description: 'Shiny, prone to acne or enlarged pores.',
        icon: 'water-outline'
    },
    {
        title: 'Dry',
        displayLabel: 'Dry',
        value: 3,
        description: 'Skin feels tight, dull or flaky.',
        icon: 'leaf-outline'
    },
    {
        title: 'Combination',
        displayLabel: 'Combination',
        value: 4,
        description: 'Oily in some areas, dry in others.',
        icon: 'options-outline'
    }
];

export const SkinTones = [
    {
        title: 'Type I',
        value: 0,
        description: 'Pale White: Always burns, never tans.',
        color: '#F4E5C8'
    },
    {
        title: 'Type II',
        value: 1,
        description: 'Fair: Usually burns, difficult to tan.',
        color: '#E8BB94'
    },
    {
        title: 'Type III',
        value: 2,
        description: 'White to Olive: Sometimes mild burns.',
        color: '#ECBC8B'
    },
    {
        title: 'Type IV',
        value: 3,
        description: 'Tan: Rarely burns, tans easily.',
        color: '#BB9065'
    },
    {
        title: 'Type V',
        value: 4,
        description: 'Brown: Very rarely burns, tans easily.',
        color: '#8E522D'
    },
    {
        title: 'Type VI',
        value: 5,
        description: 'Dark Brown: Never burns, tans easily.',
        color: '#523F38'
    }
];

export const SkinSensitivities = [
    {
        title: 'Not sensitive',
        value: 0,
        description: 'Rarely reacts to products or environments.',
        icon: 'sparkles-outline'
    },
    {
        title: 'Slightly Sensitive',
        value: 1,
        description: 'Occasionally experiences mild irritation.',
        icon: 'hand-left-outline'
    },
    {
        title: 'Moderately Sensitive',
        value: 2,
        description: 'Often reacts to new products or stress.',
        icon: 'flask-outline'
    },
    {
        title: 'Very Sensitive',
        value: 3,
        description: 'Easily irritated by most products.',
        icon: 'alert-circle-outline'
    }
];

export const SkinConcerns = [
    {
        title: 'No main concerns',
        displayLabel: 'None',
        displayConcern: 'None',
        value: 0,
        description: 'Just browsing, no main concerns.',
        severityId: 'overall',
    },
    {
        title: 'Acne and Breakouts',
        displayLabel: 'Acne',
        displayConcern: 'Acne',
        value: 1,
        description: 'Pimples, blackheads, and clogged pores.',
        severityId:'acne',
    },
    {
        title: 'Redness or Irritation',
        displayLabel: 'Redness',
        displayConcern: 'Redness',
        value: 2,
        description: 'Rosacea, inflamed, or irritated skin.',
        severityId:'redness',
    },
    {
        title: 'Oiliness and Shine',
        displayLabel: 'Oiliness',
        displayConcern: 'Oiliness',
        value: 3,
        description: 'Excess oil with shiny or greasy skin.',
        severityId:'oiliness',
    },
    {
        title: 'Dryness or Flakiness',
        displayLabel: 'Dryness',
        displayConcern: 'Dryness',
        value: 4,
        description: 'Tight, rough, or peeling skin.',
        severityId:'dryness',
    },
    {
        title: 'Uneven Tone or Pigmentation',
        displayLabel: 'Uneven Tone',
        displayConcern: 'Tone',
        value: 5,
        description: 'Dark spots or discoloration on skin.',
        severityId:'tone',
    },
    {
        title: 'Aging Concerns',
        displayLabel: 'Anti-Aging',
        displayConcern: 'Aging',
        value: 6,
        description: 'Wrinkles, fine lines, crow\'s feet.',
        severityId:'aging',
    },
    {
        title: 'Enlarged Pores and Texture',
        displayLabel: 'Large Pores',
        displayConcern: 'Pores',
        value: 7,
        description: 'Large pores or rough skin surface.',
        severityId:'pores',
    },
    {
        title: 'Dark Circles and Puffiness',
        displayLabel: 'Dark Circles',
        displayConcern: 'Circles',
        value: 8,
        description: 'Darkenss or swelling around eyes.',
        severityId:'darkCircles',
    }
];

export const BreakoutLocations = [
    {
        title: 'No specific area',
        value: 0,
        description: 'Breakouts are rare or appear randomly.'
    },
    {
        title: 'Forehead',
        value: 1,
        description: 'Common with oily skin or hair products.'
    },
    {
        title: 'Cheeks',
        value: 2,
        description: 'Can be linked to pillowcases or phones.'
    },
    {
        title: 'Nose',
        value: 3,
        description: 'Blackheads and clogged pores common.'
    },
    {
        title: 'Chin and Jawline',
        value: 4,
        description: 'Often related to hormonal breakouts.'
    }
];

// export const BreakoutPainSeverities = [
//     {
//         title: 'Not at all',
//         value: 0,
//         description: 'Mostly painless and not inflamed.',
//         icon: 'happy-outline'
//     },
//     {
//         title: 'Mild discomfort',
//         value: 1,
//         description: 'Occasionally sore, minimal swelling.',
//         icon: 'remove-circle-outline'
//     },
//     {
//         title: 'Moderate pain & redness',
//         value: 2,
//         description: 'Some pain and visible inflammation.',
//         icon: 'alert-circle-outline'
//     },
//     {
//         title: 'Severe and painful',
//         value: 3,
//         description: 'Deep, tender breakouts that hurt.',
//         icon: 'flame-outline'
//     },
//     {
//         title: 'Extremely painful',
//         value: 4,
//         description: 'Constant pain, swelling, often cystic.',
//         icon: 'close-circle-outline'
//     }
// ];

// export const CommonMedications = [
//     {
//         title: 'Birth Control',
//         description: 'Pills or patches that affect hormonal acne.'
//     },
//     {
//         title: 'Accutane',
//         description: 'Strong acne treatment that causes dryness.'
//     },
//     {
//         title: 'Antibiotics',
//         description: 'May cause dryness or disrupt oil balance.'
//     },
//     {
//         title: 'Retinoids',
//         description: 'Includes topical and oral treatments.'
//     },
//     {
//         title: 'Steroids',
//         description: 'Can thin skin and cause acne.'
//     },
//     {
//         title: 'Antidepressants',
//         description: 'May cause dryness or dullness.'
//     },
//     {
//         title: 'Hormonal Treatments',
//         description: 'PCOS meds, testosterone, or therapy.'
//     },
//     {
//         title: 'Immunosuppressants',
//         description: 'May dampen immune response.'
//     },
//     {
//         title: 'Antihistamines',
//         description: 'Includes common allergy medications.'
//     }
// ];

export const GenericClimates = [
    {
        title: 'Hot and Humid',
        value: 0,
        description: 'Warm weather with high humidity.',
        icon: 'sunny-outline'
    },
    {
        title: 'Hot and Dry',
        value: 1,
        description: 'Hot with very low humidity.',
        icon: 'flame-outline'
    },
    {
        title: 'Cold and Dry',
        value: 2,
        description: 'Cold air with little moisture.',
        icon: 'snow-outline'
    },
    {
        title: 'Mild and Moist',
        value: 3,
        description: 'Moderate temperatures with moisture.',
        icon: 'cloud-outline'
    },
    {
        title: 'Mild and Dry',
        value: 4,
        description: 'Moderate temperatures with dry air.',
        icon: 'leaf-outline'
    },
    {
        title: 'Varies Seasonally',
        value: 5,
        description: 'Climate shifts by season.',
        icon: 'sync-outline'
    }
];

export const CommonAllergens = [
    {
        value: 0,
        title: 'None',
        displayLabel: 'None',
        description: 'No common allergens to avoid.'
    },
    {
        value: 1,
        title: 'Fragrances',
        displayLabel: 'Fragrance',
        description: 'Synthetic scents may trigger allergies.'
    },
    {
        value: 2,
        title: 'Parabens',
        displayLabel: 'Parabens',
        description: 'Preservatives that some prefer to avoid.'
    },
    {
        value: 3,
        title: 'Sulfates',
        displayLabel: 'Sulfates',
        description: 'Foaming agents that can strip moisture.'
    },
    {
        value: 4,
        title: 'Alcohols',
        displayLabel: 'Alcohols',
        description: 'Irritating to sensitive or dry skin types.'
    },
    {
        value: 5,
        title: 'Silicones',
        displayLabel: 'Silicones',
        description: 'Smoothing agents that may clog pores.'
    },
    {
        value: 6,
        title: 'Dyes',
        displayLabel: 'Dyes',
        description: 'Artificial pigments that can cause irritation.'
    },
    {
        value: 7,
        title: 'Retinoids',
        displayLabel: 'Retinoids',
        description: 'Vitamin A derivatives may cause dryness.'
    },
    {
        value: 8,
        title: 'Salicylic Acid',
        displayLabel: 'Salicylic Acid',
        description: 'Exfoliant that can dry sensitive skin.'
    },
    {
        value: 9,
        title: 'Formaldehyde Releasers',
        displayLabel: 'Formaldehyde',
        description: 'Preservatives that may trigger reactions.'
    },
    {
        value: 10,
        title: 'Lanolin',
        displayLabel: 'Lanolin',
        description: 'Derived from wool, may cause reactions.'
    },
    {
        value: 11,
        title: 'Coconut Derivatives',
        displayLabel: 'Coconut',
        description: 'Natural but can cause breakouts.'
    },
    {
        value: 12,
        title: 'Chemical Sunscreens',
        displayLabel: 'Chemical SPF',
        description: 'UV filters that may sting on sensitive skin.'
    }
];

export const SkincareGoals = [
    // {
    //     title: 'Overall Skin Health',
    //     value: 0,
    //     description: 'Just exploring or maintaining skin health.'
    // },
    {
        title: 'Clear Acne',
        value: 1,
        description: 'Reduce breakouts and clogged pores.'
    },
    {
        title: 'Fade Dark Spots',
        value: 2,
        description: 'Lighten hyperpigmentation and marks.'
    },
    {
        title: 'Even Skin Tone',
        value: 3,
        description: 'Improve tone and reduce discoloration.'
    },
    {
        title: 'Hydrate Skin',
        value: 4,
        description: 'Boost moisture and barrier health.'
    },
    {
        title: 'Reduce Irritation',
        value: 5,
        description: 'Soothe redness and calm skin.'
    },
    {
        title: 'Smooth Texture',
        value: 6,
        description: 'Minimize pores and tighten texture.'
    },
    {
        title: 'Control Oil',
        value: 7,
        description: 'Balance sebum and reduce shine.'
    },
    {
        title: 'Anti-Aging',
        value: 8,
        description: 'Reduce fine lines and wrinkles.'
    },
    {
        title: 'Brighten Skin',
        value: 9,
        description: 'Boost glow and skin radiance.'
    }
];

export const DiscoverySources = [
    {
        id: 'Instagram',
        title: 'Instagram',
        value: 0,
        image: require("assets/utm/instagram.png")
    },
    {
        id: 'Friends or Family',
        title: 'Friends or Family',
        value: 1,
        icon: 'people-outline'
    },
    {
        id: 'App Store',
        title: 'App Store',
        value: 2,
        image: require("assets/utm/app-store.png")
    },
    {
        id: 'TikTok',
        title: 'TikTok',
        value: 3,
        image: require("assets/utm/tiktok.png")
    },
    {
        id: 'Google',
        title: 'Google',
        value: 4,
        image: require("assets/utm/google.png")
    },
    {
        id: 'YouTube',
        title: 'YouTube',
        value: 5,
        image: require("assets/utm/youtube.png")
    },
    {
        id: 'Facebook',
        title: 'Facebook',
        value: 6,
        image: require("assets/utm/facebook.png")
    },
    {
        id: 'Reddit',
        title: 'Reddit',
        value: 7,
        image: require("assets/utm/reddit.png")
    },
    {
        id: 'Influencer or Creator',
        title: 'Influencer or Creator',
        value: 8,
        icon: 'megaphone-outline'
    },
    {
        id: 'Other',
        title: 'Other',
        value: 9,
        icon: 'ellipsis-horizontal-circle-outline'
    }
];

export const PreviewGeneratorSteps = [
    'Uploading your photos',
    'Processing skin scan',
    'Detecting facial regions',
    'Analyzing skin texture',
    'Assessing skin tone and clarity',
    'Diagnosing\nconcerns',
    'Summarizing\nseverities',
    'Planning\nyour routine',
    'Matching\nnew products',
    'Checking safeties',
    'Finalizing'
]

const bundleId = Constants.expoConfig.extra.BUNDLE_ID

export const SubscriptionTypes = [
    {
        id:'monthly_access',
        title:'Monthly Access',
        description:'Just $9.99 per month',
        productId:`${bundleId}.monthly.2025`,
    },
    {
        id:'yearly_access',
        title:'Yearly Access',
        description:'Just $29.99 per year ($2.49/mo)',
        productId:`${bundleId}.yearly.2025`,
        badge:'Best Value!'
    },
]

export const ReferralStatus = {
    Pending: 0, // created and not reviewed
    Approved: 1, // approved for payment
    Completed: 2, // paid
    Failed: -1, // something went wrong
    Refunded: -2 // refund call
}

export const NotificationTypes = [
    {
        title: 'Scan Ready! 📸',
        icon:'scan',
        body: 'Your next skin scan is now available. Track your progress!',
        value:0,
    },
    {
        title: 'Scan Reminder ⏰',
        icon:'calendar',
        body: 'Don\'t forget - your scan will be ready tomorrow!',
        value:1,
    },
    {
        title: 'Morning Routine ☀️',
        icon:'sunny',
        body: 'Start your day with your morning skincare routine!',
        value:2,
    },
    {
        title: 'Evening Routine 🌙',
        icon:'moon',
        body: 'Time for your evening skincare routine before bed!',
        value:3,
    },
    {
        title:'Referral Code Used! 🎉',
        icon:'gift',
        body:'Someone just signed up using your referral code!',
        value:4,
    },
    {
        title:'Limited-Time Sale! 🏷️',
        icon:'pricetag',
        body:'Your saved {product} from {brand} is discounted — shop now & save!',
        value:5,
    },
    {
        title: 'Derm AI',
        body: 'Tired of guessing what\'s right for your skin? Let our AI do the work in seconds.',
        icon:'checkmark-circle',
        value: 6,
    },
    {
        title: 'Derm AI',
        body: 'Your best skin could be one step away — don\'t leave your progress unfinished.',
        icon: 'trending-up',
        value: 7,
    },
    {
        title: 'Derm AI',
        body: 'Time is precious. Stop wasting it on trial-and-error routines — let us build yours instantly.',
        icon: 'hourglass-outline',
        value: 8,
    },
    {
        title: 'Quick Check-In 💡',
        body: 'Your scan is waiting! Stay on track and don\'t miss this progress point.',
        icon: 'bulb',
        value: 9,
    },
    {
        title: 'Keep Your Streak 🌱',
        body: 'Consistency is key for great skin insights. Take your scan today!',
        icon: 'leaf',
        value: 10,
    },
    {
        title: 'Final Reminder ✨',
        body: 'Don\'t let this scan slip by — capture your skin\'s progress before it\'s too late.',
        icon: 'sparkles',
        value: 11,
    },
    {
        title: 'We miss you 😢',
        body: 'Please come back and take your skin scan — your progress depends on it!',
        icon: 'sad',
        value: 12,
    }
]