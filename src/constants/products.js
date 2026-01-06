import colors from "config/colors";
import { average, collection, doc, getAggregateFromServer, getDoc, getFirestore } from "firebase/firestore";
import { db } from "services/firebase/firebase";

export const SkincareProductCategories = [
    {
        title: 'Cleanser',
        displayLabel: 'Cleanser',
        pluralTitle:'Cleansers',
        value: 0,
        description: 'Products to gently wash and clean the face.',
        color: '#C8E6C9', // light fresh green
        whyThisCategory: 'A cleanser is the foundation of any skincare routine, removing dirt, oil, and pollutants that accumulate throughout the day. Without a proper cleanse, pores can become clogged and other products may not absorb effectively. It sets the stage for healthier, clearer skin.'
    },
    {
        title: 'Moisturizer',
        displayLabel: 'Moisturizer',
        pluralTitle:'Moisturizers',
        value: 1,
        description: 'Hydrating products formulated for facial skin.',
        color: '#B3E5FC', // soft aqua blue
        whyThisCategory: 'Moisturizers lock in hydration and strengthen the skin\'s barrier, preventing dryness and irritation. Consistent use helps maintain smooth, plump, and supple skin. They also provide a protective layer against environmental stressors.'
    },
    {
        title: 'Serum',
        displayLabel: 'Serum',
        pluralTitle:'Serums',
        value: 3,
        description: 'Concentrated treatments with active ingredients.',
        color: '#E1BEE7', // soft lavender
        whyThisCategory: 'Serums deliver a high concentration of active ingredients directly into the skin for targeted results. They can address specific concerns like dark spots, fine lines, or dehydration. Their lightweight texture allows deeper penetration than creams or lotions.'
    },
    {
        title: 'Eye Care',
        displayLabel: 'Eye Care',
        pluralTitle:'Eye Care',
        value: 5,
        description: 'Specialized products for under the eyes.',
        color: '#FFE0B2', // gentle peach
        whyThisCategory: 'The skin around the eyes is thinner and more sensitive, making it prone to puffiness, dark circles, and fine lines. Eye care products are specially formulated to be gentle yet effective. They provide hydration, brightening, and anti-aging benefits where it\'s most needed.'
    },
    {
        title: 'Cream',
        displayLabel: 'Cream',
        pluralTitle:'Creams',
        value: 6,
        description: 'Multi-purpose products for light coverage.',
        color: '#F8BBD0', // warm blush pink
        whyThisCategory: 'Creams often combine moisturizing benefits with additional properties like sun protection or tinted coverage. They simplify routines by addressing multiple needs at once. This makes them ideal for busy mornings or a minimalist skincare approach.'
    },
    {
        title: 'Mask',
        displayLabel: 'Mask',
        pluralTitle:'Masks',
        value: 7,
        description: 'Treatment masks for various skin concerns.',
        color: '#D1C4E9', // pastel purple
        whyThisCategory: 'Masks provide an intensive dose of active ingredients in a short time. They can hydrate, detoxify, brighten, or soothe depending on the formulation. Using masks regularly can give skin a noticeable boost and maintain its overall health.'
    },
    {
        title: 'Toner',
        displayLabel: 'Toner',
        pluralTitle:'Toners',
        value: 8,
        description: 'Products that prepare the skin for other products.',
        color: '#B2DFDB', // minty teal
        whyThisCategory: 'Toners help restore the skin\'s natural pH after cleansing and remove any lingering impurities. They enhance the absorption of serums and moisturizers applied afterward. Many also provide an initial layer of hydration and calming benefits.'
    },
    {
        title: 'Sun Care',
        displayLabel: 'Sun Care',
        pluralTitle:'Sun Care',
        value: 9,
        description: 'Products containing SPF for sun protection.',
        color: '#FFF9C4', // pale sunshine yellow
        whyThisCategory: 'Sun care is the most important step for preventing premature aging, sunburn, and skin cancer. Daily SPF use shields the skin from harmful UV rays, even on cloudy days. It preserves skin health and enhances the effectiveness of all other skincare efforts.'
    },
    {
        title: 'Makeup Remover',
        displayLabel: 'Remover',
        pluralTitle:'Makeup Removers',
        value: 10,
        description: 'Products designed to remove makeup.',
        color: '#FFECB3', // light honey beige
        whyThisCategory: 'Makeup removers break down stubborn cosmetics, sunscreen, and excess oil without harsh scrubbing. Proper removal prevents clogged pores and irritation. Starting your routine with a thorough cleanse ensures your skin can fully benefit from treatment products.'
    },
    {
        title: 'Exfoliant',
        displayLabel: 'Exfoliant',
        pluralTitle:'Exfoliants',
        value: 12,
        description: 'Products that remove dead cells & help texture.',
        color: '#FFCDD2', // soft rose pink
        whyThisCategory: 'Exfoliants slough away dead skin cells, revealing smoother, brighter skin beneath. Regular exfoliation can help prevent breakouts, improve product absorption, and even skin tone. However, it\'s important to use them in moderation to avoid over-exfoliation.'
    },
    {
        title: 'Treatment',
        displayLabel: 'Treatment',
        pluralTitle:'Treatments',
        value: 13,
        description: 'Targeted formulas that address concerns.',
        color: '#C5CAE9', // calm periwinkle blue
        whyThisCategory: 'Treatments focus on solving particular issues such as acne, hyperpigmentation, or redness. They often contain potent actives designed for short-term, concentrated use. Incorporating them strategically can speed up visible results in your routine.'
    },
    {
        title: 'Spray',
        displayLabel: 'Spray',
        pluralTitle:'Sprays',
        value: 14,
        description: 'Mists that hydrate or refresh the skin.',
        color: '#B3E5FC', // airy sky blue
        whyThisCategory: 'Sprays instantly boost hydration and refresh the skin throughout the day. They\'re perfect for travel, post-workout, or mid-day touch-ups. Some formulas also contain soothing or antioxidant ingredients for extra protection and comfort.'
    },
    {
        title: 'Oil',
        displayLabel: 'Oil',
        pluralTitle:'Oils',
        value: 15,
        description: 'Products that strengthen the skin barrier.',
        color: '#FFF3E0', // light warm cream
        whyThisCategory: 'Facial oils seal in moisture, provide essential fatty acids, and support a healthy skin barrier. They can help balance oil production and give skin a radiant glow. Many also contain vitamins and antioxidants for added nourishment.'
    }
];

export const RoutineProductTypes = [
    'Morning',
    'Evening',
]

export const RoutineProductUsageFrequencies = [
    {
        title:'Every day',
        value:0,
    },
    {
        title:'Every other day',
        value:1,
    },
    {
        title:'Every week',
        value:2,
    }
]

export const ProductSafetyRatings = [
    {
        name:'Excellent',
        min:86,
        max:100,
        color:colors.accents.success
    },
    {
        name:'Good',
        min:70,
        max:85,
        color:colors.accents.info
    },
    {
        name:'Decent',
        min:50,
        max:69,
        color:colors.accents.warning
    },
    {
        name:'Fair',
        min:30,
        max:49,
        color:colors.accents.severe
    },
        {
        name:'Poor',
        min:0,
        max:29,
        color:colors.accents.error
    },
]

export const ProductSkinHarshnesses = [
    {
        value:0,
        name: 'Not harsh',
        color: colors.accents.success,
    },
    {
        value:1,
        name: 'Slightly harsh',
        color: colors.accents.info,
    },
    {
        value:2,
        name: 'Moderately harsh',
        color: colors.accents.warning,
    },
    {
        value:3,
        name: 'Extremely harsh',
        color: colors.accents.error,
    }
]