chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "getJobText") {
	  try {
		const text = extractJobText();
		sendResponse({ success: true, text });
	  } catch (error) {
		sendResponse({ success: false, error: error.message });
	  }
	  return true;
	}
  });
  
  function extractJobText() {
	const selectors = [
	  '.jobs-description__content',
	  '.description__text',
	  '.jobs-box__html-content'
	];
	
	const element = selectors
	  .map(selector => document.querySelector(selector))
	  .find(el => el);
	  
	return (element || document.body).innerText
	  .replace(/\s+/g, ' ')
	  .trim()
	  .substring(0, 10000);
  }