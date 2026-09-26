import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldCheck, UserCheck, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { useBooth } from '../context/BoothContext';

export default function AuthModal() {
  const navigate = useNavigate();
  const { 
    showAuthModal, 
    closeAuthModal, 
    authRedirectUrl, 
    loginWithGoogle, 
    loginWithDemo 
  } = useBooth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!showAuthModal) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await loginWithGoogle();
      closeAuthModal();

      if (result.isAdmin) {
        // As requested: "jika saya login dengan akun admin maka akan langsung dialihkan ke dashboard admin"
        navigate('/admin');
      } else if (authRedirectUrl) {
        navigate(authRedirectUrl);
      } else {
        navigate('/setup');
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('Jendela popup Google diblokir oleh browser. Silakan izinkan popup atau gunakan tombol Masuk Cepat di bawah.');
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Proses login dibatalkan. Anda dapat mencoba lagi.');
      } else {
        setErrorMsg('Gagal terhubung ke Google Login. Silakan coba lagi atau gunakan mode pengujian.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminSignIn = () => {
    setErrorMsg('');
    loginWithDemo('admin');
    closeAuthModal();
    // Direct redirect to admin dashboard as requested
    navigate('/admin');
  };

  const handleQuickGuestSignIn = () => {
    setErrorMsg('');
    loginWithDemo('user');
    closeAuthModal();
    if (authRedirectUrl) {
      navigate(authRedirectUrl);
    } else {
      navigate('/setup');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-scaleUp text-gray-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Brand Icon Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-600 shadow-xs">
            <Sparkles size={28} className="text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Masuk ke snap.e
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Login diperlukan untuk mengakses bilik foto, menyimpan photostrip, dan layanan cetak lab.
          </p>
        </div>

        {/* Admin notice banner */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5 text-left">
          <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Otomatisasi Khusus Admin:</span> Jika Anda login dengan akun admin (<code className="font-mono text-amber-800 font-bold bg-amber-100/70 px-1 py-0.5 rounded">0601randikurnia.s@gmail.com</code>), sistem akan <strong>langsung mengalihkan Anda ke Dashboard Admin Studio</strong>.
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Google Login Button */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm border-2 border-gray-200 hover:border-gray-400 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xs active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Masuk dengan Google (Firebase Auth)</span>
          </button>

          {/* Quick Testing Options Separator */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="shrink-0 mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Opsi Masuk Cepat
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleQuickAdminSignIn}
              type="button"
              className="py-2.5 px-3 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              title="Masuk langsung sebagai admin 0601randikurnia.s@gmail.com dan dialihkan ke dashboard"
            >
              <ShieldCheck size={14} className="text-amber-400" />
              <span>Masuk sebagai Admin</span>
            </button>

            <button
              onClick={handleQuickGuestSignIn}
              type="button"
              className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              title="Masuk sebagai pengguna photobooth"
            >
              <UserCheck size={14} className="text-emerald-600" />
              <span>Masuk sebagai Tamu</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-gray-400 text-center mt-5">
          Dengan masuk, Anda menyetujui ketentuan privasi sesi photobooth snap.e.
        </p>
      </div>
    </div>
  );
}
