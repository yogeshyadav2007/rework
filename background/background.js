let predictionPort;

async function setupSandbox() {
  if (!await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.createDocument({
      url: 'sandbox/sandbox.html',
      reasons: ['CLIPBOARD'],  // Using different reason
      justification: 'Run TensorFlow.js predictions'
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "predict") {
    (async () => {
      try {
        await setupSandbox();
        
        // Create a dedicated port for this prediction
        predictionPort = chrome.runtime.connect();
        
        const prediction = await new Promise((resolve, reject) => {
          // Message handler
          const portListener = (msg) => {
            if (msg.type === 'prediction-result') {
              predictionPort.onMessage.removeListener(portListener);
              predictionPort.disconnect();
              resolve(msg.prediction);
            } else if (msg.type === 'prediction-error') {
              predictionPort.onMessage.removeListener(portListener);
              predictionPort.disconnect();
              reject(new Error(msg.error));
            }
          };
          
          predictionPort.onMessage.addListener(portListener);
          
          // Send prediction request
          predictionPort.postMessage({
            type: 'predict-request',
            text: request.text.substring(0, 10000)  // Limit input size
          });
          
          // Timeout handling
          setTimeout(() => {
            predictionPort.onMessage.removeListener(portListener);
            predictionPort.disconnect();
            reject(new Error('Prediction timeout after 10 seconds'));
          }, 10000);
        });
        
        sendResponse({ prediction });
      } catch (error) {
        console.error('Background error:', error);
        sendResponse({ prediction: 0.5 });  // Neutral fallback
      }
    })();
    return true;  // Keep message port open
  }
});