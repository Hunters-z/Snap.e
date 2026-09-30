import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { useBooth } from '../context/BoothContext';
import { 
  Download, 
  Printer, 
  Copy, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  X,
  Camera,
  Calendar,
  Move,
  RotateCcw,
  Image as ImageIcon,
  Film,
  Clock,
  Play
} from 'lucide-react';
import { FILTER_CATEGORIES, CAMERA_PRESETS } from '../data/cameraPresets';
import { drawFrameGraphicDecorations } from '../data/defaultFrames';
import { drawCover, formatSessionTime, generateGifFromFrames } from '../utils/photoCaptureHelper';

export default function EditorPhotostrip() {
  const navigate = useNavigate();
  const { 
    appConfig, 
    userName, 
    currentUser, 
    capturedPhotos, 
    updateCapturedPhotos, 
    layout, 
    addOrder,
    sessionTimeRemaining,
    sessionAlbum,
    deletePhotoFromAlbum,
    selectPhotoForSlot
  } = useBooth();

  // Selected frame
  const frames = appConfig.customFrames || [];
  const [selectedFrameId, setSelectedFrameId] = useState(frames[0]?.id || 'cream');
  const activeFrame = frames.find(f => f.id === selectedFrameId) || frames[0] || { bg: '#F9F6F0', text: '#2A2521' };

  const [frameCategory, setFrameCategory] = useState('all'); // 'all' | 'graphic' | 'solid' | 'custom'

  // Live Photos / GIF Download Modal
  const [showLiveDownloadModal, setShowLiveDownloadModal] = useState(false);
  const [isGeneratingStripGif, setIsGeneratingStripGif] = useState(false);

  // Bottom text & styling
  const [customText, setCustomText] = useState('Long Distance Soulmate');
  const [showBadge, setShowBadge] = useState(true);

  // Photos state copied from context
  const [photos, setPhotos] = useState(capturedPhotos);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Synchronize photos whenever capturedPhotos from context changes
  useEffect(() => {
    if (capturedPhotos && capturedPhotos.length > 0) {
      setPhotos(capturedPhotos);
    }
  }, [capturedPhotos]);

  // Filter presets & category
  const availablePresets = appConfig.customFilters?.length > 0 ? appConfig.customFilters : CAMERA_PRESETS;
  const [filterCategory, setFilterCategory] = useState('all');
  const [editorStickerCategory, setEditorStickerCategory] = useState('all');

  // Tab for sidebar ('album' | 'frame' | 'filter' | 'adjust' | 'sticker' | 'text')
  const [activeTab, setActiveTab] = useState('album');

  // Toast & Modals
  const [toastMessage, setToastMessage] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  // Print order form
  const [customerName, setCustomerName] = useState(currentUser?.displayName || userName);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paperType, setPaperType] = useState('Glossy 3R Extended');

  const stripPreviewRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync customerName when currentUser updates
  useEffect(() => {
    if (currentUser?.displayName && (!customerName || customerName === 'Tamu')) {
      setCustomerName(currentUser.displayName);
    }
  }, [currentUser, customerName]);

  // Sync photos to context (debounced by 500ms to eliminate disk I/O stuttering during live dragging)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCapturedPhotos(photos);
    }, 500);
    return () => clearTimeout(timer);
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

  // ==========================================
  // DIRECT TOUCH & POINTER DRAG GESTURE HANDLER
  // ==========================================
  const [dragState, setDragState] = useState(null);

  const handlePointerDown = (e, idx) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    setActivePhotoIdx(idx);

    const container = e.currentTarget.getBoundingClientRect();
    const currentPhoto = photos[idx];
    setDragState({
      idx,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX: currentPhoto?.offsetX || 0,
      initOffsetY: currentPhoto?.offsetY || 0,
      containerW: container.width || 250,
      containerH: container.height || 180,
      zoom: currentPhoto?.zoom || 1.0
    });
  };

  // Global window tracking so dragging never drops or stutters
  useEffect(() => {
    if (!dragState) return;

    const handleGlobalPointerMove = (e) => {
      // 1:1 true responsive displacement
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      const deltaPercentX = (deltaX / dragState.containerW) * 100;
      const deltaPercentY = (deltaY / dragState.containerH) * 100;

      // Allow proportional pan range based on current zoom
      const maxPan = Math.max(75, Math.round((dragState.zoom || 1.0) * 55));
      const newOffsetX = Math.max(-maxPan, Math.min(maxPan, Math.round((dragState.initOffsetX + deltaPercentX) * 10) / 10));
      const newOffsetY = Math.max(-maxPan, Math.min(maxPan, Math.round((dragState.initOffsetY + deltaPercentY) * 10) / 10));

      setPhotos((prev) => {
        const next = [...prev];
        if (next[dragState.idx]) {
          next[dragState.idx] = {
            ...next[dragState.idx],
            offsetX: newOffsetX,
            offsetY: newOffsetY
          };
        }
        return next;
      });
    };

    const handleGlobalPointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [dragState]);

  // Sticker dragging state: allows free dragging anywhere inside the frame slot
  const [dragStickerState, setDragStickerState] = useState(null);

  const handleStickerPointerDown = (e, photoIdx, sticker) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePhotoIdx(photoIdx);

    const slotElem = e.currentTarget.closest('[data-photo-slot]');
    const rect = slotElem ? slotElem.getBoundingClientRect() : { width: 250, height: 180 };

    setDragStickerState({
      photoIdx,
      stickerId: sticker.id,
      startX: e.clientX,
      startY: e.clientY,
      initX: sticker.x ?? 50,
      initY: sticker.y ?? 50,
      containerW: rect.width || 250,
      containerH: rect.height || 180,
    });
  };

  useEffect(() => {
    if (!dragStickerState) return;

    const handleGlobalStickerMove = (e) => {
      const deltaX = e.clientX - dragStickerState.startX;
      const deltaY = e.clientY - dragStickerState.startY;

      const deltaPercentX = (deltaX / dragStickerState.containerW) * 100;
      const deltaPercentY = (deltaY / dragStickerState.containerH) * 100;

      // Free range inside the photo box (clamp between 4% and 96%)
      const newX = Math.max(4, Math.min(96, Math.round((dragStickerState.initX + deltaPercentX) * 10) / 10));
      const newY = Math.max(4, Math.min(96, Math.round((dragStickerState.initY + deltaPercentY) * 10) / 10));

      setPhotos((prev) => {
        const next = [...prev];
        const targetPhoto = next[dragStickerState.photoIdx];
        if (targetPhoto && targetPhoto.stickers) {
          next[dragStickerState.photoIdx] = {
            ...targetPhoto,
            stickers: targetPhoto.stickers.map((s) =>
              s.id === dragStickerState.stickerId ? { ...s, x: newX, y: newY } : s
            )
          };
        }
        return next;
      });
    };

    const handleGlobalStickerUp = () => {
      setDragStickerState(null);
    };

    window.addEventListener('pointermove', handleGlobalStickerMove);
    window.addEventListener('pointerup', handleGlobalStickerUp);
    window.addEventListener('pointercancel', handleGlobalStickerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalStickerMove);
      window.removeEventListener('pointerup', handleGlobalStickerUp);
      window.removeEventListener('pointercancel', handleGlobalStickerUp);
    };
  }, [dragStickerState]);

  // Adjust active photo zoom
  const handleZoomChange = useCallback((val, idx = activePhotoIdx) => {
    const num = Math.max(0.8, Math.min(2.5, Math.round(parseFloat(val) * 100) / 100));
    setPhotos(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          zoom: num
        };
      }
      return next;
    });
  }, [activePhotoIdx]);

  // Adjust zoom step
  const handleZoomStep = (delta, idx = activePhotoIdx) => {
    const curZoom = photos[idx]?.zoom || 1.0;
    handleZoomChange(curZoom + delta, idx);
  };

  // Reset offset and zoom to center
  const handleResetPosition = (idx = activePhotoIdx) => {
    setPhotos(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          offsetX: 0,
          offsetY: 0,
          zoom: 1.0
        };
      }
      return next;
    });
    showToast(`Posisi & zoom Foto #${idx + 1} dikembalikan ke tengah`);
  };

  // Add sticker to active photo (supports emoji or custom image stickers with adjustable scale)
  const handleAddSticker = (stickerItem) => {
    const next = [...photos];
    if (!next[activePhotoIdx]) return;
    if (!next[activePhotoIdx].stickers) next[activePhotoIdx].stickers = [];

    const isObj = typeof stickerItem === 'object';
    const stickerData = {
      id: Date.now() + Math.random(),
      type: isObj ? (stickerItem.type || 'emoji') : 'emoji',
      text: isObj ? (stickerItem.text || '✨') : stickerItem,
      imageUrl: isObj ? (stickerItem.imageUrl || null) : null,
      x: 50 + (Math.random() * 20 - 10),
      y: 50 + (Math.random() * 20 - 10),
      scale: 1.0,
    };

    next[activePhotoIdx].stickers.push(stickerData);
    setPhotos(next);
    showToast(`Stiker ${stickerData.text || 'gambar'} ditambahkan ke Foto ${activePhotoIdx + 1}`);
  };

  // Adjust sticker scale (perbesar / perkecil stiker)
  const handleStickerScale = (photoIdx, stickerId, delta) => {
    setPhotos(prev => {
      const next = [...prev];
      const targetPhoto = next[photoIdx];
      if (targetPhoto && targetPhoto.stickers) {
        next[photoIdx] = {
          ...targetPhoto,
          stickers: targetPhoto.stickers.map(s => {
            if (s.id === stickerId) {
              const cur = s.scale || 1.0;
              const newScale = Math.max(0.4, Math.min(3.0, Math.round((cur + delta) * 10) / 10));
              return { ...s, scale: newScale };
            }
            return s;
          })
        };
      }
      return next;
    });
  };

  // Remove sticker
  const handleRemoveSticker = (photoIdx, stickerId) => {
    const next = [...photos];
    if (next[photoIdx]?.stickers) {
      next[photoIdx].stickers = next[photoIdx].stickers.filter(s => s.id !== stickerId);
      setPhotos(next);
    }
  };

  // Assign photo from session album into selected slot
  const handleAssignPhotoToSlot = (photoItem, slotIdx) => {
    selectPhotoForSlot(slotIdx, photoItem);
    const next = [...photos];
    next[slotIdx] = {
      ...photoItem,
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0,
      stickers: []
    };
    setPhotos(next);
    showToast(`Foto berhasil dipasang pada Slot #${slotIdx + 1}`);
  };

  /**
   * Render high-res strip onto canvas and download (100% un-stretched aspect ratio).
   */
  const handleDownloadHD = async () => {
    showToast('Sedang membuat gambar resolusi tinggi (300 DPI)...');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const isGrid = layout === 'grid';
    const cWidth = isGrid ? 1600 : 1200;
    const padding = 60;
    const spacing = 40;
    const footerHeight = 320;

    let photoRects = [];

    if (!isGrid) {
      // 3 cuts vertically (4:3 aspect ratio each)
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
      // 2x2 grid (4:3 aspect ratio each)
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

      // Apply filter
      ctx.filter = p?.filterCss || 'none';

      // Apply zoom & translation
      const zoom = p?.zoom || 1.0;
      const shiftX = ((p?.offsetX || 0) / 100) * rect.w;
      const shiftY = ((p?.offsetY || 0) / 100) * rect.h;

      ctx.translate(rect.x + rect.w / 2 + shiftX, rect.y + rect.h / 2 + shiftY);
      ctx.scale(zoom, zoom);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));

      // Draw using drawCover to guarantee aspect ratio is never stretched!
      drawCover(ctx, img, rect.x, rect.y, rect.w, rect.h, false);

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

      // Draw stickers (both emoji and custom image stickers with scale support)
      if (p?.stickers && p.stickers.length > 0) {
        for (const s of p.stickers) {
          const sx = rect.x + (s.x / 100) * rect.w;
          const sy = rect.y + (s.y / 100) * rect.h;
          const sScale = s.scale || 1.0;

          if (s.type === 'image' && s.imageUrl) {
            const sImg = new Image();
            sImg.crossOrigin = 'anonymous';
            await new Promise(res => {
              sImg.onload = res;
              sImg.onerror = res;
              sImg.src = s.imageUrl;
            });
            const sSize = rect.w * 0.22 * sScale;
            ctx.drawImage(sImg, sx - sSize / 2, sy - sSize / 2, sSize, sSize);
          } else {
            ctx.save();
            ctx.font = `${rect.w * 0.14 * sScale}px 'Segoe UI Emoji', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.text || '✨', sx, sy);
            ctx.restore();
          }
        }
      }
    }

    // Draw Frame Graphic Decorations
    drawFrameGraphicDecorations(ctx, activeFrame, canvas.width, canvas.height, photoRects);

    // If frame has custom uploaded overlay image
    if (activeFrame.imageUrl) {
      await new Promise((resolve) => {
        const frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        frameImg.onload = () => {
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        frameImg.onerror = () => resolve();
        frameImg.src = activeFrame.imageUrl;
      });
    }

    // Draw Footer Typography
    const footerY = canvas.height - footerHeight + 60;
    ctx.fillStyle = activeFrame.text;

    // Brand Name
    ctx.font = "bold 52px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(appConfig.website?.brandName || 'snap.e', padding + 10, footerY + 50);

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
    ctx.fillText(`${dateStr} • PHOTO STUDIO`, padding + 10, footerY + 175);

    // Trigger download
    const link = document.createElement('a');
    link.download = `snap_e_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    showToast('Foto HD berhasil diunduh ke perangkat Anda!');
  };

  /**
   * Generates and downloads an Animated GIF of the Photostrip.
   */
  const handleDownloadAnimatedStripGif = async () => {
    setIsGeneratingStripGif(true);
    showToast('Sedang membuat Strip GIF bergerak...');

    try {
      const framesList = [];
      const gifWidth = layout === 'grid' ? 400 : 320;
      const gifHeight = layout === 'grid' ? 520 : 640;

      for (let f = 0; f < 5; f++) {
        const canvas = document.createElement('canvas');
        canvas.width = gifWidth;
        canvas.height = gifHeight;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = activeFrame.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw slots with subtle pulse/movement
        const margin = 16;
        const spacing = 10;
        const footerH = 70;
        const innerW = canvas.width - margin * 2;

        if (layout !== 'grid') {
          const itemH = (canvas.height - margin * 2 - footerH - spacing * 2) / 3;
          for (let s = 0; s < 3; s++) {
            const p = photos[s] || photos[0];
            const y = margin + s * (itemH + spacing);

            ctx.save();
            ctx.beginPath();
            ctx.rect(margin, y, innerW, itemH);
            ctx.clip();

            const img = new Image();
            img.src = (f % 2 === 1 && p?.gifUrl) ? p.gifUrl : p?.dataUrl;
            await new Promise(res => { img.onload = res; img.onerror = res; });
            drawCover(ctx, img, margin, y, innerW, itemH, false);

            if (f === s) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.fillRect(margin, y, innerW, itemH);
            }
            ctx.restore();
          }
        } else {
          // 2x2 grid
          const itemW = (innerW - spacing) / 2;
          const itemH = itemW * 0.75;
          for (let s = 0; s < 4; s++) {
            const p = photos[s] || photos[0];
            const col = s % 2;
            const row = Math.floor(s / 2);
            const x = margin + col * (itemW + spacing);
            const y = margin + row * (itemH + spacing);

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, itemW, itemH);
            ctx.clip();
            const img = new Image();
            img.src = p?.dataUrl;
            await new Promise(res => { img.onload = res; img.onerror = res; });
            drawCover(ctx, img, x, y, itemW, itemH, false);
            ctx.restore();
          }
        }

        // Mini footer
        ctx.fillStyle = activeFrame.text;
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.fillText(appConfig.website?.brandName || 'snap.e', margin + 4, canvas.height - 35);
        ctx.font = "italic 11px 'Playfair Display', serif";
        ctx.fillText(customText, margin + 4, canvas.height - 18);

        framesList.push(canvas.toDataURL('image/jpeg', 0.85));
      }

      const gifData = await generateGifFromFrames(framesList, gifWidth, gifHeight, 0.25);
      if (gifData) {
        const link = document.createElement('a');
        link.download = `snap_e_strip_${Date.now()}.gif`;
        link.href = gifData;
        link.click();
        showToast('Strip GIF Bergerak berhasil diunduh!');
      } else {
        showToast('Gagal membuat GIF. Silakan coba kembali.');
      }
    } catch (e) {
      console.warn('Strip GIF generation error:', e);
      showToast('Gagal memproses GIF animasi.');
    } finally {
      setIsGeneratingStripGif(false);
    }
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

      {/* 15-Minute Session Banner with Retake / Add Photo CTA */}
      <div className="bg-gray-900 text-white px-4 py-2 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-gray-300">Sesi Bilik Foto Berjalan</span>
            <div className="flex items-center gap-1.5 font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-full text-amber-300 border border-white/10">
              <Clock size={12} />
              <span>Sisa: {formatSessionTime(sessionTimeRemaining)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/capture')}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
          >
            <Camera size={13} />
            <span>📸 Ambil Foto Lagi / Retake Pose</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl animate-fadeIn flex items-center gap-2">
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
              onClick={() => setActiveTab('album')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'album' ? 'bg-white shadow-xs text-red-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ImageIcon size={13} />
              Album
            </button>
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
                activeTab === 'filter' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Camera size={13} />
              Filter
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
              onClick={() => setActiveTab('text')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'text' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Teks
            </button>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            
            {/* Section 0: TEMPORARY ALBUM & PHOTO SELECTION */}
            {activeTab === 'album' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-red-600" />
                      Pilih Foto dari Album Sesi
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tersimpan {sessionAlbum?.length || 0} jepretan foto selama sesi ini.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/capture')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold rounded-lg border border-red-200 transition-colors shrink-0"
                    title="Buka kamera untuk mengambil pose tambahan"
                  >
                    <Camera size={13} />
                    <span>+ Foto Baru</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {sessionAlbum?.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 space-y-2">
                      <Camera size={28} className="mx-auto text-gray-300" />
                      <p className="text-xs font-semibold">Belum ada foto yang tersimpan di album sesi.</p>
                      <button
                        onClick={() => navigate('/capture')}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                      >
                        Buka Kamera Sekarang
                      </button>
                    </div>
                  ) : (
                    sessionAlbum.map((item, idx) => {
                      const assignedSlot = photos.findIndex(p => p.dataUrl === item.dataUrl);

                      return (
                        <div
                          key={item.id || idx}
                          className={`p-2.5 rounded-xl border transition-all flex gap-3 ${
                            assignedSlot !== -1
                              ? 'border-red-500 bg-red-50/30 ring-1 ring-red-500/20'
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-18 h-20 rounded-lg overflow-hidden relative shrink-0 bg-gray-200 border border-gray-300">
                            <img 
                              src={item.dataUrl} 
                              alt="Album Thumbnail" 
                              className="w-full h-full object-cover" 
                            />
                            {item.gifUrl && (
                              <span className="absolute bottom-1 left-1 bg-purple-600 text-white text-[8px] font-bold px-1 rounded">
                                GIF
                              </span>
                            )}
                          </div>

                          {/* Info and Slot Selection */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <span className="text-[10px] font-mono text-gray-400">
                                  {item.capturedAt || `Foto #${idx + 1}`}
                                </span>
                                <p className="text-xs font-bold text-gray-800 truncate">
                                  {item.filterName || 'Analog Real'}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {assignedSlot !== -1 && (
                                  <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                    Slot #{assignedSlot + 1}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deletePhotoFromAlbum(item.id)}
                                  className="text-gray-400 hover:text-red-500 p-0.5"
                                  title="Hapus foto dari album"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Slot buttons to place into frame */}
                            <div>
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                Pasang ke Frame:
                              </span>
                              <div className="flex gap-1">
                                {Array.from({ length: layout === 'grid' ? 4 : 3 }).map((_, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => handleAssignPhotoToSlot(item, sIdx)}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded border transition-colors ${
                                      assignedSlot === sIdx
                                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                        : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                                    }`}
                                  >
                                    Slot {sIdx + 1}
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Section 1: Frame Selection (Exclusive Studio Curated Frames - NO add frame button) */}
            {activeTab === 'frame' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Pilih Desain Frame</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Koleksi bingkai estetik berstandar studio</p>
                </div>

                {/* Category Filter Chips */}
                <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1 border-b border-gray-100 text-[11px]">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'graphic', label: '🎨 Bergambar' },
                    { id: 'solid', label: '⬛ Solid' },
                    { id: 'custom', label: '⭐ Kustom Studio' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFrameCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                        frameCategory === cat.id
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Frames Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {frames
                    .filter((f) => {
                      if (frameCategory === 'graphic') return f.category === 'graphic' || f.overlayType || f.imageUrl;
                      if (frameCategory === 'solid') return f.category === 'solid' && !f.imageUrl && !f.overlayType;
                      if (frameCategory === 'custom') return f.id.startsWith('frame_') || f.isCustom;
                      return true;
                    })
                    .map((f) => {
                      const isSelected = selectedFrameId === f.id;

                      return (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFrameId(f.id)}
                          className={`relative group p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-gray-900 ring-2 ring-gray-900/20 bg-gray-50/80 shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {/* Top Thumbnail Preview */}
                          <div
                            className="w-full h-11 rounded-lg border border-black/10 overflow-hidden relative flex items-center justify-center text-xs shadow-inner"
                            style={{
                              backgroundColor: f.bg,
                              color: f.text,
                              backgroundImage: f.imageUrl ? `url(${f.imageUrl})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            {!f.imageUrl && (
                              <>
                                {f.overlayType === 'sakura' && <span className="text-base">🌸 Sakura</span>}
                                {f.overlayType === 'film' && <span className="font-mono text-[10px] tracking-widest bg-black/60 px-1 py-0.5 rounded text-amber-400">🎞️ 35MM</span>}
                                {f.overlayType === 'y2k' && <span className="text-sm">✦ Y2K</span>}
                                {f.overlayType === 'cat_cafe' && <span className="text-sm">🐱 Cat Cafe</span>}
                                {f.overlayType === 'botanical' && <span className="text-sm">🌿 Flora</span>}
                                {f.overlayType === 'party' && <span className="text-sm">🎈 Party</span>}
                                {f.overlayType === 'coquette' && <span className="text-sm">🎀 Bow</span>}
                                {f.overlayType === 'doodle' && <span className="text-sm">☕ Cafe</span>}
                                {f.overlayType === 'newspaper' && <span className="font-serif text-[10px] font-bold">📰 TIMES</span>}
                                {!f.overlayType && (
                                  <div
                                    className="w-5 h-5 rounded-full border border-black/20 shadow-xs"
                                    style={{ backgroundColor: f.bg }}
                                  />
                                )}
                              </>
                            )}

                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-gray-900 text-white p-0.5 rounded-full shadow-xs">
                                <CheckCircle2 size={11} className="text-emerald-400" />
                              </div>
                            )}
                          </div>

                          {/* Info bottom */}
                          <div className="mt-1.5 flex items-center justify-between">
                            <div className="truncate pr-1">
                              <p className="text-[11px] font-bold text-gray-800 truncate leading-tight">
                                {f.name}
                              </p>
                              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                {f.badge || (f.imageUrl ? 'KUSTOM' : f.category)}
                              </span>
                            </div>
                          </div>
                        </div>
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
                    Preset Warna Analog
                  </h3>
                  <p className="text-xs text-gray-500">Profil warna film Fujifilm, Kodak, Polaroid & CCD</p>
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
                          {p?.filterBrand || 'RAW'}
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
                              Semua Foto
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Section 3: Stickers (Supports Custom Stickers from Admin) */}
            {activeTab === 'sticker' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Koleksi Stiker Studio</h3>
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

                {/* Category Filter Chips for Stickers */}
                <div className="flex gap-1 overflow-x-auto pb-2 mb-2 text-[10px]">
                  {['all', 'Aesthetic', 'Love', 'Cute', 'Party', 'Studio'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditorStickerCategory(cat)}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                        editorStickerCategory === cat
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat === 'all' ? 'Semua' : cat}
                    </button>
                  ))}
                </div>

                {/* Stickers Grid from appConfig.customStickers */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {(appConfig.customStickers || [])
                    .filter(s => editorStickerCategory === 'all' || s.category === editorStickerCategory)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAddSticker(s)}
                        className="w-12 h-12 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl flex items-center justify-center p-1 transition-transform active:scale-95 hover:scale-105"
                        title={s.name || s.text}
                      >
                        {s.type === 'image' && s.imageUrl ? (
                          <img src={s.imageUrl} alt={s.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-2xl">{s.text || '✨'}</span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Section 4: Text & Caption */}
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
                      Logo {appConfig.website?.brandName || 'snap.e'}
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* CENTER COLUMN: Interactive Photostrip Preview & DOCKED ZOOM/PAN CONTROLLER (Berdampingan) */}
        <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full min-w-0">
          
          {/* Photostrip Card Container */}
          <div
            ref={stripPreviewRef}
            className={`shadow-2xl rounded-sm p-4 sm:p-5 relative transition-all duration-300 max-w-full overflow-hidden shrink-0 ${
              layout === 'grid' ? 'w-[320px] sm:w-[380px]' : 'w-[280px] sm:w-[320px]'
            }`}
            style={{ 
              backgroundColor: activeFrame.bg, 
              color: activeFrame.text,
              backgroundImage: activeFrame.imageUrl && !activeFrame.overlayType ? `url(${activeFrame.imageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Custom Overlay Image if present */}
            {activeFrame.imageUrl && (
              <img
                src={activeFrame.imageUrl}
                alt="Frame Overlay"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20 opacity-95"
              />
            )}

            {/* 35mm Film Sprockets live decoration */}
            {activeFrame.overlayType === 'film' && (
              <>
                <div className="absolute inset-y-0 left-0 w-3 sm:w-4 bg-[#08080A] flex flex-col justify-around py-3 pointer-events-none z-10">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-1.5 sm:w-2 h-2.5 bg-white/90 mx-auto rounded-xs shadow-xs" />
                  ))}
                </div>
                <div className="absolute inset-y-0 right-0 w-3 sm:w-4 bg-[#08080A] flex flex-col justify-around py-3 pointer-events-none z-10">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-1.5 sm:w-2 h-2.5 bg-white/90 mx-auto rounded-xs shadow-xs" />
                  ))}
                </div>
              </>
            )}

            {/* Sakura blossom corner icons */}
            {activeFrame.overlayType === 'sakura' && (
              <>
                <span className="absolute top-1.5 left-2.5 text-base sm:text-lg pointer-events-none z-10 animate-pulse">🌸</span>
                <span className="absolute top-1.5 right-2.5 text-base sm:text-lg pointer-events-none z-10 animate-pulse">🌸</span>
              </>
            )}

            {/* Y2K Stars */}
            {activeFrame.overlayType === 'y2k' && (
              <>
                <span className="absolute top-1.5 left-2 text-sm sm:text-base pointer-events-none z-10 text-purple-600">✦</span>
                <span className="absolute top-1.5 right-2 text-sm sm:text-base pointer-events-none z-10 text-purple-600">✦</span>
                <span className="absolute bottom-16 right-2 text-xs pointer-events-none z-10 text-purple-500">✨</span>
              </>
            )}

            {/* Cat Cafe */}
            {activeFrame.overlayType === 'cat_cafe' && (
              <>
                <span className="absolute top-1 left-2 text-base pointer-events-none z-10">🐱</span>
                <span className="absolute top-1 right-2 text-sm pointer-events-none z-10">🐾</span>
                <span className="absolute bottom-16 right-2 text-xs pointer-events-none z-10">☕</span>
              </>
            )}

            {/* Botanical */}
            {activeFrame.overlayType === 'botanical' && (
              <>
                <span className="absolute top-1.5 left-2 text-base pointer-events-none z-10">🌿</span>
                <span className="absolute top-1.5 right-2 text-base pointer-events-none z-10">🌿</span>
              </>
            )}

            {/* Party Celebration */}
            {activeFrame.overlayType === 'party' && (
              <>
                <span className="absolute top-1 left-2 text-base pointer-events-none z-10">🎈</span>
                <span className="absolute top-1 right-2 text-base pointer-events-none z-10">🎉</span>
              </>
            )}

            {/* Coquette Bow */}
            {activeFrame.overlayType === 'coquette' && (
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-base sm:text-lg pointer-events-none z-10">🎀</span>
            )}

            {/* Strip Header */}
            <div className="flex justify-center items-center mb-3 sm:mb-4 px-1 text-[9px] font-bold tracking-widest opacity-70">
              <span>{activeFrame.overlayType === 'film' ? '► KODAK 400 35MM' : 'SNAP.E MEMORIES'}</span>
            </div>

            {/* Photos Layout (4:3 aspect ratio per box without stretching) */}
            <div className={layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2.5 sm:space-y-3'}>
              {photos.slice(0, layout === 'grid' ? 4 : 3).map((p, idx) => {
                const isActive = activePhotoIdx === idx;
                const isDraggingThis = dragState?.idx === idx;
                return (
                  <div
                    key={idx}
                    data-photo-slot="true"
                    onClick={() => setActivePhotoIdx(idx)}
                    onPointerDown={(e) => handlePointerDown(e, idx)}
                    className={`aspect-[4/3] bg-gray-200 rounded-xs overflow-hidden relative group border-2 transition-all select-none touch-none ${
                      isActive ? 'border-red-500 shadow-md ring-2 ring-red-500/30' : 'border-transparent hover:border-gray-400/50'
                    } ${isDraggingThis ? 'cursor-grabbing' : 'cursor-grab'}`}
                    title="Klik untuk memilih foto. Geser langsung pada foto untuk mengatur posisi, atau geser stiker."
                  >
                    {p?.dataUrl ? (
                      <div 
                        className="w-full h-full relative overflow-hidden pointer-events-none select-none"
                        style={{
                          transform: `translate(${p?.offsetX || 0}%, ${p?.offsetY || 0}%) scale(${p?.zoom || 1.0})`,
                          transformOrigin: 'center center',
                          transition: isDraggingThis ? 'none' : 'transform 0.12s ease-out'
                        }}
                      >
                        <img
                          src={p?.dataUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover pointer-events-none select-none"
                          style={{
                            filter: p?.filterCss || 'none'
                          }}
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-2 text-center pointer-events-none select-none">
                        <Camera size={20} className="text-gray-300 mb-1" />
                        <span className="text-[10px] font-bold font-mono text-gray-500">Slot #{idx + 1}</span>
                        <span className="text-[9px] text-gray-400">Belum ada foto</span>
                      </div>
                    )}

                    {/* Quick Floating Zoom & Reset Toolbar on Slot */}
                    {isActive && (
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-1 rounded-lg border border-white/20 shadow-lg text-white animate-fadeIn"
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleZoomStep(-0.1, idx); }}
                          className="w-5 h-5 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 text-white font-bold active:scale-95 transition-all text-xs"
                          title="Perkecil Zoom"
                        >
                          -
                        </button>
                        <span className="font-mono text-[9px] font-bold px-1 text-amber-300">
                          {(p?.zoom || 1.0).toFixed(1)}x
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleZoomStep(0.1, idx); }}
                          className="w-5 h-5 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 text-white font-bold active:scale-95 transition-all text-xs"
                          title="Perbesar Zoom"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleResetPosition(idx); }}
                          className="w-5 h-5 ml-0.5 rounded flex items-center justify-center bg-white/10 hover:bg-red-600 text-white/80 hover:text-white active:scale-95 transition-all"
                          title="Reset Posisi Tengah"
                        >
                          <RotateCcw size={10} />
                        </button>
                      </div>
                    )}

                    {/* Move drag badge indicator */}
                    <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Move size={10} />
                      <span>Geser Foto / Stiker</span>
                    </div>

                    {/* Pose index badge */}
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-mono px-1 rounded pointer-events-none">
                      #{idx + 1}
                    </span>

                    {/* Draggable stickers on this photo with scale & resize controls */}
                    {p?.stickers?.map((stk) => {
                      const isDraggingThisSticker = dragStickerState?.stickerId === stk.id;
                      const sScale = stk.scale || 1.0;
                      return (
                        <div
                          key={stk.id}
                          onPointerDown={(e) => handleStickerPointerDown(e, idx, stk)}
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute select-none cursor-grab active:cursor-grabbing group/stk z-20 touch-none ${
                            isDraggingThisSticker ? 'z-30 cursor-grabbing ring-2 ring-red-500 rounded-full' : ''
                          }`}
                          style={{
                            left: `${stk.x}%`,
                            top: `${stk.y}%`,
                            transform: `translate(-50%, -50%) scale(${sScale})`,
                            transformOrigin: 'center center'
                          }}
                          title="Tahan dan geser stiker ini ke mana saja di dalam foto"
                        >
                          {stk.type === 'image' && stk.imageUrl ? (
                            <img src={stk.imageUrl} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md pointer-events-none" />
                          ) : (
                            <span className="text-xl sm:text-2xl drop-shadow-md pointer-events-none">{stk.text || '✨'}</span>
                          )}

                          {/* Quick Scale & Delete Controls on sticker hover/touch */}
                          <div 
                            className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/90 backdrop-blur-xs px-2 py-0.5 rounded-full opacity-0 group-hover/stk:opacity-100 transition-opacity shadow-lg pointer-events-auto z-30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStickerScale(idx, stk.id, -0.2);
                              }}
                              className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 text-white font-bold text-[10px] flex items-center justify-center active:scale-90"
                              title="Kecilkan Stiker"
                            >
                              -
                            </button>
                            <span className="text-[8px] font-mono text-amber-300 font-bold px-0.5">
                              {sScale.toFixed(1)}x
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStickerScale(idx, stk.id, 0.2);
                              }}
                              className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 text-white font-bold text-[10px] flex items-center justify-center active:scale-90"
                              title="Besarkan Stiker"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSticker(idx, stk.id);
                              }}
                              className="w-4 h-4 ml-0.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] flex items-center justify-center active:scale-90"
                              title="Hapus Stiker"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick remove last sticker indicator on hover */}
                    {p?.stickers?.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSticker(idx, p.stickers[p.stickers.length - 1].id);
                        }}
                        className="absolute bottom-1 left-1 bg-red-600/80 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        title="Hapus Stiker Terakhir"
                      >
                        <Trash2 size={10} />
                        <span>Hapus Stiker</span>
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
                    <span className="font-bold text-sm sm:text-base tracking-tight leading-none">
                      {appConfig.website?.brandName || 'snap.e'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  </div>
                )}
                <p className="font-serif italic text-xs sm:text-sm font-medium tracking-tight">
                  {customText}
                </p>
                <p className="text-[8px] sm:text-[9px] opacity-75 font-mono mt-0.5">
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • PHOTO STUDIO
                </p>
              </div>
            </div>

          </div>

          {/* 7-Day Temporary Storage Notice Badge */}
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-amber-50/90 border border-amber-200/80 rounded-xl text-amber-900 text-xs w-full max-w-[320px] shadow-xs">
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <Clock size={14} className="text-amber-600 shrink-0" />
              <span>Album Sementara Studio</span>
            </div>
            <span className="text-[10px] font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-mono">
              Bertahan 7 Hari
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: Download & Print Actions */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Unduh & Bagikan Hasil</h3>
              <p className="text-xs text-gray-500 mt-0.5">Ekspor strip foto siap cetak atau share ke media sosial</p>
            </div>

            {/* HD Download PNG */}
            <button
              onClick={handleDownloadHD}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <Download size={15} />
              <span>Unduh Foto Strip HD (PNG)</span>
            </button>

            {/* Strip Animated GIF */}
            <button
              onClick={handleDownloadAnimatedStripGif}
              disabled={isGeneratingStripGif}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20 active:scale-98 disabled:opacity-50"
            >
              <Film size={15} />
              <span>{isGeneratingStripGif ? 'Memproses Strip GIF...' : 'Unduh Strip Bergerak (GIF)'}</span>
            </button>

            {/* Live Photos Per Pose Modal */}
            <button
              onClick={() => setShowLiveDownloadModal(true)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-gray-200"
            >
              <ImageIcon size={15} className="text-red-600" />
              <span>Unduh Foto Live / GIF Per Pose</span>
            </button>

            {/* Copy Share Link */}
            <button
              onClick={handleCopyShareUrl}
              className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Copy size={15} />
              <span>Salin Tautan Strip Foto</span>
            </button>

            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => navigate('/capture')}
                className="w-full py-2 text-xs font-bold text-red-600 hover:text-red-700 flex items-center justify-center gap-1.5"
              >
                <Camera size={13} />
                <span>Foto Ulang / Retake Sesi</span>
              </button>
            </div>
          </div>

          {/* Physical Print Ordering */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <div className="pt-1">
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

      {/* INDIVIDUAL LIVE PHOTO & GIF DOWNLOAD MODAL */}
      {showLiveDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Film size={18} className="text-purple-600" />
                  Unduh Foto Gerak & GIF Album Sesi
                </h3>
                <p className="text-xs text-gray-500">Pilih foto pose untuk diunduh sebagai animasi GIF atau video live.</p>
              </div>
              <button
                onClick={() => setShowLiveDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {sessionAlbum?.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Belum ada foto dalam album sesi.</p>
              ) : (
                sessionAlbum.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 relative">
                        <img src={item.gifUrl || item.dataUrl} alt="Pose Thumbnail" className="w-full h-full object-cover" />
                        {item.gifUrl && (
                          <span className="absolute bottom-0.5 right-0.5 text-[7px] bg-purple-600 text-white px-1 rounded font-bold">
                            GIF
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Pose #{idx + 1}</p>
                        <p className="text-[10px] text-gray-500">{item.filterName || 'Analog'} • {item.capturedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.gifUrl && (
                        <a
                          href={item.gifUrl}
                          download={`snap_e_pose_${idx + 1}.gif`}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Download size={12} />
                          Unduh GIF
                        </a>
                      )}
                      {item.liveVideoUrl && (
                        <a
                          href={item.liveVideoUrl}
                          download={`snap_e_live_${idx + 1}.webm`}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Play size={12} />
                          Live Video
                        </a>
                      )}
                      <a
                        href={item.dataUrl}
                        download={`snap_e_photo_${idx + 1}.jpg`}
                        className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Download size={12} />
                        Foto HD
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => setShowLiveDownloadModal(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{appConfig.website?.brandName || 'snap.e'}</span>
            <span>— {appConfig.website?.heroTagline || 'Tangible Memories, Synchronized Distances.'}</span>
          </div>
          <p>© {new Date().getFullYear()} {appConfig.website?.brandName || 'snap.e'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
