import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Auto-rotates an image based on its EXIF orientation data
 * This fixes the issue where iOS captures images with EXIF rotation data
 * but Firebase Storage doesn't respect the EXIF data, causing sideways images
 * 
 * @param {string} imageUri - The URI of the image to rotate
 * @param {number} quality - Image quality (0-1), defaults to 0.9
 * @returns {Promise<string>} - Returns the URI of the corrected image
 */
export const autoRotateImage = async (imageUri, quality = 0.9) => {
  try {
    // Use expo-image-manipulator to auto-rotate based on EXIF data and resize proportionally
    const manipulatedImage = await manipulateAsync(
      imageUri,
      [
        // Resize while maintaining aspect ratio - only specify width, height will be calculated proportionally
        { resize: { width: 1024 } },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
        base64: true, // Return base64 for easy transmission to Firebase function
      }
    );

    return manipulatedImage;
  } catch (error) {
    console.error('Error auto-rotating image:', error);
    throw new Error(`Failed to auto-rotate image: ${error.message}`);
  }
};

/**
 * Converts an image URI to base64 format with auto-rotation applied
 * 
 * @param {string} imageUri - The URI of the image
 * @param {number} quality - Image quality (0-1), defaults to 0.9
 * @returns {Promise<string>} - Returns base64 string ready for Firebase function
 */
export const imageUriToBase64WithRotation = async (imageUri, quality = 0.9) => {
  try {
    const rotatedImage = await autoRotateImage(imageUri, quality);
    return rotatedImage.base64;
  } catch (error) {
    console.error('Error converting image to base64 with rotation:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

/**
 * Prepares an image for Firebase function processing by:
 * 1. Auto-rotating based on EXIF data
 * 2. Resizing to optimal dimensions
 * 3. Converting to base64
 * 4. Compressing to reduce payload size
 * 
 * @param {string} imageUri - The URI of the image to process
 * @param {Object} options - Processing options
 * @param {number} options.quality - Image quality (0-1), defaults to 0.9
 * @param {number} options.maxWidth - Maximum width, defaults to 1024
 * @param {number} options.maxHeight - Maximum height, defaults to 1024
 * @returns {Promise<string>} - Returns base64 string ready for Firebase function
 */
export const prepareImageForFirebase = async (
  imageUri, 
  options = {}
) => {
  const {
    quality = 0.9,
    maxWidth = 1024,
    maxHeight = 1024
  } = options;

  try {
    const manipulatedImage = await manipulateAsync(
      imageUri,
      [
        // Resize while maintaining aspect ratio, constrained by max dimensions
        { resize: { width: maxWidth } },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    return manipulatedImage.base64;
  } catch (error) {
    console.error('Error preparing image for Firebase:', error);
    throw new Error(`Failed to prepare image for Firebase: ${error.message}`);
  }
};