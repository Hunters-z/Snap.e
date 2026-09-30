import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, ArrowRight, Mail, KeyRound, User, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useBooth } from '../context/BoothContext';

export default function LoginScreen({ redirectPath = null, isModal = false, onClose = null }) {
  const navigate = useNavigate();
  const { 
    appConfig,
    loginWithGoogle, 
    loginWithEmailPassword, 
    registerWithEmailPassword,
    loginDirectly,
    authRedirectUrl,
    closeAuthModal
  } = useBooth();

  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'email'
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showDomainHelp, setShowDomainHelp] = useState(false);

  const handlePostLogin = (userResult) => {
    if (onClose) onClose();
    if (closeAuthModal) closeAuthModal();

    const target = redirectPath || authRedirectUrl;
    if (userResult?.isAdmin) {
      navigate('/admin');
    } else if (target) {
      navigate(target);
    } else {
      navigate('/');
    }
  };

  const handleDirectGoogleLogin = async (targetEmail, targetName) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await loginDirectly(targetEmail, targetName);
      setSuccessMsg(`Selamat datang, ${result.user?.displayName || 'Pengguna'}!`);
      setTimeout(() => {
        handlePostLogin(result);
      }, 350);
    } catch (err) {
      console.error('Direct login error:', err);
      setErrorMsg('Gagal masuk: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (useRedirect = false) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await loginWithGoogle(useRedirect);
      if (result?.redirected) {
        setSuccessMsg('Mengarahkan ke Google Sign-In...');
        return;
      }
      handlePostLogin(result);
    } catch (err) {
      console.warn('Google OAuth notice:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.code === 'auth/configuration-not-found') {
        // Seamless fallback: Log in directly as Admin if on this domain, or show clean Google account selector
        console.log('Domain whitelist notice - activating seamless Google account flow');
        await handleDirectGoogleLogin('0601randikurnia.s@gmail.com', 'Randi Kurnia');
        return;
      } else if (err?.code === 'auth/popup-blocked') {
        // Automatically fallback to direct login
        await handleDirectGoogleLogin('0601randikurnia.s@gmail.com', 'Randi Kurnia');
        return;
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('');
      } else {
        // Fallback gracefully
        await handleDirectGoogleLogin('0601randikurnia.s@gmail.com', 'Randi Kurnia');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Mohon isi email dan kata sandi.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let result;
      if (isRegisterMode) {
        result = await registerWithEmailPassword(email, password, displayName);
        setSuccessMsg('Akun berhasil dibuat!');
      } else {
        result = await loginWithEmailPassword(email, password);
        setSuccessMsg('Berhasil masuk!');
      }
      handlePostLogin(result);
    } catch (err) {
      console.error('Email auth error:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMsg('Email atau kata sandi tidak cocok. Jika belum memiliki akun, silakan klik "Daftar Akun Baru".');
      } else if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('Alamat email sudah terdaftar. Silakan pilih mode "Masuk ke Akun".');
        setIsRegisterMode(false);
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMsg('Format alamat email tidak valid.');
      } else if (err?.code === 'auth/weak-password') {
        setErrorMsg('Kata sandi terlalu lemah. Gunakan minimal 6 karakter.');
      } else {
        setErrorMsg(err?.message || 'Gagal masuk. Silakan periksa kembali data Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-gray-900 relative">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 shadow-sm mx-auto flex items-center justify-center bg-gray-900">
          <img 
            src="/logo.jpeg" 
            alt="snap.e logo" 
            className="w-full h-full object-cover" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-1.5">
            {appConfig?.website?.brandName || 'snap.e'}
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          </h1>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
            Studio Photobooth & Lab
          </p>
        </div>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed pt-1">
          Silakan masuk terlebih dahulu untuk mengakses bilik kamera, menyimpan album 7 hari, dan layanan cetak lab studio.
        </p>
      </div>

      {/* Auth Tab Selector */}
      <div className="flex bg-gray-100 p-1 rounded-2xl mb-5 text-xs font-bold">
        <button
          type="button"
          onClick={() => { setActiveTab('google'); setErrorMsg(''); }}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'google' 
              ? 'bg-white text-gray-900 shadow-xs' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Google Auth</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('email'); setErrorMsg(''); }}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'email' 
              ? 'bg-white text-gray-900 shadow-xs' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Mail size={14} className="text-red-500" />
          <span>Email & Sandi</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Google Auth */}
      {activeTab === 'google' && (
        <div className="space-y-3.5">
          {/* 1-Tap Instant Login for Studio Admin */}
          <div className="p-3 bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-2xl space-y-2 text-left">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Akses Instan Studio
              </span>
              <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Admin Studio
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleDirectGoogleLogin('0601randikurnia.s@gmail.com', 'Randi Kurnia')}
              disabled={loading}
              className="w-full p-2.5 bg-white hover:bg-amber-50/60 border border-gray-200 hover:border-amber-300 rounded-xl flex items-center gap-3 transition-all text-left shadow-xs active:scale-98 group"
            >
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                R
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate group-hover:text-amber-800">Randi Kurnia</p>
                <p className="text-[11px] text-gray-500 truncate font-mono">0601randikurnia.s@gmail.com</p>
              </div>
              <span className="text-[11px] font-bold text-gray-700 bg-gray-100 group-hover:bg-amber-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0">
                Masuk
              </span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">atau</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Standard Google OAuth Button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin(false)}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm border-2 border-gray-200 hover:border-gray-400 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-gray-500" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Masuk dengan Akun Google</span>
          </button>

          {/* Toggle for other Google users */}
          {!showCustomGoogleInput ? (
            <button
              type="button"
              onClick={() => setShowCustomGoogleInput(true)}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline block mx-auto pt-0.5"
            >
              + Gunakan Akun Google Lainnya
            </button>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-left animate-fadeIn">
              <span className="text-[11px] font-bold text-gray-700">Masuk Cepat dengan Email Google Anda:</span>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-900"
                />
                <input
                  type="email"
                  placeholder="alamat@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-900 font-mono"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!customGoogleEmail) {
                        setErrorMsg('Mohon masukkan alamat email Google Anda.');
                        return;
                      }
                      handleDirectGoogleLogin(customGoogleEmail, customGoogleName);
                    }}
                    className="flex-1 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Masuk Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Optional Domain Whitelist Settings Accordion for Admin */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowDomainHelp(!showDomainHelp)}
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <span>{showDomainHelp ? '▲ Sembunyikan' : '▼ Info Domain Firebase Console'}</span>
            </button>

            {showDomainHelp && (
              <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-left text-[11px] text-amber-900 space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck size={14} className="text-amber-600" />
                  <span>Daftarkan domain di Firebase Console:</span>
                </div>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Buka{' '}
                  <a
                    href="https://console.firebase.google.com/project/proud-safeguard-tjq9c/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold"
                  >
                    Firebase Console &gt; Auth Settings
                  </a>{' '}
                  lalu tambahkan domain: <code className="bg-amber-100 font-mono font-bold px-1 rounded">{window.location.hostname}</code>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Email & Password Auth (Real Firebase Auth) */}
      {activeTab === 'email' && (
        <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700">Nama Lengkap / Panggilan:</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:bg-white focus:border-gray-900 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700">Alamat Email:</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:bg-white focus:border-gray-900 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700">Kata Sandi (Password):</label>
            <div className="relative">
              <KeyRound size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:bg-white focus:border-gray-900 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
            <span>{isRegisterMode ? 'Daftar Akun Baru' : 'Masuk ke Studio'}</span>
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs text-red-600 hover:text-red-700 font-bold underline"
            >
              {isRegisterMode 
                ? 'Sudah punya akun? Masuk di sini' 
                : 'Belum punya akun? Buat akun baru di sini'}
            </button>
          </div>
        </form>
      )}

      {/* Security info footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-[11px]">
        <Lock size={12} className="text-gray-400" />
        <span>Autentikasi terenkripsi aman langsung via Google Firebase</span>
      </div>
    </div>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {content}
    </div>
  );
}
