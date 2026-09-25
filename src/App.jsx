import { Routes, Route, Navigate } from 'react-router-dom';
import { BoothProvider } from './context/BoothContext';
import BoothHome from './pages/BoothHome';
import LiveCapture from './pages/LiveCapture';
import EditorPhotostrip from './pages/EditorPhotostrip';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BoothProvider>
      <Routes>
        <Route path="/" element={<BoothHome />} />
        <Route path="/setup" element={<BoothHome />} />
        <Route path="/capture" element={<LiveCapture />} />
        <Route path="/editor" element={<EditorPhotostrip />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BoothProvider>
  );
}

export default App;
