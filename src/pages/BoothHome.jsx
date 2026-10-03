import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { useBooth } from '../context/BoothContext';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Camera, 
  Smartphone, 
  User, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  ShieldCheck, 
  Heart, 
  Layers, 
  Zap,
  MapPin,
  Clock,
  MessageCircle,
  Instagram,
  LogIn,
  Loader2
} from 'lucide-react';

export default function BoothHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    appConfig, 
    userName, 
    setUserName, 
    mode, 
    setMode, 
    layout, 
    setLayout,
    currentUser,
    authLoading,
    openAuthModal,
    startNewSession
  } = useBooth();

  // State for step modal or section
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLdrModal, setShowLdrModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [inputName, setInputName] = useState(currentUser?.displayName || userName);
  const [partnerRoomCode, setPartnerRoomCode] = useState('');
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync inputName when currentUser loads
  useEffect(() => {
    if (currentUser?.displayName && (!inputName || inputName === 'Tamu')) {
      setInputName(currentUser.displayName);
      setUserName(currentUser.displayName);
    }
  }, [currentUser, inputName, setUserName]);

  // Check if joined via URL (?join=ROOM_ID)
  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode) {
      setMode('ldr');
      setPartnerRoomCode(joinCode);
      // Auto open payment or proceed
    }
  }, [searchParams, setMode]);

  // Generate unique room ID for LDR mode
  useEffect(() => {
    if (mode === 'ldr' && !generatedRoomId) {
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setGeneratedRoomId(`SNAP-${randomCode}`);
    }
  }, [mode, generatedRoomId]);

  // Dynamic SEO & Metadata sync configured from Admin Website Editor
  useEffect(() => {
    if (appConfig.website?.metaTitle) {
      document.title = appConfig.website.metaTitle;
    }
    if (appConfig.website?.metaDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', appConfig.website.metaDescription);
      }
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', appConfig.website.metaDescription);
      }
    }
  }, [appConfig.website?.metaTitle, appConfig.website?.metaDescription]);

  const handleStartBooth = () => {
    if (!currentUser) {
      openAuthModal('/setup');
      return;
    }
    setUserName(inputName || currentUser.displayName || 'Tamu');
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    startNewSession();
    setTimeout(() => {
      setShowPaymentModal(false);
      if (mode === 'ldr') {
        setShowLdrModal(true);
      } else {
        navigate('/capture');
      }
    }, 1200);
  };

  const getJoinUrl = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('join', generatedRoomId);
    return url.toString();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getJoinUrl());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleProceedLdr = () => {
    setShowLdrModal(false);
    navigate(`/capture?room=${generatedRoomId}&role=host`);
  };

  const handleJoinExistingRoom = (e) => {
    e.preventDefault();
    if (!partnerRoomCode.trim()) return;
    if (!currentUser) {
      openAuthModal(`/capture?room=${partnerRoomCode.trim()}&role=guest`);
      return;
    }
    setMode('ldr');
    setUserName(inputName || currentUser.displayName || 'Tamu');
    navigate(`/capture?room=${partnerRoomCode.trim()}&role=guest`);
  };

  // 1. Authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] text-gray-700">
        <Loader2 size={36} className="animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Memuat sesi studio...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-gray-900 font-sans">
      <Topbar />

      {/* Dynamic Announcement Banner configured from Admin Website Editor */}
      {appConfig.website?.showAnnouncement && appConfig.website?.announcement && (
        <div 
          className="w-full text-white text-xs sm:text-sm py-2.5 px-4 text-center font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: appConfig.website?.accentColor || '#E11D48' }}
        >
          <Sparkles size={14} className="text-amber-300 animate-spin shrink-0" />
          <span>{appConfig.website.announcement}</span>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center">
        
        {/* Header Hero */}
        {appConfig.website?.showHero !== false && (
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold tracking-wide">
              <Sparkles size={14} className="animate-spin text-red-500" />
              <span>{appConfig.website?.promoBadge || 'PHOTO BOOTH ONLINE & LDR DUAL-STREAM'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${appConfig.website?.taglineGradient || 'from-rose-600 via-purple-600 to-indigo-600'}`}>
                {appConfig.website?.heroTagline || 'Momen Berharga, Synchronized Distances'}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
              {appConfig.website?.heroDescription || 'Foto bersama pasangan atau sahabat dari jarak jauh secara real-time, atau nikmati sesi solo dengan photostrip estetik gaya Korea.'}
            </p>
          </div>
        )}

        {/* Setup Card */}
        {appConfig.website?.showSetupCard !== false && (
        <div className="w-full max-w-3xl bg-white border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-200/50 p-5 sm:p-8 space-y-8">
          
          {/* User Name input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-gray-400" />
              Nama Tampilan Anda
            </label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Contoh: Rian & Nabila"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-gray-900 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Step 1: Mode Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  1. Pilih Mode Booth
                </label>
                <span className="text-[11px] text-gray-400">WebRTC Dual Sync</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Solo Mode */}
                <button
                  type="button"
                  onClick={() => setMode('solo')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                    mode === 'solo'
                      ? 'border-gray-900 bg-gray-50/80 ring-2 ring-gray-900/10 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${mode === 'solo' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Camera size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-gray-900">Solo Booth</p>
                      {mode === 'solo' && <CheckCircle2 size={16} className="text-gray-900" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Gunakan kamera 1 perangkat untuk sesi potret pribadi atau bersama teman.
                    </p>
                  </div>
                </button>

                {/* LDR Mode */}
                <button
                  type="button"
                  onClick={() => setMode('ldr')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                    mode === 'ldr'
                      ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-500/10 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${mode === 'ldr' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Smartphone size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        LDR / Dual Cam
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Paling Populer</span>
                      </p>
                      {mode === 'ldr' && <CheckCircle2 size={16} className="text-rose-600" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Sinkronisasi 2 perangkat berbeda kota atau negara. Shutter tersinkron otomatis!
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Layout Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  2. Tata Letak Frame (4R & Strip)
                </label>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  Ukuran Cetak 4R (10x15cm)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* 4R 4-Cut with Center Cut Line */}
                <button
                  type="button"
                  onClick={() => setLayout('4r_4cut')}
                  className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2.5 transition-all ${
                    layout === '4r_4cut'
                      ? 'border-gray-900 bg-gray-50/90 ring-2 ring-gray-900/10 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="w-16 h-20 bg-white border-2 border-gray-400 rounded p-1 relative flex">
                    {/* Left Strip (2 photos) */}
                    <div className="flex-1 flex flex-col justify-between pr-1">
                      <div className="w-full h-7 bg-gray-200 rounded-xs mb-1"></div>
                      <div className="w-full h-7 bg-gray-200 rounded-xs"></div>
                    </div>
                    {/* Center Divider */}
                    <div className="w-0.5 bg-gray-200 my-0.5"></div>
                    {/* Right Strip (2 photos) */}
                    <div className="flex-1 flex flex-col justify-between pl-1">
                      <div className="w-full h-7 bg-gray-200 rounded-xs mb-1"></div>
                      <div className="w-full h-7 bg-gray-200 rounded-xs"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 flex items-center justify-center gap-1">
                      <span>4R (4 Foto)</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">2 strip × 2 foto</p>
                  </div>
                </button>

                {/* 4R 6-Cut */}
                <button
                  type="button"
                  onClick={() => setLayout('4r_6cut')}
                  className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2.5 transition-all ${
                    layout === '4r_6cut'
                      ? 'border-gray-900 bg-gray-50/90 ring-2 ring-gray-900/10 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="w-16 h-20 bg-white border-2 border-gray-400 rounded p-1 relative flex">
                    {/* Left Strip (3 photos) */}
                    <div className="flex-1 flex flex-col justify-between pr-1">
                      <div className="w-full h-4.5 bg-gray-200 rounded-xs mb-0.5"></div>
                      <div className="w-full h-4.5 bg-gray-200 rounded-xs mb-0.5"></div>
                      <div className="w-full h-4.5 bg-gray-200 rounded-xs"></div>
                    </div>
                    {/* Center Divider */}
                    <div className="w-0.5 bg-gray-200 my-0.5"></div>
                    {/* Right Strip (3 photos) */}
                    <div className="flex-1 flex flex-col justify-between pl-1">
                      <div className="w-full h-4.5 bg-gray-200 rounded-xs mb-0.5"></div>
                      <div className="w-full h-4.5 bg-gray-200 rounded-xs mb-0.5"></div>
                      <div className="w-full h-4.5 bg-gray-200 rounded-xs"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 flex items-center justify-center gap-1">
                      <span>4R (6 Foto)</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">2 strip × 3 foto</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* LDR Join Box (if invited by partner) */}
          {mode === 'ldr' && (
            <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                <Heart size={14} className="text-rose-600 fill-rose-600" />
                Punya Kode Ruangan dari Pasangan?
              </div>
              <form onSubmit={handleJoinExistingRoom} className="flex gap-2">
                <input
                  type="text"
                  value={partnerRoomCode}
                  onChange={(e) => setPartnerRoomCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan Kode (cth: SNAP-AB12)"
                  className="flex-1 px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-mono font-bold tracking-wider outline-none focus:border-rose-600 uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Gabung Ruangan
                </button>
              </form>
            </div>
          )}

          {/* Login notice for guests */}
          {!currentUser && (
            <div className="p-3.5 bg-red-50/80 border border-red-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-red-600 shrink-0" />
                <span>Silakan login terlebih dahulu untuk mengakses bilik kamera snap.e.</span>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal('/setup')}
                className="font-bold underline text-red-900 hover:text-black shrink-0 px-2 py-1 bg-red-100/60 rounded-md"
              >
                Masuk / Login
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs text-gray-500 block">Tarif Sesi Booth</span>
              <span className="text-xl font-extrabold text-gray-900">
                Rp {appConfig.payment.price.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-emerald-600 ml-2 font-medium">● Termasuk HD Download & Album 7 Hari</span>
            </div>

            {currentUser ? (
              <button
                onClick={handleStartBooth}
                className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-gray-900/10 group"
              >
                <span>{appConfig.website?.primaryCtaText || 'Mulai Sesi Booth Sekarang'}</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('/setup')}
                className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 group"
              >
                <LogIn size={16} />
                <span>Masuk untuk Mulai Booth</span>
              </button>
            )}
          </div>
        </div>
        )}

        {/* Feature Highlights */}
        {appConfig.website?.showFeatures !== false && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-center">
            <div className="p-4 bg-white/70 rounded-xl border border-gray-200/60 shadow-xs">
              <div className="w-10 h-10 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
                <Zap size={20} />
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Instant Shutter Sync</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Jepretan kamera terkoordinasi dalam hitungan milidetik melalui WebRTC stream.
              </p>
            </div>

            <div className="p-4 bg-white/70 rounded-xl border border-gray-200/60 shadow-xs">
              <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Layers size={20} />
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Stiker & Frame Estetik</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Kustomisasi bebas warna bingkai, teks tanggal kenangan, serta stiker doodle interaktif.
              </p>
            </div>

            <div className="p-4 bg-white/70 rounded-xl border border-gray-200/60 shadow-xs">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Kualitas Cetak 300 DPI</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hasil ekspor tajam beresolusi tinggi, siap cetak fisik atau posting ke media sosial.
              </p>
            </div>
          </div>
        )}

        {/* Frames Showcase Section */}
        {appConfig.website?.showFramesShowcase !== false && (
          <section className="mt-14 w-full max-w-4xl">
            <div className="text-center mb-6 space-y-1">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Koleksi Frame</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Pilihan Frame Photostrip Estetik</h2>
              <p className="text-xs text-gray-500">Tersedia beragam template frame siap pakai dengan sentuhan vintage & modern.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(appConfig.customFrames || []).slice(0, 4).map((frame) => (
                <div key={frame.id} className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all group">
                  <div 
                    className="w-full aspect-[2/3] rounded-xl flex flex-col justify-between p-2.5 relative overflow-hidden transition-transform group-hover:scale-102"
                    style={{ backgroundColor: frame.bg, color: frame.text }}
                  >
                    <div className="text-[8px] font-bold tracking-widest opacity-60">SNAP.E</div>
                    <div className="space-y-1 my-auto">
                      <div className="w-full h-8 bg-black/10 rounded"></div>
                      <div className="w-full h-8 bg-black/10 rounded"></div>
                      <div className="w-full h-8 bg-black/10 rounded"></div>
                    </div>
                    <div className="text-[9px] font-serif italic truncate">{frame.name}</div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-bold text-gray-800 truncate">{frame.name}</p>
                    <span className="text-[9px] text-gray-400 font-mono uppercase">{frame.badge || 'ESTETIK'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How It Works Section */}
        {appConfig.website?.showHowItWorks !== false && (
          <section className="mt-14 w-full max-w-4xl bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="text-center mb-8 space-y-1">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Cara Kerja</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">4 Langkah Mudah Berfoto</h2>
              <p className="text-xs text-gray-500">Mulai dari memilih mode hingga mencetak hasil foto strip kenangan Anda.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">1</div>
                <h4 className="font-bold text-xs text-gray-900">Pilih Mode & Layout</h4>
                <p className="text-[11px] text-gray-500">Pilih Solo atau LDR Dual Cam serta tata letak 3-cut strip atau 4-cut quad.</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">2</div>
                <h4 className="font-bold text-xs text-gray-900">Bayar via QRIS</h4>
                <p className="text-[11px] text-gray-500">Scan QRIS dari dompet digital apa saja (BCA, GoPay, ShopeePay, Dana, dll).</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">3</div>
                <h4 className="font-bold text-xs text-gray-900">Pose & Jepret Bebas</h4>
                <p className="text-[11px] text-gray-500">Ambil foto sebanyak mungkin selama sesi 15 menit dengan auto-advance.</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">4</div>
                <h4 className="font-bold text-xs text-gray-900">Edit, Unduh & Cetak</h4>
                <p className="text-[11px] text-gray-500">Kustomisasi frame, stiker, filter, simpan album 7 hari dan order cetak lab.</p>
              </div>
            </div>
          </section>
        )}

        {/* Pricing Packages */}
        {appConfig.website?.showPricing !== false && (
          <section className="mt-14 w-full max-w-4xl">
            <div className="text-center mb-6 space-y-1">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Tarif & Layanan</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Pilihan Paket Sesi Studio</h2>
              <p className="text-xs text-gray-500">Harga transparan tanpa biaya tersembunyi dengan fitur terlengkap.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-sm relative">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase mb-3">
                  Paling Populer
                </div>
                <h3 className="font-extrabold text-lg text-gray-900">Sesi Digital Booth + Album 7 Hari</h3>
                <p className="text-xs text-gray-500 mt-1">Akses penuh bilik kamera, filter vintage, dan penyimpanan foto 7 hari.</p>
                <div className="mt-4 mb-5">
                  <span className="text-3xl font-extrabold text-gray-900">Rp {appConfig.payment.price.toLocaleString('id-ID')}</span>
                  <span className="text-xs text-gray-400 ml-1">/ sesi 15 menit</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Jepret foto bebas tanpa batas selama sesi 15 menit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Tersimpan aman di Album Sementara selama 7 Hari</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Download file HD 300 DPI & Animasi Live GIF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Dukungan LDR Shutter Sync WebRTC</span>
                  </li>
                </ul>
                {currentUser ? (
                  <button
                    onClick={handleStartBooth}
                    className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Mulai Sekarang
                  </button>
                ) : (
                  <button
                    onClick={() => openAuthModal('/setup')}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogIn size={14} />
                    <span>Masuk untuk Memulai</span>
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold tracking-wider uppercase mb-3">
                  Add-on Opsional
                </div>
                <h3 className="font-extrabold text-lg text-gray-900">Layanan Cetak Lab Fisik</h3>
                <p className="text-xs text-gray-500 mt-1">Cetak fisik photostrip kualitas laboratorium foto dikirim ke alamat Anda.</p>
                <div className="mt-4 mb-5">
                  <span className="text-3xl font-extrabold text-gray-900">Rp {(appConfig.payment.printFee || 20000).toLocaleString('id-ID')}</span>
                  <span className="text-xs text-gray-400 ml-1">/ strip 3R</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Kertas foto Glossy 3R Extended atau Matte Scandinavia</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Tinta pigment anti-luntur bertahan puluhan tahun</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Pengiriman rapi dengan amplop kaku & sleeve pelindung</span>
                  </li>
                </ul>
                {currentUser ? (
                  <button
                    onClick={() => navigate('/editor')}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-xs font-bold transition-colors"
                  >
                    Lihat Editor & Order Cetak
                  </button>
                ) : (
                  <button
                    onClick={() => openAuthModal('/editor')}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogIn size={14} />
                    <span>Masuk untuk Akses Editor</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FAQs Section */}
        {appConfig.website?.showFaq !== false && (
          <section className="mt-14 w-full max-w-4xl space-y-4">
            <div className="text-center mb-6 space-y-1">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Bantuan & Informasi</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Pertanyaan yang Sering Diajukan</h2>
            </div>

            <div className="space-y-3">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="font-bold text-xs text-gray-900 mb-1">Berapa lama hasil foto saya tersimpan di album sementara?</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Semua jepretan foto dan photostrip hasil sesi Anda tersimpan aman selama <strong>7 hari</strong>. Anda dapat mengunduh ulang foto dan GIF kapan saja selama masa simpan tersebut.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="font-bold text-xs text-gray-900 mb-1">Bagaimana cara kerja fitur foto bersama pasangan LDR?</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Pilih mode LDR Dual Cam, lakukan pembayaran, lalu bagikan kode ruangan kepada pasangan. Kamera kedua perangkat akan terhubung secara real-time dan shutter foto akan terjepret bersamaan!
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <h4 className="font-bold text-xs text-gray-900 mb-1">Metode pembayaran apa saja yang didukung?</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Sistem mendukung pembayaran QRIS Nasional melalui seluruh dompet digital dan mobile banking terpercaya seperti BCA, Mandiri, GoPay, ShopeePay, OVO, serta Dana dengan verifikasi otomatis.
                </p>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Floating WhatsApp Button */}
      {appConfig.website?.showFloatingWhatsapp !== false && appConfig.website?.whatsappNumber && (
        <a
          href={`https://wa.me/${appConfig.website.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo ' + (appConfig.website?.brandName || 'snap.e') + ', saya ingin bertanya mengenai sesi photobooth.')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-xl shadow-emerald-600/30 flex items-center gap-2 font-bold text-xs transition-transform hover:scale-105"
          title="Chat Customer Service via WhatsApp"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline">Tanya Studio</span>
        </a>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 sm:p-7 text-center space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <QrCode size={24} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>{appConfig.paymentGateway?.provider?.toUpperCase() || 'DOKU'} QRIS PAYMENT GATEWAY</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Pembayaran QRIS</h3>
              <p className="text-xs text-gray-500 mt-0.5">Pindai kode QRIS dengan BCA Mobile, GoPay, ShopeePay, OVO, atau Dana.</p>
            </div>

            {/* QRIS code */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl inline-block mx-auto relative">
              <QRCodeSVG 
                value={appConfig.payment.qrisUrl || 'https://snap.e.studio/pay'} 
                size={170} 
                level="M" 
                includeMargin={false}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white p-1 shadow-xs border border-gray-200 flex items-center justify-center">
                <span className="font-extrabold text-[9px] text-red-600">QRIS</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl space-y-1 text-left text-xs">
              <div className="flex items-center justify-between text-gray-500 text-[11px]">
                <span>No. Transaksi</span>
                <span className="font-mono font-bold text-gray-800">INV-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500 text-[11px]">
                <span>Masa Aktif QR</span>
                <span className="font-mono font-bold text-red-600">14:59 Menit</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                <span className="font-bold text-gray-700">Total Pembayaran</span>
                <span className="text-base font-extrabold text-gray-900">
                  Rp {appConfig.payment.price.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Simulate / Verify Button */}
            <div className="space-y-2">
              <button
                onClick={handlePaymentSuccess}
                disabled={paymentSuccess}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  paymentSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                }`}
              >
                {paymentSuccess ? (
                  <>
                    <CheckCircle2 size={18} />
                    Pembayaran Terkonfirmasi!
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Konfirmasi Pembayaran Selesai
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LDR HOST MODAL */}
      {showLdrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Smartphone size={24} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">Hubungkan Pasangan LDR</h3>
              <p className="text-xs text-gray-500 mt-1">
                Kirim link atau minta pasangan Anda scan QR di bawah ini untuk terhubung.
              </p>
            </div>

            {/* QR Code for Join URL */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl inline-block mx-auto">
              <QRCodeSVG value={getJoinUrl()} size={160} level="M" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-gray-100 p-2.5 rounded-lg">
                <code className="text-xs font-mono font-bold text-gray-800 flex-1 truncate text-left">
                  {getJoinUrl()}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1 shrink-0"
                >
                  {copySuccess ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copySuccess ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Kode Ruangan Anda: <span className="font-mono font-bold text-gray-900">{generatedRoomId}</span>
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleProceedLdr}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                Lanjut Masuk Booth Kamera
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setShowLdrModal(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Dynamic Website Studio Info */}
      {appConfig.website?.showFooter !== false && (
        <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs text-gray-600">
              {/* Brand & Tagline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-gray-900 tracking-tight">
                    {appConfig.website?.brandName || 'snap.e'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    appConfig.website?.isOpen !== false 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {appConfig.website?.isOpen !== false ? '● Buka' : '● Tutup'}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  {appConfig.website?.heroTagline || 'Tangible Memories, Synchronized Distances.'}
                </p>
              </div>

              {/* Studio Address */}
              <div className="space-y-1.5">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin size={13} className="text-red-500" />
                  Alamat Studio
                </span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {appConfig.website?.studioAddress || 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan'}
                </p>
              </div>

              {/* Operational Hours */}
              <div className="space-y-1.5">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-500" />
                  Jam Buka
                </span>
                <p className="text-[11px] text-gray-500">
                  {appConfig.website?.openingHours || 'Setiap Hari: 10:00 - 22:00 WIB'}
                </p>
              </div>

              {/* Contact CS / WhatsApp & IG */}
              <div className="space-y-2">
                <span className="font-bold text-gray-900 block">Hubungi Admin</span>
                <div className="flex flex-col gap-1.5 text-[11px]">
                  {appConfig.website?.whatsappNumber && (
                    <a
                      href={`https://wa.me/${appConfig.website.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp CS: {appConfig.website.whatsappNumber}</span>
                    </a>
                  )}
                  {appConfig.website?.instagramHandle && (
                    <a
                      href={`https://instagram.com/${appConfig.website.instagramHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-pink-600 hover:text-pink-700 font-semibold"
                    >
                      <Instagram size={13} />
                      <span>{appConfig.website.instagramHandle}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
              <p>© {new Date().getFullYear()} {appConfig.website?.brandName || 'snap.e'} Studio. All rights reserved.</p>
              <p className="font-mono text-[10px]">Cloud Synced • Real-Time WebRTC</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
