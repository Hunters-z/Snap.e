import { useLocation, useNavigate } from 'react-router-dom';
import { useBooth } from '../context/BoothContext';
import { ShieldAlert, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import LoginScreen from './LoginScreen';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    currentUser, 
    authLoading, 
    isAdmin, 
    openAuthModal
  } = useBooth();

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] text-gray-700">
        <Loader2 size={36} className="animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Memeriksa status autentikasi...</p>
      </div>
    );
  }

  // 2. Unauthenticated: Render dedicated Login Screen directly
  if (!currentUser) {
    return <LoginScreen redirectPath={location.pathname + location.search} />;
  }

  // 3. User is logged in, but route requires Admin privileges
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 text-gray-900">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-gray-200 text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-xs">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Akses Ditolak
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Akun Anda (<strong className="text-gray-900">{currentUser.email || currentUser.displayName}</strong>) bukan merupakan akun Administrator Studio snap.e.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => openAuthModal('/admin')}
              className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <ShieldCheck size={16} className="text-amber-400" />
              <span>Ganti Akun & Masuk sebagai Admin</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Photobooth</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated & authorized
  return children;
}
