let offscreenDocument = null;

const setupOffscreen = async () => {
  if (!await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.createDocument({
      url: 'sandbox/sandbox.html',
      reasons: ['WORKERS'],
      justification: 'Run ML model securely'
    });
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "predict") {
    (async () => {
      try {
        await setupOffscreen();
        
        const prediction = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'predict', text: request.text },
            (response) => resolve(response?.prediction || 0.5)
          );
        });
        
        sendResponse({ prediction });
      } catch (error) {
        console.error('Background error:', error);
        sendResponse({ prediction: 0.5 });
      }
    })();
    return true;
  }
});

chrome.runtime.onSuspend.addListener(() => {
  if (offscreenDocument) {
    chrome.offscreen.closeDocument();
  }
});