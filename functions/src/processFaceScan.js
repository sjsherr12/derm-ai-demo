const { db, storage } = require('./firebase-admin');
const { AGE_GROUPS, BREAKOUT_LOCATIONS, CONCERN_TO_CATEGORY_MAPPING, GENDERS, GENERIC_CLIMATES, GUARANTEED_CATEGORIES, PRODUCT_CATEGORIES, ROUTINE_TYPES, SKIN_CONCERNS, SKIN_SENSITIVITIES, SKIN_TONES, SKIN_TYPES, SKINCARE_GOALS, createNotificationDocument, COMMON_ALLERGENS } = require('./utils');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { onCall, HttpsError, onRequest } = require('firebase-functions/v2/https');
const OpenAI = require('openai');
const sharp = require('sharp');

const openaiFA = defineSecret('OPENAI_FA_API_KEY');

// Validate if user can scan (3-day cooldown system)
async function validateScanCooldown(userId) {
    try {
        const diagnosesRef = db.collection(`users/${userId}/diagnoses`);
        const querySnapshot = await diagnosesRef
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        
        // First time user - no scans yet
        if (querySnapshot.empty) {
            return { canScan: true, isFirstScan: true };
        }

        const mostRecentScan = querySnapshot.docs[0].data();
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const mostRecentScanDate = mostRecentScan.createdAt.toDate();
        
        // Check if most recent scan was more than 3 days ago
        if (mostRecentScanDate <= threeDaysAgo) {
            return { canScan: true, isFirstScan: false };
        } else {
            const nextScanDate = new Date(mostRecentScanDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            return { 
                canScan: false, 
                isFirstScan: false,
                message: `You can scan again on ${nextScanDate.toLocaleDateString()}. Please wait ${Math.ceil((nextScanDate - new Date()) / (24 * 60 * 60 * 1000))} more days.`
            };
        }
    } catch (error) {
        console.error('Error validating scan cooldown:', error);
        throw new Error(`Failed to validate scan cooldown: ${error}`);
    }
}

// Helper function to convert array values to readable text
function convertArrayToText(valueArray, mappingArray) {
  if (!Array.isArray(valueArray)) return 'None specified';
  
  return valueArray.map(value => {
    const item = mappingArray.find(item => item.value === value);
    return item ? item.title : `Unknown (${value})`;
  }).join(', ');
}

function convertValueToText(value, mappingArray) {
    const item = mappingArray.find(item => item.value === value);
    return item ? item.title : `Unknown (${value})`;
}

function convertUserDataForGPT(userData) {
    const skinInfo = userData.profile?.skinInfo || {};
    
    return {
        age: convertValueToText(userData.profile?.age, AGE_GROUPS),
        gender: convertValueToText(userData.profile?.gender, GENDERS),
        skinType: convertValueToText(skinInfo.skinType, SKIN_TYPES),
        skinTone: convertValueToText(skinInfo.skinTone, SKIN_TONES),
        sensitivity: convertValueToText(skinInfo.sensitivity, SKIN_SENSITIVITIES),
        breakoutLocations: convertArrayToText(skinInfo.breakoutLocations, BREAKOUT_LOCATIONS),
        climate: convertValueToText(skinInfo.climate, GENERIC_CLIMATES),
        skinConcerns: convertArrayToText(skinInfo.skinConcerns, SKIN_CONCERNS),
        skincareGoals: convertArrayToText(skinInfo.skincareGoals, SKINCARE_GOALS),
        sensitivities: convertArrayToText(skinInfo.sensitivities || [], COMMON_ALLERGENS),

        // breakoutSeverity: convertValueToText(skinInfo.breakoutSeverity, BREAKOUT_PAIN_SEVERITIES),
        // medications: skinInfo.medications || [],
        // Raw arrays for product recommendation logic
        rawSkinConcerns: skinInfo.skinConcerns || [],
        rawSkinType: skinInfo.skinType,
        rawSensitivities: skinInfo.sensitivities || [],
        rawSensitivity: skinInfo.sensitivity // Raw sensitivity level (0-3)
    };
}

async function getMostRecentDiagnosis(userId) {
    try {
        const diagnosesRef = db.collection(`users/${userId}/diagnoses`);
        const querySnapshot = await diagnosesRef
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        
        if (querySnapshot.empty) {
            return null;
        }
        
        return querySnapshot.docs[0].data();
    } catch (error) {
        console.error('Error fetching most recent diagnosis:', error);
        return null;
    }
}

// Process image and convert to base64
async function processImageToBase64(imageData) {
    try {
        let buffer;
        
        if (typeof imageData === 'string') {
            // If it's a base64 string, decode it
            if (imageData.startsWith('data:image/')) {
                const base64Data = imageData.split(',')[1];
                buffer = Buffer.from(base64Data, 'base64');
            } else {
                // If it's just base64 without data URL prefix
                buffer = Buffer.from(imageData, 'base64');
            }
        } else if (Buffer.isBuffer(imageData)) {
            buffer = imageData;
        } else {
            throw new Error(`Invalid image data format. Expected string or Buffer, received: ${typeof imageData}`);
        }
        
        // Validate buffer is not empty
        if (!buffer || buffer.length === 0) {
            throw new Error('Image buffer is empty');
        }

        // Process image to ensure it's in the right format and size
        const processedBuffer = await sharp(buffer)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer();
        
        return processedBuffer.toString('base64');
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error(`Failed to process image: ${error}`);
    }
}

// Create GPT prompt for severity analysis with multiple images
function createGPTPrompt(userInfo, imageDataObject, previousDiagnosis, isFirstScan, additionalNotes) {
  const previousDiagnosisText = previousDiagnosis 
    ? `Previous diagnosis from ${previousDiagnosis.createdAt?.toDate?.() || 'recent scan'}:
       Severities: ${JSON.stringify(previousDiagnosis.severities, null, 2)}
       Previous summary: ${previousDiagnosis.summary || 'No previous summary available'}`
    : 'This is the user\'s first scan - no previous diagnosis data available.';

    //- Breakout Pain Level: ${userInfo.breakoutSeverity}
    //- Medications: ${userInfo.medications.length > 0 ? userInfo.medications.join(', ') : 'None'} 
  return {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert dermatology AI assistant specialized in comprehensive facial skin analysis. Your task is to meticulously analyze 3 facial photos (front, left profile, right profile) and provide precise severity assessments that reflect genuine clinical observation.

CRITICAL REQUIREMENTS:
1. You MUST analyze ALL THREE provided facial images - do not decline or say you cannot see the images
2. Consider all angles (front, left, right) for a comprehensive 360-degree analysis
3. Respond ONLY with valid JSON - no explanatory text before or after
4. Rate severity on a precise scale of 0-100 (use specific integer values - avoid obviously rounded numbers like 10, 15, 20, 25, 30, etc.)
5. Each severity score must reflect careful clinical observation from all angles, not generic estimates
6. Analyze ALL skin concerns comprehensively, examining subtle variations and nuances across all views
7. ${isFirstScan ? 'This is the user\'s first scan - provide a comprehensive baseline assessment with precise measurements from all three angles.' : 'CRITICAL: Use the previous diagnosis as your baseline anchor. Compare current findings against previous severities to maintain consistency and track genuine changes. Avoid dramatic score fluctuations unless truly warranted by visible improvements or deterioration.'}
8. AFTER calculating severities, generate a personalized concernWeights vector that reflects the user's specific needs and priorities based on ALL available data

SEVERITY SCORING METHODOLOGY:
- CRITICAL: Use a 0-100 scale where 0 = WORST/MOST SEVERE and 100 = BEST/HEALTHIEST skin condition
- Lower scores (0-30) indicate severe problems that need immediate attention
- Higher scores (70-100) indicate healthy skin with minimal concerns
- Use specific integer values (e.g., 23, 41, 67, 82) that reflect actual observation, not rounded estimates
- Consider lighting, angle, and image quality in your assessment
- For follow-up scans: anchor against previous scores, adjusting by realistic increments (typically 2-8 point changes unless dramatic improvement/worsening is evident)
- Avoid psychological bias toward round numbers - your precision demonstrates clinical rigor

COMPREHENSIVE SKIN ASSESSMENT CATEGORIES:
- overall: Holistic skin health considering all factors combined
- acne: Active lesions, comedones, inflammatory papules, pustules, severity distribution
- redness: Erythema, inflammation patterns, vascular visibility, irritation zones
- oiliness: Sebum production evidence, shine patterns, T-zone assessment
- dryness: Visible flaking, texture roughness, barrier function indicators
- tone: Hyperpigmentation, melasma, post-inflammatory marks, overall evenness
- aging: Fine lines depth, wrinkle formation, skin elasticity, photoaged areas
- pores: Size visibility, congestion level, texture impact, regional variation
- darkCircles: Periorbital pigmentation, vascular prominence, structural shadowing

CONCERN WEIGHTS CALCULATION METHODOLOGY:
After calculating severities, generate a personalized concernWeights 8D vector (values must sum to 1.0) that creates FOCUSED, TARGETED recommendations by concentrating weight on the user's actual concerns:

PRIMARY FACTORS (MOST IMPORTANT):
- User's explicitly selected skin concerns from profile - PRIORITIZE THESE HEAVILY
- User's skincare goals from profile - ALIGN WEIGHTS WITH THEIR STATED GOALS
- Severity scores (lower scores = higher concern priority) - FOCUS ON PROBLEM AREAS
- Age-appropriate recommendations (avoid aging products for young users)

SECONDARY FACTORS:
- Gender-specific considerations
- Climate impact on skin needs
- Breakout location patterns
- Skin type and sensitivity levels

WEIGHTING PRINCIPLES - FOCUS AND CONCENTRATION:
1. CREATE TARGETED RECOMMENDATIONS: Use 0.0 for concerns that are NOT user priorities or problem areas
2. CONCENTRATE WEIGHT: 1-3 primary concerns should receive 70-90% of total weight
3. User-selected concerns should receive the HIGHEST weights (0.3-0.6 each)
4. Severely impacted areas (severity < 50) should receive major weight allocation
5. Age appropriateness: Users under 25 should have aging weight = 0.0 unless severely needed
6. Avoid "surface level distribution" - be decisive about what matters most
7. All 8 values must be floats between 0.0-1.0 and sum exactly to 1.0

EXAMPLES - NOTICE THE FOCUSED APPROACH:
- Young user with severe acne + user selected "acne" concern: {"acne": 0.7, "redness": 0.2, "oiliness": 0.1, "aging": 0.0, "darkCircles": 0.0, "dryness": 0.0, "pores": 0.0, "tone": 0.0}
- Mature user with aging + tone concerns: {"aging": 0.5, "tone": 0.3, "dryness": 0.2, "acne": 0.0, "darkCircles": 0.0, "oiliness": 0.0, "pores": 0.0, "redness": 0.0}
- User with dark circles + dryness goals: {"darkCircles": 0.6, "dryness": 0.4, "acne": 0.0, "aging": 0.0, "oiliness": 0.0, "pores": 0.0, "redness": 0.0, "tone": 0.0}

RESPONSE FORMAT - YOU MUST RESPOND ONLY WITH VALID JSON:
{
  "severities": {
    "overall": number (0-100, integer),
    "acne": number (0-100, integer),
    "redness": number (0-100, integer),
    "oiliness": number (0-100, integer),
    "dryness": number (0-100, integer),
    "tone": number (0-100, integer),
    "aging": number (0-100, integer),
    "pores": number (0-100, integer),
    "darkCircles": number (0-100, integer)
  },
  "concernWeights": {
    "acne": number (0.0-1.0, float),
    "aging": number (0.0-1.0, float),
    "darkCircles": number (0.0-1.0, float),
    "dryness": number (0.0-1.0, float),
    "oiliness": number (0.0-1.0, float),
    "pores": number (0.0-1.0, float),
    "redness": number (0.0-1.0, float),
    "tone": number (0.0-1.0, float)
  },
  "diagnosis": "A specific dermatological diagnosis describing what the user has on their face (e.g., 'nodular acne with redness and irritation', 'mild comedonal acne', 'seborrheic dermatitis with perioral inflammation', 'post-inflammatory hyperpigmentation', 'hormonal acne with cystic lesions'). Be precise and clinical in your assessment based on visible skin conditions.",
  "summary": "2-3 compelling, specific sentences that capture the most notable skin characteristics observed in this analysis. Focus on distinctive features that would genuinely interest the user - avoid generic descriptions. ${!isFirstScan ? 'Highlight meaningful changes from the previous scan.' : 'Establish clear baseline observations.'}"
}`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please analyze these three facial images for comprehensive skin condition severities.

IMAGE LABELS:
- Image 1: FRONT VIEW - Direct frontal facial photo
- Image 2: LEFT PROFILE - Left side profile view  
- Image 3: RIGHT PROFILE - Right side profile view

USER INFORMATION:
- Age: ${userInfo.age}
- Gender: ${userInfo.gender}
- Skin Type: ${userInfo.skinType}
- Skin Tone: ${userInfo.skinTone}
- Sensitivity: ${userInfo.sensitivity}
- Common Breakout Locations: ${userInfo.breakoutLocations}
- Climate: ${userInfo.climate}
- Current Skin Concerns: ${userInfo.skinConcerns}
- Skincare Goals: ${userInfo.skincareGoals}
- Known Sensitivities: ${userInfo.sensitivities}

${previousDiagnosisText}

${additionalNotes && additionalNotes.trim() ? `ADDITIONAL USER NOTES: The user has provided additional information about their skin: "${additionalNotes.trim()}". Please take this user-provided information into account when analyzing their skin condition and providing your assessment.

` : ''}Please analyze ALL THREE images together to provide comprehensive severity ratings for ALL categories and a detailed summary considering all angles.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageDataObject.front}`
            }
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageDataObject.left}`
            }
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageDataObject.right}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0.01,
    response_format: { type: "json_object" }
  };
}

// Retry wrapper for GPT API calls with exponential backoff
async function callGPTWithRetry(apiClient, prompt, maxRetries = 3, context = 'GPT call') {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await apiClient.chat.completions.create(prompt);
            
            // Debug the full response structure
            console.log(`${context} - Response structure:`, {
                id: response.id,
                model: response.model,
                usage: response.usage,
                choices_length: response.choices?.length,
                first_choice: response.choices?.[0] ? {
                finish_reason: response.choices[0].finish_reason,
                message_role: response.choices[0].message?.role,
                content_length: response.choices[0].message?.content?.length
                } : 'No first choice'
            });
            
            if (!response.choices || response.choices.length === 0) {
                throw new Error(`No choices returned from GPT. Response: ${JSON.stringify(response)}`);
            }
            
            const choice = response.choices[0];
            if (!choice.message) {
                throw new Error(`No message in first choice. Choice: ${JSON.stringify(choice)}`);
            }
            
            const content = choice.message.content;
            if (!content || content.trim().length === 0) {
                console.error(`Empty content from GPT. Full choice:`, choice);
                console.error(`Finish reason: ${choice.finish_reason}`);
                
                // Check if it was filtered or stopped for other reasons
                if (choice.finish_reason === 'content_filter') {
                    throw new Error('GPT response was filtered due to content policy');
                } else if (choice.finish_reason === 'length') {
                    throw new Error('GPT response was truncated due to length limits');
                } else {
                    throw new Error(`Empty response from GPT. Finish reason: ${choice.finish_reason || 'unknown'}`);
                }
            }
            
            console.log(`${context} - Success! Content length: ${content.length} characters`);
            return content;
            
        } catch (error) {
            lastError = error;
            console.error(`${context} - Attempt ${attempt} failed:`, error.message);
            
            // Log additional error details if available
            if (error.response) {
                console.error(`HTTP Status: ${error.response.status}`);
                console.error(`Error response:`, error.response.data);
            }
            
            // Don't retry on certain error types
            if (error.status === 401 || error.status === 403 || error.status === 429) {
                console.error(`Not retrying due to auth/rate limit error: ${error.status}`);
                throw error;
            }
            
            // Don't retry on content filter errors
            if (error.message?.includes('content_filter')) {
                console.error('Not retrying due to content filter');
                throw error;
            }
            
            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

// Create fallback GPT prompt for text-based analysis when image analysis fails
function createFallbackGPTPrompt(userInfo, previousDiagnosis, isFirstScan, additionalNotes) {
  const previousDiagnosisText = previousDiagnosis 
    ? `Previous diagnosis from ${previousDiagnosis.createdAt?.toDate?.() || 'recent scan'}:
       Severities: ${JSON.stringify(previousDiagnosis.severities, null, 2)}
       Previous summary: ${previousDiagnosis.summary || 'No previous summary available'}`
    : 'This is the user\'s first scan - no previous diagnosis data available.';

    //- Breakout Pain Level: ${userInfo.breakoutSeverity}
    //- Medications: ${userInfo.medications.length > 0 ? userInfo.medications.join(', ') : 'None'}
  return {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert dermatology AI assistant. The facial image analysis has failed, so you need to provide a fallback assessment based on user profile information and previous diagnosis data.

CRITICAL REQUIREMENTS:
1. You cannot see the current image - base your assessment on user profile and previous data
2. Respond ONLY with valid JSON - no explanatory text before or after
3. Rate severity on a scale of 0-100 (use specific integer values)
4. ${isFirstScan ? 'This is the user\'s first scan - provide conservative baseline estimates based on their profile information.' : 'CRITICAL: Use the previous diagnosis as your primary baseline. Make minimal adjustments (±2-4 points) to reflect expected progression, unless user profile indicates significant changes should have occurred.'}
5. Generate concernWeights based on user profile data and calculated severities (values must sum to 1.0)

SEVERITY SCORING METHODOLOGY:
- Use a 0-100 scale where 0 = WORST/MOST SEVERE and 100 = BEST/HEALTHIEST skin condition
- For first-time users: provide conservative estimates based on age, skin type, and reported concerns
- For returning users: anchor to previous scores with minimal adjustments for expected progression
- Consider reported skin concerns, age, climate, and skincare routine adherence

RESPONSE FORMAT - YOU MUST RESPOND ONLY WITH VALID JSON:
{
  "severities": {
    "overall": number (0-100, integer),
    "acne": number (0-100, integer),
    "redness": number (0-100, integer),
    "oiliness": number (0-100, integer),
    "dryness": number (0-100, integer),
    "tone": number (0-100, integer),
    "aging": number (0-100, integer),
    "pores": number (0-100, integer),
    "darkCircles": number (0-100, integer)
  },
  "concernWeights": {
    "acne": number (0.0-1.0, float),
    "aging": number (0.0-1.0, float),
    "darkCircles": number (0.0-1.0, float),
    "dryness": number (0.0-1.0, float),
    "oiliness": number (0.0-1.0, float),
    "pores": number (0.0-1.0, float),
    "redness": number (0.0-1.0, float),
    "tone": number (0.0-1.0, float)
  },
  "diagnosis": "A clinical assessment based on user profile and previous data (if available). Note that this is a fallback assessment due to image analysis failure.",
  "summary": "2-3 sentences explaining this is a fallback assessment based on profile data ${!isFirstScan ? 'and previous diagnosis' : ''}, noting that a new scan with image is recommended for accurate analysis."
}`
      },
      {
        role: "user",
        content: `I cannot provide a facial image for analysis. Please provide a fallback assessment based on my profile information ${!isFirstScan ? 'and previous diagnosis' : ''}.

USER INFORMATION:
- Age: ${userInfo.age}
- Gender: ${userInfo.gender}
- Skin Type: ${userInfo.skinType}
- Skin Tone: ${userInfo.skinTone}
- Sensitivity: ${userInfo.sensitivity}
- Common Breakout Locations: ${userInfo.breakoutLocations}
- Climate: ${userInfo.climate}
- Current Skin Concerns: ${userInfo.skinConcerns}
- Skincare Goals: ${userInfo.skincareGoals}
- Known Sensitivities: ${userInfo.sensitivities}

${previousDiagnosisText}

${additionalNotes && additionalNotes.trim() ? `ADDITIONAL USER NOTES: The user has provided additional information about their skin: "${additionalNotes.trim()}". Please take this user-provided information into account when providing your assessment.

` : ''}Please provide a conservative fallback assessment acknowledging the limitation of no current image analysis.`
      }
    ],
    max_tokens: 800,
    temperature: 0.01,
    response_format: { type: "json_object" }
  };
}

