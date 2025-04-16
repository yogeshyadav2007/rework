// Remove importScripts() since we're loading via HTML
const tf = window.tf; // Access tf from global scope

// Model loading with retries
const MAX_RETRIES = 3;
let model;
let retryCount = 0;

async function loadModelWithRetry() {
  try {
    model = await tf.loadLayersModel(chrome.runtime.getURL('assets/model.json'));
    console.log('Model loaded successfully');
    return model;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying model load (attempt ${retryCount})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return loadModelWithRetry();
    }
    throw error;
  }
}

// Message handling
window.onmessage = async (event) => {
  try {
    if (!model) {
      model = await loadModelWithRetry();
    }

    const text = event.data.text;
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input text');
    }

    const input = preprocessText(text);
    const prediction = model.predict(input).dataSync()[0];
    input.dispose();

    // Send back to worker
    window.parent.postMessage({ 
      type: 'prediction',
      prediction 
    }, '*');
    
  } catch (error) {
    console.error('Sandbox error:', error);
    window.parent.postMessage({
      type: 'error',
      error: error.message,
      prediction: 0.5 // Fallback
    }, '*');
  }
};

function preprocessText(text) {
  // Your preprocessing logic here
  const words = text.toLowerCase().split(/\s+/);
  const features = new Array(100).fill(0);
  
  words.forEach(word => {
    if (word.length > 0) {
      const index = word.length % 100;
      features[index] += 1;
    }
  });
  
  return tf.tensor2d([features]);
}

// Initialization
console.log('Sandbox ready');