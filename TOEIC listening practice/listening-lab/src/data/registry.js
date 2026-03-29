// TOEIC試験データレジストリ
// data/toeic/ 配下のJSONデータを集約管理する
// 新しい試験データを追加する場合は examSets 配列に追加する

import toeicKishutu31 from "./toeic/toeic-kishutu3-1.json";
import toeicKishutu32 from "./toeic/toeic-kishutu3-2.json";

const examSets = [toeicKishutu31, toeicKishutu32];

/**
 * 全試験セットを返す
 */
export function getExamSets() {
  return examSets;
}

/**
 * examId で特定の試験セットを返す
 */
export function getExamSet(examId) {
  return examSets.find((s) => s.id === examId) || null;
}

/**
 * examId と sectionId で特定のセクションを返す
 */
export function getSection(examId, sectionId) {
  const examSet = getExamSet(examId);
  if (!examSet || !examSet.sections) return null;
  return examSet.sections.find((s) => s.id === sectionId) || null;
}

/**
 * 試験セット件数を返す
 */
export function getExamCount() {
  return examSets.length;
}

export default examSets;
