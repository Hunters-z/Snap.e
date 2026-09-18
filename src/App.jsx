import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import EditorPhotostrip from './pages/EditorPhotostrip';
import LiveCapture from './pages/LiveCapture';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/editor" replace />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/editor" element={<EditorPhotostrip />} />
      <Route path="/capture" element={<LiveCapture />} />
    </Routes>
  );
}

export default App;
