document.getElementById('check').addEventListener('click', async () => {
	const button = document.getElementById('check');
	const resultDiv = document.getElementById('result');
	
	button.disabled = true;
	resultDiv.style.display = 'none';
  
	try {
	  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	  
	  if (!tab?.url?.includes('linkedin.com/jobs')) {
		throw new Error('Please navigate to a LinkedIn job posting first');
	  }
  
	  // Ensure content script is injected
	  await chrome.scripting.executeScript({
		target: { tabId: tab.id },
		files: ['content/content.js']
	  });
  
	  // Get job text with timeout
	  const response = await Promise.race([
		chrome.tabs.sendMessage(tab.id, { action: "getJobText" }),
		new Promise((_, reject) => setTimeout(
		  () => reject(new Error('Timeout getting job text')),
		  5000
		))
	  ]);
  
	  if (!response?.success) {
		throw new Error(response?.error || 'Failed to extract job text');
	  }
  
	  // Create offscreen document if needed
	  if (!await chrome.offscreen.hasDocument()) {
		await chrome.offscreen.createDocument({
		  url: 'workers/offscreen.html',
		  reasons: ['WORKERS'],
		  justification: 'Run TensorFlow.js predictions'
		});
	  }
  
	  // Get prediction
	  const { prediction } = await chrome.runtime.sendMessage({
		action: "predict",
		text: response.text.substring(0, 10000)
	  });
  
	  // Display result
	  resultDiv.style.display = 'block';
	  resultDiv.className = prediction > 0.5 ? 'result-fake' : 'result-legit';
	  resultDiv.innerHTML = prediction > 0.5 ?
		`⚠️ <strong>High Risk (${Math.round(prediction * 100)}%)</strong>` :
		`✅ <strong>Likely Safe (${Math.round((1 - prediction) * 100)}%)</strong>`;
  
	} catch (error) {
	  resultDiv.style.display = 'block';
	  resultDiv.className = 'result-error';
	  resultDiv.textContent = `Error: ${error.message}`;
	  console.error(error);
	} finally {
	  button.disabled = false;
	}
  });