// Initialize TensorFlow.js
const tf = self.tf;

// Model loading flag
let isModelLoading = false;
let model;

// Preprocessing function
function preprocessText(text) {
  // Simple feature extraction - replace with your actual preprocessing
  const features = new Array(100).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  words.forEach(word => {
    if (word.length > 0) {
      const index = word.length % 100;
      features[index] += 1;
    }
  });
  return features;
}

self.onmessage = async (event) => {
  try {
    // Load model if needed
    if (!model && !isModelLoading) {
      isModelLoading = true;
      model = await tf.loadLayersModel(chrome.runtime.getURL('model.json'));
      isModelLoading = false;
    }

    // Wait if model is still loading
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Preprocess and predict
    const features = preprocessText(event.data.text);
    const input = tf.tensor2d([features]);
    const prediction = model.predict(input).dataSync()[0];
    input.dispose();

    self.postMessage(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    self.postMessage(0.5); // Neutral fallback
  }
};