class WorkerWrapper {
  constructor() {
    this.iframe = document.createElement('iframe');
    this.iframe.src = chrome.runtime.getURL('sandbox/sandbox.html');
    this.iframe.style.display = 'none';
    document.body.appendChild(this.iframe);
    
    this.pendingResolves = new Map();
    this.messageId = 0;
    
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  handleMessage(event) {
    if (event.data.type === 'prediction' || event.data.type === 'error') {
      const { id, prediction, error } = event.data;
      const resolve = this.pendingResolves.get(id);
      if (resolve) {
        error ? reject(error) : resolve(prediction);
        this.pendingResolves.delete(id);
      }
    }
  }

  async predict(text) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.pendingResolves.set(id, resolve);
      this.iframe.contentWindow.postMessage({ 
        type: 'predict',
        text,
        id
      }, '*');
      
      // Timeout fallback
      setTimeout(() => {
        if (this.pendingResolves.has(id)) {
          this.pendingResolves.delete(id);
          reject(new Error('Prediction timeout'));
        }
      }, 10000);
    });
  }
}

const worker = new WorkerWrapper();

self.onmessage = async (event) => {
  try {
    const prediction = await worker.predict(event.data.text);
    self.postMessage({ prediction });
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ prediction: 0.5 });
  }
};