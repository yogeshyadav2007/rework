// background/background.js

let offscreenDocument = null;

// Create offscreen document if needed
async function setupOffscreen() {
  if (!await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.createDocument({
      url: 'workers/offscreen.html',
      reasons: ['WORKERS'],
      justification: 'Execute TensorFlow.js model'
    });
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "predict") {
    (async () => {
      try {
        await setupOffscreen();
        
        // Forward to offscreen document
        const prediction = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'predict',
            text: request.text
          }, (response) => {
            resolve(response?.prediction);
          });
        });
        
        sendResponse({ prediction });
      } catch (error) {
        console.error('Background error:', error);
        sendResponse({ prediction: 0.5 }); // Fallback
      }
    })();
    
    return true; // Keep message port open
  }
});

// Clean up when extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
  if (offscreenDocument) {
    chrome.offscreen.closeDocument();
  }
});