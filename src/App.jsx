import { Routes, Route, Navigate } from 'react-router-dom';
import { BoothProvider } from './context/BoothContext';
import BoothHome from './pages/BoothHome';
import LiveCapture from './pages/LiveCapture';
import EditorPhotostrip from './pages/EditorPhotostrip';
import AdminDashboard from './pages/AdminDashboard';
import PublicAlbum from './pages/PublicAlbum';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BoothProvider>
        <AuthModal />
        <Routes>
          <Route path="/" element={<BoothHome />} />
          <Route path="/setup" element={<BoothHome />} />
          <Route path="/capture" element={<LiveCapture />} />
          <Route 
            path="/editor" 
            element={
              <ProtectedRoute>
                <EditorPhotostrip />
              </ProtectedRoute>
            } 
          />
          <Route path="/album/:albumId" element={<PublicAlbum />} />
          <Route path="/shared-album/:albumId" element={<PublicAlbum />} />
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
    </ErrorBoundary>
  );
}

export default App;
