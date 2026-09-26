import { useLocation, useNavigate } from 'react-router-dom';
import { useBooth } from '../context/BoothContext';
import { Lock, ShieldAlert, ArrowLeft, Loader2, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    currentUser, 
    authLoading, 
    isAdmin, 
    openAuthModal, 
    loginWithDemo 
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

  // 2. Unauthenticated: User MUST login to access features
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 text-gray-900">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-gray-200 text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-600 shadow-xs">
            <Lock size={28} className="text-red-500" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
              Autentikasi Diperlukan
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Masuk untuk Mengakses Fitur
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Anda harus masuk terlebih dahulu untuk memulai sesi foto, memilih mode booth, dan menyesuaikan strip kenangan Anda.
            </p>
          </div>

          {/* Admin Note */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Perhatian Admin:</strong> Jika Anda login dengan email admin <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">0601randikurnia.s@gmail.com</code>, sistem akan otomatis mengarahkan Anda ke Dashboard Admin.
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => openAuthModal(location.pathname)}
              className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <Sparkles size={16} className="text-yellow-400" />
              <span>Masuk Sekarang (Google / Akun Saya)</span>
            </button>

            <button
              onClick={() => {
                loginWithDemo('user');
                // stay or refresh
              }}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <UserCheck size={15} className="text-emerald-600" />
              <span>Masuk Cepat sebagai Pengguna Tamu</span>
            </button>

            <button
              onClick={() => {
                loginWithDemo('admin');
                navigate('/admin');
              }}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ShieldCheck size={15} />
              <span>Masuk Cepat sebagai Admin Studio (0601randikurnia.s@gmail.com)</span>
            </button>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={14} />
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
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
