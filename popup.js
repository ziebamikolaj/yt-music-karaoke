let fontSizeIndex = 1; // 0: small, 1: medium, 2: large
let autoScroll = true;

document.getElementById("toggleFontSize").addEventListener("click", () => {
  fontSizeIndex = (fontSizeIndex + 1) % 3;
  const sizes = ["Small", "Medium", "Large"];
  document.getElementById("toggleFontSize").textContent = `Font Size: ${sizes[fontSizeIndex]}`;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "setFontSize", size: fontSizeIndex });
  });
});

document.getElementById("toggleAutoScroll").addEventListener("click", () => {
  autoScroll = !autoScroll;
  document.getElementById("toggleAutoScroll").textContent = `Auto-scroll: ${autoScroll ? "On" : "Off"}`;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "setAutoScroll", enabled: autoScroll });
  });
});

// Load saved settings
chrome.storage.sync.get(["fontSizeIndex", "autoScroll"], (result) => {
  if (result.fontSizeIndex !== undefined) {
    fontSizeIndex = result.fontSizeIndex;
    const sizes = ["Small", "Medium", "Large"];
    document.getElementById("toggleFontSize").textContent = `Font Size: ${sizes[fontSizeIndex]}`;
  }
  if (result.autoScroll !== undefined) {
    autoScroll = result.autoScroll;
    document.getElementById("toggleAutoScroll").textContent = `Auto-scroll: ${autoScroll ? "On" : "Off"}`;
  }
});
