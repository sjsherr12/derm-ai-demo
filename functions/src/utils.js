const {db} = require('./firebase-admin')

exports.AGE_GROUPS = [
  { title: 'Under 21', value: 0 },
  { title: '21 to 30', value: 1 },
  { title: '31 to 40', value: 2 },
  { title: '41 to 50', value: 3 },
  { title: '51 to 60', value: 4 },
  { title: '61 or above', value: 5 }
];

exports.GENDERS = [
  { title: 'Male', value: 0 },
  { title: 'Female', value: 1 },
  { title: 'Other', value: 2 }
];

exports.SKIN_TYPES = [
  { title: 'Normal', value: 0 },
  { title: 'Oily', value: 2 },
  { title: 'Dry', value: 3 },
  { title: 'Combination', value: 4 }
];

exports.SKIN_TONES = [
  { title: 'Type I - Pale White', value: 0 },
  { title: 'Type II - Fair', value: 1 },
  { title: 'Type III - White to Olive', value: 2 },
  { title: 'Type IV - Tan', value: 3 },
  { title: 'Type V - Brown', value: 4 },
  { title: 'Type VI - Dark Brown', value: 5 }
];

exports.SKIN_SENSITIVITIES = [
  { title: 'Not sensitive', value: 0 },
  { title: 'Slightly Sensitive', value: 1 },
  { title: 'Moderately Sensitive', value: 2 },
  { title: 'Very Sensitive', value: 3 }
];

exports.BREAKOUT_LOCATIONS = [
  { title: 'No specific area', value: 0 },
  { title: 'Forehead', value: 1 },
  { title: 'Cheeks', value: 2 },
  { title: 'Nose', value: 3 },
  { title: 'Chin and Jawline', value: 4 }
];

exports.BREAKOUT_PAIN_SEVERITIES = [
  { title: 'Not at all', value: 0 },
  { title: 'Mild discomfort', value: 1 },
  { title: 'Moderate pain & redness', value: 2 },
  { title: 'Severe and painful', value: 3 },
  { title: 'Extremely painful', value: 4 }
];

exports.GENERIC_CLIMATES = [
  { title: 'Hot and Humid', value: 0 },
  { title: 'Hot and Dry', value: 1 },
  { title: 'Cold and Dry', value: 2 },
  { title: 'Mild and Moist', value: 3 },
  { title: 'Mild and Dry', value: 4 },
  { title: 'Varies Seasonally', value: 5 }
];

exports.COMMON_ALLERGENS = [
    { value: 0, title: 'None' },
    { value: 1, title: 'Fragrances' },
    { value: 2, title: 'Parabens' },
    { value: 3, title: 'Sulfates' },
    { value: 4, title: 'Alcohols' },
    { value: 5, title: 'Silicones' },
    { value: 6, title: 'Dyes' },
    { value: 7, title: 'Retinoids' },
    { value: 8, title: 'Salicylic Acid' },
    { value: 9, title: 'Formaldehyde Releasers' },
    { value: 10, title: 'Lanolin' },
    { value: 11, title: 'Coconut Derivatives' },
    { value: 12, title: 'Chemical Sunscreens' }
];


exports.SKINCARE_GOALS = [
  { title: 'Clear Acne', value: 1 },
  { title: 'Fade Dark Spots', value: 2 },
  { title: 'Even Skin Tone', value: 3 },
  { title: 'Hydrate Skin', value: 4 },
  { title: 'Reduce Irritation', value: 5 },
  { title: 'Smooth Texture', value: 6 },
  { title: 'Control Oil', value: 7 },
  { title: 'Anti-Aging', value: 8 },
  { title: 'Brighten Skin', value: 9 }
];

exports.ROUTINE_TYPES = {
  MORNING:0,
  EVENING:1,
}

exports.PRODUCT_CATEGORIES = [
  { title: 'Cleanser', value: 0 },
  { title: 'Moisturizer', value: 1 },
  { title: 'Serum', value: 3 },
  { title: 'Eye Care', value: 5 },
  { title: 'Cream', value: 6 },
  { title: 'Mask', value: 7 },
  { title: 'Toner', value: 8 },
  { title: 'Sun Care', value: 9 },
  { title: 'Makeup Remover', value: 10 },
  { title: 'Exfoliant', value: 12 },
  { title: 'Treatment', value: 13 },
  { title: 'Spray', value: 14 },
  { title: 'Oil', value: 15 }
];

