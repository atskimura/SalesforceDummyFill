// 設定画面のJavaScript
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const temperatureInput = document.getElementById('temperature');
  const saveButton = document.getElementById('saveButton');
  const testButton = document.getElementById('testButton');
  const statusDiv = document.getElementById('status');

  // 保存された設定を読み込み
  loadSettings();

  function showStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'openaiApiKey',
        'temperature'
      ]);

      if (result.openaiApiKey) {
        apiKeyInput.value = result.openaiApiKey;
      }

      if (result.temperature !== undefined) {
        temperatureInput.value = result.temperature;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      showStatus('設定の読み込みに失敗しました', 'error');
    }
  }

  async function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    const temperature = parseFloat(temperatureInput.value) || 0.7;

    if (!apiKey) {
      showStatus('OpenAI APIキーを入力してください', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showStatus('無効なAPIキー形式です。sk-で始まる必要があります', 'error');
      return;
    }

    if (temperature < 0 || temperature > 1) {
      showStatus('創造性レベルは0.0から1.0の間で入力してください', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({
        openaiApiKey: apiKey,
        temperature: temperature
      });

      showStatus('設定を保存しました');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showStatus('設定の保存に失敗しました', 'error');
    }
  }

  async function testConnection() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus('APIキーを入力してください', 'error');
      return;
    }

    testButton.disabled = true;
    testButton.textContent = 'テスト中...';

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showStatus('OpenAI APIに正常に接続できました');
      } else if (response.status === 401) {
        showStatus('APIキーが無効です', 'error');
      } else if (response.status === 429) {
        showStatus('API制限に達しています。しばらく後に再試行してください', 'error');
      } else {
        showStatus(`接続エラー: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      if (error.message.includes('Failed to fetch')) {
        showStatus('ネットワークエラー: インターネット接続を確認してください', 'error');
      } else {
        showStatus(`接続テストに失敗しました: ${error.message}`, 'error');
      }
    } finally {
      testButton.disabled = false;
      testButton.textContent = '接続テスト';
    }
  }

  // イベントリスナー
  saveButton.addEventListener('click', saveSettings);
  testButton.addEventListener('click', testConnection);

  // Enterキーで保存
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });

  temperatureInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });
});