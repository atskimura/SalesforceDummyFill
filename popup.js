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

  fillButton.addEventListener('click', async function() {
    try {
      fillButton.disabled = true;
      fillButton.textContent = 'AI生成中...';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('salesforce.com') && 
          !tab.url.includes('force.com') && 
          !tab.url.includes('my.salesforce.com')) {
        showStatus('Salesforceページで実行してください', 'error');
        return;
      }

      // TODO: OpenAI API統合後にcontent scriptと連携
      const results = await chrome.tabs.sendMessage(tab.id, { 
        action: 'fillDummyData' 
      });

      if (results && results.success) {
        showStatus('AIダミーデータを生成して入力しました');
      } else {
        showStatus('フォームの解析に失敗しました', 'error');
      }

    } catch (error) {
      console.error('Error:', error);
      showStatus('エラーが発生しました', 'error');
    } finally {
      fillButton.disabled = false;
      fillButton.textContent = 'AIダミーデータ生成';
    }
  });

  // TODO: OpenAI API設定チェック機能
  async function checkOpenAIKey() {
    const result = await chrome.storage.sync.get(['openaiApiKey']);
    return result.openaiApiKey;
  }

  // TODO: 設定画面への誘導
  function showSettingsMessage() {
    showStatus('OpenAI APIキーを設定してください', 'error');
    // 設定画面を開くリンクを表示
  }
});