exports.GUARANTEED_CATEGORIES = [0, 3, 1, 9]; 
// Cleanser, Serum, Moisturizer, Sun Care

exports.CONCERN_TO_CATEGORY_MAPPING = {
  acne: [12, 13],        // Exfoliant (BHA/AHA), Treatment (spot/retinoid)
  redness: [6, 13],      // Cream (barrier repair), Treatment (anti-redness)
  oiliness: [8, 12, 7],  // Toner (oil-control), Exfoliant, Mask (clay/charcoal)
  dryness: [6, 15],      // Cream (richer hydration), Oil
  tone: [12, 13],        // Exfoliant, Treatment (dark spot corrector)
  aging: [5, 13],        // Eye Care, Treatment (retinoid/peptides)
  pores: [12, 8, 7],     // Exfoliant, Toner, Mask (pore-clearing)
  darkCircles: [5, 6]    // Eye Care, Cream (hydrating/brightening for eye area)
};

// Mapping arrays from signup.js for data conversion
exports.SKIN_CONCERNS = [
  { title: 'No main concerns', value: 0, severityId: 'overall' },
  { title: 'Acne and Breakouts', value: 1, severityId: 'acne' },
  { title: 'Redness or Irritation', value: 2, severityId: 'redness' },
  { title: 'Oiliness and Shine', value: 3, severityId: 'oiliness' },
  { title: 'Dryness or Flakiness', value: 4, severityId: 'dryness' },
  { title: 'Uneven Tone or Pigmentation', value: 5, severityId: 'tone' },
  { title: 'Aging Concerns', value: 6, severityId: 'aging' },
  { title: 'Enlarged Pores and Texture', value: 7, severityId: 'pores' },
  { title: 'Dark Circles and Puffiness', value: 8, severityId: 'darkCircles' }
];

exports.REFERRAL_STATUS = {
  PENDING:0, // created and not reviewed
  APPROVED:1, // approved for payment
  COMPLETED:2, // paid
  FAILED:-1, // something went wrong
  REFUNDED: -2 // refund call
}

exports.createNotificationDocument = async (userId, type, scheduledAt) => {
  try {
    const notificationData = {
        type,
        createdAt: new Date(),
        scheduledAt,
        sent: false,
        attempts: 0,
        read: false
    };
    
    const notificationRef = db.collection(`users/${userId}/notifications`).doc();
    await notificationRef.set(notificationData);
    
    // console.log(`Created notification document: ${notificationRef.id} for user ${userId}, type ${type}`);
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification document:', error);
    throw error;
  }
}

exports.getPayPalAccessToken = async (clientId, clientSecret) => {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get PayPal access token: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    return data.access_token;
}

exports.APPLE_SUBSCRIPTIONS = [
  {
    id: 'com.dermai.dermaiapp.yearly.2025',
    fullPrice: 29.99,
    proceedPrice: 25.49,
  },
  {
    id: 'com.dermai.dermaiapp.yearly.10percent.2025',
    fullPrice: 26.99,
    proceedPrice: 22.99
  },
  {
    id: 'com.dermai.dermaiapp.yearly.15percent.2025',
    fullPrice: 25.99,
    proceedPrice: 21.99
  },
  {
    id: 'com.dermai.dermaiapp.yearly.20percent.2025',
    fullPrice: 23.99,
    proceedPrice: 19.99
  },
  {
    id: 'com.dermai.dermaiapp.yearly.25percent.2025',
    fullPrice: 19.99,
    proceedPrice: 16.99,
  },
  {
    id: 'com.dermai.dermaiapp.monthly.2025',
    fullPrice: 9.99,
    proceedPrice: 8.49,
  },
  {
    id: 'com.dermai.dermaiapp.monthly.10percent.2025',
    fullPrice: 8.99,
    proceedPrice: 7.65,
  },
  {
    id: 'com.dermai.dermaiapp.monthly.15percent.2025',
    fullPrice: 8.49,
    proceedPrice: 7.22,
  },
  {
    id: 'com.dermai.dermaiapp.monthly.20percent.2025',
    fullPrice: 7.99,
    proceedPrice: 6.79
  }
]