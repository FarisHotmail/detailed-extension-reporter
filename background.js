// Eklenti ikonuna tıklandığında rapor sayfasını açar
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: 'report.html'
  });
});

// Eklenti ilk kez kurulduğunda bir kereliğine hoş geldiniz sayfasını açar
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'welcome.html'
    });
  }
});