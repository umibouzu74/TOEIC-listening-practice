import { useState, useCallback, useMemo, useEffect } from 'react';
import PassageQuestionPlayer from './PassageQuestionPlayer';
import MiniAudioPlayer from './MiniAudioPlayer';
import QuestionCard from './QuestionCard';
import styles from './SequentialPracticeView.module.css';

/**
 * Sequential group practice view — shows one passage group or question at a time.
 * For Part 3/4: displays the full passage group (chained audio + all questions).
 * For Part 1/2: displays a single question with audio.
 * Navigates between groups/questions sequentially.
 */
export default function SequentialPracticeView({
  renderItems,
  answers,
  checkedQuestions,
  onAnswer,
  onCheck,
  onClose,
  accentColor,
  sectionTitle,
  examTitle,
}) {
  const accent = accentColor || 'var(--color-accent)';
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  const item = renderItems[currentGroupIndex];
  const totalGroups = renderItems.length;

  // Questions in the current item
  const currentQuestions = useMemo(() => {
    if (!item) return [];
    if (item.type === 'passageGroup') return item.questions;
    return [item.question];
  }, [item]);

  // Check if all questions in current group are answered/checked
  const allGroupAnswered = currentQuestions.every((q) => answers[q.id]);
  const allGroupChecked = currentQuestions.every((q) => checkedQuestions.has(q.id));
  const groupCorrectCount = currentQuestions.filter(
    (q) => checkedQuestions.has(q.id) && answers[q.id] === q.answer
  ).length;

  // Build questionAudios for chained player (passage groups)
  const questionAudios = useMemo(() => {
    if (!item || item.type !== 'passageGroup') return [];
    return item.questions.map((q) => ({
      src: q.audio,
      label: `Q${q.number}`,
    }));
  }, [item]);

  // Check all answered questions in the current group
  const handleCheckGroup = useCallback(() => {
    currentQuestions.forEach((q) => {
      if (answers[q.id] && !checkedQuestions.has(q.id)) {
        onCheck(q.id);
      }
    });
  }, [currentQuestions, answers, checkedQuestions, onCheck]);

  // Navigate to next group
  const goToNext = useCallback(() => {
    if (currentGroupIndex < totalGroups - 1) {
      setCurrentGroupIndex((i) => i + 1);
    }
  }, [currentGroupIndex, totalGroups]);

  const goToPrev = useCallback(() => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex((i) => i - 1);
    }
  }, [currentGroupIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Scroll to top when group changes
  useEffect(() => {
    const body = document.querySelector(`.${styles.body}`);
    if (body) body.scrollTop = 0;
  }, [currentGroupIndex]);

  if (!item) return null;

  const isPassageGroup = item.type === 'passageGroup';

  // Label for the current group
  const groupLabel = isPassageGroup
    ? `${item.passageLabel} (${item.questions.map((q) => `Q${q.number}`).join(', ')})`
    : `Q${item.question.number}`;

  return (
    <div className={styles.overlay}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="一覧に戻る">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.headerSectionTitle}>{sectionTitle}</span>
          {examTitle && <span className={styles.headerExamTitle}>{examTitle}</span>}
        </div>
        <span className={styles.headerCount}>{currentGroupIndex + 1} / {totalGroups}</span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Group header */}
        <div className={styles.groupHeader}>
          <span className={styles.groupLabel} style={{ borderColor: accent }}>
            {isPassageGroup ? item.passageLabel : `Q${item.question.number}`}
          </span>
          {isPassageGroup && (
            <span className={styles.groupCount}>
              {item.questions.map((q) => `Q${q.number}`).join(' / ')}
            </span>
          )}
        </div>

        {/* Audio player */}
        {isPassageGroup ? (
          <div className={styles.audioSection}>
            <PassageQuestionPlayer
              passageSrc={item.passageAudio}
              questionAudios={questionAudios}
              passageLabel={item.passageLabel}
              accentColor={accent}
            />
          </div>
        ) : (
          item.question.audio && (
            <div className={styles.audioSection}>
              <MiniAudioPlayer
                src={item.question.audio}
                label="Question"
                accentColor={accent}
              />
            </div>
          )
        )}

        {/* Group image */}
        {isPassageGroup && item.questions[0]?.image && (
          <div className={styles.groupImage}>
            <img
              src={item.questions[0].image}
              alt={`${item.passageLabel || '問題'}の図表`}
              className={styles.groupImageImg}
            />
          </div>
        )}

        {/* Individual question image (non-group) */}
        {!isPassageGroup && item.question.image && (
          <div className={styles.groupImage}>
            <img
              src={item.question.image}
              alt={`問題${item.question.number}の図表`}
              className={styles.groupImageImg}
            />
          </div>
        )}

        {/* Question cards */}
        <div className={styles.questionsArea}>
          {currentQuestions.map((q) => {
            const isChecked = checkedQuestions.has(q.id);
            return (
              <QuestionCard
                key={q.id}
                question={q}
                userAnswer={answers[q.id] || null}
                showResult={isChecked}
                onAnswer={(choice) => onAnswer(q.id, choice)}
                onCheck={() => onCheck(q.id)}
                accentColor={accent}
                hideAudio={isPassageGroup}
              />
            );
          })}
        </div>

        {/* Group check button */}
        {!allGroupChecked && allGroupAnswered && (
          <button
            className={styles.checkGroupBtn}
            onClick={handleCheckGroup}
            style={{ '--accent': accent }}
          >
            まとめて答え合わせ（{currentQuestions.length}問）
          </button>
        )}

        {/* Group result summary */}
        {allGroupChecked && (
          <div className={styles.groupResult}>
            <span className={styles.groupResultText}>
              {groupCorrectCount === currentQuestions.length
                ? '全問正解！'
                : `${groupCorrectCount} / ${currentQuestions.length} 正解`
              }
            </span>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className={styles.bottomNav}>
        <button
          className={styles.navBtn}
          onClick={goToPrev}
          disabled={currentGroupIndex === 0}
          aria-label="前のグループ"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 15L7 10L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>前へ</span>
        </button>

        <div className={styles.navProgress}>
          <div className={styles.navProgressTrack}>
            <div
              className={styles.navProgressFill}
              style={{
                width: `${((currentGroupIndex + 1) / totalGroups) * 100}%`,
                background: accent,
              }}
            />
          </div>
        </div>

        <button
          className={styles.navBtn}
          onClick={goToNext}
          disabled={currentGroupIndex === totalGroups - 1}
          aria-label="次のグループ"
          style={
            allGroupChecked && currentGroupIndex < totalGroups - 1
              ? { color: accent, fontWeight: 600 }
              : undefined
          }
        >
          <span>次へ</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 5L13 10L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
