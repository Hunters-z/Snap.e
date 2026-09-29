import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, Sparkles, Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import { useBooth } from '../context/BoothContext';

export default function AuthModal() {
  const navigate = useNavigate();
  const { 
    showAuthModal, 
    closeAuthModal, 
    authRedirectUrl, 
    loginWithGoogle,
    loginDirectly
  } = useBooth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [directEmail, setDirectEmail] = useState('0601randikurnia.s@gmail.com');
  const [directName, setDirectName] = useState('Randi Kurnia');
  const [showDirectForm, setShowDirectForm] = useState(false);

  if (!showAuthModal) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await loginWithGoogle();
      closeAuthModal();

      if (result.isAdmin) {
        navigate('/admin');
      } else if (authRedirectUrl) {
        navigate(authRedirectUrl);
      } else {
        navigate('/setup');
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      setShowDirectForm(true);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('Popup Google diblokir oleh browser. Anda dapat menggunakan opsi login langsung di bawah.');
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Proses login Google dibatalkan. Anda dapat mencoba lagi atau login langsung di bawah.');
      } else {
        setErrorMsg('Tidak dapat membuka popup Google di jendela ini. Silakan gunakan login langsung di bawah.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await loginDirectly(directEmail, directName);
      closeAuthModal();

      if (result.isAdmin) {
        navigate('/admin');
      } else if (authRedirectUrl) {
        navigate(authRedirectUrl);
      } else {
        navigate('/setup');
      }
    } catch (err) {
      console.error('Direct login failed:', err);
      setErrorMsg('Gagal masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
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
            Login untuk mengakses bilik kamera, menyimpan album 7 hari, dan layanan cetak lab studio.
          </p>
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

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-gray-400 text-[11px] font-semibold uppercase">atau</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Direct Email Login Option (Guaranteed to work even if popups are blocked) */}
          {!showDirectForm ? (
            <button
              type="button"
              onClick={() => setShowDirectForm(true)}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-200 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Mail size={14} className="text-gray-500" />
              <span>Masuk Langsung dengan Akun Email / Admin</span>
            </button>
          ) : (
            <form onSubmit={handleDirectSignIn} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 animate-fadeIn text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Mail size={13} className="text-red-600" />
                  Masuk Langsung (Tanpa Popup)
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  Akses Cepat
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-600">Alamat Email:</label>
                <div className="relative">
                  <input
                    type="email"
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-600">Nama Tampilan:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    placeholder="Nama Anda"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>Lanjutkan Masuk</span>
              </button>
            </form>
          )}
        </div>

        {/* Security Info */}
        <div className="mt-5 p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-gray-500 text-[11px]">
          <Lock size={13} className="text-gray-400" />
          <span>Autentikasi terenkripsi aman langsung melalui Firebase</span>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-gray-400 text-center mt-4">
          Dengan masuk, Anda menyetujui ketentuan privasi sesi photobooth snap.e.
        </p>
      </div>
    </div>
  );
}
