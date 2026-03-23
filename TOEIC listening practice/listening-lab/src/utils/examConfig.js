const TOEIC_COLOR = "#e67e22";

const EXAM_CONFIG = {
  id: "toeic",
  label: "TOEIC L&R",
  color: TOEIC_COLOR,
  description: "TOEIC Listening 演習",
  groupBy: "none",
  sortOrder: "asc",
};

export default EXAM_CONFIG;

/**
 * TOEICのカラーコードを返す
 */
export function getAccentColor() {
  return TOEIC_COLOR;
}
