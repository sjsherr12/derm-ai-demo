import { getAI, getGenerativeModel, VertexAIBackend } from 'firebase/ai';
import { getApp } from 'firebase/app';
import * as FileSystem from 'expo-file-system';

class ProductScanService {
    constructor() {
        this.app = getApp();

        // Initialize Firebase AI with Vertex backend
        this.ai = getAI(this.app, { backend: new VertexAIBackend() });
    }

    /**
     * Get the AI model instance configured for OCR
     */
    getOCRModel() {
        return getGenerativeModel(this.ai, {
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.1,
                topP: 0.8,
                maxOutputTokens: 1024,
            },
            systemInstruction: `You are an OCR specialist focused on extracting text from product images for skincare and cosmetic products. Your task is to:

1. **Extract ALL visible text** from the image, including:
   - Product names
   - Brand names
   - Ingredient lists
   - Product descriptions
   - Any other readable text

2. **Format your response** as a JSON object with the following structure:
   {
     "extractedText": "All extracted text as a single string",
     "detectedBrands": ["list", "of", "detected", "brand", "names"],
     "detectedProducts": ["list", "of", "detected", "product", "names"],
     "confidence": 0.95
   }

3. **Guidelines:**
   - Be thorough but accurate
   - Include partial text if clearly readable
   - Focus on skincare/cosmetic product terminology
   - Return confidence score between 0 and 1
   - If no text is detected, return empty strings/arrays with low confidence

4. **Important:** Only return the JSON object, no additional text or explanation.`
        });
    }

    /**
     * Process image with OCR using Gemini Vertex AI
     */
    async processImageWithOCR(imageUri) {
        try {

            if (!imageUri) {
                throw new Error('Image URI is required');
            }

            // Read the image file as base64
            const base64Image = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (!base64Image) {
                throw new Error('Failed to read image file');
            }


            // Prepare the image data for Gemini
            const imageData = {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/jpeg', // Assuming JPEG, you might want to detect this
                }
            };


            // Get OCR model and process image
            const model = this.getOCRModel();
            const result = await model.generateContent([
                "Extract all text from this product image and return as JSON:",
                imageData
            ]);

            const responseText = result.response.text().trim();

            // Parse the JSON response
            let ocrResult;
            try {
                // Remove any markdown code block formatting if present
                const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();

                ocrResult = JSON.parse(cleanedResponse);
            } catch (parseError) {
                // Fallback to treating entire response as extracted text
                ocrResult = {
                    extractedText: responseText,
                    detectedBrands: [],
                    detectedProducts: [],
                    confidence: 0.5
                };
            }


            return {
                success: true,
                data: ocrResult
            };

        } catch (error) {

            // Handle specific errors
            if (error.message?.includes('quota')) {
                throw new Error('OCR service temporarily unavailable. Please try again in a moment.');
            }

            if (error.message?.includes('timeout')) {
                throw new Error('OCR request timed out. Please try again.');
            }

            throw new Error(error.message || 'Failed to process image. Please try again.');
        }
    }

    /**
     * Simple fuzzy matching algorithm using Levenshtein distance
     */
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;

        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();

        if (s1 === s2) return 1;

        const maxLength = Math.max(s1.length, s2.length);
        if (maxLength === 0) return 1;

        return (maxLength - this.levenshteinDistance(s1, s2)) / maxLength;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i;
        }

        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j;
        }

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,     // deletion
                    matrix[j - 1][i] + 1,     // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Create searchable text from product for fuzzy matching
     */
    createProductSearchText(product) {
        if (!product) return '';

        const searchableParts = [
            product.name || '',
            product.brand || '',
            product.description || '',
        ].filter(Boolean);

        return searchableParts.join(' ').toLowerCase().trim();
    }

    /**
     * Fuzzy match extracted text against product database
     */
    fuzzyMatchProducts(extractedText, products, maxResults = 3, minConfidence = 0.3) {

        if (!extractedText || !products || typeof products !== 'object') {
            return [];
        }

        const searchText = extractedText.toLowerCase().trim();

        const productMatches = [];

        // Convert products object to array if needed
        const productsArray = Array.isArray(products) ? products : Object.values(products);

        // First, try to find exact brand matches
        let priorityMatches = [];
        let regularMatches = [];

        for (const product of productsArray) {
            if (!product || !product.id) continue;

            const productName = (product.name || '').toLowerCase();
            const productBrand = (product.brand || '').toLowerCase();
            const productSearchText = this.createProductSearchText(product);

            if (!productSearchText) continue;

            // Check for exact brand match first
            const hasExactBrandMatch = productBrand && searchText.includes(productBrand);

            // Check for exact product name keywords
            const productNameWords = productName.split(/\s+/).filter(word => word.length > 2);
            const exactProductMatches = productNameWords.filter(word =>
                searchText.includes(word)
            );

            let finalScore = 0;
            let matchType = 'none';

            if (hasExactBrandMatch && exactProductMatches.length > 0) {
                // Perfect match: brand + product keywords found
                const productMatchRatio = exactProductMatches.length / Math.max(productNameWords.length, 1);
                finalScore = 0.9 + (productMatchRatio * 0.1); // 0.9-1.0 range
                matchType = 'perfect';
            } else if (hasExactBrandMatch) {
                // Good match: brand found
                finalScore = 0.7 + (exactProductMatches.length * 0.1); // 0.7+ range
                matchType = 'brand';
            } else if (exactProductMatches.length > 0) {
                // Fair match: product keywords found but no brand
                const productMatchRatio = exactProductMatches.length / Math.max(productNameWords.length, 1);
                finalScore = 0.5 + (productMatchRatio * 0.2); // 0.5-0.7 range
                matchType = 'product';
            } else {
                // Fallback to fuzzy matching
                const nameScore = this.calculateSimilarity(searchText, productName);
                const brandScore = this.calculateSimilarity(searchText, productBrand);
                const fullTextScore = this.calculateSimilarity(searchText, productSearchText);

                finalScore = Math.max(nameScore * 0.6, brandScore * 0.6, fullTextScore * 0.4);
                matchType = 'fuzzy';
            }


            if (finalScore >= minConfidence) {
                const match = {
                    product,
                    confidence: finalScore,
                    matchDetails: {
                        matchType,
                        hasExactBrandMatch,
                        exactProductMatches: exactProductMatches.length,
                        finalScore
                    }
                };

                if (matchType === 'perfect' || matchType === 'brand') {
                    priorityMatches.push(match);
                } else {
                    regularMatches.push(match);
                }
            }
        }

        // Combine priority matches first, then regular matches
        productMatches.push(...priorityMatches, ...regularMatches);


        // Sort by confidence (highest first) and return top results
        const sortedMatches = productMatches
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, maxResults);


        return sortedMatches;
    }

    /**
     * Main function to scan and match products
     */
    async scanAndMatchProducts(imageUri, products, maxResults = 3) {

        try {
            if (!imageUri || !products) {
                throw new Error('Image URI and products are required');
            }

            // Step 1: Process image with OCR
            const ocrResult = await this.processImageWithOCR(imageUri);

            if (!ocrResult.success || !ocrResult.data) {
                throw new Error('Failed to extract text from image');
            }

            const { extractedText, detectedBrands, detectedProducts, confidence } = ocrResult.data;
            // Step 2: Fuzzy match against products
            const matches = this.fuzzyMatchProducts(extractedText, products, maxResults);


            const finalResult = {
                success: true,
                ocrResult: {
                    extractedText,
                    detectedBrands: detectedBrands || [],
                    detectedProducts: detectedProducts || [],
                    confidence: confidence || 0
                },
                matches: matches.map(match => ({
                    productId: match.product.id,
                    product: match.product,
                    confidence: match.confidence,
                    matchDetails: match.matchDetails
                }))
            };


            return finalResult;

        } catch (error) {
            throw error;
        }
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
                    error.message.includes('Image URI is required') ||
                    error.message.includes('products are required') ||
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
export default new ProductScanService();