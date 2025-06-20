# Salesforce Form HTML Samples

このディレクトリには、Salesforce Lightning Web Componentのフォーム構造を分析するためのサンプルHTMLファイルが含まれています。

## ファイル説明

### salesforce-account-inline.html
- **概要**: Salesforce取引先（Account）のインライン編集フォーム
- **用途**: 既存レコードの編集時のHTML構造
- **特徴**: 
  - Lightning Web Component構造
  - インライン編集モード
  - フィールド毎の詳細なHTML構造

### salesforce-account-modal.html  
- **概要**: Salesforce取引先（Account）のモーダルフォーム
- **用途**: 新規作成やモーダル表示時のHTML構造
- **特徴**:
  - モーダルダイアログ内のフォーム
  - 異なるレイアウト構造
  - Lightning Design System使用

## 分析対象のフィールドタイプ

### 基本フィールド
- **テキスト入力**: `lightning-input` + `input[type="text"]`
- **テキストエリア**: `lightning-textarea` + `textarea.slds-textarea`
- **数値入力**: `input[inputmode="decimal"]`
- **チェックボックス**: `input[type="checkbox"]`

### 特殊フィールド
- **ピックリスト**: `lightning-combobox` + `button[role="combobox"]`
- **ルックアップ**: `lightning-lookup` + `input[role="combobox"]`
- **日付**: `lightning-datepicker` + `input[type="text"]`
- **住所**: `lightning-input-address` + 複数コンポーネント

### 識別パターン
- **フィールド名**: `data-target-selection-name="sfdc:RecordField.Account.{FieldName}"`
- **API名**: `name="{FieldAPIName}"`
- **住所サブフィールド**: `data-field="{country|province|city|postalCode|street}"`

## Chrome Extension開発での活用

これらのサンプルファイルは以下の目的で使用されます：

1. **フィールド検出ロジック**: 適切なCSSセレクターの開発
2. **データ型判別**: フィールドタイプに応じた入力方法の決定
3. **テスト**: ダミーデータ入力機能の動作確認
4. **OpenAI API**: フィールド情報抽出とダミーデータ生成

## 注意事項

- 実際のSalesforce環境から取得したHTMLのため、本番データは含まれていません
- Lightning Web Componentの構造は動的に変化する可能性があります
- Salesforceのバージョンアップにより構造が変更される場合があります