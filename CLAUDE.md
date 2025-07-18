# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

SalesforceのLightning Web Componentフォームに、OpenAI APIを活用してコンテキストに応じた適切なダミーデータを自動入力するChrome Extension。

## 開発環境セットアップ

### Chrome拡張機能の読み込み
1. Chrome で `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトのルートディレクトリを選択

### 設定
1. 拡張機能アイコンを右クリック → 「オプション」
2. OpenAI APIキーを入力・保存
3. 「接続テスト」で動作確認

### デバッグ
- Salesforceページで `?debug=true` パラメータを追加するとフォーム解析結果がコンソールに出力される
- Chrome DevToolsの拡張機能タブでバックグラウンドページとコンテンツスクリプトを個別にデバッグ可能

## アーキテクチャ

### Chrome Extension 構造（Manifest V3）
```
manifest.json          # 拡張機能設定
popup.html/js          # ポップアップUI
options.html/js        # 設定画面
content.js            # メインロジック（Salesforceページで実行）
salesforce-analyzer.js # フォーム解析エンジン
openai-helper.js      # OpenAI API統合
```

### コアコンポーネント

#### `content.js` - メインオーケストレーター
- `SalesforceDummyFill`クラス：全体の処理フローを管理
- フォーム解析 → OpenAI API呼び出し → フィールド入力の一連の処理
- フォールバック機能（API失敗時の基本ダミーデータ）
- メッセージパッシング（popup.js との通信）

#### `salesforce-analyzer.js` - フォーム解析エンジン
- `SalesforceAnalyzer`クラス：Lightning Web Componentの複雑な構造を解析
- `data-target-selection-name` 属性ベースの堅牢なフィールド検出
- 11種類のフィールドタイプをサポート（テキスト、数値、チェックボックス、ピックリスト、住所、ルックアップ等）
- 複合フィールド（住所）の個別コンポーネント処理

#### `openai-helper.js` - AI統合
- `OpenAIHelper`クラス：GPT-4o-miniを使用したコンテキスト認識ダミーデータ生成
- 日本語ビジネスデータの生成
- フラットなJSON構造での応答パース
- API制限・エラーハンドリング

## フィールド検出パターン

### 基本識別方法
```javascript
// フィールドコンテナの識別
'[data-target-selection-name^="sfdc:RecordField."]'

// API名抽出
const match = selectionName.match(/sfdc:RecordField\.[^\.]+\.(.+)/);
```

### 複合フィールド（住所）の処理
```javascript
// 住所フィールドの二重識別子方式
if (baseApiName.endsWith('Address')) {
  const dataField = element.closest('[data-field]')?.getAttribute('data-field');
  // BillingAddress.country, BillingAddress.postalCode etc.
}
```

### サポートするフィールドタイプ
- **テキスト系**: `input[type="text|email|tel|url|password"]`, `textarea`
- **数値**: `input[type="number"]`, `input[inputmode="decimal"]`
- **選択系**: `button[role="combobox"]` (picklist), `input[role="combobox"]` (lookup)
- **チェックボックス**: `input[type="checkbox"]`
- **複合**: `lightning-input-address` (住所の複数コンポーネント)

## 開発時の重要事項

### Lightning Web Component との互換性
- イベントトリガー：`input`, `change`, `blur` イベントをディスパッチしてSalesforceのリアクティブ更新を確保
- Lookupフィールドは自動的にスキップ（参照項目のため）
- 住所フィールドは個別コンポーネント（国、都道府県、市区町村、郵便番号、住所）として処理

### OpenAI API プロンプト設計
- 日本語ビジネスデータ生成に最適化
- フラットなJSON構造で応答（ネストしたオブジェクトを避ける）
- フィールドの意味とコンテキストを考慮したデータ生成

### エラーハンドリング
- OpenAI API失敗時は自動的にフォールバックダミーデータを使用
- ユーザーフレンドリーなエラーメッセージ
- APIキー未設定時の適切な誘導

## テスト

### 手動テスト
1. Salesforceの取引先、リード、商談などの新規作成/編集ページを開く
2. 拡張機能ポップアップから「AIダミーデータ生成」をクリック
3. フィールドが適切に入力されることを確認

### デバッグ用サンプル
- `test-samples/` ディレクトリに実際のSalesforceフォーム構造のHTMLサンプルあり
- フィールド検出ロジックの開発・テストに使用

## ファイル構造の特徴

- バニラJavaScript（ビルドツール不要）
- Manifest V3準拠
- 日本語UI/UX
- Chrome Storage API使用（設定保存）
- host_permissions でSalesforceドメインとOpenAI API制限