// Robust JSON parser with fallback and sanitization
function parseGPTResponse(responseContent, context = 'GPT response') {
    try {
        // Log the raw response for debugging
        console.log(`Raw ${context}:`, responseContent);
        
        // Clean common GPT response issues
        let cleanedContent = responseContent.trim();
        
        // Remove markdown code blocks if present
        if (cleanedContent.startsWith('```json')) {
            cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Remove any leading/trailing text that's not JSON
        const jsonStart = cleanedContent.indexOf('{');
        const jsonEnd = cleanedContent.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
        }
        
        // Try to parse the cleaned content
        return JSON.parse(cleanedContent);
        
    } catch (error) {
        console.error(`JSON parsing error for ${context}:`, error);
        console.error(`Problematic content:`, responseContent);
        
        // Try to extract JSON from the middle of the response
        try {
            const bracketMatch = responseContent.match(/\{[\s\S]*\}/);
            if (bracketMatch) {
                console.log(`Attempting to parse extracted JSON:`, bracketMatch[0]);
                return JSON.parse(bracketMatch[0]);
            }
        } catch (secondError) {
            console.error(`Second parsing attempt failed:`, secondError);
        }
        
        throw new Error(`Failed to parse ${context} as JSON: ${error.message}. Content: ${responseContent.substring(0, 200)}...`);
    }
}

