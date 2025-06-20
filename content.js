console.log('Salesforce Dummy Fill Content Script loaded');

class SalesforceDummyFill {
  constructor() {
    this.init();
  }

  isSalesforcePage() {
    return window.location.hostname.includes('salesforce.com') || 
           window.location.hostname.includes('force.com') || 
           window.location.hostname.includes('my.salesforce.com');
  }

  init() {
    if (!this.isSalesforcePage()) {
      return;
    }

    console.log('Salesforce page detected - ready for AI powered dummy data fill');
  }

  // TODO: フォーム解析機能（フィールド情報抽出）
  analyzeForm() {
    // Lightning Web Component構造の解析
    // フィールドラベル、API名、タイプの抽出
    console.log('Analyzing Salesforce form structure...');
  }

  // TODO: 一括フィールド入力機能（Lightning対応）
  fillAllFields(_dummyData) {
    // OpenAI APIから受信したダミーデータで一括入力
    console.log('Filling all fields with AI generated data...');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SalesforceDummyFill();
  });
} else {
  new SalesforceDummyFill();
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'fillDummyData') {
    console.log('Received fillDummyData message');
    // TODO: OpenAI API統合後にここで実際の処理を実行
    sendResponse({ success: true });
  }
});