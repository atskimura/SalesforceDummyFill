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
      fillButton.textContent = '処理中...';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('salesforce.com') && 
          !tab.url.includes('force.com') && 
          !tab.url.includes('my.salesforce.com')) {
        showStatus('Salesforceページで実行してください', 'error');
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: fillDummyData
      });

      if (results && results[0] && results[0].result) {
        showStatus(`${results[0].result.count}個のフィールドに入力しました`);
      } else {
        showStatus('入力可能なフィールドが見つかりませんでした', 'error');
      }

    } catch (error) {
      console.error('Error:', error);
      showStatus('エラーが発生しました', 'error');
    } finally {
      fillButton.disabled = false;
      fillButton.textContent = 'ダミーデータ入力';
    }
  });

  function fillDummyData() {
    const dummyData = {
      firstName: ['太郎', '花子', '次郎', '美咲', '健太'],
      lastName: ['田中', '佐藤', '鈴木', '高橋', '渡辺'],
      email: ['test@example.com', 'dummy@test.co.jp', 'sample@demo.com'],
      phone: ['03-1234-5678', '090-1234-5678', '06-9876-5432'],
      company: ['株式会社テスト', 'サンプル商事', 'デモ株式会社'],
      address: ['東京都新宿区1-1-1', '大阪府大阪市北区2-2-2', '愛知県名古屋市中区3-3-3']
    };

    function getRandomValue(array) {
      return array[Math.floor(Math.random() * array.length)];
    }

    let filledCount = 0;

    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
    
    inputs.forEach(input => {
      if (input.value.trim() !== '' || input.disabled || input.readOnly) {
        return;
      }

      let value = '';
      const fieldName = (input.name || input.id || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const label = input.getAttribute('aria-label') || '';

      if (fieldName.includes('firstname') || fieldName.includes('first_name') || 
          label.includes('名') || placeholder.includes('名前')) {
        value = getRandomValue(dummyData.firstName);
      } else if (fieldName.includes('lastname') || fieldName.includes('last_name') || 
                 fieldName.includes('surname') || label.includes('姓')) {
        value = getRandomValue(dummyData.lastName);
      } else if (fieldName.includes('email') || input.type === 'email') {
        value = getRandomValue(dummyData.email);
      } else if (fieldName.includes('phone') || fieldName.includes('tel') || input.type === 'tel') {
        value = getRandomValue(dummyData.phone);
      } else if (fieldName.includes('company') || fieldName.includes('account') || 
                 label.includes('会社') || placeholder.includes('会社')) {
        value = getRandomValue(dummyData.company);
      } else if (fieldName.includes('address') || fieldName.includes('street') || 
                 label.includes('住所') || placeholder.includes('住所')) {
        value = getRandomValue(dummyData.address);
      } else {
        value = 'テストデータ';
      }

      if (value) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
      }
    });

    return { count: filledCount };
  }
});