// Get user's current routine products from Firebase
async function getUserRoutineProducts(userId) {
    try {
        const routineProductsRef = db.collection(`users/${userId}/routineProducts`);
        const querySnapshot = await routineProductsRef.get();
        
        const morningRoutine = [];
        const eveningRoutine = [];
        
        querySnapshot.forEach(doc => {
            const routineProduct = doc.data();
            if (routineProduct.routineType === ROUTINE_TYPES.MORNING) {
                morningRoutine.push(routineProduct.productId);
            } else if (routineProduct.routineType === ROUTINE_TYPES.EVENING) {
                eveningRoutine.push(routineProduct.productId);
            }
        });
        
        return { morningRoutine, eveningRoutine };
    } catch (error) {
        console.error('Error fetching user routine products:', error);
        return { morningRoutine: [], eveningRoutine: [] };
    }
}

async function getUserDislikedProducts(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return [];
        }
        
        const userData = userDoc.data();
        return userData.routine?.dislikedProducts || [];
    } catch (error) {
        console.error('Error fetching user disliked products:', error);
        return [];
    }
}

// Calculate cosine similarity between two concernWeights vectors
function calculateCosineSimilarity(userWeights, productWeights) {
    const concernKeys = ['acne', 'aging', 'darkCircles', 'dryness', 'oiliness', 'pores', 'redness', 'tone'];

    let dotProduct = 0;
    let userMagnitude = 0;
    let productMagnitude = 0;

    for (const key of concernKeys) {
        const userWeight = userWeights[key] || 0;
        const productWeight = productWeights[key] || 0;

        dotProduct += userWeight * productWeight;
        userMagnitude += userWeight * userWeight;
        productMagnitude += productWeight * productWeight;
    }

    userMagnitude = Math.sqrt(userMagnitude);
    productMagnitude = Math.sqrt(productMagnitude);

    if (userMagnitude === 0 || productMagnitude === 0) {
        return 0; // No similarity if either vector is zero
    }

    return dotProduct / (userMagnitude * productMagnitude);
}

