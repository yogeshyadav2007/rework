document.getElementById('check').addEventListener('click', async () => {
	const button = document.getElementById('check');
	const resultDiv = document.getElementById('result');
	
	// Reset UI state
	button.disabled = true;
	resultDiv.style.display = 'none';
	resultDiv.textContent = '';
	resultDiv.className = '';
  
	try {
	  console.log("Starting job analysis...");
	  
	  // Get current tab
	  const [tab] = await chrome.tabs.query({ 
		active: true, 
		currentWindow: true 
	  });
	  
	  if (!tab?.url?.includes('linkedin.com/jobs')) {
		throw new Error('Please navigate to a LinkedIn job posting first');
	  }
  
	  // First ensure content script is injected
	  console.log("Injecting content script...");
	  await chrome.scripting.executeScript({
		target: { tabId: tab.id },
		files: ['content/content.js'],
		injectImmediately: true
	  });
	  
	  console.log("Requesting job text...");
	  const response = await Promise.race([
		chrome.tabs.sendMessage(tab.id, { action: "getJobText" }),
		new Promise((_, reject) => setTimeout(
		  () => reject(new Error('Timeout: Failed to get job text')),
		  5000
		))
	  ]);
  
	  if (!response?.success) {
		throw new Error(response?.error || 'Failed to extract job text');
	  }
  
	  console.log("Requesting prediction...");
	  const { prediction } = await chrome.runtime.sendMessage({
		action: "predict",
		text: response.text
	  });
  
	  // Display results
	  resultDiv.style.display = 'block';
	  resultDiv.className = prediction > 0.5 ? 'result-fake' : 'result-legit';
	  resultDiv.innerHTML = prediction > 0.5 ?
		`⚠️ <strong>High Risk (${Math.round(prediction * 100)}%)</strong>` :
		`✅ <strong>Likely Safe (${Math.round((1 - prediction) * 100)}%)</strong>`;
	  
	  console.log("Analysis completed successfully");
  
	} catch (error) {
	  console.error("Popup error:", error);
	  resultDiv.style.display = 'block';
	  resultDiv.className = 'result-error';
	  resultDiv.textContent = `Error: ${error.message}`;
	  
	  // For debugging connection issues
	  if (error.message.includes('Receiving end does not exist')) {
		resultDiv.textContent += '\n(Tip: Try refreshing the LinkedIn page)';
	  }
	} finally {
	  button.disabled = false;
	}
  });