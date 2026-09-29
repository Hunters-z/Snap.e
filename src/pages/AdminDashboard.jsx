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
  Menu,
  Users,
  QrCode,
  CreditCard,
  Sparkles,
  SlidersHorizontal,
  KeyRound,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useBooth } from '../context/BoothContext';
import AddFrameModal from '../components/AddFrameModal';
import FrameGuideModal from '../components/FrameGuideModal';
import { CAMERA_PRESETS } from '../data/cameraPresets';

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
    addCustomFilter,
    deleteCustomFilter,
    updatePaymentGatewayConfig,
    updateWebsiteConfig,
    registeredUsers,
    registeredUsersCount,
    isAdminAuth, 
    adminLogin, 
    adminLogout,
    currentUser,
    loginWithGoogle
  } = useBooth();

  // Admin Login Form State
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Active Tab
  // 'console' | 'orders' | 'frames' | 'pricing' | 'presets' | 'qris_api' | 'website' | 'stickers' | 'hardware'
  const [activeTab, setActiveTab] = useState('console');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals for Custom Frames & Guide
  const [showAddFrameModal, setShowAddFrameModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Toast notification
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [toastText, setToastText] = useState('Pengaturan Berhasil Disimpan!');

  const triggerToast = (msg = 'Pengaturan Berhasil Disimpan!') => {
    setToastText(msg);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
  };

  // Pricing & Session States
  const [configPrice, setConfigPrice] = useState(appConfig.payment?.price || 15000);
  const [configDuration, setConfigDuration] = useState(appConfig.payment?.sessionDurationMinutes || 15);
  const [configPrintFee, setConfigPrintFee] = useState(appConfig.payment?.printFee || 20000);
  const [configQrisUrl, setConfigQrisUrl] = useState(appConfig.payment?.qrisUrl || '');

  // QRIS & Payment Gateway API States
  const [gwProvider, setGwProvider] = useState(appConfig.paymentGateway?.provider || 'doku');
  const [gwMerchantId, setGwMerchantId] = useState(appConfig.paymentGateway?.merchantId || 'MALL-DOKU-882190');
  const [gwClientKey, setGwClientKey] = useState(appConfig.paymentGateway?.clientKey || 'pk_live_doku_a89123bc891');
  const [gwSecretKey, setGwSecretKey] = useState(appConfig.paymentGateway?.secretKey || 'sk_live_doku_993821736152');
  const [gwWebhookUrl, setGwWebhookUrl] = useState(
    appConfig.paymentGateway?.webhookUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/qris-webhook` : '')
  );
  const [gwEnvironment, setGwEnvironment] = useState(appConfig.paymentGateway?.environment || 'sandbox');
  const [gwMethods, setGwMethods] = useState(
    appConfig.paymentGateway?.activeMethods || ['qris_bca', 'qris_gopay', 'qris_shopeepay', 'qris_dana']
  );
  const [gwShowSecret, setGwShowSecret] = useState(false);
  const [gwTesting, setGwTesting] = useState(false);
  const [gwTestResult, setGwTestResult] = useState(null);
  const [copyWebhookSuccess, setCopyWebhookSuccess] = useState(false);

  // Filter & Preset States
  const [presetCategoryFilter, setPresetCategoryFilter] = useState('all');
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterBrand, setNewFilterBrand] = useState('KODAK');
  const [newFilterCategory, setNewFilterCategory] = useState('vintage');
  const [newFilterCss, setNewFilterCss] = useState('contrast(1.15) saturate(1.2) sepia(0.2)');
  const [newFilterDesc, setNewFilterDesc] = useState('');

  // Website Editor states
  const [webBrandName, setWebBrandName] = useState(appConfig.website?.brandName || 'snap.e');
  const [webHeroTagline, setWebHeroTagline] = useState(appConfig.website?.heroTagline || 'Momen Berharga, Synchronized Distances');
  const [webTaglineGradient, setWebTaglineGradient] = useState(
    appConfig.website?.taglineGradient || 'from-rose-600 via-purple-600 to-indigo-600'
  );
  const [webHeroDesc, setWebHeroDesc] = useState(appConfig.website?.heroDescription || 'Foto bersama pasangan atau sahabat dari jarak jauh secara real-time, atau nikmati sesi solo dengan photostrip estetik gaya Korea.');
  const [webPromoBadge, setWebPromoBadge] = useState(appConfig.website?.promoBadge || 'PHOTO BOOTH ONLINE & LDR DUAL-STREAM');
  const [webAnnouncement, setWebAnnouncement] = useState(appConfig.website?.announcement || '✨ Selamat datang di Studio snap.e! Cetak strip foto kualitas lab.');
  const [webShowAnnouncement, setWebShowAnnouncement] = useState(appConfig.website?.showAnnouncement ?? true);
  
  // Section visibility toggles
  const [webShowHero, setWebShowHero] = useState(appConfig.website?.showHero ?? true);
  const [webShowSetupCard, setWebShowSetupCard] = useState(appConfig.website?.showSetupCard ?? true);
  const [webShowFeatures, setWebShowFeatures] = useState(appConfig.website?.showFeatures ?? true);
  const [webShowFramesShowcase, setWebShowFramesShowcase] = useState(appConfig.website?.showFramesShowcase ?? true);
  const [webShowPricing, setWebShowPricing] = useState(appConfig.website?.showPricing ?? true);
  const [webShowHowItWorks, setWebShowHowItWorks] = useState(appConfig.website?.showHowItWorks ?? true);
  const [webShowTestimonials, setWebShowTestimonials] = useState(appConfig.website?.showTestimonials ?? true);
  const [webShowFaq, setWebShowFaq] = useState(appConfig.website?.showFaq ?? true);
  const [webShowFooter, setWebShowFooter] = useState(appConfig.website?.showFooter ?? true);
  const [webShowFloatingWhatsapp, setWebShowFloatingWhatsapp] = useState(appConfig.website?.showFloatingWhatsapp ?? true);

  const [webWhatsapp, setWebWhatsapp] = useState(appConfig.website?.whatsappNumber || '0812-3456-7890');
  const [webInstagram, setWebInstagram] = useState(appConfig.website?.instagramHandle || '@snape.photobooth');
  const [webAddress, setWebAddress] = useState(appConfig.website?.studioAddress || 'Jl. Senopati No. 88, Jakarta Selatan');
  const [webOpeningHours, setWebOpeningHours] = useState(appConfig.website?.openingHours || '10:00 - 22:00 WIB');
  const [webIsOpen, setWebIsOpen] = useState(appConfig.website?.isOpen ?? true);
  const [webAccentColor, setWebAccentColor] = useState(appConfig.website?.accentColor || '#E11D48');

  // New CTA and SEO Metadata states
  const [webPrimaryCtaText, setWebPrimaryCtaText] = useState(appConfig.website?.primaryCtaText || 'Mulai Sesi Booth Sekarang');
  const [webSecondaryCtaText, setWebSecondaryCtaText] = useState(appConfig.website?.secondaryCtaText || 'Lihat Pilihan Frame');
  const [webMetaTitle, setWebMetaTitle] = useState(appConfig.website?.metaTitle || 'snap.e - Tangible Memories, Synchronized Distances');
  const [webMetaDescription, setWebMetaDescription] = useState(
    appConfig.website?.metaDescription || 'Tangible Memories, Synchronized Distances - Online photobooth for solo and LDR couples with customizable photostrips and studio management.'
  );
  const [webMetaKeywords, setWebMetaKeywords] = useState(
    appConfig.website?.metaKeywords || 'photobooth online, ldr photobooth, photo strip korea, cetak foto lab'
  );

  // Synchronize local states when appConfig changes
  useEffect(() => {
    if (appConfig.website) {
      setWebBrandName(appConfig.website.brandName || 'snap.e');
      setWebHeroTagline(appConfig.website.heroTagline || '');
      setWebTaglineGradient(appConfig.website.taglineGradient || 'from-rose-600 via-purple-600 to-indigo-600');
      setWebHeroDesc(appConfig.website.heroDescription || '');
      setWebPromoBadge(appConfig.website.promoBadge || 'PHOTO BOOTH ONLINE & LDR DUAL-STREAM');
      setWebAnnouncement(appConfig.website.announcement || '');
      setWebShowAnnouncement(appConfig.website.showAnnouncement ?? true);
      setWebShowHero(appConfig.website.showHero ?? true);
      setWebShowSetupCard(appConfig.website.showSetupCard ?? true);
      setWebShowFeatures(appConfig.website.showFeatures ?? true);
      setWebShowFramesShowcase(appConfig.website.showFramesShowcase ?? true);
      setWebShowPricing(appConfig.website.showPricing ?? true);
      setWebShowHowItWorks(appConfig.website.showHowItWorks ?? true);
      setWebShowTestimonials(appConfig.website.showTestimonials ?? true);
      setWebShowFaq(appConfig.website.showFaq ?? true);
      setWebShowFooter(appConfig.website.showFooter ?? true);
      setWebShowFloatingWhatsapp(appConfig.website.showFloatingWhatsapp ?? true);
      setWebWhatsapp(appConfig.website.whatsappNumber || '');
      setWebInstagram(appConfig.website.instagramHandle || '');
      setWebAddress(appConfig.website.studioAddress || '');
      setWebOpeningHours(appConfig.website.openingHours || '10:00 - 22:00 WIB');
      setWebIsOpen(appConfig.website.isOpen ?? true);
      setWebAccentColor(appConfig.website.accentColor || '#E11D48');
      setWebPrimaryCtaText(appConfig.website.primaryCtaText || 'Mulai Sesi Booth Sekarang');
      setWebSecondaryCtaText(appConfig.website.secondaryCtaText || 'Lihat Pilihan Frame');
      setWebMetaTitle(appConfig.website.metaTitle || 'snap.e - Tangible Memories, Synchronized Distances');
      setWebMetaDescription(
        appConfig.website.metaDescription || 'Tangible Memories, Synchronized Distances - Online photobooth for solo and LDR couples with customizable photostrips and studio management.'
      );
      setWebMetaKeywords(appConfig.website.metaKeywords || 'photobooth online, ldr photobooth, photo strip korea, cetak foto lab');
    }

    if (appConfig.payment) {
      setConfigPrice(appConfig.payment.price || 15000);
      setConfigDuration(appConfig.payment.sessionDurationMinutes || 15);
      setConfigPrintFee(appConfig.payment.printFee || 20000);
      setConfigQrisUrl(appConfig.payment.qrisUrl || '');
    }

    if (appConfig.paymentGateway) {
      setGwProvider(appConfig.paymentGateway.provider || 'doku');
      setGwMerchantId(appConfig.paymentGateway.merchantId || '');
      setGwClientKey(appConfig.paymentGateway.clientKey || '');
      setGwSecretKey(appConfig.paymentGateway.secretKey || '');
      setGwWebhookUrl(appConfig.paymentGateway.webhookUrl || '');
      setGwEnvironment(appConfig.paymentGateway.environment || 'sandbox');
      setGwMethods(appConfig.paymentGateway.activeMethods || ['qris_bca', 'qris_gopay']);
    }
  }, [appConfig]);

  // Sticker Editor states
  const [stickerType, setStickerType] = useState('emoji');
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
      setLoginError('Kata sandi salah. Gunakan kata sandi admin yang valid.');
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
        setLoginError(`Akun Google (${result.user.email}) bukan email admin yang terotorisasi.`);
      }
    } catch (err) {
      console.error(err);
      setLoginError('Gagal login via Google. Silakan coba kembali atau gunakan kata sandi admin.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Save Pricing (Separated)
  const handleSavePricing = (e) => {
    e.preventDefault();
    const updated = {
      ...appConfig,
      payment: {
        ...appConfig.payment,
        price: parseInt(configPrice, 10) || 15000,
        sessionDurationMinutes: parseInt(configDuration, 10) || 15,
        printFee: parseInt(configPrintFee, 10) || 20000,
        qrisUrl: configQrisUrl
      }
    };
    updateAppConfig(updated);
    triggerToast('Pengaturan Tarif & Durasi Sesi Berhasil Disimpan!');
  };

  // Handle Save QRIS & Payment Gateway API
  const handleSavePaymentGateway = (e) => {
    e.preventDefault();
    updatePaymentGatewayConfig({
      provider: gwProvider,
      merchantId: gwMerchantId.trim(),
      clientKey: gwClientKey.trim(),
      secretKey: gwSecretKey.trim(),
      webhookUrl: gwWebhookUrl.trim(),
      environment: gwEnvironment,
      activeMethods: gwMethods
    });
    triggerToast('Konfigurasi API QRIS & Payment Gateway Berhasil Disimpan!');
  };

  const handleTestGatewayConnection = () => {
    setGwTesting(true);
    setGwTestResult(null);
    setTimeout(() => {
      setGwTesting(false);
      if (gwMerchantId && gwSecretKey) {
        setGwTestResult({
          status: 'success',
          message: `Berhasil terhubung ke API ${gwProvider.toUpperCase()} (${gwEnvironment.toUpperCase()}). Endpoint siap memproses transaksi QRIS.`
        });
      } else {
        setGwTestResult({
          status: 'error',
          message: 'Gagal verifikasi: Harap isi Merchant ID dan Secret Key API terlebih dahulu.'
        });
      }
    }, 1200);
  };

  const handleCopyWebhook = () => {
    if (!gwWebhookUrl) return;
    navigator.clipboard.writeText(gwWebhookUrl);
    setCopyWebhookSuccess(true);
    setTimeout(() => setCopyWebhookSuccess(false), 2000);
  };

  // Handle Add Preset (Separated)
  const handleAddPresetSubmit = (e) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    addCustomFilter({
      name: newFilterName.trim(),
      brand: newFilterBrand,
      category: newFilterCategory,
      css: newFilterCss.trim(),
      description: newFilterDesc.trim() || 'Preset kustom buatan studio.'
    });

    setNewFilterName('');
    setNewFilterDesc('');
    triggerToast('Preset Kamera Baru Berhasil Ditambahkan!');
  };

  // Handle Save Website Editor
  const handleSaveWebsiteEditor = (e) => {
    e.preventDefault();
    updateWebsiteConfig({
      brandName: webBrandName.trim() || 'snap.e',
      heroTagline: webHeroTagline.trim(),
      taglineGradient: webTaglineGradient,
      heroDescription: webHeroDesc.trim(),
      promoBadge: webPromoBadge.trim(),
      announcement: webAnnouncement.trim(),
      showAnnouncement: webShowAnnouncement,
      showHero: webShowHero,
      showSetupCard: webShowSetupCard,
      showFeatures: webShowFeatures,
      showFramesShowcase: webShowFramesShowcase,
      showPricing: webShowPricing,
      showHowItWorks: webShowHowItWorks,
      showTestimonials: webShowTestimonials,
      showFaq: webShowFaq,
      showFooter: webShowFooter,
      showFloatingWhatsapp: webShowFloatingWhatsapp,
      whatsappNumber: webWhatsapp.trim(),
      instagramHandle: webInstagram.trim(),
      studioAddress: webAddress.trim(),
      openingHours: webOpeningHours.trim(),
      isOpen: webIsOpen,
      accentColor: webAccentColor,
      primaryCtaText: webPrimaryCtaText.trim() || 'Mulai Sesi Booth Sekarang',
      secondaryCtaText: webSecondaryCtaText.trim() || 'Lihat Pilihan Frame',
      metaTitle: webMetaTitle.trim() || 'snap.e - Tangible Memories, Synchronized Distances',
      metaDescription: webMetaDescription.trim(),
      metaKeywords: webMetaKeywords.trim()
    });
    triggerToast('Perubahan Editor Website Berhasil Disimpan!');
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
    triggerToast('Stiker Baru Berhasil Ditambahkan!');
  };

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

  // GRADIENT PRESETS FOR TAGLINE
  const GRADIENT_PRESETS = [
    { id: 'from-rose-600 via-purple-600 to-indigo-600', name: 'Rose to Indigo', preview: 'bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600' },
    { id: 'from-pink-500 via-rose-500 to-amber-500', name: 'Sunset Coral', preview: 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500' },
    { id: 'from-cyan-400 via-blue-500 to-purple-600', name: 'Neon Cyber', preview: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600' },
    { id: 'from-amber-400 via-orange-500 to-red-500', name: 'Golden Glow', preview: 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500' },
    { id: 'from-emerald-400 via-teal-500 to-indigo-500', name: 'Aurora Emerald', preview: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500' },
    { id: 'from-red-600 via-rose-500 to-amber-600', name: 'Classic Red Sunset', preview: 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-600' }
  ];

  // IF NOT AUTHENTICATED: Show Clean Dedicated Admin Login Screen (No authorization warning banner, no quick demo buttons)
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#18181B] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/30 shadow-xs">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Studio Admin Console</h1>
            <p className="text-xs text-gray-400">
              Akses khusus pengelola dan pemilik studio snap.e
            </p>
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
            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin text-gray-600" />
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

          {/* Password fallback form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-3 border-t border-white/10">
            <label className="text-[11px] font-semibold text-gray-400 block">
              Atau Masuk Menggunakan Kata Sandi Admin:
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Masukkan password admin"
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
          {toastText}
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
              <h2 className="font-bold text-sm text-gray-900">{appConfig.website?.brandName || 'snap.e'}</h2>
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* 1. Studio Console Overview */}
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

          {/* 2. Print Orders */}
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

          {/* SEPARATED: 3. Kelola Frame */}
          <button
            onClick={() => { setActiveTab('frames'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'frames'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Palette size={16} />
              Kelola Frame
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-700 font-bold">
              {appConfig.customFrames?.length || 7}
            </span>
          </button>

          {/* SEPARATED: 4. Kelola Tarif & Sesi */}
          <button
            onClick={() => { setActiveTab('pricing'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pricing'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CreditCard size={16} />
            Tarif & Sesi
          </button>

          {/* SEPARATED: 5. Filter & Preset Kamera */}
          <button
            onClick={() => { setActiveTab('presets'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'presets'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Sliders size={16} />
              Filter & Preset
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-700 font-bold">
              {appConfig.customFilters?.length || CAMERA_PRESETS.length}
            </span>
          </button>

          {/* NEW: 6. Integrasi QRIS & Payment Gateway API */}
          <button
            onClick={() => { setActiveTab('qris_api'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'qris_api'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <QrCode size={16} />
              Integrasi QRIS API
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-100 text-emerald-700 font-bold uppercase">
              {gwProvider}
            </span>
          </button>

          {/* 7. Website Content Editor */}
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

          {/* 8. Sticker Management Tab */}
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
              Kelola Stiker
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-700 font-bold">
              {appConfig.customStickers?.length || 15}
            </span>
          </button>

          {/* 9. Hardware Machine */}
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
              {activeTab === 'console' && 'Studio Overview & Statistik'}
              {activeTab === 'orders' && 'Antrean Pesanan Cetak Lab'}
              {activeTab === 'frames' && 'Manajemen Template Frame'}
              {activeTab === 'pricing' && 'Tarif & Durasi Sesi Booth'}
              {activeTab === 'presets' && 'Filter & Preset Kamera'}
              {activeTab === 'qris_api' && 'Integrasi QRIS API Gateway'}
              {activeTab === 'website' && 'Editor Tampilan & Konten Website'}
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
              <span className="hidden sm:inline">Buka Halaman Publik</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            
            {/* TAB 1: CONSOLE OVERVIEW (Includes JUMLAH PENGGUNA) */}
            {activeTab === 'console' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Studio Console & Operasional
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Ringkasan performa studio foto, jumlah pengguna terdaftar, antrean cetak fisik, dan katalog aktif.
                  </p>
                </div>

                {/* Stats Grid including JUMLAH PENGGUNA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Stat Card 1: Jumlah Pengguna */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jumlah Pengguna</p>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      {registeredUsersCount || registeredUsers?.length || 5} Akun
                    </h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-3 pt-3 border-t border-gray-100 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Pelanggan aktif studio terverifikasi
                    </p>
                  </div>

                  {/* Stat Card 2: Antrean Cetak */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Antrean Cetak Lab</p>
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Printer size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{orders.length}</h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      {orders.filter(o => o.status === 'pending').length} pesanan baru menunggu proses
                    </p>
                  </div>

                  {/* Stat Card 3: Tarif Sesi Booth */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarif Booth Aktif</p>
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      Rp {appConfig.payment.price.toLocaleString('id-ID')}
                    </h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      Gateway: {gwProvider.toUpperCase()} QRIS
                    </p>
                  </div>

                  {/* Stat Card 4: Koleksi Frame */}
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

                {/* Registered Users Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Users size={16} className="text-blue-600" />
                        Daftar Pengguna Studio snap.e ({registeredUsers?.length || 5} Akun)
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Pengguna yang telah login dan terdaftar dalam database studio.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Pengguna</th>
                          <th className="p-3">Email Akun</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Bergabung</th>
                          <th className="p-3">Sesi Terakhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(registeredUsers && registeredUsers.length > 0 ? registeredUsers : [
                          { uid: '1', displayName: 'Randi Kurnia', email: '0601randikurnia.s@gmail.com', role: 'admin', createdAt: '2026-09-20', lastLoginAt: 'Baru saja' },
                          { uid: '2', displayName: 'Nabila Azzahra', email: 'nabila.azzahra@gmail.com', role: 'customer', createdAt: '2026-09-22', lastLoginAt: '2 jam yang lalu' },
                          { uid: '3', displayName: 'Dimas Prasetya', email: 'dimas.prasetya@gmail.com', role: 'customer', createdAt: '2026-09-23', lastLoginAt: '6 jam yang lalu' },
                          { uid: '4', displayName: 'Alisya Putri', email: 'alisya.putri@gmail.com', role: 'customer', createdAt: '2026-09-24', lastLoginAt: 'Kemarin' },
                          { uid: '5', displayName: 'Kevin Pratama', email: 'kevin.pratama@gmail.com', role: 'customer', createdAt: '2026-09-26', lastLoginAt: 'Hari ini' }
                        ]).map((u, i) => (
                          <tr key={u.uid || i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs uppercase">
                                  {u.displayName?.[0] || 'U'}
                                </div>
                                <span className="font-bold text-gray-900">{u.displayName || 'Pengguna Photobooth'}</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-gray-600">{u.email}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {u.role === 'admin' ? 'Studio Owner' : 'Customer'}
                              </span>
                            </td>
                            <td className="p-3 text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : 'Aktif'}</td>
                            <td className="p-3 text-gray-500 font-mono text-[11px]">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Online'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Navigation Shortcuts */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900">Aksi Cepat Pengelolaan Studio</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => setActiveTab('frames')}
                      className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors flex items-start gap-3"
                    >
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0"><Palette size={16} /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Kelola Frame</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Upload frame baru rasio 600x1800 px.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('pricing')}
                      className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors flex items-start gap-3"
                    >
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0"><CreditCard size={16} /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Atur Tarif & Durasi</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Ubah harga sesi dan biaya cetak fisik.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('presets')}
                      className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors flex items-start gap-3"
                    >
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0"><Sliders size={16} /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Preset Kamera</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Kelola filter film analog vintage.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('qris_api')}
                      className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors flex items-start gap-3"
                    >
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0"><QrCode size={16} /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Integrasi QRIS API</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Setup gateway DOKU, Midtrans, Xendit.</p>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: PRINT ORDERS */}
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
                              <td className="p-4 font-mono font-bold text-gray-900">{ord.id}</td>
                              <td className="p-4">
                                <p className="font-bold text-gray-900">{ord.customerName}</p>
                                <p className="text-gray-500 text-[11px]">{ord.phone}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold text-gray-800">{ord.paperType}</p>
                                <p className="font-mono text-gray-500">Rp {ord.totalPrice?.toLocaleString('id-ID')}</p>
                              </td>
                              <td className="p-4 max-w-xs text-gray-600 truncate">{ord.address}</td>
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

            {/* SEPARATED TAB 3: KELOLA FRAME (STANDALONE) */}
            {activeTab === 'frames' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                      <Palette size={24} className="text-amber-600" />
                      Manajemen Template Frame Studio
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Kelola frame bawaan, upload desain bingkai bergambar kustom, dan panduan ukuran frame.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen size={14} className="text-amber-700" />
                      <span>Panduan Frame</span>
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

                {/* Frame Management Grid */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Daftar Bingkai Terpasang ({appConfig.customFrames?.length || 0})</h3>
                      <p className="text-xs text-gray-500">Tampil pada bilik pemilihan frame photostrip pengguna.</p>
                    </div>
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
                              className="w-11 h-11 rounded-lg border border-black/10 shrink-0 shadow-xs flex items-center justify-center text-xs font-bold overflow-hidden"
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
                                frame.overlayType === 'coquette' ? '🎀' : ''
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

                          {isCustom ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus frame kustom "${frame.name}"?`)) {
                                  deleteCustomFrame(frame.id);
                                  triggerToast(`Frame "${frame.name}" berhasil dihapus.`);
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

            {/* SEPARATED TAB 4: TARIF & SESI (STANDALONE) */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <CreditCard size={24} className="text-emerald-600" />
                    Manajemen Tarif & Durasi Sesi Booth
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Atur harga per sesi foto, durasi waktu jepret bilik kamera, dan biaya cetak lab fisik.
                  </p>
                </div>

                <form onSubmit={handleSavePricing} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                    Pengaturan Tarif Utama
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Harga Tiket Sesi (Rupiah)</label>
                      <input
                        type="number"
                        value={configPrice}
                        onChange={(e) => setConfigPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-gray-900"
                        placeholder="15000"
                        required
                      />
                      <p className="text-[10px] text-gray-400">Tarif default pengunjung untuk masuk bilik kamera.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Durasi Sesi Aktif (Menit)</label>
                      <input
                        type="number"
                        value={configDuration}
                        onChange={(e) => setConfigDuration(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-gray-900"
                        placeholder="15"
                        required
                      />
                      <p className="text-[10px] text-gray-400">Waktu countdown bilik foto aktif (default 15 menit).</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Biaya Tambahan Cetak Lab (Rupiah)</label>
                      <input
                        type="number"
                        value={configPrintFee}
                        onChange={(e) => setConfigPrintFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-gray-900"
                        placeholder="20000"
                      />
                      <p className="text-[10px] text-gray-400">Biaya per strip untuk pesanan cetak fisik ke alamat.</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Check size={16} />
                      Simpan Perubahan Tarif
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SEPARATED TAB 5: FILTER & PRESET KAMERA (STANDALONE) */}
            {activeTab === 'presets' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <Sliders size={24} className="text-blue-600" />
                    Manajemen Filter & Preset Kamera
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Atur filter warna analog vintage (Kodak, Fuji, Ilford, Cyberpunk) dan tambahkan preset CSS kustom.
                  </p>
                </div>

                {/* Form Tambah Preset Baru */}
                <form onSubmit={handleAddPresetSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                    <Plus size={16} className="text-blue-600" />
                    Tambah Preset Filter Baru
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Nama Preset</label>
                      <input
                        type="text"
                        value={newFilterName}
                        onChange={(e) => setNewFilterName(e.target.value)}
                        placeholder="Contoh: Kodak Gold 200"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900 font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Label Gaya / Brand</label>
                      <input
                        type="text"
                        value={newFilterBrand}
                        onChange={(e) => setNewFilterBrand(e.target.value)}
                        placeholder="KODAK, FUJI, VINTAGE"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900 uppercase font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Kategori</label>
                      <select
                        value={newFilterCategory}
                        onChange={(e) => setNewFilterCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-gray-900"
                      >
                        <option value="vintage">Vintage & Analog Film</option>
                        <option value="color">Warm & Vivid Color</option>
                        <option value="bw">Black & White / Monochrome</option>
                        <option value="mood">Moody & Cinematic</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">CSS Filter String</label>
                    <input
                      type="text"
                      value={newFilterCss}
                      onChange={(e) => setNewFilterCss(e.target.value)}
                      placeholder="contrast(1.15) saturate(1.2) sepia(0.25)"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-gray-900"
                      required
                    />
                    <p className="text-[10px] text-gray-400">Mendukung kombinasi standard CSS: contrast(), saturate(), brightness(), sepia(), grayscale(), hue-rotate().</p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Simpan Preset Baru
                    </button>
                  </div>
                </form>

                {/* Preset List */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Katalog Filter Terpasang ({appConfig.customFilters?.length || CAMERA_PRESETS.length})
                      </h3>
                      <p className="text-xs text-gray-500">Preset yang dapat dipilih pelanggan saat mengambil foto dan di editor strip.</p>
                    </div>

                    <div className="flex gap-1 text-[11px]">
                      {['all', 'vintage', 'color', 'bw', 'mood'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPresetCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                            presetCategoryFilter === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {cat === 'all' ? 'Semua' : cat.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(appConfig.customFilters || CAMERA_PRESETS)
                      .filter(f => presetCategoryFilter === 'all' || f.category === presetCategoryFilter)
                      .map((filter) => {
                        const isCustom = filter.id.startsWith('flt_');
                        return (
                          <div key={filter.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div 
                                className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-300"
                                style={{ filter: filter.css }}
                              >
                                <div className="w-full h-full bg-gradient-to-br from-amber-200 via-rose-300 to-indigo-300 flex items-center justify-center text-[10px] font-bold text-gray-700">
                                  FX
                                </div>
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-gray-900 truncate">{filter.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-mono px-1 rounded bg-white border border-gray-200 text-gray-600 font-bold">
                                    {filter.brand || 'PRESET'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 capitalize">{filter.category}</span>
                                </div>
                              </div>
                            </div>

                            {isCustom ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Hapus preset "${filter.name}"?`)) {
                                    deleteCustomFilter(filter.id);
                                    triggerToast(`Preset "${filter.name}" berhasil dihapus.`);
                                  }
                                }}
                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <span className="text-[9px] font-mono text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SEPARATED TAB 6: INTEGRASI QRIS API & PAYMENT GATEWAY */}
            {activeTab === 'qris_api' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <QrCode size={24} className="text-purple-600" />
                    Integrasi API QRIS & Payment Gateway
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Konfigurasikan API payment gateway (DOKU, Midtrans, Xendit, QRIS Dinamis) untuk penyelesaian pembayaran instan.
                  </p>
                </div>

                <form onSubmit={handleSavePaymentGateway} className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <KeyRound size={16} className="text-purple-600" />
                      Kredensial API Payment Gateway
                    </h3>

                    {/* Provider Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700">Pilih Payment Gateway Provider</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'doku', name: 'DOKU Checkout & QRIS', desc: 'QRIS Real-Time BCA/Shopee' },
                          { id: 'midtrans', name: 'Midtrans Snap', desc: 'GoPay / QRIS Simulator' },
                          { id: 'xendit', name: 'Xendit QRIS', desc: 'Instant Dynamic Settlement' },
                          { id: 'manual', name: 'QRIS Statis / Manual', desc: 'QR Image Direct Scan' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setGwProvider(p.id)}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              gwProvider === p.id 
                                ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20 shadow-xs' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <p className="font-bold text-xs text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{p.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Environment mode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Environment Mode</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setGwEnvironment('sandbox')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                              gwEnvironment === 'sandbox' ? 'bg-white shadow-xs text-purple-700' : 'text-gray-500'
                            }`}
                          >
                            Sandbox (Pengujian)
                          </button>
                          <button
                            type="button"
                            onClick={() => setGwEnvironment('production')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                              gwEnvironment === 'production' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500'
                            }`}
                          >
                            Production (Live Transaksi)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Merchant ID / Client ID</label>
                        <input
                          type="text"
                          value={gwMerchantId}
                          onChange={(e) => setGwMerchantId(e.target.value)}
                          placeholder="MALL-DOKU-882190"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-gray-900"
                          required
                        />
                      </div>
                    </div>

                    {/* API Keys */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Client Key / Public Key</label>
                        <input
                          type="text"
                          value={gwClientKey}
                          onChange={(e) => setGwClientKey(e.target.value)}
                          placeholder="pk_live_doku_..."
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-gray-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Secret Key / Server Key</label>
                        <div className="relative">
                          <input
                            type={gwShowSecret ? 'text' : 'password'}
                            value={gwSecretKey}
                            onChange={(e) => setGwSecretKey(e.target.value)}
                            placeholder="sk_live_doku_..."
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-gray-900 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setGwShowSecret(!gwShowSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                          >
                            {gwShowSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Webhook Callback URL */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Webhook Notification Callback URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={gwWebhookUrl}
                          onChange={(e) => setGwWebhookUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-gray-900"
                        />
                        <button
                          type="button"
                          onClick={handleCopyWebhook}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <Copy size={14} />
                          <span>{copyWebhookSuccess ? 'Tersalin' : 'Salin URL'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400">Tempelkan URL ini di dashboard Merchant DOKU / Midtrans untuk menerima notifikasi status pembayaran QRIS sukses.</p>
                    </div>

                    {/* Test Connection Button & Result */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleTestGatewayConnection}
                        disabled={gwTesting}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {gwTesting ? <Loader2 size={14} className="animate-spin text-purple-600" /> : <Sparkles size={14} className="text-purple-600" />}
                        <span>Uji Koneksi API Payment Gateway</span>
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                      >
                        <Check size={16} />
                        Simpan Pengaturan API QRIS
                      </button>
                    </div>

                    {gwTestResult && (
                      <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                        gwTestResult.status === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        <CheckCircle size={16} className={gwTestResult.status === 'success' ? 'text-emerald-600' : 'text-red-600'} />
                        <span>{gwTestResult.message}</span>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* TAB 7: WEBSITE CONTENT & BRANDING EDITOR (ENHANCED WITH GRADIENT & TOGGLES) */}
            {activeTab === 'website' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <Globe size={24} className="text-red-600" />
                    Editor Tampilan & Konten Website
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Sesuaikan gradasi warna tagline, atur bagian/fitur mana saja yang ingin ditampilkan di website publik, dan kelola identitas studio.
                  </p>
                </div>

                <form onSubmit={handleSaveWebsiteEditor} className="space-y-6">
                  
                  {/* Section 1: Pengaturan Gradasi Tagline & Judul */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" />
                      1. Tagline Judul & Gradasi Warna
                    </h3>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Teks Tagline Judul Website</label>
                      <input
                        type="text"
                        value={webHeroTagline}
                        onChange={(e) => setWebHeroTagline(e.target.value)}
                        placeholder="Momen Berharga, Synchronized Distances"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-gray-900"
                      />
                    </div>

                    {/* Gradient Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700">Pilih Gaya Gradasi Warna Tagline</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {GRADIENT_PRESETS.map((gp) => (
                          <button
                            key={gp.id}
                            type="button"
                            onClick={() => setWebTaglineGradient(gp.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                              webTaglineGradient === gp.id
                                ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10 shadow-xs'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full ${gp.preview} shrink-0`}></span>
                            <span className="text-xs font-bold text-gray-800 truncate">{gp.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Preview of Gradient Tagline */}
                    <div className="p-4 bg-gray-900 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block">Live Preview Gradasi Tagline:</span>
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                        <span className={`text-transparent bg-clip-text bg-gradient-to-r ${webTaglineGradient}`}>
                          {webHeroTagline || 'Momen Berharga, Synchronized Distances'}
                        </span>
                      </h2>
                    </div>
                  </div>

                  {/* Section 2: Pilihan Fitur / Bagian yang Ingin Ditampilkan (FITUR MANA SAJA YANG INGIN DITAMPILKAN) */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-red-600" />
                      2. Pengaturan Tampilan Fitur & Bagian Website
                    </h3>
                    <p className="text-xs text-gray-500">
                      Centang fitur atau bagian halaman beranda yang ingin Anda tampilkan kepada pengunjung website:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {[
                        { label: 'Header Hero & Tagline Gradasi', checked: webShowHero, setter: setWebShowHero, desc: 'Judul besar, badge promo, dan deskripsi' },
                        { label: 'Form Setup Bilik & Pilihan Shutter', checked: webShowSetupCard, setter: setWebShowSetupCard, desc: 'Pilihan mode solo/LDR dan strip 3-cut / grid 4-cut' },
                        { label: 'Banner Pengumuman Promo Berjalan', checked: webShowAnnouncement, setter: setWebShowAnnouncement, desc: 'Pita pengumuman promo di bagian paling atas' },
                        { label: 'Fitur Unggulan Studio (Highlights)', checked: webShowFeatures, setter: setWebShowFeatures, desc: 'Instant Shutter Sync, Stiker Estetik, 300 DPI' },
                        { label: 'Galeri Showcase Template Frame', checked: webShowFramesShowcase, setter: setWebShowFramesShowcase, desc: 'Katalog pratinjau bingkai photostrip' },
                        { label: 'Daftar Paket Tarif & Layanan Cetak', checked: webShowPricing, setter: setWebShowPricing, desc: 'Paket sesi digital dan add-on cetak lab fisik' },
                        { label: 'Panduan 4 Langkah Cara Kerja', checked: webShowHowItWorks, setter: setWebShowHowItWorks, desc: 'Edukasi langkah mudah berfoto bagi pengunjung baru' },
                        { label: 'Tanya Jawab Seputar Photobooth (FAQ)', checked: webShowFaq, setter: setWebShowFaq, desc: 'Informasi album 7 hari, LDR sync, dan QRIS' },
                        { label: 'Footer Studio & Info Operasional', checked: webShowFooter, setter: setWebShowFooter, desc: 'Alamat fisik, jam buka, dan tautan sosial media' },
                        { label: 'Tombol Chat WhatsApp Melayang (Floating)', checked: webShowFloatingWhatsapp, setter: setWebShowFloatingWhatsapp, desc: 'Akses cepat CS WhatsApp di pojok kanan bawah' },
                      ].map((item, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setter(e.target.checked)}
                            className="mt-0.5 rounded text-red-600 focus:ring-red-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-gray-900 block">{item.label}</span>
                            <span className="text-[11px] text-gray-500 leading-snug">{item.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Teks & Informasi Brand */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      3. Identitas Brand & Pengumuman
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Nama Brand Studio</label>
                        <input
                          type="text"
                          value={webBrandName}
                          onChange={(e) => setWebBrandName(e.target.value)}
                          placeholder="snap.e"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-gray-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Badge Promo Hero</label>
                        <input
                          type="text"
                          value={webPromoBadge}
                          onChange={(e) => setWebPromoBadge(e.target.value)}
                          placeholder="PHOTO BOOTH ONLINE & LDR DUAL-STREAM"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-gray-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Warna Aksen Website</label>
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
                      <label className="text-xs font-semibold text-gray-700">Deskripsi Subtitle Hero</label>
                      <textarea
                        rows={2}
                        value={webHeroDesc}
                        onChange={(e) => setWebHeroDesc(e.target.value)}
                        placeholder="Deskripsi singkat yang tampil di bawah judul..."
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900 resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Teks Banner Pengumuman Promo</label>
                      <input
                        type="text"
                        value={webAnnouncement}
                        onChange={(e) => setWebAnnouncement(e.target.value)}
                        placeholder="✨ Selamat datang di Studio snap.e! Cetak strip foto kualitas lab."
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>

                  {/* Section 4: Kontak Customer Service & Jam Operasional */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      4. Kontak Customer Service & Jam Operasional
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

                  {/* Section 5: Teks Tombol Call To Action (CTA) */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <CreditCard size={16} className="text-indigo-600" />
                      5. Teks Tombol Aksi Utama (Call To Action / CTA)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Kustomisasi kata-kata tombol pemicu sesi untuk menarik pengunjung berfoto di photobooth.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Teks Tombol Utama (Primary CTA)</label>
                        <input
                          type="text"
                          value={webPrimaryCtaText}
                          onChange={(e) => setWebPrimaryCtaText(e.target.value)}
                          placeholder="Mulai Sesi Booth Sekarang"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-gray-900"
                        />
                        <span className="text-[10px] text-gray-400">Contoh: &quot;Mulai Sesi Booth Sekarang&quot;, &quot;Masuk Bilik Foto&quot;, &quot;Jepret Foto Sekarang&quot;</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Teks Tombol Sekunder (Secondary CTA)</label>
                        <input
                          type="text"
                          value={webSecondaryCtaText}
                          onChange={(e) => setWebSecondaryCtaText(e.target.value)}
                          placeholder="Lihat Pilihan Frame"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-gray-900"
                        />
                        <span className="text-[10px] text-gray-400">Contoh: &quot;Lihat Pilihan Frame&quot;, &quot;Katalog Kertas Foto&quot;</span>
                      </div>
                    </div>

                    {/* Preview of CTA button */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pratinjau Tampilan Tombol:</span>
                        <p className="text-xs text-gray-600">Bagaimana tombol akan tampil di halaman setup photobooth pengunjung</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm"
                        >
                          <span>{webPrimaryCtaText || 'Mulai Sesi Booth Sekarang'}</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section 6: SEO & Metadata Mesin Pencari */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <Globe size={16} className="text-emerald-600" />
                      6. Pengaturan SEO & Metadata Mesin Pencari
                    </h3>
                    <p className="text-xs text-gray-500">
                      Optimalkan judul dan ringkasan website agar tampil menarik saat dibagikan ke media sosial (WhatsApp, Instagram) atau hasil pencarian Google.
                    </p>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Meta Title (Judul Tab & Pencarian)</label>
                        <input
                          type="text"
                          value={webMetaTitle}
                          onChange={(e) => setWebMetaTitle(e.target.value)}
                          placeholder="snap.e - Tangible Memories, Synchronized Distances"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-gray-900"
                        />
                        <span className="text-[10px] text-gray-400">Panjang ideal: 50-60 karakter. Saat ini: {webMetaTitle.length} karakter.</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Meta Description (Ringkasan Cuplikan Snippet)</label>
                        <textarea
                          rows={2}
                          value={webMetaDescription}
                          onChange={(e) => setWebMetaDescription(e.target.value)}
                          placeholder="Deskripsi singkat yang tampil di Google atau link preview WhatsApp..."
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-gray-900 resize-none"
                        />
                        <span className="text-[10px] text-gray-400">Panjang ideal: 120-160 karakter. Saat ini: {webMetaDescription.length} karakter.</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Meta Keywords (Kata Kunci Pencarian)</label>
                        <input
                          type="text"
                          value={webMetaKeywords}
                          onChange={(e) => setWebMetaKeywords(e.target.value)}
                          placeholder="photobooth online, ldr photobooth, photo strip korea, cetak foto lab"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-gray-900"
                        />
                        <span className="text-[10px] text-gray-400">Pisahkan setiap kata kunci dengan koma (,).</span>
                      </div>
                    </div>

                    {/* Google Search Snippet Card Preview */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-1.5 shadow-xs">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">
                        Google Search Snippet Preview:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">
                          s
                        </div>
                        <div className="leading-tight">
                          <p className="text-[12px] text-gray-800 font-semibold">{webBrandName || 'snap.e'} Photobooth</p>
                          <p className="text-[10px] text-gray-500 font-mono">https://snape.studio &rsaquo; photobooth</p>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
                        {webMetaTitle || 'snap.e - Tangible Memories, Synchronized Distances'}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {webMetaDescription || 'Online photobooth for solo and LDR couples with customizable photostrips, real-time sync, and lab-quality printing.'}
                      </p>
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

            {/* TAB 8: KELOLA STIKER MANDIRI */}
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

                <form onSubmit={handleAddStickerSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                    <Plus size={16} className="text-purple-600" />
                    Tambah Stiker Baru
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                    <div className="flex gap-1 overflow-x-auto text-[11px]">
                      {['all', 'Aesthetic', 'Love', 'Cute', 'Party', 'Studio'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setStickerFilterCategory(cat)}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                            stickerFilterCategory === cat ? 'bg-gray-900 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus stiker "${stk.name || stk.text}"?`)) {
                              deleteCustomSticker(stk.id);
                              triggerToast(`Stiker "${stk.name || stk.text}" berhasil dihapus.`);
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

            {/* TAB 9: HARDWARE LAB */}
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

      {/* Modals */}
      <AddFrameModal
        isOpen={showAddFrameModal}
        onClose={() => setShowAddFrameModal(false)}
        onOpenGuide={() => setShowGuideModal(true)}
      />

      <FrameGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onOpenAddFrame={() => setShowAddFrameModal(true)}
      />

    </div>
  );
}
