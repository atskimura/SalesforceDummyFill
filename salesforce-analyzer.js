// Salesforce Lightning Web Component フォーム解析クラス
class SalesforceAnalyzer {
  constructor() {
    // data-target-selection-nameベースのアプローチに変更
    this.fieldContainerSelector = '[data-target-selection-name^="sfdc:RecordField."]';
    
    // 各コンテナ内で検索する入力要素のセレクター
    this.inputSelectors = [
      'input[type="text"]',
      'input[type="email"]', 
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="password"]',
      'input[type="number"]',
      'input[type="checkbox"]',
      'textarea',
      'button[role="combobox"]',  // picklist
      'input[role="combobox"]'    // lookup
    ];
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
    
    // data-target-selection-nameを持つフィールドコンテナを検索
    const fieldContainers = document.querySelectorAll(this.fieldContainerSelector);
    
    fieldContainers.forEach(container => {
      const selectionName = container.getAttribute('data-target-selection-name');
      
      // 各コンテナ内で入力要素を検索（全要素を処理）
      this.inputSelectors.forEach(inputSelector => {
        const elements = container.querySelectorAll(inputSelector);
        
        elements.forEach(element => {
          const fieldInfo = this.extractFieldInfo(element, container, selectionName);
          if (fieldInfo && !this.isDuplicateField(fields, fieldInfo)) {
            fields.push(fieldInfo);
          }
        });
      });
    });

    return fields;
  }

  // 個別フィールド情報の抽出
  extractFieldInfo(element, container, selectionName) {
    try {
      const apiNameInfo = this.getFieldApiName(element, selectionName);
      
      const fieldInfo = {
        type: this.getFieldType(element),
        element: element,
        apiName: apiNameInfo.apiName,
        subField: apiNameInfo.subField,
        label: this.getFieldLabel(element, container),
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

  // フィールドのAPI名とサブフィールド名を取得
  getFieldApiName(element, selectionName) {
    // data-target-selection-nameから基本API名を抽出
    const match = selectionName.match(/sfdc:RecordField\.[^\.]+\.(.+)/);
    if (!match) {
      return { apiName: null, subField: null };
    }
    
    const baseApiName = match[1];
    
    // 複合フィールド（住所など）の処理
    if (baseApiName.endsWith('Address')) {
      const dataField = element.closest('[data-field]')?.getAttribute('data-field');
      if (dataField) {
        return {
          apiName: baseApiName,
          subField: dataField
        };
      }
    }
    
    // 通常のフィールド
    return {
      apiName: baseApiName,
      subField: null
    };
  }

  // フィールドラベルを取得
  getFieldLabel(element, container) {
    // コンテナのfield-label属性から取得
    const fieldLabel = container.getAttribute('field-label');
    if (fieldLabel) {
      return fieldLabel;
    }

    // aria-label から取得
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }

    // コンテナ内のラベル要素を探す
    const labelElement = container.querySelector('.test-id__field-label, label, legend');
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

    return null;
  }

  // フィールドタイプを判定
  getFieldType(element) {
    const tagName = element.tagName.toLowerCase();
    const type = element.type;
    const role = element.getAttribute('role');

    // ピックリスト判定用（ログなし）

    if (tagName === 'input') {
      if (type === 'checkbox') return 'checkbox';
      if (type === 'email') return 'email';
      if (type === 'tel') return 'tel';
      if (type === 'url') return 'url';
      if (type === 'password') return 'password';
      if (type === 'number' || element.getAttribute('inputmode') === 'decimal') return 'number';
      if (role === 'combobox') return 'lookup';
      return 'text';
    }
    
    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'button' && role === 'combobox') {
      return 'picklist';
    }
    
    // 不明なフィールドタイプのログは削除（ログが多すぎるため）
    return 'unknown';
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
    return existingFields.some(field => {
      // 複合フィールドの場合は apiName + subField の組み合わせで判定
      if (field.subField || newField.subField) {
        return field.apiName === newField.apiName && field.subField === newField.subField;
      }
      
      // 通常フィールドの場合は従来通り
      return (field.apiName && field.apiName === newField.apiName) ||
             (field.label && field.label === newField.label);
    });
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