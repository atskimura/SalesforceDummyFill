// OpenAI API統合ヘルパークラス
class OpenAIHelper {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://api.openai.com/v1';
  }

  // APIキーを設定から取得
  async loadApiKey() {
    const result = await chrome.storage.sync.get(['openaiApiKey']);
    this.apiKey = result.openaiApiKey;
    return this.apiKey;
  }

  // APIキーの有効性チェック
  async validateApiKey() {
    if (!this.apiKey) {
      await this.loadApiKey();
    }
    
    if (!this.apiKey) {
      throw new Error('OpenAI APIキーが設定されていません');
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`APIキーが無効です: ${response.status}`);
      }

      return true;
    } catch (error) {
      throw new Error(`APIキー検証に失敗: ${error.message}`);
    }
  }

  // フィールド情報からダミーデータを生成
  async generateDummyData(formInfo) {
    if (!this.apiKey) {
      await this.loadApiKey();
    }

    if (!this.apiKey) {
      throw new Error('OpenAI APIキーが設定されていません');
    }

    const prompt = this.buildPrompt(formInfo);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'あなたはSalesforceのフォーム入力用ダミーデータを生成するAIアシスタントです。日本語の適切なダミーデータを生成してください。プレーンなJSONのみを返し、マークダウンのコードブロックや説明文は一切含めないでください。フラットなJSON構造を使用し、ネストしたオブジェクトは絶対に使わないでください。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('OpenAI APIからの応答をパースできませんでした');
      }

    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  // プロンプト生成
  buildPrompt(formInfo) {
    const { objectName, fields } = formInfo;
    
    const fieldList = fields.map(field => {
      // 複合フィールドの表示形式
      const fieldKey = field.subField 
        ? `${field.apiName}.${field.subField}`
        : field.apiName;
      
      return `- ${field.label} (${fieldKey}) - ${field.type}${field.required ? ' [必須]' : ''}`;
    }).join('\n');

    return `
Salesforceの${objectName}オブジェクトのフォームに入力するダミーデータを生成してください。

フィールド情報:
${fieldList}

以下の条件で生成してください:
1. 日本語の適切なビジネスデータ
2. フィールドの意味に応じた関連性のあるデータ
3. 必須フィールドは必ず値を設定
4. 実在しそうだが架空のデータ

**重要**: フラットなJSONで回答してください。ネストしたオブジェクトは使わず、全てのフィールドをトップレベルのキーとして定義してください:
{
  "Name": "値1",
  "BillingAddress.country": "値2",
  "BillingAddress.postalCode": "値3",
  "ShippingAddress.country": "値4",
  ...
}
`.trim();
  }

  // フォールバック用の基本ダミーデータ
  getFallbackData() {
    return {
      fallback: true,
      data: {
        Name: '株式会社サンプル',
        FirstName: '太郎',
        LastName: '田中',
        Email: 'test@example.com',
        Phone: '03-1234-5678',
        MobilePhone: '090-1234-5678',
        Title: '営業部長',
        Department: '営業部',
        CompanyName: '株式会社テスト',
        Street: '東京都新宿区1-1-1',
        City: '新宿区',
        State: '東京都',
        PostalCode: '160-0001',
        Country: '日本',
        Website: 'https://example.com',
        Description: 'テスト用のダミーデータです。'
      }
    };
  }
}