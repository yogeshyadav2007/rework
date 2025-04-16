chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "getJobText") {
	  try {
		const jobText = extractJobText();
		sendResponse({ success: true, text: jobText });
	  } catch (error) {
		sendResponse({ success: false, error: error.message });
	  }
	  return true; // Keep message channel open
	}
  });
  
  function extractJobText() {
	const selectors = [
	  '.jobs-description__content',
	  '.description__text',
	  '.jobs-box__html-content',
	  'body'
	];
	
	const element = selectors
	  .map(selector => document.querySelector(selector))
	  .find(el => el);
	
	return element.innerText
	  .replace(/\s+/g, ' ')
	  .trim();
  }