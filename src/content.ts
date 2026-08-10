// Content script for AI Resume Tailor Chrome Extension
// This runs on every page to support the context menu functionality

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SELECTED_TEXT") {
    const selectedText = window.getSelection()?.toString() || "";
    sendResponse({ selectedText });
  }
  return true;
});