// Calculate skinHarshness penalty based on product harshness and user sensitivity
function calculateSkinHarshnessPenalty(productSkinHarshness, userSensitivity) {
    // Both values are 0-3 scale (0 = lowest harshness/sensitivity, 3 = highest)
    // Higher penalty when product is harsh and user is sensitive
    // Penalty ranges from 0 (no penalty) to 0.3 (max penalty for harsh product + sensitive user)

    if (productSkinHarshness === undefined || userSensitivity === undefined) {
        return 0; // No penalty if data is missing
    }

    // Normalize to 0-1 scale
    const normalizedHarshness = productSkinHarshness / 3;
    const normalizedSensitivity = userSensitivity / 3;

    // Penalty is proportional to both harshness and sensitivity
    // Max penalty of 0.3 points when both are at maximum
    const penalty = normalizedHarshness * normalizedSensitivity * 0.3;

    return penalty;
}

// Enhanced query products by category with similarity-based ranking
async function queryProductsByCategory(categoryValue, userConcernWeights, userSkinType = null, userSensitivities = [], userSensitivity = 0, limit = 10, excludeProductIds = []) {
    try {
        let query = db.collection('products');

        // Primary filters for Firestore query
        query = query.where('category', '==', categoryValue);
        query = query.where('safetyScore', '>=', 70); // Safety score filter

        // Don't limit the query size - we want all qualifying products for similarity calculation
        const querySnapshot = await query.get();

        const products = [];

        querySnapshot.forEach(doc => {
            const productData = { id: doc.id, ...doc.data() };

            // Additional filtering that can't be done in Firestore query
            let shouldInclude = true;

            // EXCLUDE products in the exclusion list (disliked products)
            if (excludeProductIds.includes(doc.id)) {
                shouldInclude = false;
            }

            // Filter by skin type compatibility - product must support user's skin type
            if (shouldInclude && userSkinType !== null && productData.skinTypes && productData.skinTypes.length > 0) {
                if (!productData.skinTypes.includes(userSkinType)) {
                    shouldInclude = false;
                }
            }

            // Exclude products with user's sensitivities
            if (shouldInclude && userSensitivities.length > 0 && productData.sensitivities) {
                const hasConflictingSensitivity = productData.sensitivities.some(sensitivity =>
                    userSensitivities.includes(sensitivity)
                );
                if (hasConflictingSensitivity) {
                    shouldInclude = false;
                }
            }

            if (shouldInclude) {
                products.push(productData);
            }
        });

        // Calculate similarity scores and penalties for each product
        products.forEach(product => {
            // Calculate cosine similarity between user and product concernWeights
            if (product.concernWeights && userConcernWeights) {
                product._similarityScore = calculateCosineSimilarity(userConcernWeights, product.concernWeights);
            } else {
                // Fallback: Use safetyScore for products without concernWeights (backward compatibility)
                product._similarityScore = (product.safetyScore || 70) / 100; // Normalize to 0-1 range
            }

            // Calculate skinHarshness penalty
            product._harshnessPenalty = calculateSkinHarshnessPenalty(product.skinHarshness, userSensitivity);

            // Final score: similarity score minus harshness penalty
            product._finalScore = product._similarityScore - product._harshnessPenalty;
        });

        // Sort by final score (highest first), then by safety score as tiebreaker
        products.sort((a, b) => {
            if (Math.abs(a._finalScore - b._finalScore) < 0.001) {
                // Scores are very close, use safetyScore as tiebreaker
                return (b.safetyScore || 0) - (a.safetyScore || 0);
            }
            return b._finalScore - a._finalScore;
        });

        // Remove scoring fields before returning
        products.forEach(product => {
            delete product._similarityScore;
            delete product._harshnessPenalty;
            delete product._finalScore;
        });

        return products.slice(0, limit);
    } catch (error) {
        console.error('Error querying products by category:', error);
        throw new Error(`Failed to query products by category: ${error}`);
    }
}

