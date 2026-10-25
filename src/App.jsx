import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BoothProvider } from './context/BoothContext';
import BoothHome from './pages/BoothHome';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';

// Code-split heavy routes: first paint only loads the home page.
const LiveCapture = lazy(() => import('./pages/LiveCapture'));
const EditorPhotostrip = lazy(() => import('./pages/EditorPhotostrip'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PublicAlbum = lazy(() => import('./pages/PublicAlbum'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#12100D] text-white/60">
    Memuat…
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BoothProvider>
        <AuthModal />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<BoothHome />} />
            <Route path="/setup" element={<BoothHome />} />
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
            <Route path="/album" element={<PublicAlbum />} />
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
        </Suspense>
      </BoothProvider>
    </ErrorBoundary>
  );
}

export default App;
