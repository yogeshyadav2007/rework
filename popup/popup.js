document.getElementById('check').addEventListener('click', async () => {
	const button = document.getElementById('check');
	const resultDiv = document.getElementById('result');
	
	button.disabled = true;
	resultDiv.style.display = 'none';
  
	try {
	  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	  
	  if (!tab?.url?.includes('linkedin.com/jobs')) {
		throw new Error('Please open a LinkedIn job posting first');
	  }
  
	  // Ensure content script is injected
	  await chrome.scripting.executeScript({
		target: { tabId: tab.id },
		files: ['content/content.js']
	  });
  
	  const response = await chrome.tabs.sendMessage(tab.id, { action: "getJobText" });
	  
	  if (!response?.success) {
		throw new Error(response?.error || 'Failed to extract job text');
	  }
  
	  const { prediction } = await chrome.runtime.sendMessage({
		action: "predict",
		text: response.text
	  });
  
	  resultDiv.style.display = 'block';
	  resultDiv.className = prediction > 0.5 ? 'result-fake' : 'result-legit';
	  resultDiv.innerHTML = prediction > 0.5 ?
		`⚠️ <strong>High Risk (${Math.round(prediction * 100)}%)</strong>` :
		`✅ <strong>Likely Safe (${Math.round((1 - prediction) * 100)}%)</strong>`;
  
	} catch (error) {
	  resultDiv.style.display = 'block';
	  resultDiv.className = 'result-error';
	  resultDiv.textContent = `Error: ${error.message}`;
	} finally {
	  button.disabled = false;
	}
  });