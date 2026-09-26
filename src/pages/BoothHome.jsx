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
  Zap
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
    openAuthModal
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-gray-900 font-sans">
      <Topbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold tracking-wide">
            <Sparkles size={14} className="animate-spin text-red-500" />
            PHOTO BOOTH ONLINE & LDR DUAL-STREAM
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Momen Berharga, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-600">
              Synchronized Distances
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
            Foto bersama pasangan atau sahabat dari jarak jauh secara real-time, atau nikmati sesi solo dengan photostrip estetik gaya Korea.
          </p>
        </div>

        {/* Setup Card */}
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
                  2. Tata Letak Strip
                </label>
                <span className="text-[11px] text-gray-400">Ukuran 2x6 / 4R</span>
              </div>

              <div className="grid grid-cols-2 gap-3 h-full">
                {/* Classic 3-Cut Strip */}
                <button
                  type="button"
                  onClick={() => setLayout('strip')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-3 transition-all ${
                    layout === 'strip'
                      ? 'border-gray-900 bg-gray-50/80 ring-2 ring-gray-900/10 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="w-10 h-16 bg-white border-2 border-gray-400 rounded p-1 flex flex-col justify-between">
                    <div className="w-full h-3 bg-gray-200 rounded-sm"></div>
                    <div className="w-full h-3 bg-gray-200 rounded-sm"></div>
                    <div className="w-full h-3 bg-gray-200 rounded-sm"></div>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900">Classic Strip</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">3 Pose Vertikal</p>
                  </div>
                </button>

                {/* 2x2 Quad Grid */}
                <button
                  type="button"
                  onClick={() => setLayout('grid')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-3 transition-all ${
                    layout === 'grid'
                      ? 'border-gray-900 bg-gray-50/80 ring-2 ring-gray-900/10 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="w-14 h-16 bg-white border-2 border-gray-400 rounded p-1 grid grid-cols-2 gap-1 items-center">
                    <div className="w-full h-5 bg-gray-200 rounded-sm"></div>
                    <div className="w-full h-5 bg-gray-200 rounded-sm"></div>
                    <div className="w-full h-5 bg-gray-200 rounded-sm"></div>
                    <div className="w-full h-5 bg-gray-200 rounded-sm"></div>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900">2x2 Quad Grid</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">4 Pose Grid</p>
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
              <span className="text-xs text-emerald-600 ml-2 font-medium">● Termasuk HD Download</span>
            </div>

            <button
              onClick={handleStartBooth}
              className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-gray-900/10 group"
            >
              Mulai Sesi Booth Sekarang
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
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

      </main>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <QrCode size={24} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">Pembayaran QRIS</h3>
              <p className="text-xs text-gray-500 mt-1">Pindai kode QRIS atau gunakan simulasi instan untuk memulai.</p>
            </div>

            {/* QRIS code */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl inline-block mx-auto">
              <QRCodeSVG 
                value={appConfig.payment.qrisUrl || 'https://snap.e.studio/pay'} 
                size={180} 
                level="M" 
                includeMargin={false}
              />
            </div>

            <div className="bg-gray-100/70 p-3 rounded-xl flex items-center justify-between px-4">
              <span className="text-xs text-gray-500 font-medium">Total Tagihan</span>
              <span className="text-base font-extrabold text-gray-900">
                Rp {appConfig.payment.price.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Simulate Button */}
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
                    Simulasikan Pembayaran Berhasil
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

      {/* Footer - Public Only */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">snap.e</span>
            <span>— Tangible Memories, Synchronized Distances.</span>
          </div>
          <p>© {new Date().getFullYear()} snap.e Atelier. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
