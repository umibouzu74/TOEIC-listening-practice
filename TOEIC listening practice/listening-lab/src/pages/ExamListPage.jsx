import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ExamSetCard from '../components/ExamSetCard';
import EXAM_CONFIG from '../utils/examConfig';
import { getExamSets } from '../data/registry';
import styles from './ExamListPage.module.css';

export default function ExamListPage() {
  const navigate = useNavigate();
  const sets = getExamSets();

  return (
    <div className={styles.page}>
      <Header showSubtitle accentColor={EXAM_CONFIG.color} />

      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>{EXAM_CONFIG.label}</h2>
            <p className={styles.pageDescription}>{EXAM_CONFIG.description}</p>
          </div>
        </div>

        {sets.length === 0 ? (
          <div className={styles.empty}>準備中です</div>
        ) : (
          <div className={styles.list}>
            {sets.map((examSet) => (
              <ExamSetCard
                key={examSet.id}
                examSet={examSet}
                accentColor={EXAM_CONFIG.color}
                onClick={() => navigate(`/${examSet.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
