chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: 'report.html'
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'welcome.html'
    });
  }
});
