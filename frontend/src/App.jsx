import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LecturerPage from './pages/LecturerPage.jsx';
import StudentJoinPage from './pages/StudentJoinPage.jsx';
import StudentRoomPage from './pages/StudentRoomPage.jsx';
import StudentPracticePage from './pages/StudentPracticePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/lecturer" element={<LecturerPage />} />
      <Route path="/student" element={<StudentJoinPage />} />
      <Route path="/student/:code" element={<StudentRoomPage />} />
      <Route path="/student-practice" element={<StudentPracticePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
