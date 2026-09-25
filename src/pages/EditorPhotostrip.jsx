import { useState, useRef, useEffect } from 'react';
import Topbar from '../components/Topbar';
import { useBooth } from '../context/BoothContext';
import { 
  Download, 
  Printer, 
  Copy, 
  Sparkles, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  X,
  Camera,
  Calendar
} from 'lucide-react';
import { FILTER_CATEGORIES, CAMERA_PRESETS } from '../data/cameraPresets';

export default function EditorPhotostrip() {
  const { appConfig, userName, capturedPhotos, updateCapturedPhotos, layout, addOrder } = useBooth();

  // Selected frame
  const frames = appConfig.customFrames || [];
  const [selectedFrameId, setSelectedFrameId] = useState(frames[0]?.id || 'cream');
  const activeFrame = frames.find(f => f.id === selectedFrameId) || frames[0] || { bg: '#F9F6F0', text: '#2A2521' };

  // Bottom text & styling
  const [customText, setCustomText] = useState('Long Distance Soulmate');
  const [showBadge, setShowBadge] = useState(true);
  const [showQr, setShowQr] = useState(true);

  // Photos state copied from context
  const [photos, setPhotos] = useState(capturedPhotos);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Filter presets & category
  const availablePresets = appConfig.customFilters?.length > 0 ? appConfig.customFilters : CAMERA_PRESETS;
  const [filterCategory, setFilterCategory] = useState('all');

  // Stickers library
  const stickerList = ['✨', '💖', '🎀', '⭐', '🍒', '🌸', '📸', '💌', '🧸', '🕊️'];

  // Tab for sidebar
  const [activeTab, setActiveTab] = useState('frame'); // 'frame' | 'filter' | 'sticker' | 'adjust' | 'text'

  // Toast & Modals
  const [toastMessage, setToastMessage] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  // Print order form
  const [customerName, setCustomerName] = useState(userName);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paperType, setPaperType] = useState('Glossy 3R Extended');

  const stripPreviewRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync photos to context
  useEffect(() => {
    updateCapturedPhotos(photos);
  }, [photos, updateCapturedPhotos]);

  // Apply analog preset to single photo
  const handleApplyFilterToPhoto = (preset, idx = activePhotoIdx) => {
    const next = [...photos];
    if (next[idx]) {
      next[idx] = {
        ...next[idx],
        filterCss: preset.css,
        filterId: preset.id,
        filterName: preset.name,
        filterBrand: preset.brand
      };
      setPhotos(next);
      showToast(`Preset ${preset.name} diterapkan ke Foto #${idx + 1}`);
    }
  };

  // Apply analog preset to all photos
  const handleApplyFilterToAll = (preset) => {
    const next = photos.map(p => ({
      ...p,
      filterCss: preset.css,
      filterId: preset.id,
      filterName: preset.name,
      filterBrand: preset.brand
    }));
    setPhotos(next);
    showToast(`Preset ${preset.name} diterapkan ke semua foto strip`);
  };

  // Toggle retro date stamp for photo
  const handleToggleDateStamp = (idx = activePhotoIdx) => {
    const next = [...photos];
    if (next[idx]) {
      const d = new Date();
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const stampStr = `'${yy} ${mm} ${dd}`;

      next[idx].dateStamp = next[idx].dateStamp ? null : stampStr;
      setPhotos(next);
      showToast(next[idx].dateStamp ? `Stempel tanggal ditambahkan pada Foto #${idx + 1}` : `Stempel tanggal dilepas dari Foto #${idx + 1}`);
    }
  };

  // Adjust active photo zoom
  const handleZoomChange = (val) => {
    const next = [...photos];
    if (next[activePhotoIdx]) {
      next[activePhotoIdx].zoom = parseFloat(val);
      setPhotos(next);
    }
  };

  // Add sticker to active photo
  const handleAddSticker = (emoji) => {
    const next = [...photos];
    if (!next[activePhotoIdx]) return;
    if (!next[activePhotoIdx].stickers) next[activePhotoIdx].stickers = [];
    next[activePhotoIdx].stickers.push({
      id: Date.now() + Math.random(),
      text: emoji,
      x: 50 + (Math.random() * 20 - 10),
      y: 50 + (Math.random() * 20 - 10),
    });
    setPhotos(next);
    showToast(`Stiker ${emoji} ditambahkan ke Foto ${activePhotoIdx + 1}`);
  };

  // Remove sticker
  const handleRemoveSticker = (photoIdx, stickerId) => {
    const next = [...photos];
    if (next[photoIdx]?.stickers) {
      next[photoIdx].stickers = next[photoIdx].stickers.filter(s => s.id !== stickerId);
      setPhotos(next);
    }
  };

  // Replace photo via file upload
  const handleFileUpload = (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const next = [...photos];
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          dataUrl: event.target.result,
          zoom: 1.0,
          offsetX: 0,
          offsetY: 0
        };
        setPhotos(next);
        showToast(`Foto #${idx + 1} berhasil diganti`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Render high-res strip onto canvas and download
  const handleDownloadHD = async () => {
    showToast('Sedang membuat gambar resolusi tinggi (300 DPI)...');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Strip dimensions: 1200 x 3600 (high res 2x6 photostrip)
    const isGrid = layout === 'grid';
    const cWidth = isGrid ? 1600 : 1200;
    const padding = 60;
    const spacing = 40;
    const footerHeight = 320;

    let photoRects = [];

    if (!isGrid) {
      // 3 cuts vertically
      const photoW = cWidth - padding * 2;
      const photoH = photoW * 0.75;
      const cHeight = padding * 2 + (photoH * 3) + (spacing * 2) + footerHeight;
      canvas.width = cWidth;
      canvas.height = cHeight;

      for (let i = 0; i < 3; i++) {
        photoRects.push({
          x: padding,
          y: padding + i * (photoH + spacing),
          w: photoW,
          h: photoH,
          photo: photos[i] || photos[0]
        });
      }
    } else {
      // 2x2 grid
      const innerW = cWidth - padding * 2;
      const photoW = (innerW - spacing) / 2;
      const photoH = photoW * 0.75;
      const cHeight = padding * 2 + (photoH * 2) + spacing + footerHeight;
      canvas.width = cWidth;
      canvas.height = cHeight;

      photoRects = [
        { x: padding, y: padding, w: photoW, h: photoH, photo: photos[0] },
        { x: padding + photoW + spacing, y: padding, w: photoW, h: photoH, photo: photos[1] || photos[0] },
        { x: padding, y: padding + photoH + spacing, w: photoW, h: photoH, photo: photos[2] || photos[0] },
        { x: padding + photoW + spacing, y: padding + photoH + spacing, w: photoW, h: photoH, photo: photos[3] || photos[0] }
      ];
    }

    // Draw background
    ctx.fillStyle = activeFrame.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load each image
    const loadedImages = await Promise.all(
      photoRects.map(rect => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve({ img, rect });
          img.onerror = () => resolve({ img: null, rect });
          img.src = rect.photo?.dataUrl || '';
        });
      })
    );

    // Draw photos & stickers
    for (const item of loadedImages) {
      const { img, rect } = item;
      const p = rect.photo;
      if (!img) continue;

      ctx.save();
      // Clip to photo box
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();

      // Apply analog filter simulation to high-res canvas
      ctx.filter = p?.filterCss || 'none';

      // Apply zoom & center
      const zoom = p?.zoom || 1.0;
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));

      // Draw image to cover
      const scale = Math.max(rect.w / img.width, rect.h / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offX = rect.x + (rect.w - drawW) / 2;
      const offY = rect.y + (rect.h - drawH) / 2;

      ctx.drawImage(img, offX, offY, drawW, drawH);
      ctx.filter = 'none';
      ctx.restore();

      // Draw retro date stamp on high-res canvas if enabled
      if (p?.dateStamp) {
        ctx.save();
        ctx.font = `bold ${Math.round(rect.w * 0.052)}px 'Courier New', monospace`;
        ctx.fillStyle = '#FF7A00';
        ctx.shadowColor = 'rgba(255, 122, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'right';
        ctx.fillText(p.dateStamp, rect.x + rect.w - 18, rect.y + rect.h - 18);
        ctx.restore();
      }

      // Draw stickers
      if (p?.stickers && p.stickers.length > 0) {
        ctx.save();
        ctx.font = `${rect.w * 0.14}px 'Segoe UI Emoji', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        p.stickers.forEach(s => {
          const sx = rect.x + (s.x / 100) * rect.w;
          const sy = rect.y + (s.y / 100) * rect.h;
          ctx.fillText(s.text, sx, sy);
        });
        ctx.restore();
      }
    }

    // Draw Footer Typography
    const footerY = canvas.height - footerHeight + 60;
    ctx.fillStyle = activeFrame.text;

    // Brand Name
    ctx.font = "bold 52px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('snap.e', padding + 10, footerY + 50);

    // Custom Text Caption
    ctx.font = "italic 500 44px 'Playfair Display', serif";
    ctx.fillText(customText, padding + 10, footerY + 120);

    // Timestamp
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    ctx.font = "400 28px 'Inter', sans-serif";
    ctx.fillStyle = activeFrame.text === '#FFFFFF' ? '#A1A1AA' : '#6B7280';
    ctx.fillText(`${dateStr} • STUDIO ATELIER`, padding + 10, footerY + 175);

    // Mini QR code representation at bottom-right
    if (showQr) {
      const qrSize = 130;
      const qrX = canvas.width - padding - qrSize - 10;
      const qrY = footerY + 40;

      ctx.fillStyle = activeFrame.text === '#FFFFFF' ? '#27272A' : '#E5E7EB';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = activeFrame.text;
      // Decorative barcode-like mini matrix
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if ((r + c) % 2 === 0 || r === 0 || c === 0 || r === 4 || c === 4) {
            ctx.fillRect(qrX + 15 + c * 20, qrY + 15 + r * 20, 16, 16);
          }
        }
      }
    }

    // Trigger real download
    const link = document.createElement('a');
    link.download = `snap_e_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    showToast('Foto HD berhasil diunduh ke perangkat Anda!');
  };

  // Copy share URL
  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Tautan strip foto berhasil disalin!');
  };

  // Handle submit print order
  const handlePrintSubmit = (e) => {
    e.preventDefault();
    if (!customerPhone || !customerAddress) {
      showToast('Mohon lengkapi nomor telepon dan alamat pengiriman!');
      return;
    }

    const newOrder = addOrder({
      customerName: customerName || 'Tamu snap.e',
      phone: customerPhone,
      address: customerAddress,
      paperType: paperType,
      totalPrice: paperType.includes('Scandinavian') ? 48000 : 35000,
      thumbnail: photos[0]?.dataUrl || ''
    });

    setOrderConfirmed(newOrder);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-gray-900 font-sans">
      <Topbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl animate-fadeIn flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400" />
          {toastMessage}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8 items-start justify-center">
        
        {/* LEFT COLUMN: Controls & Customization */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('frame')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'frame' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Bingkai
            </button>
            <button
              onClick={() => setActiveTab('filter')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'filter' ? 'bg-white shadow-xs text-red-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Camera size={13} />
              Filter Analog
            </button>
            <button
              onClick={() => setActiveTab('sticker')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'sticker' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Stiker
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'adjust' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Atur Foto
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'text' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Teks
            </button>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            
            {/* Section 1: Frame Selection */}
            {activeTab === 'frame' && (
              <div>
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-gray-900">Pilih Warna Frame</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Palet estetik minimalis photostrip Anda</p>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {frames.map((f) => {
                    const isSelected = selectedFrameId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFrameId(f.id)}
                        className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 transition-all text-center"
                      >
                        <div
                          className={`w-9 h-9 rounded-full border-2 transition-all ${
                            isSelected ? 'border-gray-900 scale-110 shadow-sm' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: f.bg }}
                        />
                        <span className="text-[10px] font-semibold text-gray-700 truncate w-full">
                          {f.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Analog & Digital Camera Filters */}
            {activeTab === 'filter' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Camera size={15} className="text-red-600" />
                    Preset Kamera Analog & Digital
                  </h3>
                  <p className="text-xs text-gray-500">Simulasi profil warna film Fujifilm, Kodak, Polaroid & CCD</p>
                </div>

                {/* Target Photo Selector */}
                <div className="bg-gray-50 p-2.5 rounded-xl space-y-2 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-700">Target Foto:</span>
                    <button
                      onClick={() => handleToggleDateStamp(activePhotoIdx)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                        photos[activePhotoIdx]?.dateStamp
                          ? 'bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/30'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Calendar size={11} />
                      {photos[activePhotoIdx]?.dateStamp ? 'Stempel Aktif' : '+ Stempel Tanggal'}
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    {photos.slice(0, layout === 'grid' ? 4 : 3).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhotoIdx(i)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex flex-col items-center transition-colors ${
                          activePhotoIdx === i
                            ? 'bg-gray-900 text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>Foto {i + 1}</span>
                        <span className="text-[9px] font-normal opacity-70 truncate max-w-full">
                          {p.filterBrand || 'RAW'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Category Chips */}
                <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1 border-b border-gray-100">
                  {FILTER_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        filterCategory === cat.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Preset Cards List */}
                <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                  {availablePresets
                    .filter(p => filterCategory === 'all' || p.category === filterCategory)
                    .map(preset => {
                      const isCurrentActive = photos[activePhotoIdx]?.filterId === preset.id || photos[activePhotoIdx]?.filterCss === preset.css;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleApplyFilterToPhoto(preset, activePhotoIdx)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isCurrentActive
                              ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900/10'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded text-white"
                                style={{ backgroundColor: preset.accentColor || '#374151' }}
                              >
                                {preset.brand || 'CAM'}
                              </span>
                              <span className="font-bold text-xs text-gray-900">{preset.name}</span>
                            </div>
                            {isCurrentActive && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Terpasang
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 leading-snug">{preset.description}</p>
                          
                          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyFilterToPhoto(preset, activePhotoIdx);
                              }}
                              className="font-bold text-gray-800 hover:text-black"
                            >
                              Terapkan ke Foto #{activePhotoIdx + 1}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyFilterToAll(preset);
                              }}
                              className="font-bold text-red-600 hover:text-red-700 underline text-[10px]"
                            >
                              Terapkan ke Semua Foto
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Section 3: Stickers */}
            {activeTab === 'sticker' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Stiker Esensial</h3>
                    <p className="text-xs text-gray-500">Pasang pada Foto #{activePhotoIdx + 1}</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = [...photos];
                      if (next[activePhotoIdx]) {
                        next[activePhotoIdx].stickers = [];
                        setPhotos(next);
                        showToast(`Stiker di Foto #${activePhotoIdx + 1} dibersihkan`);
                      }
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700"
                  >
                    Reset Stiker
                  </button>
                </div>

                {/* Photo selector indicator */}
                <div className="flex gap-1.5 mb-3">
                  {photos.slice(0, layout === 'grid' ? 4 : 3).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                        activePhotoIdx === i
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Foto {i + 1}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {stickerList.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddSticker(s)}
                      className="w-11 h-11 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-xl flex items-center justify-center text-xl transition-transform active:scale-95 hover:scale-105"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Photo Adjustments (Zoom / Replace) */}
            {activeTab === 'adjust' && (
              <div>
                <div className="mb-3">
                  <h3 className="font-bold text-sm text-gray-900">Sesuaikan Foto #{activePhotoIdx + 1}</h3>
                  <p className="text-xs text-gray-500">Zoom atau ganti gambar dari perangkat</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Zoom Level</span>
                      <span className="font-mono">{photos[activePhotoIdx]?.zoom?.toFixed(1) || 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.2"
                      step="0.1"
                      value={photos[activePhotoIdx]?.zoom || 1.0}
                      onChange={(e) => handleZoomChange(e.target.value)}
                      className="w-full accent-gray-900 cursor-pointer"
                    />
                  </div>

                  <label className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer transition-colors">
                    <Upload size={14} />
                    Ganti Foto #{activePhotoIdx + 1}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, activePhotoIdx)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Section 5: Text & Caption */}
            {activeTab === 'text' && (
              <div>
                <h3 className="font-bold text-sm text-gray-900 mb-3">Teks & Footer Bawah</h3>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Ketik judul memori..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs font-medium outline-none focus:border-gray-900"
                  />

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showBadge}
                        onChange={(e) => setShowBadge(e.target.checked)}
                        className="rounded text-gray-900 focus:ring-gray-900"
                      />
                      Logo snap.e
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showQr}
                        onChange={(e) => setShowQr(e.target.checked)}
                        className="rounded text-gray-900 focus:ring-gray-900"
                      />
                      Mini QR Verifikasi
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* CENTER COLUMN: Interactive Photostrip Preview */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          
          {/* Photostrip Card Container */}
          <div
            ref={stripPreviewRef}
            className={`shadow-2xl rounded-sm p-4 sm:p-5 relative transition-all duration-300 max-w-full ${
              layout === 'grid' ? 'w-[320px] sm:w-[380px]' : 'w-[280px] sm:w-[320px]'
            }`}
            style={{ backgroundColor: activeFrame.bg, color: activeFrame.text }}
          >
            {/* Strip Header */}
            <div className="flex justify-between items-center mb-3 sm:mb-4 px-1 text-[9px] font-bold tracking-widest opacity-70">
              <span>SNAP.E MEMORIES</span>
              <span className="font-mono">#SNP-{Math.floor(1000 + Math.random() * 9000)}</span>
            </div>

            {/* Photos Layout */}
            <div className={layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2.5 sm:space-y-3'}>
              {photos.slice(0, layout === 'grid' ? 4 : 3).map((p, idx) => {
                const isActive = activePhotoIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`aspect-[4/3] bg-gray-200 rounded-xs overflow-hidden relative group cursor-pointer border-2 transition-all ${
                      isActive ? 'border-red-500 shadow-md ring-2 ring-red-500/20' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={p.dataUrl}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={{
                        transform: `scale(${p.zoom || 1.0}) translate(${p.offsetX || 0}px, ${p.offsetY || 0}px)`,
                        filter: p.filterCss || 'none'
                      }}
                    />

                    {/* Pose index badge */}
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-mono px-1 rounded">
                      #{idx + 1}
                    </span>

                    {/* Render stickers on this photo */}
                    {p.stickers?.map((stk) => (
                      <div
                        key={stk.id}
                        className="absolute text-xl sm:text-2xl pointer-events-none select-none -translate-x-1/2 -translate-y-1/2 animate-scaleIn"
                        style={{ left: `${stk.x}%`, top: `${stk.y}%` }}
                      >
                        {stk.text}
                      </div>
                    ))}

                    {/* Quick remove sticker indicator on hover */}
                    {p.stickers?.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSticker(idx, p.stickers[p.stickers.length - 1].id);
                        }}
                        className="absolute top-1 right-1 bg-red-600/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus Stiker Terakhir"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Strip Footer */}
            <div className="mt-5 sm:mt-6 px-1 flex justify-between items-end">
              <div>
                {showBadge && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-600 flex items-center justify-center text-[8px] text-white font-bold">
                      s
                    </div>
                    <span className="font-bold text-[11px] tracking-tight">snap.e atelier</span>
                  </div>
                )}
                <p className="text-[11px] sm:text-xs font-serif italic font-semibold leading-tight max-w-[180px] truncate">
                  {customText}
                </p>
                <p className="text-[8px] sm:text-[9px] font-mono mt-0.5 opacity-70">
                  {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} • JAKARTA
                </p>
              </div>

              {showQr && (
                <div className="w-8 h-8 rounded border border-current/20 flex items-center justify-center p-1 bg-current/5">
                  <div className="w-full h-full grid grid-cols-3 gap-0.5 opacity-80">
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="border border-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Tip: Klik foto pada photostrip untuk memilih foto yang ingin di-zoom atau ditambah stiker.
          </p>
        </div>

        {/* RIGHT COLUMN: Actions & Print Order */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Download Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Simpan & Bagikan</h3>
              <p className="text-xs text-gray-500 mt-0.5">Ekspor gambar tajam kualitas lab cetak</p>
            </div>

            <button
              onClick={handleDownloadHD}
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-gray-900/10 active:scale-98"
            >
              <Download size={16} />
              Unduh Foto HD (300 DPI)
            </button>

            <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-gray-500 outline-none truncate"
              />
              <button
                onClick={handleCopyShareUrl}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border-l border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors shrink-0"
              >
                <Copy size={12} />
                Salin
              </button>
            </div>
          </div>

          {/* Physical Print Order Card */}
          <div className="bg-gradient-to-br from-white to-red-50/40 p-5 sm:p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 bg-red-500 text-white font-bold text-[10px] px-3 py-1 rounded-bl-xl shadow-xs">
              Mulai Rp 35.000
            </div>

            <div className="pt-2">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Printer size={16} className="text-red-600" />
                Pesan Cetak Fisik
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                2x Strip cetak glossy lab DNP + Frame Kayu Scandinavian dikirim langsung ke alamat rumah Anda.
              </p>
            </div>

            <button
              onClick={() => setShowPrintModal(true)}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20 active:scale-98"
            >
              <Printer size={16} />
              Pesan Cetak & Kirim ke Rumah
            </button>
          </div>

        </div>

      </main>

      {/* PRINT ORDER MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => { setShowPrintModal(false); setOrderConfirmed(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            {!orderConfirmed ? (
              <form onSubmit={handlePrintSubmit} className="space-y-4 text-left">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-2">
                    <Printer size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Formulir Cetak Fisik</h3>
                  <p className="text-xs text-gray-500">Hasil jepretan Anda akan dicetak mesin lab berstandar galeri</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Nama Penerima</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Nomor WhatsApp / HP</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Alamat Lengkap Pengiriman</label>
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Jalan, No Rumah, RT/RW, Kelurahan, Kecamatan, Kota"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-900 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Pilihan Paket Cetak</label>
                  <select
                    value={paperType}
                    onChange={(e) => setPaperType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-900"
                  >
                    <option value="Glossy 3R Extended">2x Glossy Strip (3R Extended) - Rp 35.000</option>
                    <option value="Matte Scandinavian Frame">2x Matte Strip + Frame Kayu Oak - Rp 48.000</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition-colors"
                  >
                    Konfirmasi Pesanan Cetak
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pesanan Berhasil Masuk!</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    ID Pesanan: <span className="font-mono font-bold text-gray-900">{orderConfirmed.id}</span>
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 text-left space-y-1">
                  <p><b>Penerima:</b> {orderConfirmed.customerName}</p>
                  <p><b>Paket:</b> {orderConfirmed.paperType}</p>
                  <p><b>Alamat:</b> {orderConfirmed.address}</p>
                </div>
                <p className="text-[11px] text-gray-500">
                  Pesanan telah masuk ke antrean cetak lab studio. Tim kami akan menghubungi melalui WhatsApp.
                </p>
                <button
                  onClick={() => { setShowPrintModal(false); setOrderConfirmed(null); }}
                  className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer - Public Only */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">snap.e</span>
            <span>— Tangible Memories, Synchronized Distances.</span>
          </div>
          <p>© {new Date().getFullYear()} snap.e atelier. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
