#!/usr/bin/env node
/**
 * validate-data.js
 * マージ後のデータ整合性チェック
 *
 * 使い方:
 *   node scripts/validate-data.js --exam toeic-kishutu3-2              # 全パートをチェック
 *   node scripts/validate-data.js --exam toeic-kishutu3-2 --part 3    # Part 3 のみ
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
const partIndex = args.indexOf("--part");
const examIndex = args.indexOf("--exam");

const partFilter = partIndex !== -1 ? parseInt(args[partIndex + 1], 10) : null;
if (examIndex === -1) {
  console.error("エラー: --exam <examId> を指定してください");
  process.exit(1);
}
const examId = args[examIndex + 1];

const dataPath = resolve(`src/data/toeic/${examId}.json`);

let examData;
try {
  examData = JSON.parse(readFileSync(dataPath, "utf8"));
} catch (e) {
  console.error(`エラー: 試験データの読み込みに失敗: ${dataPath}`);
  console.error(e.message);
  process.exit(1);
}

const errors = [];
const warnings = [];

// TOEIC Part definitions
const partDefs = {
  part1: { qRange: [1, 6], choiceCount: 4, grouped: false },
  part2: { qRange: [7, 31], choiceCount: 3, grouped: false },
  part3: { qRange: [32, 70], choiceCount: 4, grouped: true, groupSize: 3 },
  part4: { qRange: [71, 100], choiceCount: 4, grouped: true, groupSize: 3 },
};

const sections = partFilter
  ? examData.sections.filter((s) => s.id === `part${partFilter}`)
  : examData.sections;

if (sections.length === 0) {
  console.error(`エラー: 対象セクションが見つかりません`);
  process.exit(1);
}

console.log(`\n=== validate-data.js ===`);
console.log(`試験: ${examId}`);
console.log(`チェック対象: ${sections.map((s) => s.id).join(", ")}\n`);

for (const section of sections) {
  const def = partDefs[section.id];
  if (!def) {
    warnings.push(`${section.id}: 未知のセクション（スキップ）`);
    continue;
  }

  const [startQ, endQ] = def.qRange;
  const expectedCount = endQ - startQ + 1;

  console.log(`--- ${section.id} (Q${startQ}-Q${endQ}) ---`);

  // Question count
  if (section.questions.length !== expectedCount) {
    errors.push(`${section.id}: 問題数が不正 (期待: ${expectedCount}, 実際: ${section.questions.length})`);
  }

  let missingAnswer = 0;
  let missingExplanation = 0;
  let missingScript = 0;
  let missingAudio = 0;

  for (let i = 0; i < section.questions.length; i++) {
    const q = section.questions[i];
    const qNum = startQ + i;

    // ID check
    if (q.id !== `q${qNum}`) {
      errors.push(`${section.id}: Q${qNum} の id が不正 (${q.id})`);
    }

    // Number check
    if (q.number !== qNum) {
      errors.push(`${section.id}: Q${qNum} の number が不正 (${q.number})`);
    }

    // Answer check
    if (!q.answer || q.answer === "") {
      missingAnswer++;
      errors.push(`${section.id}: Q${qNum} の answer が未設定`);
    } else {
      const validAnswers = def.choiceCount === 3 ? ["A", "B", "C"] : ["A", "B", "C", "D"];
      if (!validAnswers.includes(q.answer)) {
        errors.push(`${section.id}: Q${qNum} の answer が不正 (${q.answer})`);
      }
    }

    // Explanation check
    if (!q.explanation || q.explanation === "") {
      missingExplanation++;
    }

    // Script check (grouped: first of each group must have script)
    if (def.grouped) {
      if (i % def.groupSize === 0) {
        if (!q.script || q.script === "") {
          missingScript++;
          errors.push(`${section.id}: Q${qNum} (セット先頭) の script が未設定`);
        }
      }
    } else {
      if (!q.script || q.script === "") {
        missingScript++;
      }
    }

    // Audio check
    if (!q.audio || q.audio === "") {
      missingAudio++;
      warnings.push(`${section.id}: Q${qNum} の audio が未設定`);
    }

    // Choice count check
    if (q.choices && q.choices.length !== def.choiceCount) {
      errors.push(`${section.id}: Q${qNum} の選択肢数が不正 (期待: ${def.choiceCount}, 実際: ${q.choices.length})`);
    }
  }

  // Summary for this section
  const total = section.questions.length;
  const withAnswer = total - missingAnswer;
  const withExplanation = total - missingExplanation;
  console.log(`  問題数: ${total}/${expectedCount}`);
  console.log(`  answer: ${withAnswer}/${total}`);
  console.log(`  explanation: ${withExplanation}/${total}`);
  if (missingScript > 0 && !def.grouped) {
    console.log(`  script: ${total - missingScript}/${total}`);
  }
  if (def.grouped) {
    const groupCount = Math.ceil(total / def.groupSize);
    const groupsWithScript = groupCount - missingScript;
    console.log(`  script (セット先頭): ${groupsWithScript}/${groupCount}`);
  }
  console.log("");
}

// Final report
if (warnings.length > 0) {
  console.log(`警告: ${warnings.length} 件`);
  for (const w of warnings) {
    console.log(`  ⚠ ${w}`);
  }
  console.log("");
}

if (errors.length > 0) {
  console.log(`エラー: ${errors.length} 件`);
  for (const e of errors) {
    console.log(`  ✗ ${e}`);
  }
  process.exit(1);
} else {
  console.log("✓ 全チェックOK");
}
