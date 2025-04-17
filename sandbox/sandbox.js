// Load TensorFlow.js
importScripts(chrome.runtime.getURL('../lib/tf.min.js'));

let model;

async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel(chrome.runtime.getURL('assets/model.json'));
  }
  return model;
}

// Handle incoming connections
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    if (msg.type === 'predict-request') {
      try {
        const model = await loadModel();
        const input = preprocess(msg.text);
        const prediction = model.predict(input).dataSync()[0];
        input.dispose();
        
        port.postMessage({
          type: 'prediction-result',
          prediction
        });
      } catch (error) {
        port.postMessage({
          type: 'prediction-error',
          error: error.message
        });
      }
    }
  });
});

function preprocess(text) {
  // Your preprocessing logic
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