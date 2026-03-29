# TOEIC Listening Practice

TOEIC L&R リスニング演習専用のWebアプリ。
React + Vite で構築し、GitHub Pages にデプロイする。

## Tech Stack
- React 19+ / Vite
- React Router v7 (HashRouter)
- HTML5 Audio API
- CSS Modules（Tailwind不使用）
- localStorage（学習履歴）
- GitHub Pages (gh-pages)

## Data Architecture
- 全試験データは統一JSONフォーマットに従う
- TOEIC専用（examType: toeic 固定）
- 階層: ExamSet → Section (Part 1-4) → Question
- データファイル: src/data/toeic/{examId}.json
- 音声ファイル: public/audio/TOEIC/{フォルダ名}/

## TOEIC Listening 構成
- Part 1: 写真描写問題 (Q1-Q6) — 4択 (A/B/C/D)
- Part 2: 応答問題 (Q7-Q31) — 3択 (A/B/C)
- Part 3: 会話問題 (Q32-Q70) — 3問1セット、4択
- Part 4: 説明文問題 (Q71-Q100) — 3問1セット、4択

## Conventions
- コンポーネントは関数コンポーネント + Hooks
- ファイル名: PascalCase（コンポーネント）、camelCase（hooks/utils）
- ルーティング: #/:examId/:sectionId
- コミットメッセージは日本語OK

## Structure
- src/components/ : 再利用可能なUIコンポーネント
- src/pages/ : ページコンポーネント（ExamList, Sections, Practice）
- src/hooks/ : カスタムフック
- src/data/toeic/ : 問題データJSON
- src/utils/ : 設定・ユーティリティ
- public/audio/TOEIC/ : 音声ファイル

## Data Extraction Workflow
問題データの抽出は以下のフローで行う:
1. Claude Project で解答PDF から JSON を抽出（extracted/partN.json）
2. GitHub に手動アップロード
3. Claude Code でマージ（全パート一括）:
```
cd "TOEIC listening practice/listening-lab"
git pull
for i in 1 2 3 4; do node scripts/merge-extracted.js ../extracted/part$i.json --part $i --exam <examId>; done
node scripts/validate-data.js --exam <examId>
```

### Scripts
- scripts/merge-extracted.js — 抽出JSONを既存データにマージ（--dry-run でプレビュー可）
- scripts/validate-data.js — マージ後のデータ整合性チェック
- extracted/ — 抽出JSONの置き場（GitHub経由で受け渡し）
