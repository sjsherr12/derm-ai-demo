// Product Search Worker
// This worker handles intensive fuzzy search operations on a separate thread
// to prevent blocking the main UI thread and animation

import productScanService from '../services/productScanService';

// Worker message handler
if (typeof self !== 'undefined') {
  // Web Worker environment
  self.onmessage = async function(e) {
    const { imageUri, products, maxResults, requestId } = e.data;

    try {
      const result = await productScanService.scanAndMatchProducts(imageUri, products, maxResults);

      self.postMessage({
        type: 'success',
        requestId,
        result
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        requestId,
        error: error.message
      });
    }
  };
} else if (typeof global !== 'undefined') {
  // React Native environment - use different approach
  global.productSearchWorker = async function(imageUri, products, maxResults) {
    try {
      const result = await productScanService.scanAndMatchProducts(imageUri, products, maxResults);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
}

export default null; // Worker files don't export anything