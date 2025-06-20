# Salesforce Dummy Fill Chrome Extension

Salesforceのフォームに適切なダミーデータを簡単に入力するChrome Extension

## 概要

このプロジェクトは、Salesforceのフォーム入力作業を効率化するためのChrome Extensionです。1Password風のUIで、フィールドごとに適切なダミーデータを選択・入力できます。

## 主な機能

### 個別フィールド入力（メイン機能）
- フォームフィールドにフォーカスするとアイコンが表示
- アイコンクリックでデータ種類選択メニューが表示
- データ種類を選択すると該当フィールドにダミーデータを挿入

### 一括入力機能
- 拡張機能ポップアップから全フィールドを一括入力
- ページ全体のフォームを自動検出して適切なデータを挿入

### 学習機能（将来実装予定）
- フォームとデータ種類の関連を学習
- よく使うパターンを記憶して入力を効率化

## 開発計画

### フェーズ1: 基本構造
- [x] Chrome Extension基本構造の作成（manifest.json, popup.html, popup.js）
- [x] プロジェクト初期化とアイコン設定
- [ ] フォームフィールドフォーカス検出機能

### フェーズ2: 個別フィールド入力機能（メイン機能）
- [ ] フォーカス時のアイコン表示機能
- [ ] データ種類選択ドロップダウンUI
- [ ] 個別フィールドへのダミーデータ入力機能

### フェーズ3: 一括入力機能
- [ ] 一括入力機能（ポップアップから）
- [ ] Salesforce特有のフィールド（Lookup、Picklist等）対応

### フェーズ4: 高度な機能
- [ ] フォームとデータ種類の学習機能
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
- ✅ 1Password風UI実装完了
  - フォームフィールドフォーカス検出
  - フォーカス時アイコン表示（🔧）
  - データ種類選択ドロップダウン（11種類）
  - 個別フィールドダミーデータ入力
- ✅ .gitignoreファイル作成

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

### 個別フィールド入力
1. Chrome拡張として読み込み
2. Salesforceページのフォームフィールドにフォーカス
3. 表示されたアイコンをクリック
4. データ種類を選択してダミーデータを挿入

### 一括入力
1. Salesforceページで拡張アイコンをクリック
2. 「ダミーデータ入力」ボタンをクリック
3. ページ内の全フォームが自動入力される

## 開発メモ

- 各フェーズ完了後に動作確認を実施
- Salesforce特有のフィールドタイプに対応
- 日本語環境に適したダミーデータを使用