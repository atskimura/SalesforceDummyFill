console.log('Salesforce Dummy Fill Content Script loaded');

class SalesforceDummyFill {
  constructor() {
    this.analyzer = new SalesforceAnalyzer();
    this.openaiHelper = new OpenAIHelper();
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
    
    // デバッグモード：自動的にフォーム解析を実行（開発時のみ）
    if (window.location.href.includes('debug=true')) {
      setTimeout(() => {
        this.analyzer.logFieldAnalysis();
      }, 2000);
    }
  }

  // フォーム解析機能（フィールド情報抽出）
  analyzeForm() {
    try {
      const formInfo = this.analyzer.analyzeForm();
      console.log('Form analysis completed:', formInfo);
      return formInfo;
    } catch (error) {
      console.error('Form analysis failed:', error);
      throw new Error('フォームの解析に失敗しました');
    }
  }

  // AI powered ダミーデータ生成と一括入力
  async generateAndFillDummyData() {
    try {
      // 1. フォーム構造を解析
      console.log('🔍 Analyzing form structure...');
      const formInfo = this.analyzeForm();
      
      if (!formInfo.fields || formInfo.fields.length === 0) {
        throw new Error('入力可能なフィールドが見つかりませんでした');
      }

      // 2. OpenAI APIでダミーデータを生成
      console.log('🤖 Generating dummy data with OpenAI...');
      const dummyData = await this.openaiHelper.generateDummyData(formInfo);
      
      // 3. フィールドに一括入力
      console.log('📝 Filling fields with generated data...');
      const fillResult = this.fillAllFields(dummyData, formInfo.fields);
      
      return {
        success: true,
        objectName: formInfo.objectName,
        totalFields: formInfo.fields.length,
        filledFields: fillResult.filledCount,
        skippedFields: fillResult.skippedCount,
        data: dummyData
      };

    } catch (error) {
      console.error('Generate and fill process failed:', error);
      
      // OpenAI API失敗時のフォールバック
      if (error.message.includes('OpenAI') || error.message.includes('API')) {
        console.log('🔄 Falling back to basic dummy data...');
        return this.fallbackFill();
      }
      
      throw error;
    }
  }

  // 一括フィールド入力機能（Lightning対応）
  fillAllFields(dummyData, fields) {
    let filledCount = 0;
    let skippedCount = 0;

    fields.forEach(field => {
      try {
        // 無効・読み取り専用・既に値があるフィールドはスキップ
        if (field.disabled || (field.value && field.value.trim() !== '')) {
          skippedCount++;
          return;
        }

        // API名でデータを検索
        let value = null;
        
        // 複合フィールドの場合
        if (field.subField) {
          const compositeKey = `${field.apiName}.${field.subField}`;
          if (dummyData[compositeKey]) {
            value = dummyData[compositeKey];
          }
        }
        
        // 通常のフィールドの場合
        if (!value && field.apiName && dummyData[field.apiName]) {
          value = dummyData[field.apiName];
        }

        // ラベルでデータを検索（API名が見つからない場合）
        if (!value && field.label) {
          const labelKey = Object.keys(dummyData).find(key => 
            key.toLowerCase().includes(field.label.toLowerCase()) ||
            field.label.toLowerCase().includes(key.toLowerCase())
          );
          if (labelKey) {
            value = dummyData[labelKey];
          }
        }

        if (value !== null && value !== undefined) {
          this.setFieldValue(field, value);
          filledCount++;
          console.log(`✅ Filled ${field.label || field.apiName}: ${value}`);
        } else {
          skippedCount++;
          console.log(`⏭️ Skipped ${field.label || field.apiName}: No matching data`);
        }

      } catch (error) {
        console.warn(`Failed to fill field ${field.label || field.apiName}:`, error);
        skippedCount++;
      }
    });

    return { filledCount, skippedCount };
  }

  // フィールドタイプに応じた値設定
  setFieldValue(field, value) {
    const element = field.element;
    
    switch (field.type) {
      case 'checkbox':
        element.checked = Boolean(value);
        break;
        
      case 'picklist':
        // Picklistの場合は、ボタンをクリックしてオプションを選択
        this.setPicklistValue(element, value);
        break;
        
      case 'lookup':
        // Lookupの場合は、検索フィールドに値を入力
        element.value = value;
        this.triggerLookupSearch(element, value);
        break;
        
      default:
        // 通常のテキスト入力
        element.value = value;
        break;
    }

    // イベントをトリガー（Salesforceのリアクティブ更新用）
    this.triggerFieldEvents(element);
  }

  // Picklistの値設定
  setPicklistValue(buttonElement, value) {
    // TODO: Picklistの詳細な選択ロジック実装
    // 現在は data-value 属性に値を設定
    buttonElement.setAttribute('data-value', value);
    buttonElement.querySelector('.slds-truncate').textContent = value;
  }

  // Lookupの検索トリガー
  triggerLookupSearch(element, value) {
    // TODO: Lookup検索の詳細実装
    // 現在は基本的な値設定のみ
    element.value = value;
  }

  // フィールドイベントのトリガー
  triggerFieldEvents(element) {
    // Lightning Web Componentが認識するイベント
    const events = ['input', 'change', 'blur'];
    
    events.forEach(eventType => {
      const event = new Event(eventType, { 
        bubbles: true, 
        cancelable: true 
      });
      element.dispatchEvent(event);
    });
  }

  // フォールバック用の基本入力
  fallbackFill() {
    try {
      const formInfo = this.analyzeForm();
      const fallbackData = this.openaiHelper.getFallbackData();
      const fillResult = this.fillAllFields(fallbackData.data, formInfo.fields);
      
      return {
        success: true,
        fallback: true,
        objectName: formInfo.objectName,
        totalFields: formInfo.fields.length,
        filledFields: fillResult.filledCount,
        skippedFields: fillResult.skippedCount,
        message: 'フォールバック機能を使用してダミーデータを入力しました'
      };
    } catch (error) {
      console.error('Fallback fill failed:', error);
      throw new Error('ダミーデータの入力に失敗しました');
    }
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

// Global instance for message handling
let dummyFillInstance = null;

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'fillDummyData') {
    console.log('Received fillDummyData message');
    
    // Get or create instance
    if (!dummyFillInstance) {
      dummyFillInstance = new SalesforceDummyFill();
    }
    
    // Async response
    (async () => {
      try {
        const result = await dummyFillInstance.generateAndFillDummyData();
        sendResponse(result);
      } catch (error) {
        console.error('Fill dummy data failed:', error);
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
    })();
    
    // Return true to indicate async response
    return true;
  }
});