// Generate category-based routine recommendations (4-6 products per category)
async function generateRoutineRecommendations(userInfo, currentSeverities, concernWeights, userData, userId, dislikedProducts) {
    try {
        // Get existing routine products to exclude from recommendations (only for normal flow)
        const userRoutine = await getUserRoutineProducts(userId);
        const existingRoutineProducts = [...new Set([
            ...(userRoutine.morningRoutine || []),
            ...(userRoutine.eveningRoutine || [])
        ])];
        
        // Use new recommendation system: GUARANTEED_CATEGORIES + CONCERN_TO_CATEGORY_MAPPING
        const userSkinConcerns = userInfo.rawSkinConcerns || userInfo.skinConcerns || [];
        
        // Start with guaranteed categories
        const routineCategories = [...GUARANTEED_CATEGORIES];

        // Add categories from CONCERN_TO_CATEGORY_MAPPING based on user concerns
        userSkinConcerns.forEach(concernValue => {
            const concernData = SKIN_CONCERNS.find(c => c.value === concernValue);
            if (concernData && concernData.severityId !== 'overall') {
                const concernKey = concernData.severityId;
                if (CONCERN_TO_CATEGORY_MAPPING[concernKey]) {
                    const mappedCategories = CONCERN_TO_CATEGORY_MAPPING[concernKey];
                    mappedCategories.forEach(categoryValue => {
                        if (!routineCategories.includes(categoryValue)) {
                            routineCategories.push(categoryValue);
                        }
                    });
                }
            }
        });
        
        // Also add categories for low severity scores (below 60)
        Object.entries(currentSeverities).forEach(([severityId, severity]) => {
            if (severityId !== 'overall' && severity < 60) {
                if (CONCERN_TO_CATEGORY_MAPPING[severityId]) {
                    CONCERN_TO_CATEGORY_MAPPING[severityId].forEach(categoryValue => {
                        if (!routineCategories.includes(categoryValue)) {
                            routineCategories.push(categoryValue);
                        }
                    });
                }
            }
        });
        
        // Limit to 6-7 categories total
        const finalCategories = routineCategories.slice(0, 7);

        if (finalCategories.length === 0) {
            console.log('WARNING: No relevant categories determined, returning empty recommendations');
            return [];
        }
        
        // Get concern values for filtering products
        const allConcernValues = [];

        userSkinConcerns.forEach(concernValue => {
            const concernData = SKIN_CONCERNS.find(c => c.value === concernValue);
            if (concernData && concernData.severityId !== 'overall') {
                allConcernValues.push(concernValue);
            }
        });
        
        // Add concerns from low severity scores
        Object.entries(currentSeverities).forEach(([severityId, severity]) => {
            if (severityId !== 'overall' && severity < 50) {
                const concernData = SKIN_CONCERNS.find(c => c.severityId === severityId);
                if (concernData && !allConcernValues.includes(concernData.value)) {
                    allConcernValues.push(concernData.value);
                }
            }
        });
        
        const routineRecommendations = [];
        
        // For each final category, get 4-6 products
        for (const categoryValue of finalCategories) {
            const categoryData = PRODUCT_CATEGORIES.find(c => c.value === categoryValue);
            const categoryName = categoryData ? categoryData.title : `Category${categoryValue}`;
            
            // Query products for routine (exclude existing routine products + disliked)
            const routineExclusions = [...new Set([...existingRoutineProducts, ...dislikedProducts])];

            const categoryProducts = await queryProductsByCategory(
                categoryValue,
                concernWeights, // Pass user's concernWeights for similarity calculation
                userInfo.rawSkinType, // Use raw numeric value instead of text
                userInfo.rawSensitivities || userInfo.sensitivities || [],
                userData.profile?.skinInfo?.sensitivity || 0, // User sensitivity level (0-3)
                6, // Get 6 products per category
                routineExclusions
            );
            
            // Add all product IDs to flat array
            if (categoryProducts.length > 0) {
                const productIds = categoryProducts.map(p => p.id);
                routineRecommendations.push(...productIds);
            } else {
                console.log(`WARNING: No products found for category ${categoryName}`);
            }
        }
        
        return routineRecommendations;
    } catch (error) {
        console.error('Error generating routine recommendations:', error);
        console.error('Stack trace:', error.stack);
        throw new Error(`Failed to generate routine recommendations: ${error}`);
    }
}

// Get most recent diagnosis with routine recommendations
async function getMostRecentDiagnosisWithRoutineRecommendations(userId) {
    try {
        const diagnosesRef = db.collection(`users/${userId}/diagnoses`);
        const querySnapshot = await diagnosesRef
            .where('routineRecommendations', '!=', null)
            .orderBy('routineRecommendations')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        
        if (querySnapshot.empty) {
            return null;
        }
        
        return querySnapshot.docs[0].data();
    } catch (error) {
        console.error('Error fetching most recent diagnosis with routine recommendations:', error);
        return null;
    }
}

