import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Printer, 
  ExternalLink, 
  Printer as PrinterIcon, 
  CheckCircle, 
  Trash2, 
  X, 
  Palette, 
  Sliders, 
  DollarSign, 
  ShieldCheck, 
  Loader2, 
  BookOpen, 
  Plus, 
  Globe, 
  Smile, 
  Upload, 
  MessageCircle, 
  Instagram, 
  MapPin, 
  Clock, 
  Check,
  LogOut,
  Menu
} from 'lucide-react';
import { useBooth } from '../context/BoothContext';
import AddFrameModal from '../components/AddFrameModal';
import FrameGuideModal from '../components/FrameGuideModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { 
    appConfig, 
    updateAppConfig, 
    orders, 
    updateOrderStatus, 
    deleteOrder, 
    deleteCustomFrame,
    addCustomSticker,
    deleteCustomSticker,
    updateWebsiteConfig,
    isAdminAuth, 
    adminLogin, 
    adminLogout,
    currentUser,
    loginWithGoogle,
    loginWithDemo
  } = useBooth();

  // Admin Login Form State
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'orders' | 'config' | 'website' | 'stickers' | 'hardware'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals for Custom Frames & Guide
  const [showAddFrameModal, setShowAddFrameModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Config editing states
  const [configPrice, setConfigPrice] = useState(appConfig.payment?.price || 15000);
  const [configQrisUrl, setConfigQrisUrl] = useState(appConfig.payment?.qrisUrl || '');
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Website Editor states
  const [webBrandName, setWebBrandName] = useState(appConfig.website?.brandName || 'snap.e');
  const [webHeroTagline, setWebHeroTagline] = useState(appConfig.website?.heroTagline || 'Momen Berharga, Synchronized Distances');
  const [webHeroDesc, setWebHeroDesc] = useState(appConfig.website?.heroDescription || 'Foto bersama pasangan atau sahabat dari jarak jauh secara real-time, atau nikmati sesi solo dengan photostrip estetik gaya Korea.');
  const [webAnnouncement, setWebAnnouncement] = useState(appConfig.website?.announcement || '✨ Selamat datang di Studio snap.e! Cetak strip foto kualitas lab.');
  const [webShowAnnouncement, setWebShowAnnouncement] = useState(appConfig.website?.showAnnouncement ?? true);
  const [webWhatsapp, setWebWhatsapp] = useState(appConfig.website?.whatsappNumber || '0812-3456-7890');
  const [webInstagram, setWebInstagram] = useState(appConfig.website?.instagramHandle || '@snape.photobooth');
  const [webAddress, setWebAddress] = useState(appConfig.website?.studioAddress || 'Jl. Senopati No. 88, Jakarta Selatan');
  const [webOpeningHours, setWebOpeningHours] = useState(appConfig.website?.openingHours || '10:00 - 22:00 WIB');
  const [webIsOpen, setWebIsOpen] = useState(appConfig.website?.isOpen ?? true);
  const [webAccentColor, setWebAccentColor] = useState(appConfig.website?.accentColor || '#E11D48');

  // Synchronize local website state when appConfig changes
  useEffect(() => {
    if (appConfig.website) {
      setWebBrandName(appConfig.website.brandName || 'snap.e');
      setWebHeroTagline(appConfig.website.heroTagline || '');
      setWebHeroDesc(appConfig.website.heroDescription || '');
      setWebAnnouncement(appConfig.website.announcement || '');
      setWebShowAnnouncement(appConfig.website.showAnnouncement ?? true);
      setWebWhatsapp(appConfig.website.whatsappNumber || '');
      setWebInstagram(appConfig.website.instagramHandle || '');
      setWebAddress(appConfig.website.studioAddress || '');
      setWebOpeningHours(appConfig.website.openingHours || '10:00 - 22:00 WIB');
      setWebIsOpen(appConfig.website.isOpen ?? true);
      setWebAccentColor(appConfig.website.accentColor || '#E11D48');
    }
  }, [appConfig.website]);

  // Sticker Editor states
  const [stickerType, setStickerType] = useState('emoji'); // 'emoji' | 'image'
  const [stickerText, setStickerText] = useState('💖');
  const [stickerImageUrl, setStickerImageUrl] = useState('');
  const [stickerName, setStickerName] = useState('');
  const [stickerCategory, setStickerCategory] = useState('Aesthetic');
  const [stickerFilterCategory, setStickerFilterCategory] = useState('all');

  // Handle Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const success = adminLogin(adminPassword);
    if (!success) {
      setLoginError('Kata sandi salah. Gunakan kata sandi default: admin123');
    } else {
      setLoginError('');
    }
  };

  const handleGoogleAdminLogin = async () => {
    setGoogleLoading(true);
    setLoginError('');
    try {
      const result = await loginWithGoogle();
      if (!result.isAdmin) {
        setLoginError(`Akun Google (${result.user.email}) bukan email admin yang terdaftar (0601randikurnia.s@gmail.com).`);
      }
    } catch (err) {
      console.error(err);
      setLoginError('Gagal login via Google. Silakan coba tombol Masuk Cepat Admin atau masukkan kata sandi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickAdminLogin = () => {
    loginWithDemo('admin');
    setLoginError('');
  };

  // Handle Save Pricing
  const handleSaveConfig = (e) => {
    e.preventDefault();
    const updated = {
      ...appConfig,
      payment: {
        ...appConfig.payment,
        price: parseInt(configPrice, 10) || 15000,
        qrisUrl: configQrisUrl
      }
    };

    updateAppConfig(updated);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
  };

  // Handle Save Website Editor
  const handleSaveWebsiteEditor = (e) => {
    e.preventDefault();
    updateWebsiteConfig({
      brandName: webBrandName.trim() || 'snap.e',
      heroTagline: webHeroTagline.trim(),
      heroDescription: webHeroDesc.trim(),
      announcement: webAnnouncement.trim(),
      showAnnouncement: webShowAnnouncement,
      whatsappNumber: webWhatsapp.trim(),
      instagramHandle: webInstagram.trim(),
      studioAddress: webAddress.trim(),
      openingHours: webOpeningHours.trim(),
      isOpen: webIsOpen,
      accentColor: webAccentColor
    });

    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
  };

  // Handle Add Custom Sticker
  const handleAddStickerSubmit = (e) => {
    e.preventDefault();
    if (stickerType === 'emoji' && !stickerText.trim()) return;
    if (stickerType === 'image' && !stickerImageUrl.trim()) return;

    addCustomSticker({
      type: stickerType,
      text: stickerText.trim() || '✨',
      imageUrl: stickerType === 'image' ? stickerImageUrl : null,
      name: stickerName.trim() || (stickerType === 'emoji' ? `Emoji ${stickerText}` : 'Stiker Gambar'),
      category: stickerCategory
    });

    setStickerName('');
    if (stickerType === 'image') setStickerImageUrl('');
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
  };

  // Upload sticker image file as base64
  const handleStickerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setStickerImageUrl(event.target.result);
      if (!stickerName) {
        setStickerName(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // IF NOT AUTHENTICATED: Show Dedicated Admin Login Screen
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#18181B] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/30">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Studio Admin Console</h1>
            <p className="text-xs text-gray-400">
              Akses khusus pemilik studio foto snap.e atelier
            </p>
          </div>

          {/* Admin Email Callout */}
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 text-xs text-amber-200">
            <span className="font-bold text-amber-400">Akun Terdaftar:</span> Masuk dengan akun Google <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300 font-bold">0601randikurnia.s@gmail.com</code> atau gunakan tombol akses cepat di bawah.
          </div>

          {loginError && (
            <div className="text-xs text-red-400 bg-red-950/50 p-3 rounded-xl border border-red-800/60 leading-relaxed">
              {loginError}
            </div>
          )}

          {/* Google Login for Admin */}
          <button
            onClick={handleGoogleAdminLogin}
            disabled={googleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-md disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin text-gray-900" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Masuk dengan Akun Google Admin</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">Atau Masuk Cepat Demo</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Quick Demo Admin Login */}
          <button
            onClick={handleQuickAdminLogin}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-600/20"
          >
            <ShieldCheck size={16} />
            <span>Masuk Cepat Admin (Demo Mode)</span>
          </button>

          {/* Password fallback form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-2 border-t border-white/10">
            <label className="text-[11px] font-semibold text-gray-400 block">
              Atau Gunakan Kata Sandi Khusus:
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Ketik admin123"
              className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs outline-none focus:border-amber-500 text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-colors"
            >
              Masuk dengan Password
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-gray-400 hover:text-white"
            >
              &larr; Kembali ke Beranda Photobooth
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden text-gray-900 font-sans">
      
      {/* Toast Notification */}
      {configSavedToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl animate-fadeIn flex items-center gap-2">
          <CheckCircle size={16} />
          Pengaturan Studio Berhasil Disimpan!
        </div>
      )}

      {/* SIDEBAR (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
              s
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900">snap.e</h2>
              <p className="text-[9px] text-gray-400 font-bold tracking-widest">STUDIO OWNER CONSOLE</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('console'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'console'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard size={16} />
            Studio Console
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Printer size={16} />
              Pesanan Cetak Lab
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-100 text-red-700 font-bold">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('config'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'config'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sliders size={16} />
            Tarif, Frame & Preset
          </button>

          {/* NEW: Website Editor Tab */}
          <button
            onClick={() => { setActiveTab('website'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'website'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Globe size={16} />
            Website Editor
          </button>

          {/* NEW: Sticker Management Tab */}
          <button
            onClick={() => { setActiveTab('stickers'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stickers'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Smile size={16} />
              Kelola Stiker Studio
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-700 font-bold">
              {appConfig.customStickers?.length || 15}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('hardware'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hardware'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PrinterIcon size={16} />
            Hardware Mesin Cetak
          </button>
        </nav>

        {/* Studio Info & Logout */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="text-[11px] text-gray-600 bg-gray-50 border border-gray-200/60 p-2.5 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-900">
              <ShieldCheck size={13} className="text-amber-500" />
              <span>Admin Terotorisasi</span>
            </div>
            <p className="font-mono text-[10px] text-gray-600 truncate">
              {currentUser?.email || '0601randikurnia.s@gmail.com'}
            </p>
          </div>

          <button
            onClick={() => { adminLogout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={14} />
            Keluar dari Admin
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
              Control Center &bull;
            </span>
            <span className="text-xs font-semibold text-gray-700 capitalize">
              {activeTab === 'console' && 'Studio Overview'}
              {activeTab === 'orders' && 'Antrean Cetak Lab'}
              {activeTab === 'config' && 'Tarif, Frame & Preset'}
              {activeTab === 'website' && 'Website Editor'}
              {activeTab === 'stickers' && 'Kelola Stiker Mandiri'}
              {activeTab === 'hardware' && 'Mesin Cetak Lab'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Buka Tampilan Publik</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            
            {/* TAB 1: CONSOLE OVERVIEW (No automated notifications) */}
            {activeTab === 'console' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Studio Console & Operasional
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Ringkasan performa studio foto, antrean cetak fisik, dan katalog aktif.
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Antrean Cetak</p>
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Printer size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{orders.length}</h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      {orders.filter(o => o.status === 'pending').length} pesanan baru menunggu proses
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Katalog Stiker</p>
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Smile size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{appConfig.customStickers?.length || 15} Stiker</h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 text-purple-700 font-semibold">
                      Tersedia untuk photostrip
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarif Booth Aktif</p>
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      Rp {appConfig.payment.price.toLocaleString('id-ID')}
                    </h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      Pembayaran QRIS Statis / Dinamis
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Koleksi Frame</p>
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Palette size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      {appConfig.customFrames?.length || 7} Desain
                    </h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      Dikelola eksklusif oleh Admin
                    </p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900">Aksi Cepat Pengelolaan Studio</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab('website')}
                      className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors flex items-start gap-3"
                    >
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Editor Konten Website</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Ubah banner promo, kontak WA, tagline, dan status jam buka.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('stickers')}
                      className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors flex items-start gap-3"
                    >
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                        <Smile size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Tambah Stiker Mandiri</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Unggah gambar stiker PNG transparan atau tambah stiker emoji.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('config'); setShowAddFrameModal(true); }}
                      className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors flex items-start gap-3"
                    >
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                        <Plus size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Upload Frame Baru</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Tambah bingkai bergambar dengan rasio 600x1800 px.</p>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: PRINT ORDERS QUEUE */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Pesanan Cetak Fisik Lab Studio
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Kelola antrean cetak mesin foto, packaging, dan status pengiriman ke pelanggan.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-4">ID Pesanan</th>
                          <th className="p-4">Pelanggan</th>
                          <th className="p-4">Paket & Nilai</th>
                          <th className="p-4">Alamat Pengiriman</th>
                          <th className="p-4">Status Cetak</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-400">
                              Belum ada pesanan cetak fisik.
                            </td>
                          </tr>
                        ) : (
                          orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-gray-900">
                                {ord.id}
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-gray-900">{ord.customerName}</p>
                                <p className="text-gray-500 text-[11px]">{ord.phone}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold text-gray-800">{ord.paperType}</p>
                                <p className="font-mono text-gray-500">Rp {ord.totalPrice?.toLocaleString('id-ID')}</p>
                              </td>
                              <td className="p-4 max-w-xs text-gray-600 truncate">
                                {ord.address}
                              </td>
                              <td className="p-4">
                                <select
                                  value={ord.status}
                                  onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-bold border outline-none ${
                                    ord.status === 'printing'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : ord.status === 'ready'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : ord.status === 'shipped'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  <option value="pending">Belum Dicetak</option>
                                  <option value="printing">Sedang Dicetak Lab</option>
                                  <option value="ready">Siap Kirim / Selesai Cetak</option>
                                  <option value="shipped">Telah Dikirim Kurir</option>
                                </select>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => deleteOrder(ord.id)}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                  title="Hapus Pesanan"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONFIGURATION (PRICE, QRIS, FRAMES) */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                      Pengaturan Tarif, QRIS & Kustomisasi Frame
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Kelola tarif photobooth, tambah bingkai bergambar kustom, dan panduan spesifikasi frame.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen size={14} className="text-amber-700" />
                      <span>Buka Panduan Frame</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddFrameModal(true)}
                      className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus size={14} />
                      <span>+ Upload Frame Baru</span>
                    </button>
                  </div>
                </div>

                {/* Form Tarif & QRIS */}
                <form onSubmit={handleSaveConfig} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                    Tarif Sesi Bilik Foto & QRIS
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Harga Per Sesi (Rupiah)</label>
                      <input
                        type="number"
                        value={configPrice}
                        onChange={(e) => setConfigPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-gray-900"
                        placeholder="15000"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">URL Gambar QRIS Statis</label>
                      <input
                        type="text"
                        value={configQrisUrl}
                        onChange={(e) => setConfigQrisUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Simpan Perubahan Tarif & QRIS
                    </button>
                  </div>
                </form>

                {/* Frame Management Grid (Admin Only) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Daftar Bingkai Terpasang ({appConfig.customFrames?.length || 0})</h3>
                      <p className="text-xs text-gray-500">Bingkai ini akan tampil pada pemilih frame di editor pengguna.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddFrameModal(true)}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Upload Frame Baru</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {(appConfig.customFrames || []).map((frame) => {
                      const isCustom = frame.id.startsWith('frame_') || frame.isCustom;

                      return (
                        <div
                          key={frame.id}
                          className="p-3 bg-gray-50/70 border border-gray-200 rounded-xl flex items-center justify-between gap-3 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Swatch / Thumbnail */}
                            <div
                              className="w-10 h-10 rounded-lg border border-black/10 shrink-0 shadow-xs flex items-center justify-center text-xs font-bold overflow-hidden"
                              style={{
                                backgroundColor: frame.bg,
                                color: frame.text,
                                backgroundImage: frame.imageUrl ? `url(${frame.imageUrl})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              {!frame.imageUrl && (
                                frame.overlayType === 'sakura' ? '🌸' :
                                frame.overlayType === 'film' ? '🎞️' :
                                frame.overlayType === 'y2k' ? '✦' :
                                frame.overlayType === 'cat_cafe' ? '🐱' :
                                frame.overlayType === 'botanical' ? '🌿' :
                                frame.overlayType === 'party' ? '🎈' :
                                frame.overlayType === 'coquette' ? '🎀' :
                                frame.overlayType === 'doodle' ? '☕' :
                                frame.overlayType === 'newspaper' ? '📰' : ''
                              )}
                            </div>

                            <div className="truncate">
                              <p className="text-xs font-bold text-gray-900 truncate">{frame.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-white rounded border border-gray-200 text-gray-600 uppercase">
                                  {frame.badge || (frame.imageUrl ? 'KUSTOM' : frame.category)}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {isCustom ? 'Kustom Studio' : 'Default'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delete button for custom frames */}
                          {isCustom ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus frame kustom "${frame.name}" dari sistem?`)) {
                                  deleteCustomFrame(frame.id);
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                              title="Hapus Frame Kustom"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-semibold px-2 py-1 bg-gray-100 rounded-md shrink-0">
                              Sistem
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: WEBSITE EDITOR */}
            {activeTab === 'website' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <Globe size={24} className="text-red-600" />
                    Website Content & Branding Editor
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Sesuaikan tampilan halaman publik, teks promosi, informasi kontak WhatsApp, dan identitas studio.
                  </p>
                </div>

                <form onSubmit={handleSaveWebsiteEditor} className="space-y-6">
                  
                  {/* Section 1: Hero & Identitas Brand */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      1. Identitas Brand & Teks Hero
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nama Studio / Brand</label>
                        <input
                          type="text"
                          value={webBrandName}
                          onChange={(e) => setWebBrandName(e.target.value)}
                          placeholder="snap.e"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-gray-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Warna Aksen Studio</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={webAccentColor}
                            onChange={(e) => setWebAccentColor(e.target.value)}
                            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={webAccentColor}
                            onChange={(e) => setWebAccentColor(e.target.value)}
                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Tagline Judul Utama</label>
                      <input
                        type="text"
                        value={webHeroTagline}
                        onChange={(e) => setWebHeroTagline(e.target.value)}
                        placeholder="Momen Berharga, Synchronized Distances"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-gray-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Deskripsi Subtitle</label>
                      <textarea
                        rows={2}
                        value={webHeroDesc}
                        onChange={(e) => setWebHeroDesc(e.target.value)}
                        placeholder="Deskripsi singkat yang tampil di bawah judul..."
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900 resize-none"
                      />
                    </div>
                  </div>

                  {/* Section 2: Banner Pengumuman Promo */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        2. Banner Promo & Pengumuman Berjalan
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                        <input
                          type="checkbox"
                          checked={webShowAnnouncement}
                          onChange={(e) => setWebShowAnnouncement(e.target.checked)}
                          className="rounded text-red-600 focus:ring-red-600"
                        />
                        Aktifkan Banner di Halaman Depan
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Teks Pengumuman Promo</label>
                      <input
                        type="text"
                        value={webAnnouncement}
                        onChange={(e) => setWebAnnouncement(e.target.value)}
                        placeholder="✨ PROMO: Cetak 2 Strip Gratis Frame Scandinavian!"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-gray-900"
                      />
                    </div>

                    {/* Live Preview of Banner */}
                    {webShowAnnouncement && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                        <span className="font-bold bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded">PREVIEW BANNER</span>
                        <span className="truncate">{webAnnouncement || 'Teks pengumuman akan tampil di sini'}</span>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Informasi Studio, WhatsApp & Jam Buka */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      3. Kontak Customer Service & Jam Operasional
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <MessageCircle size={14} className="text-emerald-600" />
                          Nomor WhatsApp Admin / CS
                        </label>
                        <input
                          type="text"
                          value={webWhatsapp}
                          onChange={(e) => setWebWhatsapp(e.target.value)}
                          placeholder="0812-3456-7890"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <Instagram size={14} className="text-pink-600" />
                          Akun Instagram
                        </label>
                        <input
                          type="text"
                          value={webInstagram}
                          onChange={(e) => setWebInstagram(e.target.value)}
                          placeholder="@snape.photobooth"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <Clock size={14} className="text-indigo-600" />
                          Jam Operasional Studio
                        </label>
                        <input
                          type="text"
                          value={webOpeningHours}
                          onChange={(e) => setWebOpeningHours(e.target.value)}
                          placeholder="10:00 - 22:00 WIB"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Status Operasional Studio</label>
                        <select
                          value={webIsOpen ? 'open' : 'closed'}
                          onChange={(e) => setWebIsOpen(e.target.value === 'open')}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-gray-900"
                        >
                          <option value="open">🟢 Buka / Menerima Pengunjung</option>
                          <option value="closed">🔴 Tutup Sementara / Maintenance</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <MapPin size={14} className="text-red-500" />
                        Alamat Fisik Studio
                      </label>
                      <input
                        type="text"
                        value={webAddress}
                        onChange={(e) => setWebAddress(e.target.value)}
                        placeholder="Jl. Senopati No. 88, Jakarta Selatan"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-colors flex items-center gap-2"
                    >
                      <Check size={16} />
                      Simpan Konten Website ke Cloud
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 5: KELOLA STIKER MANDIRI */}
            {activeTab === 'stickers' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <Smile size={24} className="text-purple-600" />
                    Kelola Stiker Mandiri Studio
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Tambah stiker emoji atau upload gambar stiker PNG transparan kustom untuk digunakan pelanggan di editor photostrip.
                  </p>
                </div>

                {/* Form Tambah Stiker Baru */}
                <form onSubmit={handleAddStickerSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                    <Plus size={16} className="text-purple-600" />
                    Tambah Stiker Baru
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Tipe Stiker */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Tipe Stiker</label>
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setStickerType('emoji')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            stickerType === 'emoji' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          Emoji / Icon
                        </button>
                        <button
                          type="button"
                          onClick={() => setStickerType('image')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            stickerType === 'image' ? 'bg-white shadow-xs text-purple-600' : 'text-gray-500'
                          }`}
                        >
                          Gambar PNG
                        </button>
                      </div>
                    </div>

                    {/* Nama Stiker */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Nama Stiker</label>
                      <input
                        type="text"
                        value={stickerName}
                        onChange={(e) => setStickerName(e.target.value)}
                        placeholder="Contoh: Pita Pink Coquette"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900"
                        required
                      />
                    </div>

                    {/* Kategori */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Kategori</label>
                      <select
                        value={stickerCategory}
                        onChange={(e) => setStickerCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-gray-900"
                      >
                        <option value="Aesthetic">Aesthetic</option>
                        <option value="Love">Love & Romance</option>
                        <option value="Cute">Cute & Kawaii</option>
                        <option value="Party">Party & Birthday</option>
                        <option value="Studio">Studio & Retro</option>
                        <option value="Nature">Nature & Floral</option>
                      </select>
                    </div>

                  </div>

                  {/* Input Detail Berdasarkan Tipe */}
                  {stickerType === 'emoji' ? (
                    <div className="space-y-1 max-w-md">
                      <label className="text-xs font-semibold text-gray-700">Karakter Emoji</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={stickerText}
                          onChange={(e) => setStickerText(e.target.value)}
                          placeholder="💖"
                          className="w-20 text-center text-2xl px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                          maxLength={3}
                          required
                        />
                        <div className="flex items-center gap-1.5 overflow-x-auto text-lg bg-gray-50 p-2 rounded-xl border border-gray-200 flex-1">
                          {['✨', '💖', '🎀', '⭐', '🍒', '🌸', '📸', '🧸', '🕶️', '👑', '🐱', '☕'].map((em, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setStickerText(em)}
                              className="hover:scale-125 transition-transform"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700">Upload Gambar Stiker (PNG Transparan Disarankan)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-gray-300 shrink-0">
                          <Upload size={15} />
                          <span>Pilih File Gambar</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleStickerFileUpload}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={stickerImageUrl}
                          onChange={(e) => setStickerImageUrl(e.target.value)}
                          placeholder="Atau tempel URL gambar stiker..."
                          className="flex-1 w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900"
                        />
                      </div>

                      {stickerImageUrl && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] text-gray-500 font-semibold">Preview:</span>
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 p-1 flex items-center justify-center">
                            <img src={stickerImageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Simpan & Pasang Stiker ke Studio</span>
                    </button>
                  </div>
                </form>

                {/* Galeri Stiker Aktif */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Galeri Stiker Terpasang ({appConfig.customStickers?.length || 0})
                      </h3>
                      <p className="text-xs text-gray-500">Stiker yang aktif dapat langsung ditempel oleh pengunjung pada frame foto.</p>
                    </div>

                    {/* Filter Category Chips */}
                    <div className="flex gap-1 overflow-x-auto text-[11px]">
                      {['all', 'Aesthetic', 'Love', 'Cute', 'Party', 'Studio'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setStickerFilterCategory(cat)}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                            stickerFilterCategory === cat
                              ? 'bg-gray-900 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {cat === 'all' ? 'Semua' : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {(appConfig.customStickers || []).filter(s => stickerFilterCategory === 'all' || s.category === stickerFilterCategory).map((stk) => (
                      <div
                        key={stk.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-between text-center group hover:border-gray-300 transition-all relative"
                      >
                        {/* Display Sticker Icon / Image */}
                        <div className="w-14 h-14 flex items-center justify-center my-1">
                          {stk.type === 'image' && stk.imageUrl ? (
                            <img src={stk.imageUrl} alt={stk.name} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-3xl select-none">{stk.text || '✨'}</span>
                          )}
                        </div>

                        <div className="w-full truncate mt-1">
                          <p className="text-[11px] font-bold text-gray-900 truncate">{stk.name || stk.text}</p>
                          <span className="text-[9px] text-gray-400 font-mono uppercase">{stk.category || 'General'}</span>
                        </div>

                        {/* Delete Sticker */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus stiker "${stk.name || stk.text}"?`)) {
                              deleteCustomSticker(stk.id);
                            }
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus Stiker"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 6: HARDWARE LAB */}
            {activeTab === 'hardware' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Mesin Cetak Lab & Telemetri Hardware
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    DNP RX1-HS Dye-Sublimation Photo Lab Printer status & kalibrasi pemotong.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <PrinterIcon size={24} className="text-emerald-600" />
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">DNP Fotolusio RX1-HS</h3>
                        <p className="text-xs text-gray-500">USB Connected • Firmware v2.10</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      ONLINE & READY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Sisa Kertas Cetak</p>
                      <p className="text-2xl font-extrabold text-gray-900 mt-1">482 / 700</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Lembar Roll 4R</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Kaset Ribbon Tinta</p>
                      <p className="text-2xl font-extrabold text-gray-900 mt-1">74%</p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Kondisi Prima</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Suhu Print Head</p>
                      <p className="text-2xl font-extrabold text-gray-900 mt-1">33.5°C</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Normal (Batas Max 55°C)</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => alert("Perintah kalibrasi pisau potong 2x6 telah dikirim ke mesin.")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
                    >
                      Uji Kalibrasi Potong (2x6 Cut)
                    </button>
                    <button
                      onClick={() => alert("Kertas test strip sedang dicetak.")}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Cetak Lembar Uji Warna Lab
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Custom Frame Creation Modal (Exclusively accessible from Admin) */}
      <AddFrameModal
        isOpen={showAddFrameModal}
        onClose={() => setShowAddFrameModal(false)}
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* Frame Design & Specifications Guide Modal */}
      <FrameGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onOpenAddFrame={() => setShowAddFrameModal(true)}
      />

    </div>
  );
}
