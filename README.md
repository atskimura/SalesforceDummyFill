# Salesforce Dummy Fill Chrome Extension

Salesforceのフォームに適切なダミーデータを1クリックで入力するChrome Extension

## 概要

このプロジェクトは、Salesforceのフォーム入力作業を効率化するためのChrome Extensionです。ワンクリックで各フィールドに適切なダミーデータを自動入力できます。

## 開発計画

### フェーズ1: 基本構造
- [ ] Chrome Extension基本構造の作成（manifest.json, popup.html, popup.js）
- [ ] シンプルなPopup UIの実装（ボタン1つで動作確認）
- [ ] Content Scriptの実装（ページ操作用）

### フェーズ2: 基本機能
- [ ] Salesforceページ検出機能の実装
- [ ] 基本的なフォームフィールド検出とダミーデータ入力

### フェーズ3: データ拡張
- [ ] ダミーデータパターンの拡張（名前、住所、電話番号等）
- [ ] Salesforce特有のフィールド（Lookup、Picklist等）対応

### フェーズ4: 高度な機能
- [ ] 設定画面の実装（データパターンカスタマイズ）

## 実装状況

### 2025-06-20
- ✅ プロジェクト初期化
- ✅ 開発計画策定
- ✅ README.md作成
- ✅ Chrome Extension基本構造作成
  - manifest.json (Manifest V3対応)
  - popup.html (シンプルなUI)
  - popup.js (基本的なロジック)
  - content.js (Salesforceページ検出)

## 技術スタック

- Chrome Extension Manifest V3
- JavaScript (ES6+)
- HTML/CSS
- Content Scripts API

## ディレクトリ構造

```
salesforce-dummy-fill/
├── README.md
├── manifest.json
├── popup.html
├── popup.js
├── content.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 使用方法

1. Chrome拡張として読み込み
2. Salesforceページで拡張アイコンをクリック
3. 「ダミーデータ入力」ボタンをクリック
4. フォームが自動入力される

## 開発メモ

- 各フェーズ完了後に動作確認を実施
- Salesforce特有のフィールドタイプに対応
- 日本語環境に適したダミーデータを使用