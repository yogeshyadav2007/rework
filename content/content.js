chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "getJobText") {
	  const text = document.querySelector('.jobs-description__content')?.innerText || '';
	  sendResponse({ text: text.slice(0, 10000) });
	}
	return true;
  });