/* ENAZIZI page relay — injected on enazizi.com to forward messages from extension */
(function () {
  // Listen for messages from the extension background via chrome.runtime
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type && msg.type.startsWith("ENAZIZI_")) {
        window.postMessage(msg, "*");
      }
    });
  }
})();
