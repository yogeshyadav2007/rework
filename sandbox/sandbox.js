importScripts('../lib/tf.min.js');

let model;

self.onmessage = async (event) => {
  if (!model) {
    model = await tf.loadLayersModel(chrome.runtime.getURL('model.json'));
  }
  
  const input = tf.tensor2d([event.data.features]);
  const prediction = model.predict(input).dataSync()[0];
  input.dispose();
  
  self.postMessage(prediction);
};