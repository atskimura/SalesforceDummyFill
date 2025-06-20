document.addEventListener('DOMContentLoaded', function() {
  const fillButton = document.getElementById('fillButton');
  const statusDiv = document.getElementById('status');

  function showStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  // ページ読み込み時にAPIキーをチェック
  checkApiKeyOnLoad();

  fillButton.addEventListener('click', async function() {
    try {
      fillButton.disabled = true;
      fillButton.textContent = 'AI生成中...';

      // APIキーをチェック
      const apiKey = await checkOpenAIKey();
      if (!apiKey) {
        showSettingsMessage();
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('salesforce.com') && 
          !tab.url.includes('force.com') && 
          !tab.url.includes('my.salesforce.com')) {
        showStatus('Salesforceページで実行してください', 'error');
        return;
      }

      const results = await chrome.tabs.sendMessage(tab.id, { 
        action: 'fillDummyData' 
      });

      if (results && results.success) {
        const message = results.fallback 
          ? `フォールバック機能で${results.filledFields}個のフィールドに入力しました`
          : `AI生成データで${results.filledFields}個のフィールドに入力しました`;
        showStatus(message);
        
        // オブジェクト名も表示
        if (results.objectName && results.objectName !== 'Unknown') {
          console.log(`Object: ${results.objectName}, Total: ${results.totalFields}, Filled: ${results.filledFields}, Skipped: ${results.skippedFields}`);
        }
      } else {
        showStatus(results?.error || 'フォームの解析に失敗しました', 'error');
      }

    } catch (error) {
      console.error('Error:', error);
      if (error.message && error.message.includes('OpenAI')) {
        showStatus(error.message, 'error');
      } else {
        showStatus('エラーが発生しました', 'error');
      }
    } finally {
      fillButton.disabled = false;
      fillButton.textContent = 'AIダミーデータ生成';
    }
  });

  async function checkOpenAIKey() {
    const result = await chrome.storage.sync.get(['openaiApiKey']);
    return result.openaiApiKey;
  }

  async function checkApiKeyOnLoad() {
    const apiKey = await checkOpenAIKey();
    if (!apiKey) {
      fillButton.disabled = true;
      fillButton.textContent = 'API設定が必要';
      fillButton.style.backgroundColor = '#f39c12';
      fillButton.title = 'OpenAI APIキーを設定してください';
      
      // 設定画面へのリンクを表示
      showSettingsLink();
    }
  }

  function showSettingsMessage() {
    showStatus('設定画面でOpenAI APIキーを設定してください', 'error');
    showSettingsLink();
  }

  function showSettingsLink() {
    // 既存のリンクがあれば削除
    const existingLink = document.getElementById('settingsLink');
    if (existingLink) {
      existingLink.remove();
    }

    // 設定画面へのリンクを追加
    const settingsLink = document.createElement('div');
    settingsLink.id = 'settingsLink';
    settingsLink.innerHTML = `
      <div style="margin-top: 10px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; text-align: center;">
        <a href="#" id="openSettings" style="color: #e67e22; text-decoration: none; font-weight: bold;">
          ⚙️ 設定画面を開く
        </a>
      </div>
    `;
    
    document.querySelector('.header').appendChild(settingsLink);
    
    // 設定画面を開くイベントリスナー
    document.getElementById('openSettings').addEventListener('click', function(e) {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
});