# Salesforce Dummy Fill Chrome Extension

SalesforceのLightning Web Componentフォームに、OpenAI APIを活用してコンテキストに応じた適切なダミーデータを自動入力するChrome Extension

## 概要

このプロジェクトは、Salesforceのフォーム入力作業を効率化するためのChrome Extensionです。OpenAI APIを使用してフィールドのラベルや種類に基づいて最適なダミーデータを生成し、Lightning Web Componentの複雑な構造に対応した一括入力を行います。

## 主な機能

### AI powered一括入力（メイン機能）
- Salesforceページのフォーム構造を自動解析
- OpenAI APIでフィールド情報からコンテキストに応じたダミーデータを生成
- Lightning Web Component（lightning-input、lightning-combobox等）への対応
- ワンクリックで全フィールドにスマートなダミーデータを一括入力

### 対応フィールドタイプ
- テキスト入力、数値、メール、電話、URL、パスワード
- チェックボックス
- ピックリスト（lightning-combobox）
- 住所フィールド（lightning-input-address）
  - 請求先・納入先の各コンポーネント（国、都道府県、市区町村、郵便番号、住所）を個別処理
- テキストエリア
- ルックアップ（参照項目）- 自動的にスキップ

### 設定機能
- OpenAI APIキーの設定
- データ生成パラメータのカスタマイズ
- エラーハンドリングとフォールバック機能

## 開発計画

### フェーズ1: アーキテクチャ変更
- [x] Chrome Extension基本構造の作成（manifest.json, popup.html, popup.js）
- [x] プロジェクト初期化とアイコン設定
- [x] Salesforce Lightning Web Component構造の分析とサンプル収集
- [x] 個別入力機能のコード削除とクリーンアップ

### フェーズ2: OpenAI API統合
- [x] OpenAI API統合設計とmanifest.json更新
- [x] Salesforceフォーム解析機能（フィールド情報抽出）
- [x] OpenAI APIでダミーデータ生成機能
- [x] 一括フィールド入力機能（Lightning対応）

### フェーズ3: UI/設定機能
- [x] 設定画面（OpenAI APIキー入力）
- [x] エラーハンドリングとフォールバック機能
- [x] ユーザビリティ改善

### フェーズ4: 高度な機能
- [ ] データ生成パラメータのカスタマイズ
- [ ] パフォーマンス最適化
- [ ] 複数オブジェクト対応の拡張

## 実装状況

### 2025-06-20
- ✅ プロジェクト初期化
- ✅ 開発計画策定
- ✅ README.md作成
- ✅ Chrome Extension基本構造作成
  - manifest.json (Manifest V3対応)
  - popup.html (AIダミーデータ生成UI)
  - popup.js (OpenAI API統合ロジック)
  - content.js (AI powered一括入力機能)
- ✅ ~~1Password風UI実装完了~~（アーキテクチャ変更により削除済み）
- ✅ Salesforce Lightning Web Component構造分析
  - test-samples/salesforce-account-inline.html
  - test-samples/salesforce-account-modal.html
  - フィールドタイプ別HTML構造の詳細分析
- ✅ .gitignoreファイル作成
- ✅ OpenAI API統合アーキテクチャ設計と実装
- ✅ Salesforceフォーム解析機能の実装 (salesforce-analyzer.js)
  - data-target-selection-nameベースの堅牢なフィールド検出
  - 11種類のフィールドタイプをサポート
  - 住所フィールドの複数コンポーネント対応（二重識別子方式）
  - オブジェクト名の自動抽出
- ✅ OpenAI APIダミーデータ生成機能 (openai-helper.js)
  - コンテキスト理解に基づくデータ生成
  - フラットなJSON出力でネストオブジェクト問題を回避
  - エラーハンドリングとフォールバック機能
- ✅ 設定画面の実装 (options.html/js)
  - OpenAI APIキー設定
  - 接続テスト機能
- ✅ 一括フィールド入力機能
  - Lightning Web Component対応
  - 複合フィールド（住所）の個別コンポーネント処理
  - Lookupフィールド（参照項目）の自動スキップ
  - フィールドタイプ別の値設定
  - イベント処理とリアクティブ更新

## 技術スタック

- Chrome Extension Manifest V3
- JavaScript (ES6+)
- OpenAI API (GPT-4o-mini)
- HTML/CSS
- Content Scripts API
- Lightning Web Component対応
- Chrome Storage API

## ディレクトリ構造

```
salesforce-dummy-fill/
├── README.md
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── openai-helper.js         # OpenAI API統合
├── salesforce-analyzer.js   # Salesforceフォーム解析
├── options.html              # 設定画面
├── options.js               # 設定画面ロジック
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
└── test-samples/            # Salesforce HTML分析用
    ├── README.md
    ├── salesforce-account-inline.html
    └── salesforce-account-modal.html
```

## 使用方法

### 初期設定
1. Chrome拡張として読み込み
2. 拡張機能アイコンを右クリック → 「オプション」
3. OpenAI APIキーを入力・保存

### AI powered一括入力
1. Salesforceページ（取引先、リード、商談など）を開く
2. 拡張機能アイコンをクリック
3. 「AIダミーデータ生成」ボタンをクリック
4. フォーム構造が自動解析され、コンテキストに応じたダミーデータが全フィールドに入力される

### 対応ページ
- 新規レコード作成ページ
- レコード編集ページ（インライン編集・モーダル）
- クイックアクション
- Lightning App Builder内のフォーム

## アーキテクチャ設計

### OpenAI API統合フロー
```
1. フォーム解析
   ↓ DOMからフィールド情報抽出
2. API Request
   ↓ フィールド情報 + オブジェクト名をOpenAI APIに送信
3. データ生成
   ↓ コンテキストに応じたダミーデータ受信
4. 一括入力
   ↓ Lightning Web Componentに対応した入力処理
```

### フィールド解析パターン
- **ラベル**: `test-id__field-label`から取得
- **API名**: `name`属性から取得
- **フィールドタイプ**: HTML構造とselectors併用で判別
- **必須判定**: `aria-required`属性で判定

## 開発メモ

- Lightning Web Component構造の複雑性に対応
- OpenAI APIによるコンテキスト理解でデータ品質向上
- エラーハンドリングとフォールバック機能でユーザビリティ確保
- 日本語環境に適したダミーデータ生成