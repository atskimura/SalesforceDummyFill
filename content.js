console.log('Salesforce Dummy Fill Content Script loaded');

class SalesforceDummyFill {
  constructor() {
    this.currentFocusedField = null;
    this.fillIcon = null;
    this.dropdown = null;
    this.isIconVisible = false;

    this.dummyData = {
      'firstName': {
        label: '名（ファーストネーム）',
        values: ['太郎', '花子', '次郎', '美咲', '健太', '由美', '和彦', '恵子']
      },
      'lastName': {
        label: '姓（ラストネーム）',
        values: ['田中', '佐藤', '鈴木', '高橋', '渡辺', '山本', '中村', '小林']
      },
      'fullName': {
        label: 'フルネーム',
        values: ['田中太郎', '佐藤花子', '鈴木次郎', '高橋美咲', '渡辺健太']
      },
      'email': {
        label: 'メールアドレス',
        values: ['test@example.com', 'dummy@test.co.jp', 'sample@demo.com', 'user@company.jp']
      },
      'phone': {
        label: '電話番号',
        values: ['03-1234-5678', '090-1234-5678', '06-9876-5432', '045-111-2222']
      },
      'company': {
        label: '会社名',
        values: ['株式会社テスト', 'サンプル商事', 'デモ株式会社', 'テック企業', 'ソフトウェア会社']
      },
      'address': {
        label: '住所',
        values: ['東京都新宿区1-1-1', '大阪府大阪市北区2-2-2', '愛知県名古屋市中区3-3-3']
      },
      'zipCode': {
        label: '郵便番号',
        values: ['100-0001', '530-0001', '460-0001', '220-0001']
      },
      'date': {
        label: '日付',
        values: ['2024-01-15', '2024-03-20', '2024-06-10', '2024-09-05']
      },
      'number': {
        label: '数値',
        values: ['100', '500', '1000', '2500', '5000']
      },
      'text': {
        label: 'テキスト',
        values: ['テストデータ', 'サンプルテキスト', 'ダミー情報', '入力例']
      }
    };

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

    console.log('Salesforce page detected - initializing field focus detection');
    this.attachEventListeners();
    this.createFillIcon();
    
    // Dynamic content handling
    this.setupMutationObserver();
  }

  attachEventListeners() {
    document.addEventListener('focusin', this.handleFieldFocus.bind(this));
    document.addEventListener('focusout', this.handleFieldBlur.bind(this));
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Re-attach listeners to new form fields
              const inputs = node.querySelectorAll('input, textarea, select');
              if (inputs.length > 0) {
                console.log(`Found ${inputs.length} new form fields`);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  isFormField(element) {
    if (!element || !element.tagName) return false;
    
    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['text', 'email', 'tel', 'url', 'search', 'password'];
    
    return (
      tagName === 'textarea' ||
      tagName === 'select' ||
      (tagName === 'input' && (
        !element.type || 
        inputTypes.includes(element.type.toLowerCase())
      ))
    ) && !element.disabled && !element.readOnly;
  }

  handleFieldFocus(event) {
    const field = event.target;
    
    if (this.isFormField(field)) {
      console.log('Form field focused:', field);
      this.currentFocusedField = field;
      this.showFillIcon(field);
    }
  }

  handleFieldBlur(event) {
    // Small delay to allow icon clicking
    setTimeout(() => {
      if (!this.isIconVisible) {
        this.hideFillIcon();
      }
    }, 150);
  }

  handleDocumentClick(event) {
    if (this.dropdown && !this.dropdown.contains(event.target) && 
        this.fillIcon && !this.fillIcon.contains(event.target)) {
      this.hideDropdown();
    }
  }

  showFillIcon(field) {
    if (!this.fillIcon) return;

    const rect = field.getBoundingClientRect();
    this.fillIcon.style.display = 'block';
    this.fillIcon.style.left = (rect.right + 10) + 'px';
    this.fillIcon.style.top = (rect.top + (rect.height / 2) - 12) + 'px';
    this.isIconVisible = true;
  }

  hideFillIcon() {
    if (this.fillIcon) {
      this.fillIcon.style.display = 'none';
      this.isIconVisible = false;
    }
    this.hideDropdown();
  }

  createFillIcon() {
    this.fillIcon = document.createElement('div');
    this.fillIcon.id = 'salesforce-dummy-fill-icon';
    
    // Use high-resolution PNG icon
    const iconURL = chrome.runtime.getURL('icons/icon48.png');
    this.fillIcon.style.cssText = `
      position: fixed;
      width: 24px;
      height: 24px;
      background-image: url('${iconURL}');
      background-size: contain;
      background-repeat: no-repeat;
      border-radius: 4px;
      display: none;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      transition: box-shadow 0.2s ease, opacity 0.2s ease;
    `;

    this.fillIcon.addEventListener('click', this.showDropdown.bind(this));
    
    this.fillIcon.addEventListener('mouseenter', () => {
      this.isIconVisible = true;
      this.fillIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
      this.fillIcon.style.opacity = '0.9';
    });

    this.fillIcon.addEventListener('mouseleave', () => {
      this.fillIcon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
      this.fillIcon.style.opacity = '1';
      setTimeout(() => {
        if (!this.dropdown || this.dropdown.style.display === 'none') {
          this.isIconVisible = false;
          this.hideFillIcon();
        }
      }, 100);
    });

    document.body.appendChild(this.fillIcon);
  }

  showDropdown() {
    if (!this.currentFocusedField) return;

    this.hideDropdown();
    this.createDropdown();
    
    const iconRect = this.fillIcon.getBoundingClientRect();
    this.dropdown.style.left = iconRect.left + 'px';
    this.dropdown.style.top = (iconRect.bottom + 5) + 'px';
    this.dropdown.style.display = 'block';
  }

  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.id = 'salesforce-dummy-fill-dropdown';
    this.dropdown.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      z-index: 10001;
      min-width: 150px;
      max-height: 200px;
      overflow-y: auto;
      display: none;
    `;

    Object.keys(this.dummyData).forEach(dataType => {
      const item = document.createElement('div');
      item.textContent = this.dummyData[dataType].label;
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        font-size: 13px;
      `;

      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f0f0f0';
      });

      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'white';
      });

      item.addEventListener('click', () => {
        this.fillFieldWithData(dataType);
        this.hideDropdown();
        this.hideFillIcon();
      });

      this.dropdown.appendChild(item);
    });

    document.body.appendChild(this.dropdown);
  }

  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
    }
  }

  fillFieldWithData(dataType) {
    if (!this.currentFocusedField || !this.dummyData[dataType]) return;

    const values = this.dummyData[dataType].values;
    const randomValue = values[Math.floor(Math.random() * values.length)];

    this.currentFocusedField.value = randomValue;
    this.currentFocusedField.dispatchEvent(new Event('input', { bubbles: true }));
    this.currentFocusedField.dispatchEvent(new Event('change', { bubbles: true }));

    console.log(`Filled field with ${dataType}:`, randomValue);
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
    sendResponse({ success: true });
  }
});