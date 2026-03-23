import { HashRouter, Routes, Route } from 'react-router-dom';
import ExamListPage from './pages/ExamListPage';
import SectionsPage from './pages/SectionsPage';
import PracticePage from './pages/PracticePage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ExamListPage />} />
        <Route path="/:examId" element={<SectionsPage />} />
        <Route path="/:examId/:sectionId" element={<PracticePage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
