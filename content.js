console.log('Salesforce Dummy Fill Content Script loaded');

function isSalesforcePage() {
  return window.location.hostname.includes('salesforce.com') || 
         window.location.hostname.includes('force.com') || 
         window.location.hostname.includes('my.salesforce.com');
}

if (isSalesforcePage()) {
  console.log('Salesforce page detected');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
          console.log(`Found ${forms.length} forms on page`);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillDummyData') {
    console.log('Received fillDummyData message');
    sendResponse({ success: true });
  }
});