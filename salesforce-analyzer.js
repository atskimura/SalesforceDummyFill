// Salesforce Lightning Web Component フォーム解析クラス
class SalesforceAnalyzer {
  constructor() {
    this.fieldSelectors = {
      // Lightning Input Components
      textInput: 'lightning-input input.slds-input[type="text"]:not([inputmode="decimal"])',
      numberInput: 'lightning-input input.slds-input[inputmode="decimal"]',
      emailInput: 'lightning-input input.slds-input[type="email"]',
      telInput: 'lightning-input input.slds-input[type="tel"]',
      urlInput: 'lightning-input input.slds-input[type="url"]',
      passwordInput: 'lightning-input input.slds-input[type="password"]',
      
      // Text Area
      textarea: 'lightning-textarea textarea.slds-textarea',
      
      // Checkbox
      checkbox: 'lightning-input input[type="checkbox"]',
      
      // Picklist/Combobox
      picklist: 'lightning-combobox button[role="combobox"]',
      
      // Lookup fields
      lookup: 'lightning-lookup input[role="combobox"]',
      
      // Date fields
      datePicker: 'lightning-datepicker input.slds-input[type="text"]',
      
      // Address components
      addressCountry: 'lightning-input-address lightning-input[data-field="country"] input',
      addressState: 'lightning-input-address lightning-input[data-field="province"] input', 
      addressCity: 'lightning-input-address lightning-input[data-field="city"] input',
      addressPostal: 'lightning-input-address lightning-input[data-field="postalCode"] input',
      addressStreet: 'lightning-input-address lightning-textarea[data-field="street"] textarea'
    };
  }

  // ページのオブジェクト名を抽出
  extractObjectName() {
    // URL pattern analysis
    const url = window.location.href;
    
    // New record creation: /lightning/o/{Object}/new
    const newRecordMatch = url.match(/\/lightning\/o\/([^\/]+)\/new/);
    if (newRecordMatch) {
      return this.formatObjectName(newRecordMatch[1]);
    }
    
    // Record edit: /lightning/r/{Object}/{Id}/edit
    const editRecordMatch = url.match(/\/lightning\/r\/([^\/]+)\/[^\/]+\/edit/);
    if (editRecordMatch) {
      return this.formatObjectName(editRecordMatch[1]);
    }
    
    // Quick action or modal
    const modalMatch = url.match(/\/lightning\/[ro]\/([^\/]+)/);
    if (modalMatch) {
      return this.formatObjectName(modalMatch[1]);
    }

    // Page title analysis
    const pageTitle = document.title;
    if (pageTitle.includes('新規')) {
      // Extract object name from title like "新規取引先"
      const titleMatch = pageTitle.match(/新規(.+?)\s*[\|\-]/);
      if (titleMatch) {
        return titleMatch[1];
      }
    }

    // Fallback: check for record layout container
    const recordLayout = document.querySelector('[data-target-selection-name*="sfdc:RecordField"]');
    if (recordLayout) {
      const selectionName = recordLayout.getAttribute('data-target-selection-name');
      const objectMatch = selectionName.match(/sfdc:RecordField\.([^\.]+)\./);
      if (objectMatch) {
        return this.formatObjectName(objectMatch[1]);
      }
    }

    return 'Unknown';
  }

  // オブジェクト名の整形
  formatObjectName(apiName) {
    const objectNameMap = {
      'Account': '取引先',
      'Contact': '取引先責任者', 
      'Lead': 'リード',
      'Opportunity': '商談',
      'Case': 'ケース',
      'Task': 'タスク',
      'Event': 'イベント',
      'User': 'ユーザ',
      'Campaign': 'キャンペーン'
    };
    
    return objectNameMap[apiName] || apiName;
  }

