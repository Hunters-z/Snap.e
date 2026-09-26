import { Routes, Route, Navigate } from 'react-router-dom';
import { BoothProvider } from './context/BoothContext';
import BoothHome from './pages/BoothHome';
import LiveCapture from './pages/LiveCapture';
import EditorPhotostrip from './pages/EditorPhotostrip';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';

function App() {
  return (
    <BoothProvider>
      <AuthModal />
      <Routes>
        <Route path="/" element={<BoothHome />} />
        <Route 
          path="/setup" 
          element={
            <ProtectedRoute>
              <BoothHome />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/capture" 
          element={
            <ProtectedRoute>
              <LiveCapture />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/editor" 
          element={
            <ProtectedRoute>
              <EditorPhotostrip />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BoothProvider>
  );
}

export default App;
