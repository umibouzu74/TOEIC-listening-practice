#!/usr/bin/env node
/**
 * merge-extracted.js
 * 抽出JSONを既存の問題データにマージする
 *
 * 使い方:
 *   node scripts/merge-extracted.js ../extracted/part3.json --part 3
 *   node scripts/merge-extracted.js ../extracted/part4.json --part 4
 *   node scripts/merge-extracted.js ../extracted/part3.json --part 3 --dry-run
 *   node scripts/merge-extracted.js ../extracted/part3.json --part 3 --exam toeic-kishutu3-1
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);

// Parse arguments
const dryRun = args.includes("--dry-run");
const partIndex = args.indexOf("--part");
const examIndex = args.indexOf("--exam");
const inputFile = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--part" && args[args.indexOf(a) - 1] !== "--exam");

if (!inputFile || partIndex === -1) {
  console.error("使い方: node scripts/merge-extracted.js <extracted.json> --part <N> [--exam <examId>] [--dry-run]");
  process.exit(1);
}

const partNum = parseInt(args[partIndex + 1], 10);
if (isNaN(partNum) || partNum < 1 || partNum > 4) {
  console.error("エラー: --part は 1〜4 の整数を指定してください");
  process.exit(1);
}

const examId = examIndex !== -1 ? args[examIndex + 1] : "toeic-kishutu3-1";
const sectionId = `part${partNum}`;

// Resolve paths
const extractedPath = resolve(inputFile);
const dataPath = resolve(`src/data/toeic/${examId}.json`);

// Load files
let extracted;
try {
  extracted = JSON.parse(readFileSync(extractedPath, "utf8"));
} catch (e) {
  console.error(`エラー: 抽出ファイルの読み込みに失敗: ${extractedPath}`);
  console.error(e.message);
  process.exit(1);
}

let examData;
try {
  examData = JSON.parse(readFileSync(dataPath, "utf8"));
} catch (e) {
  console.error(`エラー: 試験データの読み込みに失敗: ${dataPath}`);
  console.error(e.message);
  process.exit(1);
}

// Find target section
const section = examData.sections.find((s) => s.id === sectionId);
if (!section) {
  console.error(`エラー: セクション ${sectionId} が見つかりません`);
  process.exit(1);
}

// Build lookup from extracted data
const extractedMap = new Map();
for (const q of extracted) {
  extractedMap.set(q.id, q);
}

// Merge
const fields = ["answer", "explanation", "script", "scriptJa"];
let mergedCount = 0;
let skippedCount = 0;
let overwrittenFields = 0;
const details = [];

for (const q of section.questions) {
  const ext = extractedMap.get(q.id);
  if (!ext) {
    details.push(`  SKIP ${q.id}: 抽出データなし`);
    skippedCount++;
    continue;
  }

  const changes = [];
  for (const field of fields) {
    if (ext[field] && ext[field] !== "") {
      const hadValue = q[field] && q[field] !== "";
      if (hadValue && q[field] !== ext[field]) {
        changes.push(`${field} (上書き)`);
        overwrittenFields++;
      } else if (!hadValue) {
        changes.push(field);
      }
      q[field] = ext[field];
    }
  }

  if (changes.length > 0) {
    details.push(`  ${q.id}: ${changes.join(", ")}`);
    mergedCount++;
  }
}

// Output results
console.log(`\n=== merge-extracted.js ===${dryRun ? " (DRY RUN)" : ""}`);
console.log(`試験: ${examId}`);
console.log(`セクション: ${sectionId}`);
console.log(`抽出データ: ${extracted.length} 問`);
console.log(`対象セクション: ${section.questions.length} 問\n`);
console.log(`マージ: ${mergedCount} 問`);
if (skippedCount > 0) console.log(`スキップ: ${skippedCount} 問`);
if (overwrittenFields > 0) console.log(`上書き: ${overwrittenFields} フィールド`);
console.log("");

if (details.length > 0) {
  console.log("詳細:");
  for (const d of details) {
    console.log(d);
  }
  console.log("");
}

if (dryRun) {
  console.log("(--dry-run のため書き込みはスキップしました)");
} else {
  writeFileSync(dataPath, JSON.stringify(examData, null, 2) + "\n", "utf8");
  console.log(`書き込み完了: ${dataPath}`);
}