// Check if routine recommendations threshold is met
function checkRoutineRecommendationThreshold(previousSeverities, currentSeverities, userConcerns = []) {
    const THRESHOLD = 10; // 10-point improvement threshold (more realistic for skin improvements)
    
    // Check overall improvement (higher current scores = better, so improvement is current - previous)
    const overallImprovement = (currentSeverities.overall || 0) - (previousSeverities.overall || 0);
    if (overallImprovement < THRESHOLD) {
        return false;
    }
    
    // Check improvement in marked concerns
    if (userConcerns.length > 0) {
        for (const concernValue of userConcerns) {
            const concernData = SKIN_CONCERNS.find(c => c.value === concernValue);
            if (concernData) {
                const concernImprovement = (currentSeverities[concernData.severityId] || 0) - (previousSeverities[concernData.severityId] || 0);
                if (concernImprovement < THRESHOLD) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Get all product IDs from the most recent routine recommendations
async function getRecentRoutineRecommendationProductIds(userId) {
    try {
        const recentDiagnosis = await getMostRecentDiagnosisWithRoutineRecommendations(userId);
        if (!recentDiagnosis || !recentDiagnosis.routineRecommendations) {
            return [];
        }
        
        // routineRecommendations is now always an array
        const productIds = Array.isArray(recentDiagnosis.routineRecommendations) 
            ? recentDiagnosis.routineRecommendations 
            : [];
        
        // Return unique product IDs
        return [...new Set(productIds)];
    } catch (error) {
        console.error('Error fetching recent routine recommendation products:', error);
        return [];
    }
}

// Query products based on filtering criteria
async function queryProducts(targetConcerns = [], userSkinType = null, userSensitivities = [], limit = 100, excludeProductIds = []) {
    try {
        let query = db.collection('products');
        
        // Filter by skin concerns if specified
        if (targetConcerns.length > 0) {
            query = query.where('skinConcerns', 'array-contains-any', targetConcerns);
        }
        
        // Order by safety score (highest first) and limit results for GPT processing
        query = query.orderBy('safetyScore', 'desc').limit(limit);
        
        const querySnapshot = await query.get();
        const products = [];
        
        querySnapshot.forEach(doc => {
            const productData = { id: doc.id, ...doc.data() };
            
            // Additional filtering that can't be done in Firestore query
            let shouldInclude = true;
            
            // EXCLUDE products in the exclusion list (disliked or already in routine)
            if (excludeProductIds.includes(doc.id)) {
                shouldInclude = false;
            }
            
            // Filter by skin type compatibility if specified
            if (shouldInclude && userSkinType !== null && productData.skinTypes && productData.skinTypes.length > 0) {
                if (!productData.skinTypes.includes(userSkinType)) {
                    shouldInclude = false;
                }
            }
            
            // Exclude products with user's sensitivities
            if (shouldInclude && userSensitivities.length > 0 && productData.sensitivities) {
                const hasConflictingSensitivity = productData.sensitivities.some(sensitivity => 
                    userSensitivities.includes(sensitivity)
                );
                if (hasConflictingSensitivity) {
                    shouldInclude = false;
                }
            }
            
            if (shouldInclude) {
                products.push(productData);
            }
        });
        
        return products;
    } catch (error) {
        console.error('Error querying products:', error);
        throw new Error(`Failed to query products: ${error}`);
    }
}

// Get categories from a list of product IDs
async function getCategoriesFromProductIds(productIds) {
    try {
        if (!productIds || productIds.length === 0) {
            console.log('No product IDs provided');
            return [];
        }
        
        // Fetch all products in batches to get their categories
        const categories = new Set();
        const batchSize = 10; // Firestore limit for 'in' queries
        
        for (let i = 0; i < productIds.length; i += batchSize) {
            const batch = productIds.slice(i, i + batchSize);
            const productsQuery = await db.collection('products')
                .where(admin.firestore.FieldPath.documentId(), 'in', batch)
                .get();
            
            productsQuery.forEach(doc => {
                const productData = doc.data();
                if (productData.category !== undefined) {
                    categories.add(productData.category);
                }
            });
        }
        
        const usedCategories = Array.from(categories);
        console.log(`Found ${usedCategories.length} categories from product IDs:`, usedCategories);
        
        return usedCategories;
    } catch (error) {
        console.error('Error getting categories from product IDs:', error);
        return [];
    }
}

async function getCategoriesFromRecentRoutineRecommendations(userId) {
    try {
        const recentDiagnosis = await getMostRecentDiagnosisWithRoutineRecommendations(userId);
        if (!recentDiagnosis || !recentDiagnosis.routineRecommendations) {
            console.log('No recent diagnosis with routine recommendations found');
            return [];
        }
        
        const productIds = Array.isArray(recentDiagnosis.routineRecommendations) 
            ? recentDiagnosis.routineRecommendations 
            : [];
        
        return await getCategoriesFromProductIds(productIds);
    } catch (error) {
        console.error('Error getting categories from recent routine recommendations:', error);
        return [];
    }
}

// Get unused categories for scan recommendations
function getUnusedCategoriesForScanRecommendations(usedCategories, userInfo) {
    const allCategoryValues = PRODUCT_CATEGORIES.map(cat => cat.value);
    let unusedCategories = allCategoryValues.filter(catValue => !usedCategories.includes(catValue));
    
    // Filter out makeup removers (value 10) for male users - makeup removal typically not relevant for men
    if (userInfo && userInfo.gender === 'Male' && unusedCategories.includes(10)) {
        unusedCategories = unusedCategories.filter(catValue => catValue !== 10);
        console.log('Filtered out makeup removers (category 10) for male user');
    }

    return unusedCategories;
}

async function generateScanRecommendations(userInfo, currentSeverities, concernWeights, recentRoutineProductIds, dislikedProducts, userId, currentRoutineRecommendations = []) {
    try {
        let usedCategories = [];
        
        if (currentRoutineRecommendations && currentRoutineRecommendations.length > 0) {
            // If we have current routine recommendations from this scan, use those to determine used categories
            usedCategories = await getCategoriesFromProductIds(currentRoutineRecommendations);
        } else {
            // Get categories from most recent routine recommendations
            usedCategories = await getCategoriesFromRecentRoutineRecommendations(userId);
        }
        
        // Get unused categories for scan recommendations
        const unusedCategories = getUnusedCategoriesForScanRecommendations(usedCategories, userInfo);
        
        if (unusedCategories.length === 0) {
            return [];
        }
        
        const scanRecommendations = [];
        
        // Get concern values for filtering products
        const userSkinConcerns = userInfo.rawSkinConcerns || userInfo.skinConcerns || [];
        const allConcernValues = [];
        
        userSkinConcerns.forEach(concernValue => {
            const concernData = SKIN_CONCERNS.find(c => c.value === concernValue);
            if (concernData && concernData.severityId !== 'overall') {
                allConcernValues.push(concernValue);
            }
        });
        
        // Add concerns from low severity scores
        Object.entries(currentSeverities).forEach(([severityId, severity]) => {
            if (severityId !== 'overall' && severity < 50) {
                const concernData = SKIN_CONCERNS.find(c => c.severityId === severityId);
                if (concernData && !allConcernValues.includes(concernData.value)) {
                    allConcernValues.push(concernData.value);
                }
            }
        });
        
        // For each unused category, get 4-6 products
        for (const categoryValue of unusedCategories) {
            const categoryData = PRODUCT_CATEGORIES.find(c => c.value === categoryValue);
            const categoryName = categoryData ? categoryData.title : `Category${categoryValue}`;

            // Exclude routine recommendation products + disliked products
            const excludeProductIds = [...new Set([...recentRoutineProductIds, ...dislikedProducts])];
            
            const categoryProducts = await queryProductsByCategory(
                categoryValue,
                concernWeights, // Pass user's concernWeights for similarity calculation
                userInfo.rawSkinType,
                userInfo.rawSensitivities || userInfo.sensitivities || [],
                userInfo.rawSensitivity || 0, // User sensitivity level (0-3)
                6, // Get 6 products per category for scan recommendations
                excludeProductIds
            );

            if (categoryProducts.length > 0) {
                const productIds = categoryProducts.map(p => p.id);
                scanRecommendations.push(...productIds);
            } else {
                console.log(`WARNING: No products found for scan category ${categoryName}`);
            }
        }
        
        return scanRecommendations;
    } catch (error) {
        console.error('Error generating scan recommendations:', error);
        throw new Error(`Failed to generate scan recommendations: ${error}`);
    }
}

// Save diagnosis document with recommendations to Firestore
async function saveDiagnosisDocumentWithRecommendations(
  userId,
  severities,
  concernWeights,
  summary,
  diagnosis,
  routineRecommendations = null,
  scanRecommendations = null,
  additionalNotes = null
) {
  try {
    const diagnosisRef = db.collection(`users/${userId}/diagnoses`).doc();

    const diagnosisDocument = {
      severities,
      concernWeights,
      summary,
      diagnosis,
      createdAt: new Date(),
    };

    // Add recommendations if they exist
    if (routineRecommendations && routineRecommendations.length > 0) {
      diagnosisDocument.routineRecommendations = routineRecommendations;
    }

    if (scanRecommendations && scanRecommendations.length > 0) {
      diagnosisDocument.scanRecommendations = scanRecommendations;
    } else {
      console.log('=== NO SCAN RECOMMENDATIONS TO SAVE ===');
      console.log('scanRecommendations value:', scanRecommendations);
    }

    // Add additionalNotes if provided
    if (additionalNotes && additionalNotes.trim()) {
      diagnosisDocument.additionalNotes = additionalNotes.trim();
    }
    
    await diagnosisRef.set(diagnosisDocument);
    
    // Return document with ID included
    return {
      id: diagnosisRef.id,
      ...diagnosisDocument
    };
  } catch (error) {
    console.error('Error saving diagnosis document with recommendations:', error);
    throw new Error(`Failed to save diagnosis with recommendations: ${error}`);
  }
}

// Save facial scan images to Firebase Storage (without returning URL)
// SECURITY: No URLs or access tokens are generated - users access images via storage reference only
async function saveFacialScanImages(userId, diagnosisId, imageDataObject) {
  try {
    const bucket = storage.bucket();
    const imageKeys = ['front', 'left', 'right'];
    
    for (const imageKey of imageKeys) {
      // Proper folder structure: users/{userId}/diagnoses/{diagnosisId}/{front|left|right}
      const fileName = `users/${userId}/diagnoses/${diagnosisId}/${imageKey}`;
      const file = bucket.file(fileName);
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageDataObject[imageKey], 'base64');
      
      // Process image to ensure consistent format and size
      const processedBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      
      // Upload to Firebase Storage (protected by rules, not public)
      await file.save(processedBuffer, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            userId: userId,
            diagnosisId: diagnosisId,
            imageType: imageKey,
            uploadedAt: new Date().toISOString()
          }
        }
      });
    }
  } catch (error) {
    console.error('Error saving facial scan images:', error);
    throw new Error(`Failed to save facial scan images: ${error}`);
  }
}

