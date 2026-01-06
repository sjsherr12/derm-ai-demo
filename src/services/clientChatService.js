import { getAI, getGenerativeModel, VertexAIBackend } from 'firebase/ai';
import { getFirestore, collection, doc, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { storage as firebaseStorage } from '../services/firebase/firebase';
import {
    AgeGroups,
    Genders,
    SkinTypes,
    SkinTones,
    SkinSensitivities,
    BreakoutLocations,
    GenericClimates,
    SkinConcerns,
    SkincareGoals,
    CommonAllergens
} from '../constants/signup';
import {
    SkincareProductCategories,
    RoutineProductTypes,
    RoutineProductUsageFrequencies
} from '../constants/products';

class ClientChatService {
    constructor() {
        this.app = getApp();
        this.firestore = getFirestore(this.app);
        this.auth = getAuth(this.app);
        this.storage = getStorage(this.app);

        // Initialize Firebase AI with Vertex backend
        this.ai = getAI(this.app, { backend: new VertexAIBackend() });

        // Active listeners for cleanup
        this.activeListeners = new Map();
    }

    /**
     * Helper function to convert values to text using mapping arrays
     */
    convertValueToText(value, mappingArray) {
        if (value === null || value === undefined) return 'Not specified';
        const item = mappingArray.find(item => item.value === value);
        return item ? item.title : `Unknown (${value})`;
    }

    /**
     * Helper function to convert array values to text using mapping arrays
     */
    convertArrayToText(valueArray, mappingArray) {
        if (!Array.isArray(valueArray) || valueArray.length === 0) return 'None specified';

        return valueArray.map(value => {
            const item = mappingArray.find(item => item.value === value);
            return item ? item.title : `Unknown (${value})`;
        }).join(', ');
    }

    /**
     * Create user profile context for system instruction
     */
    createUserProfileContext(userData) {
        if (!userData?.profile?.skinInfo) {
            console.log('user info not available', userData)
            return 'USER INFORMATION: User profile data not available.';
        }

        const profile = userData.profile;
        const skinInfo = profile.skinInfo;

        const userInfo = {
            age: this.convertValueToText(profile.age, AgeGroups),
            gender: this.convertValueToText(profile.gender, Genders),
            skinType: this.convertValueToText(skinInfo.skinType, SkinTypes),
            skinTone: this.convertValueToText(skinInfo.skinTone, SkinTones),
            sensitivity: this.convertValueToText(skinInfo.sensitivity, SkinSensitivities),
            breakoutLocations: this.convertArrayToText(skinInfo.breakoutLocations, BreakoutLocations),
            climate: this.convertValueToText(skinInfo.climate, GenericClimates),
            skinConcerns: this.convertArrayToText(skinInfo.skinConcerns, SkinConcerns),
            skincareGoals: this.convertArrayToText(skinInfo.skincareGoals, SkincareGoals),
            sensitivities: this.convertArrayToText(skinInfo.sensitivities || [], CommonAllergens),
        };

        return `USER INFORMATION:
- Age: ${userInfo.age}
- Gender: ${userInfo.gender}
- Skin Type: ${userInfo.skinType}
- Skin Tone: ${userInfo.skinTone}
- Sensitivity: ${userInfo.sensitivity}
- Common Breakout Locations: ${userInfo.breakoutLocations}
- Climate: ${userInfo.climate}
- Current Skin Concerns: ${userInfo.skinConcerns}
- Skincare Goals: ${userInfo.skincareGoals}
- Known Sensitivities: ${userInfo.sensitivities}`;
    }

    /**
     * Create routine context for system instruction
     */
    createRoutineContext(routineProducts) {
        if (!routineProducts || !Array.isArray(routineProducts) || routineProducts.length === 0) {
            return 'USER ROUTINE: User has not set up their skincare routine yet.';
        }

        // Separate into morning and evening routines
        const morningRoutine = routineProducts.filter(rp => rp?.routineInfo?.routineType === 0);
        const eveningRoutine = routineProducts.filter(rp => rp?.routineInfo?.routineType === 1);

        const formatRoutineItem = (rp, index) => {
            const productInfo = rp?.productInfo;
            const routineInfo = rp?.routineInfo;

            if (!productInfo || !routineInfo) return null;

            const category = SkincareProductCategories.find(cat => cat.value === productInfo.category);
            const frequency = RoutineProductUsageFrequencies.find(freq => freq.value === routineInfo.usageFrequency);

            let itemText = `  ${index + 1}. ${productInfo.brand} - ${productInfo.name}`;
            itemText += `\n     Category: ${category?.title || 'Unknown'}`;
            if (frequency) {
                itemText += ` | Frequency: ${frequency.title}`;
            }
            if (routineInfo.directions) {
                itemText += `\n     Notes: ${routineInfo.directions}`;
            }

            return itemText;
        };

        let routineContext = 'USER ROUTINE:\n';

        if (morningRoutine.length > 0) {
            routineContext += '\nMorning Routine:\n';
            morningRoutine.forEach((rp, index) => {
                const formatted = formatRoutineItem(rp, index);
                if (formatted) routineContext += formatted + '\n';
            });
        } else {
            routineContext += '\nMorning Routine: Not set up\n';
        }

        if (eveningRoutine.length > 0) {
            routineContext += '\nEvening Routine:\n';
            eveningRoutine.forEach((rp, index) => {
                const formatted = formatRoutineItem(rp, index);
                if (formatted) routineContext += formatted + '\n';
            });
        } else {
            routineContext += '\nEvening Routine: Not set up\n';
        }

        return routineContext.trim();
    }

    /**
     * Get the AI model instance with user context
     */
    getModel(userData = null, routineProducts = null, productRecommendationMode = false) {
        const userProfileContext = userData ? this.createUserProfileContext(userData) : 'USER INFORMATION: User profile data not available.';
        const routineContext = routineProducts ? this.createRoutineContext(routineProducts) : 'USER ROUTINE: User routine data not available.';

        const baseSystemInstruction = `You are Derm AI, an expert virtual skin advisor and dermatology assistant specializing in skincare guidance and product recommendations. You have access to comprehensive user data and a complete product database.

${userProfileContext}

${routineContext}

## Your Capabilities:
1. **Skincare Expertise**: Provide evidence-based advice on skin concerns, conditions, and care routines
2. **Product Recommendations**: When users ask for product help, our system will automatically select matching products from our database
3. **User Context**: Access user's skin profile, concerns, routines, and purchase history for personalized advice
4. **Routine Analysis**: When users ask about their routine (e.g., "rate my morning routine", "suggest improvements"), use the routine information above to provide specific feedback

## Response Guidelines:
- Be professional, friendly, and empathetic
- Provide specific, actionable advice tailored to the user's profile above
- Consider user's skin type, concerns, budget, and current routine from their profile
- Acknowledge limitations - you're not a replacement for professional dermatological care
- For serious conditions, recommend consulting a dermatologist
- Keep responses concise but comprehensive (aim for 150-300 words)
- Always reference the user's specific skin information when providing advice

## IMPORTANT - Product Recommendation Format:
When a user asks for product recommendations:
- DO NOT mention specific product names, brands, or ingredients
- DO NOT talk about what types of products to look for (e.g., "look for serums with X")
- DO NOT list or describe specific product categories or formulations
- Instead, focus ONLY on:
  * Explaining their skin concern and why it's happening
  * What their skin condition means for their skincare routine
  * General skincare advice (frequency, application tips, etc.)
  * End with a simple statement that you'll compile recommendations
- Our system will automatically analyze their needs and display matching products
- Keep responses focused on education about their condition, not products

Example Response:
"Based on your oily skin and acne concerns, these conditions are often related to increased sebum production and inflammation. It's important to maintain a gentle cleansing routine twice daily and avoid over-washing which can worsen oil production. I'll compile a list of product recommendations that target these specific concerns for you."

## Important:
- Always prioritize user safety and skin health
- Never diagnose medical conditions
- Base all recommendations on the user's specific profile
- Consider user's budget, preferences, and skin sensitivities from their profile
- Reference specific user information when providing personalized advice`;

        const productRecommendationInstruction = `
## PRODUCT RECOMMENDATION MODE

You are now in product recommendation mode. Your task is to:

1. **Analyze the user's request** and determine if they are asking for product recommendations
2. **Generate a concernWeights vector** (8D, values sum to 1.0) based on what the user wants help with

CRITICAL: You MUST respond in valid JSON format with this exact structure:
{
  "needsProductRecommendation": boolean,
  "concernWeights": {
    "acne": number (0.0-1.0),
    "aging": number (0.0-1.0),
    "darkCircles": number (0.0-1.0),
    "dryness": number (0.0-1.0),
    "oiliness": number (0.0-1.0),
    "pores": number (0.0-1.0),
    "redness": number (0.0-1.0),
    "tone": number (0.0-1.0)
  }
}

## ConcernWeights Generation Rules:
- Focus weights on 1-3 primary concerns mentioned by the user (70-90% of total weight)
- Use 0.0 for concerns NOT mentioned or relevant to the user's request
- All values must be floats between 0.0-1.0 and sum to exactly 1.0
- Base weights on: user's prompt, attached image (if any), and their profile

## Examples:
User asks: "I need help with my acne and oily skin"
{
  "needsProductRecommendation": true,
  "concernWeights": {
    "acne": 0.6,
    "oiliness": 0.4,
    "aging": 0.0,
    "darkCircles": 0.0,
    "dryness": 0.0,
    "pores": 0.0,
    "redness": 0.0,
    "tone": 0.0
  }
}

User asks: "What's a good moisturizer for dry skin?"
{
  "needsProductRecommendation": true,
  "concernWeights": {
    "dryness": 1.0,
    "acne": 0.0,
    "aging": 0.0,
    "darkCircles": 0.0,
    "oiliness": 0.0,
    "pores": 0.0,
    "redness": 0.0,
    "tone": 0.0
  }
}

User asks: "How often should I wash my face?"
{
  "needsProductRecommendation": false,
  "concernWeights": {
    "acne": 0.0,
    "aging": 0.0,
    "darkCircles": 0.0,
    "dryness": 0.0,
    "oiliness": 0.0,
    "pores": 0.0,
    "redness": 0.0,
    "tone": 0.0
  }
}

User asks: "My routine is missing some products, can you recommend some?"
{
  "needsProductRecommendation": true,
  "concernWeights": {
    "acne": 0.2,
    "aging": 0.2,
    "darkCircles": 0.0,
    "dryness": 0.3,
    "oiliness": 0.0,
    "pores": 0.1,
    "redness": 0.1,
    "tone": 0.1
  }
}

User asks: "Help improve my morning routine"
{
  "needsProductRecommendation": true,
  "concernWeights": {
    "acne": 0.15,
    "aging": 0.15,
    "darkCircles": 0.1,
    "dryness": 0.2,
    "oiliness": 0.1,
    "pores": 0.1,
    "redness": 0.1,
    "tone": 0.1
  }
}`;

        const config = {
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: productRecommendationMode ? 0.1 : 0.7,
                topP: productRecommendationMode ? 0.9 : 0.8,
                maxOutputTokens: productRecommendationMode ? 512 : 2048,
            },
            systemInstruction: productRecommendationMode
                ? productRecommendationInstruction
                : baseSystemInstruction
        };

        // Add JSON mode for product recommendation
        if (productRecommendationMode) {
            config.generationConfig.responseMimeType = "application/json";
        }

        return getGenerativeModel(this.ai, config);
    }

    /**
     * Generate chat title from first message
     */
    generateChatTitle(message) {
        const words = message.trim().split(' ');
        const title = words.slice(0, 6).join(' ');
        return title.length > 30 ? title.substring(0, 27) + '...' : title;
    }

    /**
     * Compress image for chat upload
     */
    async compressChatImage(imageUri) {
        try {
            const compressedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    // Resize to max 800px on longest side while maintaining aspect ratio
                    { resize: { width: 800 } }
                ],
                {
                    compress: 0.7, // 70% quality
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            // Get file sizes for comparison
            const originalInfo = await FileSystem.getInfoAsync(imageUri);
            const compressedInfo = await FileSystem.getInfoAsync(compressedImage.uri);

            console.log('Image compressed:', {
                from: (originalInfo.size / 1024 / 1024).toFixed(2) + 'MB',
                to: (compressedInfo.size / 1024 / 1024).toFixed(2) + 'MB',
                saved: ((1 - compressedInfo.size / originalInfo.size) * 100).toFixed(1) + '%'
            });

            return compressedImage.uri;
        } catch (error) {
            console.warn('Image compression failed, using original:', error);
            return imageUri; // Fallback to original if compression fails
        }
    }

    /**
     * Upload image to Firebase Storage
     */
    async uploadChatImage(imageUri, userId, chatId) {
        try {
            // Compress the image first
            const compressedImageUri = await this.compressChatImage(imageUri);

            // Fetch the compressed image
            const response = await fetch(compressedImageUri);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }

            // Create blob
            const blob = await response.blob();

            // Create storage reference
            const fileExtension = imageUri.split('.').pop() || 'jpg';
            const fileName = `image_${Date.now()}.${fileExtension}`;
            const storagePath = `users/${userId}/chats/${chatId}/${fileName}`;

            // Use the same storage instance as profile upload
            const imageRef = ref(firebaseStorage, storagePath);

            // Upload the image
            await uploadBytes(imageRef, blob);

            // Get download URL
            const downloadURL = await getDownloadURL(imageRef);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading chat image:', error);
            throw new Error('Failed to upload image. Please try again.');
        }
    }

    /**
     * Get conversation history from chat messages
     */
    async getConversationHistory(userId, chatId) {
        if (!chatId) return [];

        try {
            const messagesRef = collection(this.firestore, 'users', userId, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(q);

            const history = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const parts = [{ text: data.content }];

                // Add image to parts if present (for AI model, we need to fetch the image data)
                if (data.hasImage && data.imageUrl) {
                    // For now, we'll include a text description that the user sent an image
                    // The actual image processing will be handled when sending the current message
                    parts[0].text += ' [User attached an image of their skin]';
                }

                history.push({
                    role: data.isFromAI ? 'model' : 'user',
                    parts: parts
                });
            });

            return history;
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            return [];
        }
    }

    /**
     * Send message and get AI response
     */
    async sendMessage(message, imageUri = null, chatId = null, userData = null, productsObject = null, routineProducts = null) {
        try {
            const userId = this.auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            if (!message.trim()) {
                throw new Error('Message cannot be empty');
            }

            let currentChatId = chatId;
            let chatRef;

            // Create or get chat reference
            if (!currentChatId) {
                chatRef = doc(collection(this.firestore, 'users', userId, 'chats'));
                currentChatId = chatRef.id;

                // Create new chat
                await setDoc(chatRef, {
                    title: this.generateChatTitle(message),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            } else {
                chatRef = doc(this.firestore, 'users', userId, 'chats', currentChatId);

                // Update chat timestamp
                await updateDoc(chatRef, {
                    updatedAt: serverTimestamp()
                });
            }

            // Prepare user message data
            const userMessageData = {
                content: message.trim(),
                isFromAI: false,
                timestamp: serverTimestamp()
            };

            // If there's an image, upload it and add the URL to the message
            if (imageUri) {
                const imageUrl = await this.uploadChatImage(imageUri, userId, currentChatId);
                userMessageData.imageUrl = imageUrl;
                userMessageData.hasImage = true;
            }

            // Add user message
            await addDoc(collection(chatRef, 'messages'), userMessageData);

            // Detect if user is asking for product recommendations
            let productRecommendationData = null;
            if (productsObject && userData?.profile?.skinInfo) {
                // Quick heuristic: Skip detection if message is clearly not about products
                const lowerMessage = message.toLowerCase();
                const nonProductKeywords = ['rate my', 'review my', 'how is my', 'analyze my', 'feedback on my', 'thoughts on my', 'opinion on my'];
                const isLikelyRoutineQuestion = nonProductKeywords.some(keyword => lowerMessage.includes(keyword));

                if (isLikelyRoutineQuestion) {
                    console.log('Skipping product recommendation detection - user asking for routine feedback');
                } else {
                    // Only call AI detection if it's not obviously a routine review question
                    try {
                        productRecommendationData = await this.detectProductRecommendation(message, imageUri, userData);
                    } catch (detectionError) {
                        console.warn('Failed to detect product recommendation:', detectionError);
                    }
                }
            }

            // Get conversation history for context
            const conversationHistory = await this.getConversationHistory(userId, currentChatId);

            // Get AI response with conversation context
            const model = this.getModel(userData, routineProducts);

            let result;

            // Prepare message parts for AI
            const messageParts = [{ text: message }];

            // If there's an image, we need to fetch it and add it to the message
            if (imageUri) {
                try {
                    const response = await fetch(imageUri);
                    const blob = await response.blob();
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result.split(',')[1]);
                        reader.readAsDataURL(blob);
                    });

                    messageParts.push({
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64
                        }
                    });
                } catch (imageError) {
                    console.warn('Failed to process image for AI:', imageError);
                    // Continue without image
                }
            }

            if (conversationHistory.length > 0) {
                // Start chat with history for context continuity
                const chat = model.startChat({
                    history: conversationHistory
                });
                result = await chat.sendMessage(messageParts);
            } else {
                // First message in conversation
                result = await model.generateContent(messageParts);
            }

            let aiResponse = result.response.text();

            if (!aiResponse.trim()) {
                throw new Error('Empty response from AI');
            }

            // Prepare AI message data
            const aiMessageData = {
                content: aiResponse.trim(),
                isFromAI: true,
                timestamp: serverTimestamp(),
            };

            // If product recommendations were detected, generate and attach them
            if (productRecommendationData?.needsProductRecommendation && productsObject) {
                const dislikedProducts = userData?.routine?.dislikedProducts || [];
                const userSkinInfo = userData?.profile?.skinInfo || {};

                const recommendedProductIds = this.filterAndRankProducts(
                    productsObject,
                    productRecommendationData.concernWeights,
                    userSkinInfo,
                    dislikedProducts,
                    6
                );

                if (recommendedProductIds.length > 0) {
                    aiMessageData.concernWeights = productRecommendationData.concernWeights;
                    aiMessageData.recommendedProducts = recommendedProductIds;
                    aiMessageData.hasProductRecommendations = true;
                }
            }

            // Save AI response
            const aiMessageDoc = await addDoc(collection(chatRef, 'messages'), aiMessageData);

            return {
                success: true,
                chatId: currentChatId,
                response: aiResponse.trim(),
                messageId: aiMessageDoc.id
            };

        } catch (error) {
            console.error('Error sending message:', error);

            // Handle specific errors
            if (error.message?.includes('quota')) {
                throw new Error('AI service temporarily unavailable. Please try again in a moment.');
            }

            if (error.message?.includes('timeout')) {
                throw new Error('Request timed out. Please try again.');
            }

            throw new Error(error.message || 'Failed to send message. Please try again.');
        }
    }

    /**
     * Listen to messages in a chat
     */
    listenToMessages(userId, chatId, callback) {
        const messagesRef = collection(this.firestore, 'users', userId, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const messages = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    messages.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate(),
                        // Ensure backward compatibility
                        hasImage: data.hasImage || false,
                        imageUrl: data.imageUrl || null,
                        // Product recommendation fields
                        hasProductRecommendations: data.hasProductRecommendations || false,
                        recommendedProducts: data.recommendedProducts || null,
                        concernWeights: data.concernWeights || null
                    });
                });
                callback(messages);
            },
            (error) => {
                console.error('Error listening to messages:', error);
                callback(null, error);
            }
        );

        // Store for cleanup
        const listenerId = `${userId}-${chatId}`;
        this.activeListeners.set(listenerId, unsubscribe);

        return unsubscribe;
    }

    /**
     * Listen to user's chats
     */
    listenToChats(userId, callback) {
        const chatsRef = collection(this.firestore, 'users', userId, 'chats');
        const q = query(chatsRef, orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const chats = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    chats.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate()
                    });
                });
                callback(chats);
            },
            (error) => {
                console.error('Error listening to chats:', error);
                callback(null, error);
            }
        );

        // Store for cleanup
        const listenerId = `chats-${userId}`;
        this.activeListeners.set(listenerId, unsubscribe);

        return unsubscribe;
    }

    /**
     * Stop listening to messages
     */
    stopListeningToMessages(userId, chatId) {
        const listenerId = `${userId}-${chatId}`;
        const unsubscribe = this.activeListeners.get(listenerId);
        if (unsubscribe) {
            unsubscribe();
            this.activeListeners.delete(listenerId);
        }
    }

    /**
     * Stop listening to chats
     */
    stopListeningToChats(userId) {
        const listenerId = `chats-${userId}`;
        const unsubscribe = this.activeListeners.get(listenerId);
        if (unsubscribe) {
            unsubscribe();
            this.activeListeners.delete(listenerId);
        }
    }

    /**
     * Clean up all listeners
     */
    cleanup() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();
    }

    /**
     * Calculate cosine similarity between two concernWeights vectors
     */
    calculateCosineSimilarity(userWeights, productWeights) {
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
            return 0;
        }

        return dotProduct / (userMagnitude * productMagnitude);
    }

    /**
     * Calculate skinHarshness penalty based on product harshness and user sensitivity
     */
    calculateSkinHarshnessPenalty(productSkinHarshness, userSensitivity) {
        if (productSkinHarshness === undefined || userSensitivity === undefined) {
            return 0;
        }

        const normalizedHarshness = productSkinHarshness / 3;
        const normalizedSensitivity = userSensitivity / 3;

        return normalizedHarshness * normalizedSensitivity * 0.3;
    }

    /**
     * Filter and rank products using cosine similarity
     * Returns array of product IDs sorted by relevance
     */
    filterAndRankProducts(productsObject, concernWeights, userSkinInfo, dislikedProducts = [], limit = 6) {
        if (!productsObject || typeof productsObject !== 'object') {
            return [];
        }

        const products = [];
        const userSkinType = userSkinInfo?.skinType;
        const userSensitivities = userSkinInfo?.sensitivities || [];
        const userSensitivity = userSkinInfo?.sensitivity || 0;

        // Filter products
        for (const [productId, product] of Object.entries(productsObject)) {
            let shouldInclude = true;

            // Filter: exclude disliked products
            if (dislikedProducts.includes(productId)) {
                shouldInclude = false;
            }

            // Filter: safety score >= 70
            if (shouldInclude && (product.safetyScore || 0) < 70) {
                shouldInclude = false;
            }

            // Filter: skin type compatibility
            if (shouldInclude && userSkinType !== null && userSkinType !== undefined &&
                product.skinTypes && product.skinTypes.length > 0) {
                if (!product.skinTypes.includes(userSkinType)) {
                    shouldInclude = false;
                }
            }

            // Filter: exclude products with user's sensitivities
            if (shouldInclude && userSensitivities.length > 0 && product.sensitivities) {
                const hasConflictingSensitivity = product.sensitivities.some(sensitivity =>
                    userSensitivities.includes(sensitivity)
                );
                if (hasConflictingSensitivity) {
                    shouldInclude = false;
                }
            }

            if (shouldInclude) {
                products.push({ id: productId, ...product });
            }
        }

        // Calculate similarity scores
        products.forEach(product => {
            if (product.concernWeights && concernWeights) {
                product._similarityScore = this.calculateCosineSimilarity(concernWeights, product.concernWeights);
            } else {
                product._similarityScore = (product.safetyScore || 70) / 100;
            }

            product._harshnessPenalty = this.calculateSkinHarshnessPenalty(product.skinHarshness, userSensitivity);
            product._finalScore = product._similarityScore - product._harshnessPenalty;
        });

        // Sort by final score
        products.sort((a, b) => {
            if (Math.abs(a._finalScore - b._finalScore) < 0.001) {
                return (b.safetyScore || 0) - (a.safetyScore || 0);
            }
            return b._finalScore - a._finalScore;
        });

        // Return top product IDs
        return products.slice(0, limit).map(p => p.id);
    }

    /**
     * Sanitize and extract JSON from AI response text
     */
    sanitizeJSONResponse(responseText) {
        if (!responseText) {
            throw new Error('Empty response text');
        }

        // Try to extract JSON from markdown code blocks
        let cleanedText = responseText.trim();

        // Remove markdown code blocks if present
        if (cleanedText.includes('```json')) {
            const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                cleanedText = jsonMatch[1].trim();
            }
        } else if (cleanedText.includes('```')) {
            const jsonMatch = cleanedText.match(/```\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                cleanedText = jsonMatch[1].trim();
            }
        }

        // Find the first { and last } to extract just the JSON object
        const firstBrace = cleanedText.indexOf('{');
        const lastBrace = cleanedText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
        }

        return cleanedText;
    }

    /**
     * Validate and normalize concernWeights
     */
    validateConcernWeights(analysisResult) {
        const concernKeys = ['acne', 'aging', 'darkCircles', 'dryness', 'oiliness', 'pores', 'redness', 'tone'];

        // Ensure concernWeights object exists
        if (!analysisResult.concernWeights || typeof analysisResult.concernWeights !== 'object') {
            throw new Error('Missing or invalid concernWeights object');
        }

        // Ensure all keys exist and are numbers
        for (const key of concernKeys) {
            if (typeof analysisResult.concernWeights[key] !== 'number') {
                analysisResult.concernWeights[key] = 0;
            }
        }

        // Calculate sum
        let weightSum = 0;
        for (const key of concernKeys) {
            weightSum += analysisResult.concernWeights[key] || 0;
        }

        // If sum is 0 and needsProductRecommendation is false, this is valid
        // User is asking a question that doesn't need product recommendations
        if (weightSum === 0) {
            if (!analysisResult.needsProductRecommendation) {
                // This is expected - user isn't asking for products
                return analysisResult;
            }
            // If they ARE asking for products but weights are 0, that's an error
            throw new Error('Product recommendation requested but all concernWeights are zero');
        }

        // Normalize if sum is not 1.0
        if (Math.abs(weightSum - 1.0) > 0.01) {
            console.warn('ConcernWeights did not sum to 1.0, normalizing:', weightSum);
            concernKeys.forEach(key => {
                analysisResult.concernWeights[key] = (analysisResult.concernWeights[key] || 0) / weightSum;
            });
        }

        return analysisResult;
    }

    /**
     * Create fallback concernWeights based on user profile
     */
    createFallbackConcernWeights(userData, message) {
        const lowerMessage = message.toLowerCase();

        // Check if message contains product request keywords
        const productKeywords = ['recommend', 'suggest', 'need', 'want', 'help with', 'improve', 'fill', 'missing', 'add'];
        const isProductRequest = productKeywords.some(keyword => lowerMessage.includes(keyword));

        if (!isProductRequest) {
            // Not a product request - return defaults with false flag
            return {
                needsProductRecommendation: false,
                concernWeights: {
                    acne: 0.125,
                    aging: 0.125,
                    darkCircles: 0.125,
                    dryness: 0.125,
                    oiliness: 0.125,
                    pores: 0.125,
                    redness: 0.125,
                    tone: 0.125
                }
            };
        }

        // It IS a product request - use user's profile to create weights
        const skinConcerns = userData?.profile?.skinInfo?.skinConcerns || [];
        const skinType = userData?.profile?.skinInfo?.skinType;

        const weights = {
            acne: 0,
            aging: 0,
            darkCircles: 0,
            dryness: 0,
            oiliness: 0,
            pores: 0,
            redness: 0,
            tone: 0
        };

        // Map skin concerns (values 0-7 from signup constants) to concern weights
        // 0: Acne, 1: Aging, 2: Dark circles, 3: Dryness, 4: Sensitivity, 5: Oiliness, 6: Large pores, 7: Uneven tone
        const concernMapping = {
            0: 'acne',
            1: 'aging',
            2: 'darkCircles',
            3: 'dryness',
            5: 'oiliness',
            6: 'pores',
            7: 'tone'
        };

        if (skinConcerns.length > 0) {
            // Distribute weight among user's concerns
            const weightPerConcern = 1.0 / skinConcerns.length;
            skinConcerns.forEach(concern => {
                const concernKey = concernMapping[concern];
                if (concernKey) {
                    weights[concernKey] = weightPerConcern;
                }
            });
        } else {
            // No concerns specified - use skin type to infer
            if (skinType === 0) { // Dry
                weights.dryness = 0.6;
                weights.aging = 0.2;
                weights.redness = 0.2;
            } else if (skinType === 1) { // Oily
                weights.oiliness = 0.5;
                weights.acne = 0.3;
                weights.pores = 0.2;
            } else if (skinType === 2) { // Combination
                weights.oiliness = 0.3;
                weights.dryness = 0.3;
                weights.pores = 0.2;
                weights.acne = 0.2;
            } else {
                // Normal or unknown - balanced approach
                weights.dryness = 0.25;
                weights.aging = 0.25;
                weights.oiliness = 0.25;
                weights.tone = 0.25;
            }
        }

        return {
            needsProductRecommendation: true,
            concernWeights: weights
        };
    }

    /**
     * Detect if user is requesting product recommendations and generate concernWeights
     */
    async detectProductRecommendation(message, imageUri, userData, maxRetries = 2) {
        // Create intelligent fallback based on user profile
        const fallbackResponse = this.createFallbackConcernWeights(userData, message);

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const model = this.getModel(userData, null, true); // Product recommendation mode

                const messageParts = [{ text: message }];

                // Add image if present
                if (imageUri) {
                    try {
                        const response = await fetch(imageUri);
                        const blob = await response.blob();
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result.split(',')[1]);
                            reader.readAsDataURL(blob);
                        });

                        messageParts.push({
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64
                            }
                        });
                    } catch (imageError) {
                        console.warn('Failed to process image for product recommendation detection:', imageError);
                    }
                }

                const result = await model.generateContent(messageParts);
                let responseText = '';

                try {
                    responseText = result.response.text();
                } catch (textError) {
                    console.error('Error extracting text from AI response:', textError);
                    throw new Error('Empty or invalid response from AI model');
                }

                if (!responseText || responseText.trim().length === 0) {
                    throw new Error('Empty response text from AI model');
                }

                // Sanitize and extract JSON
                const cleanedJSON = this.sanitizeJSONResponse(responseText);

                // Parse JSON response
                let analysisResult;
                try {
                    analysisResult = JSON.parse(cleanedJSON);
                } catch (parseError) {
                    console.error(`JSON parse error on attempt ${attempt + 1}:`, parseError);
                    console.error('Raw response:', responseText);
                    console.error('Cleaned JSON:', cleanedJSON);

                    // If this is not the last attempt, retry
                    if (attempt < maxRetries - 1) {
                        console.log(`Retrying product recommendation detection (attempt ${attempt + 2}/${maxRetries})...`);
                        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay before retry
                        continue;
                    }

                    throw parseError;
                }

                // Validate and normalize concernWeights
                analysisResult = this.validateConcernWeights(analysisResult);

                return {
                    needsProductRecommendation: analysisResult.needsProductRecommendation || false,
                    concernWeights: analysisResult.concernWeights
                };

            } catch (error) {
                // Log detailed error info
                console.error(`Error detecting product recommendation (attempt ${attempt + 1}/${maxRetries}):`, error);

                // If this is the last attempt, return intelligent fallback
                if (attempt === maxRetries - 1) {
                    console.warn('All retries exhausted. Using fallback based on user profile and message analysis.');
                    console.log('Fallback response:', JSON.stringify(fallbackResponse, null, 2));
                    return fallbackResponse;
                }

                // Otherwise, retry after a brief delay
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return fallbackResponse;
    }

    /**
     * Retry with exponential backoff
     */
    async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // Don't retry certain errors
                if (
                    error.message.includes('not authenticated') ||
                    error.message.includes('empty') ||
                    attempt === maxRetries
                ) {
                    throw error;
                }

                // Exponential backoff
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }
}

// Export singleton instance
export default new ClientChatService();