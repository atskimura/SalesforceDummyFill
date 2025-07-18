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
      
      // 3. フィールドに一括入力（ピックリストも含む）
      console.log('📝 Filling all fields with generated data...');
      const fillResult = await this.fillAllFields(dummyData, formInfo.fields);
      
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
      
      // OpenAI API失敗時はエラーを投げる（フォールバックは削除）
      
      throw error;
    }
  }

  // 一括フィールド入力機能（Lightning対応・非同期）
  async fillAllFields(dummyData, fields) {
    let filledCount = 0;
    let skippedCount = 0;

    // ピックリストは順次処理、その他は並列処理可能だが、安全のため順次処理
    for (const field of fields) {
      try {
        // 無効・読み取り専用・既に値があるフィールドはスキップ
        // ピックリストの場合は「--なし--」を空値として扱う
        const hasValue = field.value && field.value.trim() !== '' && 
                        !(field.type === 'picklist' && field.value === '--なし--');
        
        if (field.disabled || hasValue) {
          skippedCount++;
          continue;
        }

        // 値を取得（ピックリストの場合は画面から選択）
        let value = null;
        
        // ピックリストの場合は画面から選択可能な値をランダム選択
        if (field.type === 'picklist') {
          console.log(`🎯 Processing picklist: ${field.label || field.apiName}`);
          const success = await this.setPicklistValue(field.element);
          if (success) {
            filledCount++;
          } else {
            skippedCount++;
          }
          continue;
        }
        
        // 通常フィールドの場合は生成されたダミーデータを使用
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
          const success = await this.setFieldValue(field, value);
          if (success) {
            filledCount++;
            console.log(`✅ Filled ${field.label || field.apiName}: ${value}`);
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
          console.log(`⏭️ Skipped ${field.label || field.apiName}: No matching data`);
        }

      } catch (error) {
        console.warn(`Failed to fill field ${field.label || field.apiName}:`, error);
        skippedCount++;
      }
    }

    return { filledCount, skippedCount };
  }

  // Lookupフィールド（参照項目）かどうかを判定
  isLookupField(field) {
    const element = field.element;
    return field.type === 'lookup' || 
           (element.getAttribute('aria-autocomplete') === 'list' && 
            element.getAttribute('role') === 'combobox');
  }

  // フィールドタイプに応じた値設定
  async setFieldValue(field, value) {
    const element = field.element;
    
    // Lookupフィールド（参照項目）はスキップ
    if (this.isLookupField(field)) {
      console.log(`⏭️ Skipped lookup field: ${field.label || field.apiName}`);
      return false; // スキップしたことを示す
    }
    
    switch (field.type) {
      case 'checkbox':
        element.checked = Boolean(value);
        this.triggerFieldEvents(element);
        return true;
        
      case 'picklist':
        // Picklistの場合は非同期でオプションを選択
        return await this.setPicklistValue(element);
        
      default:
        // 通常のテキスト入力
        element.value = value;
        this.triggerFieldEvents(element);
        return true;
    }
  }

  // Picklistの値設定（ドロップダウンから選択可能な値をランダム選択）
  async setPicklistValue(buttonElement) {
    try {
      // ドロップダウンを展開してオプションを取得
      const options = await this.getPicklistOptions(buttonElement);
      
      if (options && options.length > 0) {
        // ランダムにオプションを選択
        const selectedOption = this.selectRandomOption(options);
        await this.selectPicklistOption(buttonElement, selectedOption);
        console.log(`✅ Picklist selected: ${selectedOption.text}`);
        return true;
      } else {
        // オプション取得失敗時はフォールバック
        console.warn('Failed to get picklist options');
        return false;
      }
    } catch (error) {
      console.warn(`Picklist selection failed: ${error.message}`);
      return false;
    }
  }

  // ドロップダウンからオプションを取得
  async getPicklistOptions(buttonElement) {
    try {
      // 1. ドロップダウンを展開
      await this.expandPicklist(buttonElement);
      
      // 2. オプション要素が生成されるまで待機
      const dropdownId = buttonElement.getAttribute('aria-controls');
      if (!dropdownId) {
        throw new Error('Dropdown ID not found');
      }
      
      const dropdownElement = document.getElementById(dropdownId);
      if (!dropdownElement) {
        throw new Error('Dropdown element not found');
      }
      
      // 3. オプション要素を待機して取得
      const options = await this.waitForPicklistOptions(dropdownElement);
      
      // 4. ドロップダウンを閉じる
      await this.collapsePicklist(buttonElement);
      
      return options;
    } catch (error) {
      // エラー時はドロップダウンを閉じる
      await this.collapsePicklist(buttonElement);
      throw error;
    }
  }

  // ドロップダウンを展開
  async expandPicklist(buttonElement) {
    // ボタンをクリックしてドロップダウンを展開
    buttonElement.click();
    
    // aria-expanded="true"になるまで待機
    const maxWait = 3000; // 3秒
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const expanded = buttonElement.getAttribute('aria-expanded');
      if (expanded === 'true') {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Failed to expand picklist dropdown');
  }

  // ドロップダウンを閉じる
  async collapsePicklist(buttonElement) {
    if (buttonElement.getAttribute('aria-expanded') === 'true') {
      // ESCキーを送信してドロップダウンを閉じる
      const escEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true
      });
      buttonElement.dispatchEvent(escEvent);
      
      // 閉じるまで少し待機
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // オプション要素の生成を待機
  async waitForPicklistOptions(dropdownElement) {
    const maxWait = 3000; // 3秒
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      // lightning-base-combobox-item または div[role="option"] を検索
      const optionElements = dropdownElement.querySelectorAll('lightning-base-combobox-item[role="option"], div[role="option"]');
      
      if (optionElements.length > 0) {
        // オプション情報を抽出
        const options = Array.from(optionElements).map(option => {
          // data-value属性から値を取得
          const dataValue = option.getAttribute('data-value');
          
          // テキストを取得（複数のパターンに対応）
          let text = '';
          const titleElement = option.querySelector('span[title]');
          if (titleElement) {
            text = titleElement.getAttribute('title') || titleElement.textContent.trim();
          } else {
            const textElement = option.querySelector('.slds-truncate, .slds-media__body span');
            text = textElement ? textElement.textContent.trim() : '';
          }
          
          return {
            element: option,
            text: text,
            value: dataValue || text // data-valueを優先、なければtext
          };
        }).filter(option => 
          option.text && 
          option.text !== '--なし--' && 
          option.value !== '' // 空の値もスキップ
        );
        
        return options;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Picklist options not loaded within timeout');
  }

  // ランダムオプション選択
  selectRandomOption(options) {
    if (!options || options.length === 0) {
      throw new Error('No options available for selection');
    }
    
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }

  // オプションを選択
  async selectPicklistOption(buttonElement, selectedOption) {
    try {
      // ドロップダウンを再度展開
      await this.expandPicklist(buttonElement);
      
      // オプション要素をクリック（最小限のイベントで実行）
      selectedOption.element.click();
      
      // Lightning Web Component に必要な change イベント
      const changeEvent = new Event('change', { bubbles: true });
      selectedOption.element.dispatchEvent(changeEvent);
      
      // 少し待機してから状態確認
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 選択が反映されているか確認
      const displayText = buttonElement.querySelector('.slds-truncate')?.textContent;
      
      if (displayText === selectedOption.text) {
        return true;
      } else {
        throw new Error(`Selection failed: expected ${selectedOption.text}, got ${displayText}`);
      }
    } catch (error) {
      await this.collapsePicklist(buttonElement);
      throw error;
    }
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