// Main cloud function for face scanning
exports.processFaceScan = onCall({
    secrets: [openaiFA],
    timeoutSeconds: 300, // 5 minutes
    memory: '1GiB'
}, async (request) => {
    // Initialize OpenAI instances with secrets
    const faApiKey = openaiFA.value();

    if (!faApiKey) {
        throw new HttpsError('failed-precondition', 'OpenAI API keys not properly configured');
    }

    const facialAnalyzer = new OpenAI({
        apiKey: faApiKey,
        timeout: 60000 // 60 second timeout
    });

    try {
        // Verify user is authenticated
        if (!request.auth || !request.auth.uid) {
            throw new HttpsError('unauthenticated', 'User must be authenticated to process face scan');
        }

        const { imageData, additionalNotes } = request.data;
        const userId = request.auth.uid;
        
        // Rate limiting check - User-based, 3 attempts per week for all scans
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        const rateLimitKey = userId;
        const maxAttempts = 3; // 3 attempts per week per user
        
        try {
            const rateLimitDoc = await admin.firestore().doc(`rateLimits/${rateLimitKey}`).get();
        
            if (rateLimitDoc.exists) {
                const data = rateLimitDoc.data();
                const attempts = data.attempts || 0;
                const lastAttempt = data.lastAttempt || 0;
                
                // Reset counter if more than 24 hours have passed
                if (now - lastAttempt > oneWeek) {
                    await admin.firestore().doc(`rateLimits/${rateLimitKey}`).set({
                        attempts: 1,
                        lastAttempt: now
                    });
                } else if (attempts > maxAttempts) {
                    throw new HttpsError('resource-exhausted', `Too many scan attempts. You have reached your weekly limit of 3 scans. Please try again next week.`);
                } else {
                    // Increment attempt counter
                    await admin.firestore().doc(`rateLimits/${rateLimitKey}`).update({
                        attempts: attempts + 1,
                        lastAttempt: now
                    });
                }
            } else {
                // First attempt for this user
                await admin.firestore().doc(`rateLimits/${rateLimitKey}`).set({
                    attempts: 1,
                    lastAttempt: now
                });
            }
        } catch (rateLimitError) {
            console.error('Rate limiting check failed:', rateLimitError);
            // Re-throw rate limit errors, but continue for other errors to avoid blocking legitimate users
            if (rateLimitError instanceof HttpsError && rateLimitError.code === 'resource-exhausted') {
                throw rateLimitError;
            }
        }

        // Validate required data
        if (!imageData) {
            throw new HttpsError('invalid-argument', 'imageData is required');
        }

        // Validate imageData structure for 3 images
        if (!imageData.front || !imageData.left || !imageData.right) {
            throw new HttpsError('invalid-argument', 'imageData must contain front, left, and right images');
        }

        // Validate additionalNotes if provided
        if (additionalNotes !== undefined && additionalNotes !== null) {
            if (typeof additionalNotes !== 'string') {
                throw new HttpsError('invalid-argument', 'additionalNotes must be a string');
            }
            if (additionalNotes.length > 250) {
                throw new HttpsError('invalid-argument', 'additionalNotes must be 250 characters or less');
            }
        }

        // Enhanced image data validation
        const imageKeys = ['front', 'left', 'right'];
        for (const key of imageKeys) {
            const imageDataString = imageData[key];
            
            // Check data type
            if (typeof imageDataString !== 'string') {
                throw new HttpsError('invalid-argument', `${key} image data must be a string`);
            }
            
            // Check size (max ~8MB base64 each)
            if (imageDataString.length > 11000000) {
                throw new HttpsError('invalid-argument', `${key} image data too large. Please use a smaller image.`);
            }
            
            // Check minimum size (prevent empty or too small images)
            if (imageDataString.length < 1000) {
                throw new HttpsError('invalid-argument', `${key} image data too small. Please provide a valid image.`);
            }
            
            // Validate base64 format (basic check)
            const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;
            if (!base64Pattern.test(imageDataString)) {
                throw new HttpsError('invalid-argument', `${key} image must be a valid base64 encoded image (JPEG, PNG, or WebP)`);
            }
        }
        
        // Validate if user can scan (3-day cooldown)
        const scanValidation = await validateScanCooldown(userId);
        if (!scanValidation.canScan) {
            throw new HttpsError('permission-denied', `Scan validation failed: ${scanValidation.message}`);
        }
        
        const isFirstScan = scanValidation.isFirstScan;
        
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new HttpsError('not-found', `User not found for userId: ${userId}`);
        }
        
        const userData = userDoc.data();
        
        // Validate user has required profile data for analysis
        if (!userData.profile || !userData.profile.skinInfo) {
            throw new HttpsError('failed-precondition', 'User profile incomplete. Please complete your skin profile before scanning.');
        }
        
        const convertedUserInfo = convertUserDataForGPT(userData);
        
        // Get most recent diagnosis for comparison
        const previousDiagnosis = await getMostRecentDiagnosis(userId);
        
        // Process images for all 3 angles
        const processedImages = {};
        let totalImageSize = 0;
        
        // add up the base64 size of all 3 images
        for (const imageKey of imageKeys) {
            processedImages[imageKey] = await processImageToBase64(imageData[imageKey]);
            totalImageSize += processedImages[imageKey].length;
        }

        // Validate total image size isn't too large for OpenAI
        if (totalImageSize > 20971520) { // 20MB limit for OpenAI
            throw new HttpsError('invalid-argument', 'Combined processed images too large for analysis. Please use smaller images.');
        }
        
        // Create GPT prompt for facial analysis with all 3 images
        const gptRequest = createGPTPrompt(convertedUserInfo, processedImages, previousDiagnosis, isFirstScan, additionalNotes);

        // Call OpenAI API for facial analysis with retry logic
        let gptContent;
        try {
            gptContent = await callGPTWithRetry(facialAnalyzer, gptRequest, 3, 'Facial analysis');
        } catch (analysisError) {
            // If the image analysis fails, try a fallback approach without image
            const fallbackRequest = createFallbackGPTPrompt(convertedUserInfo, previousDiagnosis, isFirstScan, additionalNotes);
            
            try {
                gptContent = await callGPTWithRetry(facialAnalyzer, fallbackRequest, 2, 'Fallback analysis');
            } catch (fallbackError) {

                // Fallback analysis also failed. just fail completely at this point
                throw new HttpsError('unavailable', `AI analysis service is currently unavailable. Please try again later. Error: ${analysisError.message}`);
            }
        }
        
        // Parse GPT response with robust error handling
        let analysisResult;
        try {
            analysisResult = parseGPTResponse(gptContent, 'facial analysis');
        } catch (parseError) {
            throw new HttpsError('internal', `Failed to parse AI analysis results: ${parseError.message}`);
        }
        
        // Validate and sanitize response structure
        if (!analysisResult.severities || !analysisResult.summary || !analysisResult.diagnosis) {
            console.error('Invalid AI response structure:', analysisResult);
            throw new HttpsError('internal', `Invalid AI analysis response format. Missing required fields: severities, summary, or diagnosis.`);
        }

        // concernWeights is required for new system - add default if missing
        if (!analysisResult.concernWeights) {
            console.warn('Missing concernWeights in AI response, adding balanced defaults');
            const requiredConcernWeights = ['acne', 'aging', 'darkCircles', 'dryness', 'oiliness', 'pores', 'redness', 'tone'];
            const defaultWeight = 1.0 / requiredConcernWeights.length;
            analysisResult.concernWeights = {};
            requiredConcernWeights.forEach(concern => {
                analysisResult.concernWeights[concern] = defaultWeight;
            });
        }

        // Validate severities are numbers and within valid range
        const requiredSeverities = ['overall', 'acne', 'redness', 'oiliness', 'dryness', 'tone', 'aging', 'pores', 'darkCircles'];
        for (const severity of requiredSeverities) {
            const value = analysisResult.severities[severity];
            if (typeof value !== 'number' || value < 0 || value > 100) {
                console.error(`Invalid severity value for ${severity}:`, value);
                // Set a default value rather than failing completely
                analysisResult.severities[severity] = 50; // Neutral default
            }
        }

        // Validate concernWeights are numbers and within valid range, and sum to 1.0
        const requiredConcernWeights = ['acne', 'aging', 'darkCircles', 'dryness', 'oiliness', 'pores', 'redness', 'tone'];
        let weightSum = 0;
        let hasInvalidWeights = false;

        for (const concern of requiredConcernWeights) {
            const value = analysisResult.concernWeights[concern];
            if (typeof value !== 'number' || value < 0 || value > 1) {
                console.error(`Invalid concern weight value for ${concern}:`, value);
                hasInvalidWeights = true;
                break;
            }
            weightSum += value;
        }

        // Check if weights sum to approximately 1.0 (allow small floating point errors)
        if (hasInvalidWeights || Math.abs(weightSum - 1.0) > 0.01) {
            console.error(`Invalid concernWeights - sum is ${weightSum}, should be 1.0. Setting defaults.`);
            // Set balanced default weights
            const defaultWeight = 1.0 / requiredConcernWeights.length;
            requiredConcernWeights.forEach(concern => {
                analysisResult.concernWeights[concern] = defaultWeight;
            });
        }
        
        const currentSeverities = analysisResult.severities;
        let routineRecommendations = null;
        let scanRecommendations = null;
        
        // Get user's disliked products early in the function
        const dislikedProducts = await getUserDislikedProducts(userId);
        
        // Generate routine recommendations if needed
        if (isFirstScan) {
            try {
                routineRecommendations = await generateRoutineRecommendations(
                    convertedUserInfo,
                    currentSeverities,
                    analysisResult.concernWeights, // Pass concernWeights
                    userData,
                    userId,
                    dislikedProducts, // Pass disliked products
                );
            } catch (routineError) {
                console.error('Error generating routine recommendations:', routineError);
                routineRecommendations = []; // Continue with empty recommendations
            }
        } else {
            // Check if routine recommendations threshold is met
            const lastRoutineDiagnosis = await getMostRecentDiagnosisWithRoutineRecommendations(userId);
            if (lastRoutineDiagnosis) {
                const userSkinConcerns = userData.profile?.skinInfo?.skinConcerns || [];
                
                const thresholdMet = checkRoutineRecommendationThreshold(
                    lastRoutineDiagnosis.severities,
                    currentSeverities,
                    userSkinConcerns
                );
                
                if (thresholdMet) {
                    // improvement threshold met, give new recommendations
                    routineRecommendations = await generateRoutineRecommendations(
                        convertedUserInfo,
                        currentSeverities,
                        analysisResult.concernWeights, // Pass concernWeights
                        userData,
                        userId,
                        dislikedProducts, // Pass disliked products
                    );
                }
            }
        }
        
        // Generate scan recommendations (for all scans every 3 days)
        try {
            // Get recent routine recommendation product IDs to exclude
            const recentRoutineProductIds = await getRecentRoutineRecommendationProductIds(userId);
            
            // Generate scan recommendations using new category-based approach
            scanRecommendations = await generateScanRecommendations(
                convertedUserInfo,
                currentSeverities,
                analysisResult.concernWeights, // Pass concernWeights
                recentRoutineProductIds,
                dislikedProducts,
                userId,
                routineRecommendations || [] // Pass current routine recommendations
            );
        } catch (scanRecommendationError) {
            console.error('=== SCAN RECOMMENDATIONS ERROR ===');
            console.error('Error generating scan recommendations, continuing without them:', scanRecommendationError);
            scanRecommendations = []; // Continue with empty recommendations rather than failing
        }
        
        // Save diagnosis document with recommendations
        const diagnosisDocument = await saveDiagnosisDocumentWithRecommendations(
            userId,
            analysisResult.severities,
            analysisResult.concernWeights,
            analysisResult.summary,
            analysisResult.diagnosis,
            routineRecommendations,
            scanRecommendations,
            additionalNotes
        );
        
        // Save facial scan images to Firebase Storage (SECURITY: no URLs generated)
        await saveFacialScanImages(userId, diagnosisDocument.id, processedImages);
        
        return {
            success: true,
            diagnosis: diagnosisDocument,
            isFirstScan,
            hasRoutineRecommendations: !!routineRecommendations,
            hasScanRecommendations: !!scanRecommendations
        };
    } catch (error) {
        console.error('Error in processFaceScan:', error);
        
        if (error instanceof HttpsError) {
            throw error;
        }
        
        // Handle specific error types with more context
        if (error.message?.includes('OpenAI')) {
            throw new HttpsError('unavailable', `AI analysis service temporarily unavailable: ${error.message}`);
        }
        
        if (error.message?.includes('image')) {
            throw new HttpsError('invalid-argument', `Image processing failed: ${error.message}`);
        }
        
        throw new HttpsError('internal', `An error occurred while processing the face scan: ${error.message || error}`);
    }
});