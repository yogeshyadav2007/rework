// Ensure the content script is properly registered
console.log("Content script loaded on:", window.location.href);

// Improved message handler with error recovery
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getJobText") {
    try {
      console.log("Received request for job text");
      
      // Robust element finding with fallbacks
      const selectors = [
        '.jobs-description__content', // New LinkedIn
        '.description__text',         // Old LinkedIn
        '.jobs-box__html-content',    // Alternative
        'body'                        // Ultimate fallback
      ];
      
      const element = selectors
        .map(selector => document.querySelector(selector))
        .find(el => el?.textContent?.trim());
      
      if (!element) {
        throw new Error("No job description element found");
      }
      
      const text = element.textContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 10000);
      
      console.log("Extracted text length:", text.length);
      sendResponse({ success: true, text });
      
    } catch (error) {
      console.error("Content script error:", error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
    
    // Must return true to keep the message port open
    return true;
  }
});

// Self-initialization check
console.log("Content script initialized successfully");