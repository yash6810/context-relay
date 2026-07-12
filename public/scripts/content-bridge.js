// Only run if the window receives a specific message from our React app
window.addEventListener("message", (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data && event.data.type === "CONTEXT_RELAY_BRIDGE_REQUEST") {
    // Forward to background script
    chrome.runtime.sendMessage(event.data.payload, (response) => {
      window.postMessage({
        type: "CONTEXT_RELAY_BRIDGE_RESPONSE",
        id: event.data.id,
        payload: response
      }, "*");
    });
  }
});
