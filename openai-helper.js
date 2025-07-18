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
          temperature: 0.9,
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

    // ランダム要素を追加してバリエーションを確保
    const randomSeed = Date.now() % 1000;
    const requestId = Math.random().toString(36).substring(2, 8);

    return `
Salesforceの${objectName}オブジェクトのフォームに入力するダミーデータを生成してください。
リクエストID: ${requestId} (${randomSeed})

フィールド情報:
${fieldList}

**創造性重視**: 毎回全く異なるリアルなダミーデータを生成してください。固定パターンは使わず、AIの創造性を最大限活用:

【多様性の指針】
- 住所: 全国の実在する都市・区を自由に創造的に使用（東京、大阪、名古屋、福岡、札幌、仙台、広島、京都、神戸、横浜など）
- 会社名: 実在しそうで魅力的な企業名を創造（業界に応じて自然な命名）
- 人名: 自然で一般的な日本人の姓名を自由に組み合わせ
- 電話番号: 実在しそうな市外局番と番号を生成
- メールアドレス: xxx@yyy.example.com 形式（サブドメインyyyは自由に設定）
- ウェブサイト: https://yyy.example.com 形式（サブドメインyyyは自由に設定）
- 部署・役職: 業界や会社規模に応じた現実的な組織構造

【重要な創造性のポイント】
- 毎回全く異なるデータセットを生成
- 「株式会社○○システム」「丸の内1-1-1」のような典型的すぎる表現は避ける
- 実在する日本の地名・企業名スタイルを参考にしつつ、オリジナリティを重視
- 業界の特性を反映した自然な企業名・人名・住所の組み合わせ
- バリエーション豊かで説得力のあるビジネスデータ

以下の条件で生成してください:
1. 創造的で多様性に富んだ日本語ビジネスデータ
2. フィールドの意味に応じた関連性のあるデータ
3. 必須フィールドは必ず値を設定
4. 毎回異なる創造的なアプローチを使用
5. リアリティがありつつユニークなデータ
6. **重要**: メールアドレスとウェブサイトは必ず example.com ドメインを使用（例: info@company.example.com, https://www.company.example.com）

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

}