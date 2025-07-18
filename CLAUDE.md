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
- 統一された単一パス処理：フォーム解析 → ピックリスト事前選択 → OpenAI API呼び出し → 一括フィールド入力
- ピックリスト整合性機能：事前に選択した値をOpenAI プロンプトに含めてデータ一貫性を確保
- メッセージパッシング（popup.js との通信）

#### `salesforce-analyzer.js` - フォーム解析エンジン
- `SalesforceAnalyzer`クラス：Lightning Web Componentの複雑な構造を解析
- `data-target-selection-name` 属性ベースの堅牢なフィールド検出
- 12種類のフィールドタイプをサポート（テキスト、数値、チェックボックス、ピックリスト、住所、名前、ルックアップ等）
- 複合フィールド処理：住所（BillingAddress、ShippingAddress）と名前（Name）の個別コンポーネント対応

#### `openai-helper.js` - AI統合
- `OpenAIHelper`クラス：GPT-4o-miniを使用したコンテキスト認識ダミーデータ生成
- ピックリスト値統合：事前選択されたピックリスト値を考慮した一貫性のあるデータ生成
- 多様性重視の日本語ビジネスデータ生成（頻出姓を避ける、固定フォーマット対応）
- フラットなJSON構造での応答パース（ネストオブジェクト回避）
- example.comドメイン使用（メール・ウェブサイト）

## フィールド検出パターン

### 基本識別方法
```javascript
// フィールドコンテナの識別
'[data-target-selection-name^="sfdc:RecordField."]'

// API名抽出
const match = selectionName.match(/sfdc:RecordField\.[^\.]+\.(.+)/);
```

### 複合フィールドの処理
```javascript
// 住所フィールドの処理
if (baseApiName.endsWith('Address')) {
  const dataField = element.closest('[data-field]')?.getAttribute('data-field');
  // BillingAddress.country, BillingAddress.postalCode etc.
}

// 名前フィールドの処理（住所と同じパターン）
if (baseApiName === 'Name') {
  const dataField = element.closest('[data-field]')?.getAttribute('data-field');
  // Name.firstName, Name.lastName, Name.salutation
}
```

### サポートするフィールドタイプ
- **テキスト系**: `input[type="text|email|tel|url|password"]`, `textarea`
- **数値**: `input[type="number"]`, `input[inputmode="decimal"]`
- **選択系**: 
  - `button[role="combobox"]` (picklist) - 事前取得による整合性確保済みランダム選択
  - `input[role="combobox"]` (lookup) - 自動スキップ
- **チェックボックス**: `input[type="checkbox"]`
- **複合フィールド**: 
  - `lightning-input-address` (住所の複数コンポーネント: country, province, city, postalCode, street)
  - `lightning-input-name` (名前の複数コンポーネント: salutation, firstName, lastName)

## 開発時の重要事項

### Lightning Web Component との互換性
- **統一処理アーキテクチャ**: 全フィールドタイプを単一ループで効率的に処理（fillPicklistsDirectly削除による最適化済み）
- **ピックリスト整合性処理**: 
  - 事前選択フェーズ：全ピックリストから選択可能値を取得・ランダム選択
  - データ生成フェーズ：選択済みピックリスト値をOpenAI プロンプトに含めて一貫性のあるデータを生成
  - 「--なし--」状態を空値として適切に処理
  - 最小限のイベント処理（click + change）で Lightning Web Component との互換性確保
- **イベントトリガー**: `input`, `change`, `blur` イベントをディスパッチしてSalesforceのリアクティブ更新を確保
- **Lookupフィールド**: 自動的にスキップ（参照項目のため）
- **複合フィールド**: 住所（請求先・納入先）と名前（敬称・姓・名）の個別コンポーネント処理

### OpenAI API プロンプト設計
- **ピックリスト値統合**: 事前選択されたピックリスト値を含めて整合性のあるデータを生成
- **多様性重視**: 佐藤・田中・鈴木などの頻出姓を避け、創造的で多様な日本語ビジネスデータを生成
- **固定フォーマット対応**: 
  - 電話番号: 00-0000-0000 固定
  - 日付: YYYY/MM/DD 形式
  - メール・URL: example.com ドメイン使用
- **フラットなJSON構造**: ネストしたオブジェクトを避けて `"BillingAddress.country"` 形式で出力
- **コンテキスト認識**: フィールドの意味と選択済みピックリスト値を考慮したデータ生成

### エラーハンドリング
- OpenAI API必須（フォールバック機能は削除済み）
- ユーザーフレンドリーなエラーメッセージ
- APIキー未設定時の適切な誘導
- ピックリスト選択失敗時の適切なスキップ処理

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