  // 全フィールド情報を解析
  analyzeForm() {
    const objectName = this.extractObjectName();
    const fields = this.extractFields();
    
    console.log(`Analyzing ${objectName} form with ${fields.length} fields`);
    
    return {
      objectName,
      fields,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }

  // フィールド情報を抽出
  extractFields() {
    const fields = [];
    
    // 各フィールドタイプごとに検索
    Object.entries(this.fieldSelectors).forEach(([fieldType, selector]) => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        const fieldInfo = this.extractFieldInfo(element, fieldType);
        if (fieldInfo && !this.isDuplicateField(fields, fieldInfo)) {
          fields.push(fieldInfo);
        }
      });
    });

    return fields;
  }

  // 個別フィールド情報の抽出
  extractFieldInfo(element, fieldType) {
    try {
      const fieldInfo = {
        type: fieldType,
        element: element,
        apiName: this.getFieldApiName(element),
        label: this.getFieldLabel(element),
        required: this.isRequired(element),
        disabled: element.disabled || element.readOnly,
        value: this.getCurrentValue(element),
        placeholder: element.placeholder || '',
        maxLength: element.maxLength || null
      };

      // API名またはラベルが取得できない場合はスキップ
      if (!fieldInfo.apiName && !fieldInfo.label) {
        return null;
      }

      return fieldInfo;
    } catch (error) {
      console.warn('Failed to extract field info:', error);
      return null;
    }
  }

  // フィールドのAPI名を取得
  getFieldApiName(element) {
    // name属性から取得
    if (element.name) {
      return element.name;
    }

    // 親要素から data-target-selection-name を探す
    let parent = element.closest('[data-target-selection-name]');
    if (parent) {
      const selectionName = parent.getAttribute('data-target-selection-name');
      const match = selectionName.match(/sfdc:RecordField\.[^\.]+\.(.+)/);
      if (match) {
        return match[1];
      }
    }

    // lightning-input の親から取得を試行
    const lightningInput = element.closest('lightning-input, lightning-textarea, lightning-combobox, lightning-lookup');
    if (lightningInput) {
      const fieldName = lightningInput.getAttribute('field-name') || 
                       lightningInput.getAttribute('data-field') ||
                       lightningInput.getAttribute('name');
      if (fieldName) {
        return fieldName;
      }
    }

    return null;
  }

  // フィールドラベルを取得
  getFieldLabel(element) {
    // aria-label から取得
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }

    // 関連するlabelを探す
    const labelElement = element.closest('.slds-form-element')?.querySelector('.test-id__field-label, label');
    if (labelElement) {
      return labelElement.textContent.trim().replace(/\s*\*\s*$/, ''); // 必須マーク(*)を削除
    }

    // Lightning component の label 属性
    const lightningComponent = element.closest('lightning-input, lightning-textarea, lightning-combobox, lightning-lookup');
    if (lightningComponent) {
      const labelAttr = lightningComponent.getAttribute('label');
      if (labelAttr) {
        return labelAttr;
      }
    }

    // data-target-selection-name の field-label 属性
    const fieldContainer = element.closest('[field-label]');
    if (fieldContainer) {
      return fieldContainer.getAttribute('field-label');
    }

    return null;
  }

  // 必須フィールドかどうかを判定
  isRequired(element) {
    // aria-required属性
    if (element.getAttribute('aria-required') === 'true') {
      return true;
    }

    // required属性
    if (element.hasAttribute('required')) {
      return true;
    }

    // 親要素に必須マーク(*)があるかチェック
    const formElement = element.closest('.slds-form-element');
    if (formElement) {
      const requiredIndicator = formElement.querySelector('.slds-required, abbr[title*="required"], [class*="required"]');
      return !!requiredIndicator;
    }

    return false;
  }

  // 現在の値を取得
  getCurrentValue(element) {
    if (element.type === 'checkbox') {
      return element.checked;
    }
    
    if (element.tagName.toLowerCase() === 'button' && element.hasAttribute('data-value')) {
      return element.getAttribute('data-value');
    }
    
    return element.value || '';
  }

  // 重複フィールドチェック
  isDuplicateField(existingFields, newField) {
    return existingFields.some(field => 
      (field.apiName && field.apiName === newField.apiName) ||
      (field.label && field.label === newField.label)
    );
  }

  // デバッグ用：フィールド情報をコンソールに出力
  logFieldAnalysis() {
    const formInfo = this.analyzeForm();
    console.group('🔍 Salesforce Form Analysis');
    console.log('Object:', formInfo.objectName);
    console.log('Fields found:', formInfo.fields.length);
    
    formInfo.fields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.label || 'No Label'} (${field.apiName || 'No API Name'})`, {
        type: field.type,
        required: field.required,
        value: field.value,
        disabled: field.disabled
      });
    });
    
    console.groupEnd();
    return formInfo;
  }
}