import { useState, useRef, useEffect } from 'react';
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
  Image as ImageIcon,
  Film,
  Clock,
  Play,
  RotateCcw,
  Move
} from 'lucide-react';
import { FILTER_CATEGORIES, CAMERA_PRESETS } from '../data/cameraPresets';
import { drawFrameGraphicDecorations } from '../data/defaultFrames';
import { formatSessionTime, generateGifFromFrames } from '../utils/photoCaptureHelper';

export default function EditorPhotostrip() {
  const navigate = useNavigate();
  const { 
    appConfig, 
    userName, 
    currentUser, 
    capturedPhotos, 
    updateCapturedPhotos, 
    layout, 
    setLayout,
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
  const [showDate, setShowDate] = useState(true);

  // Frame & Photo Orientation (Mode Portrait)
  const [photoOrientation, setPhotoOrientation] = useState('portrait'); // 'portrait' (3:4 tegak) | 'square' (1:1) | 'classic' (4:3)
  const isSingleStrip = layout.startsWith('strip_');
  const totalSlots = layout === 'strip_3cut' ? 3 : layout === 'strip_4cut' ? 4 : layout === '4r_6cut' ? 6 : 4;

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

  // Tab for sidebar ('album' | 'frame' | 'filter' | 'text')
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

  // Unduh Template Frame PNG Ukuran Fix Portrait dengan cutout transparan foto
  const handleDownloadFrameTemplatePng = () => {
    const isStrip = layout.startsWith('strip_');
    const is4R6 = layout === '4r_6cut';
    const isStrip4 = layout === 'strip_4cut';
    const canvasW = isStrip ? 600 : 1200;
    const canvasH = 1800;

    showToast(`Menyiapkan template frame PNG fix ${isStrip ? 'Strip Portrait (600x1800)' : '4R Portrait (1200x1800)'}...`);
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = activeFrame.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cutLineX = 600;
    const photoW = 510;
    const leftColX = 45;
    const rightColX = 645;

    let rects = [];
    if (isStrip) {
      if (isStrip4) {
        const photoH = 345;
        const topPadding = 75;
        const spacing = 22;
        for (let i = 0; i < 4; i++) {
          rects.push({ x: leftColX, y: topPadding + i * (photoH + spacing), w: photoW, h: photoH });
        }
      } else {
        const photoH = 440;
        const topPadding = 80;
        const spacing = 35;
        for (let i = 0; i < 3; i++) {
          rects.push({ x: leftColX, y: topPadding + i * (photoH + spacing), w: photoW, h: photoH });
        }
      }
    } else if (is4R6) {
      const photoH = 385;
      const topPadding = 75;
      const spacing = 25;
      for (let i = 0; i < 3; i++) {
        rects.push({ x: leftColX, y: topPadding + i * (photoH + spacing), w: photoW, h: photoH });
        rects.push({ x: rightColX, y: topPadding + i * (photoH + spacing), w: photoW, h: photoH });
      }
    } else {
      const photoH = 500;
      const topPadding = 90;
      const spacing = 40;
      for (let i = 0; i < 2; i++) {
        rects.push({ x: leftColX, y: topPadding + i * (photoH + spacing), w: photoW, h: photoH });
        rects.push({ x: rightColX, y: topPadding + i * (photoH + spacing), w: photoW, h: photoH });
      }
    }

    // Cutout transparent slot boxes so frame is a true fixed PNG overlay
    for (const r of rects) {
      ctx.clearRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = activeFrame.text === '#FFFFFF' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 3;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }

    // Draw center cut line with scissors (only for dual-strip 4R)
    if (!isStrip) {
      ctx.save();
      ctx.strokeStyle = activeFrame.text === '#FFFFFF' ? 'rgba(255,255,255,0.45)' : 'rgba(239,68,68,0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(cutLineX, 20);
      ctx.lineTo(cutLineX, 1780);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = activeFrame.text === '#FFFFFF' ? '#FFFFFF' : '#EF4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✂', cutLineX, 40);
      ctx.fillText('✂', cutLineX, 900);
      ctx.fillText('✂', cutLineX, 1760);
      ctx.restore();
    }

    // Draw footer for portrait strips
    const colCenters = isStrip ? [300] : [300, 900];
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    for (const cx of colCenters) {
      ctx.save();
      ctx.fillStyle = activeFrame.text;
      ctx.textAlign = 'center';
      ctx.font = "bold 38px 'Inter', sans-serif";
      ctx.fillText(appConfig.website?.brandName || 'snap.e', cx, 1800 - 150);

      ctx.font = "italic 500 32px 'Playfair Display', serif";
      ctx.fillText(customText || 'Tangible Memories', cx, 1800 - 95);

      if (showDate) {
        ctx.font = "400 22px 'Inter', sans-serif";
        ctx.fillStyle = activeFrame.text === '#FFFFFF' ? '#A1A1AA' : '#6B7280';
        ctx.fillText(`${dateStr} • PHOTO STUDIO`, cx, 1800 - 50);
      }
      ctx.restore();
    }

    // Trigger PNG download
    const link = document.createElement('a');
    link.download = `frame_${isStrip ? 'strip' : '4r'}_portrait_${activeFrame.id}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast(`Template frame PNG fix ${isStrip ? 'Strip Portrait' : '4R Portrait'} berhasil diunduh!`);
  };

  // ==========================================
  // DIRECT TOUCH & POINTER DRAG & ZOOM GESTURE HANDLER
  // ==========================================
  const [dragState, setDragState] = useState(null);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [stickerFilterCategory, setStickerFilterCategory] = useState('all');

  // Pointer drag listener on window for ultra-smooth live pan and sticker placement
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      if (dragState.type === 'pan') {
        const deltaPxX = e.clientX - dragState.startX;
        const deltaPxY = e.clientY - dragState.startY;
        
        // Convert to percentage of slot size
        const deltaPercentX = (deltaPxX / (dragState.slotW || 200)) * 100;
        const deltaPercentY = (deltaPxY / (dragState.slotH || 150)) * 100;

        const newX = Math.max(-80, Math.min(80, dragState.startOffsetX + deltaPercentX));
        const newY = Math.max(-80, Math.min(80, dragState.startOffsetY + deltaPercentY));

        setPhotos(prev => {
          const next = [...prev];
          if (next[dragState.slotIdx]) {
            next[dragState.slotIdx] = {
              ...next[dragState.slotIdx],
              offsetX: Math.round(newX * 10) / 10,
              offsetY: Math.round(newY * 10) / 10
            };
          }
          return next;
        });
      } else if (dragState.type === 'sticker') {
        const deltaPxX = e.clientX - dragState.startX;
        const deltaPxY = e.clientY - dragState.startY;

        const deltaPercentX = (deltaPxX / (dragState.slotW || 200)) * 100;
        const deltaPercentY = (deltaPxY / (dragState.slotH || 150)) * 100;

        const newX = Math.max(5, Math.min(95, dragState.startStkX + deltaPercentX));
        const newY = Math.max(5, Math.min(95, dragState.startStkY + deltaPercentY));

        setPhotos(prev => {
          const next = [...prev];
          if (next[dragState.slotIdx]) {
            const nextStickers = (next[dragState.slotIdx].stickers || []).map(stk => {
              if (stk.id === dragState.stickerId) {
                return {
                  ...stk,
                  x: Math.round(newX * 10) / 10,
                  y: Math.round(newY * 10) / 10
                };
              }
              return stk;
            });
            next[dragState.slotIdx] = {
              ...next[dragState.slotIdx],
              stickers: nextStickers
            };
          }
          return next;
        });
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState]);

  // Pointer down on photo slot for panning
  const handlePhotoPointerDown = (e, slotIdx) => {
    // If clicking a sticker or button inside slot, do not start photo pan
    if (e.target.closest('[data-sticker-item]') || e.target.closest('button')) return;
    setActivePhotoIdx(slotIdx);

    const slotEl = e.currentTarget;
    const rect = slotEl.getBoundingClientRect();
    const curP = photos[slotIdx] || {};

    setDragState({
      type: 'pan',
      slotIdx,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: curP.offsetX || 0,
      startOffsetY: curP.offsetY || 0,
      slotW: rect.width || 200,
      slotH: rect.height || 150
    });
  };

  // Pointer down on sticker item for sticker drag
  const handleStickerPointerDown = (e, slotIdx, stickerId) => {
    e.stopPropagation();
    setActivePhotoIdx(slotIdx);
    setSelectedStickerId(stickerId);

    const slotEl = e.currentTarget.closest('[data-photo-slot]');
    const rect = slotEl ? slotEl.getBoundingClientRect() : { width: 200, height: 150 };
    const curStk = (photos[slotIdx]?.stickers || []).find(s => s.id === stickerId);
    if (!curStk) return;

    setDragState({
      type: 'sticker',
      slotIdx,
      stickerId,
      startX: e.clientX,
      startY: e.clientY,
      startStkX: curStk.x ?? 50,
      startStkY: curStk.y ?? 50,
      slotW: rect.width || 200,
      slotH: rect.height || 150
    });
  };

  // Wheel zoom
  const handleSlotWheel = (e, slotIdx) => {
    e.preventDefault();
    setActivePhotoIdx(slotIdx);
    const p = photos[slotIdx] || {};
    const curZoom = p.zoom || 1.0;
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    handleZoomChange(slotIdx, curZoom + delta);
  };

  // Zoom change
  const handleZoomChange = (slotIdx, val) => {
    const clamped = Math.max(1.0, Math.min(3.0, parseFloat(Number(val).toFixed(2))));
    setPhotos(prev => {
      const next = [...prev];
      if (next[slotIdx]) {
        next[slotIdx] = { ...next[slotIdx], zoom: clamped };
      }
      return next;
    });
  };

  // Step zoom (+ / -)
  const handleStepZoom = (slotIdx, step) => {
    const p = photos[slotIdx] || {};
    const cur = p.zoom || 1.0;
    handleZoomChange(slotIdx, cur + step);
  };

  // Fitur Reset Posisi Geser & Zoom Foto
  const handleResetPhotoAdjust = (slotIdx = activePhotoIdx) => {
    setPhotos(prev => {
      const next = [...prev];
      if (next[slotIdx]) {
        next[slotIdx] = {
          ...next[slotIdx],
          zoom: 1.0,
          offsetX: 0,
          offsetY: 0
        };
      }
      return next;
    });
    showToast(`Posisi dan zoom Foto #${slotIdx + 1} berhasil direset (1.0x, tengah)`);
  };

  // Reset semua foto sekaligus
  const handleResetAllPhotosAdjust = () => {
    setPhotos(prev => prev.map(p => ({
      ...p,
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0
    })));
    showToast('Semua foto telah direset ke posisi normal & zoom 1.0x');
  };

  // Available stickers from appConfig or default
  const availableStickers = appConfig.customStickers?.length > 0 ? appConfig.customStickers : (appConfig.stickers || []);

  const handleAddSticker = (stkItem, slotIdx = activePhotoIdx) => {
    setPhotos(prev => {
      const next = [...prev];
      if (!next[slotIdx]) return prev;
      const curList = Array.isArray(next[slotIdx].stickers) ? next[slotIdx].stickers : [];
      const newStk = {
        id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: stkItem.type || 'emoji',
        text: stkItem.text || '✨',
        imageUrl: stkItem.imageUrl || null,
        name: stkItem.name || 'Stiker',
        x: 50 + (Math.random() * 16 - 8),
        y: 50 + (Math.random() * 16 - 8),
        size: 32,
        rotation: 0
      };
      next[slotIdx] = {
        ...next[slotIdx],
        stickers: [...curList, newStk]
      };
      setSelectedStickerId(newStk.id);
      return next;
    });
    showToast(`Stiker ${stkItem.text || stkItem.name} ditambahkan ke Foto #${slotIdx + 1}`);
  };

  const handleRemoveSticker = (slotIdx, stkId) => {
    setPhotos(prev => {
      const next = [...prev];
      if (!next[slotIdx]) return prev;
      next[slotIdx] = {
        ...next[slotIdx],
        stickers: (next[slotIdx].stickers || []).filter(s => s.id !== stkId)
      };
      return next;
    });
    if (selectedStickerId === stkId) setSelectedStickerId(null);
    showToast('Stiker dihapus');
  };

  const handleClearSlotStickers = (slotIdx = activePhotoIdx) => {
    setPhotos(prev => {
      const next = [...prev];
      if (!next[slotIdx]) return prev;
      next[slotIdx] = {
        ...next[slotIdx],
        stickers: []
      };
      return next;
    });
    setSelectedStickerId(null);
    showToast(`Semua stiker Foto #${slotIdx + 1} dibersihkan`);
  };

  const handleChangeStickerSize = (slotIdx, stkId, delta) => {
    setPhotos(prev => {
      const next = [...prev];
      if (!next[slotIdx]) return prev;
      next[slotIdx] = {
        ...next[slotIdx],
        stickers: (next[slotIdx].stickers || []).map(s => {
          if (s.id === stkId) {
            return { ...s, size: Math.max(16, Math.min(72, (s.size || 32) + delta)) };
          }
          return s;
        })
      };
      return next;
    });
  };

  // Assign photo from session album into selected slot
  const handleAssignPhotoToSlot = (photoItem, slotIdx) => {
    selectPhotoForSlot(slotIdx, photoItem);
    const next = [...photos];
    next[slotIdx] = {
      ...photoItem,
      zoom: photoItem.zoom ?? 1.0,
      offsetX: photoItem.offsetX ?? 0,
      offsetY: photoItem.offsetY ?? 0,
      stickers: Array.isArray(photoItem.stickers) ? photoItem.stickers : []
    };
    setPhotos(next);
    showToast(`Foto berhasil dipasang pada Slot #${slotIdx + 1}`);
  };

  /**
   * Render high-res strip onto canvas and download (100% un-stretched aspect ratio).
   */
  const handleDownloadHD = async () => {
    const isStrip = layout.startsWith('strip_');
    const is4R6Cut = layout === '4r_6cut';
    const isStrip4 = layout === 'strip_4cut';

    showToast(`Sedang membuat gambar resolusi tinggi ${isStrip ? 'Strip Portrait (600x1800)' : '4R Portrait (1200x1800)'} (300 DPI)...`);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const cWidth = isStrip ? 600 : 1200;
    const cHeight = 1800;
    const cutLineX = 600;
    const photoW = 510;
    const leftColX = 45;
    const rightColX = 645;

    canvas.width = cWidth;
    canvas.height = cHeight;

    let photoRects = [];

    if (isStrip) {
      if (isStrip4) {
        // Single Strip (600 x 1800): 4 photos vertically
        const photoH = 345;
        const topPadding = 75;
        const spacing = 22;
        for (let i = 0; i < 4; i++) {
          photoRects.push({
            x: leftColX,
            y: topPadding + i * (photoH + spacing),
            w: photoW,
            h: photoH,
            photo: photos[i] || photos[0]
          });
        }
      } else {
        // Single Strip (600 x 1800): 3 photos vertically
        const photoH = 440;
        const topPadding = 80;
        const spacing = 35;
        for (let i = 0; i < 3; i++) {
          photoRects.push({
            x: leftColX,
            y: topPadding + i * (photoH + spacing),
            w: photoW,
            h: photoH,
            photo: photos[i] || photos[0]
          });
        }
      }
    } else if (is4R6Cut) {
      // 4R Portrait (1200 x 1800): Left Strip (3 photos) and Right Strip (3 photos)
      const photoH = 385;
      const topPadding = 75;
      const spacing = 25;

      // Left 3 photos
      for (let i = 0; i < 3; i++) {
        photoRects.push({
          x: leftColX,
          y: topPadding + i * (photoH + spacing),
          w: photoW,
          h: photoH,
          photo: photos[i] || photos[0]
        });
      }
      // Right 3 photos
      for (let i = 0; i < 3; i++) {
        photoRects.push({
          x: rightColX,
          y: topPadding + i * (photoH + spacing),
          w: photoW,
          h: photoH,
          photo: photos[i + 3] || photos[i] || photos[0]
        });
      }
    } else {
      // 4R Portrait (1200 x 1800): Left Strip (2 photos) and Right Strip (2 photos)
      const photoH = 500;
      const topPadding = 90;
      const spacing = 40;

      // Left 2 photos
      for (let i = 0; i < 2; i++) {
        photoRects.push({
          x: leftColX,
          y: topPadding + i * (photoH + spacing),
          w: photoW,
          h: photoH,
          photo: photos[i] || photos[0]
        });
      }
      // Right 2 photos
      for (let i = 0; i < 2; i++) {
        photoRects.push({
          x: rightColX,
          y: topPadding + i * (photoH + spacing),
          w: photoW,
          h: photoH,
          photo: photos[i + 2] || photos[i] || photos[0]
        });
      }
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

    // Draw photos (with zoom, pan offset, filters and stickers)
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

      const zoom = p?.zoom || 1.0;
      const offX = ((p?.offsetX || 0) / 100) * rect.w;
      const offY = ((p?.offsetY || 0) / 100) * rect.h;

      const sWidth = img.naturalWidth || img.width || rect.w;
      const sHeight = img.naturalHeight || img.height || rect.h;
      const targetRatio = rect.w / rect.h;
      const sourceRatio = sWidth / sHeight;

      let baseW = rect.w;
      let baseH = rect.h;
      if (sourceRatio > targetRatio) {
        baseW = rect.h * sourceRatio;
      } else {
        baseH = rect.w / sourceRatio;
      }

      const drawW = baseW * zoom;
      const drawH = baseH * zoom;
      const drawX = rect.x + (rect.w - drawW) / 2 + offX;
      const drawY = rect.y + (rect.h - drawH) / 2 + offY;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.filter = 'none';

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

      // Draw stickers for this slot onto HD canvas
      if (p?.stickers && p.stickers.length > 0) {
        const scaleFactor = rect.w / 200; // ratio from preview slot to HD canvas
        for (const stk of p.stickers) {
          ctx.save();
          const stkX = rect.x + ((stk.x ?? 50) / 100) * rect.w;
          const stkY = rect.y + ((stk.y ?? 50) / 100) * rect.h;
          const stkSize = (stk.size || 32) * scaleFactor;

          if (stk.type === 'emoji' || stk.text) {
            ctx.font = `${Math.round(stkSize)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stk.text, stkX, stkY);
          } else if (stk.imageUrl) {
            const stkImg = new Image();
            stkImg.crossOrigin = 'anonymous';
            stkImg.src = stk.imageUrl;
            await new Promise(r => { stkImg.onload = r; stkImg.onerror = r; });
            ctx.drawImage(stkImg, stkX - stkSize / 2, stkY - stkSize / 2, stkSize, stkSize);
          }
          ctx.restore();
        }
      }

      ctx.restore();
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

    // Draw Dotted Center Cut Line for 4R portrait format (not for single strip)
    if (!isStrip) {
      ctx.save();
      ctx.strokeStyle = activeFrame.text === '#FFFFFF' ? 'rgba(255,255,255,0.45)' : 'rgba(239,68,68,0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(cutLineX, 20);
      ctx.lineTo(cutLineX, canvas.height - 20);
      ctx.stroke();

      // Scissors symbol
      ctx.setLineDash([]);
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = activeFrame.text === '#FFFFFF' ? '#FFFFFF' : '#EF4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✂', cutLineX, 40);
      ctx.fillText('✂', cutLineX, canvas.height / 2);
      ctx.fillText('✂', cutLineX, canvas.height - 40);
      ctx.restore();
    }

    // Draw Footer Typography
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Draw footer on Left Strip & Right Strip (centers at 300 and 900) or Single Strip (center at 300)
    const colCenters = isStrip ? [300] : [300, 900];
    for (const cx of colCenters) {
      ctx.save();
      ctx.fillStyle = activeFrame.text;
      ctx.textAlign = 'center';
      
      // Brand name
      ctx.font = "bold 38px 'Inter', sans-serif";
      ctx.fillText(appConfig.website?.brandName || 'snap.e', cx, canvas.height - 150);

      // Custom caption
      ctx.font = "italic 500 32px 'Playfair Display', serif";
      ctx.fillText(customText, cx, canvas.height - 95);

      // Date & Studio (if showDate is true)
      if (showDate) {
        ctx.font = "400 22px 'Inter', sans-serif";
        ctx.fillStyle = activeFrame.text === '#FFFFFF' ? '#A1A1AA' : '#6B7280';
        ctx.fillText(`${dateStr} • PHOTO STUDIO`, cx, canvas.height - 50);
      }
      ctx.restore();
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `snap_e_${isStrip ? 'strip' : '4R'}_portrait_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    showToast(`Foto HD ${isStrip ? 'Strip Portrait' : '4R Portrait'} berhasil diunduh ke perangkat Anda!`);
  };

  /**
   * Generates and downloads an Animated GIF of the Portrait Photostrip.
   */
  const handleDownloadAnimatedStripGif = async () => {
    setIsGeneratingStripGif(true);
    const isStrip = layout.startsWith('strip_');
    const is4R6 = layout === '4r_6cut';
    const isStrip4 = layout === 'strip_4cut';

    showToast(`Sedang membuat Strip GIF ${isStrip ? 'Strip Portrait' : '4R Portrait'} bergerak...`);

    try {
      const framesList = [];
      const gifWidth = isStrip ? 160 : 320;
      const gifHeight = 480;

      for (let f = 0; f < 5; f++) {
        const canvas = document.createElement('canvas');
        canvas.width = gifWidth;
        canvas.height = gifHeight;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = activeFrame.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cutX = 160;
        const col1X = 12;
        const col2X = 172;
        const itemW = 136;

        const countPerCol = isStrip ? (isStrip4 ? 4 : 3) : (is4R6 ? 3 : 2);
        const itemH = isStrip ? (isStrip4 ? 88 : 118) : (is4R6 ? 102 : 136);
        const topY = isStrip ? (isStrip4 ? 18 : 20) : (is4R6 ? 20 : 25);
        const sp = isStrip ? (isStrip4 ? 6 : 9) : (is4R6 ? 7 : 12);

        // Draw left col photos (or single strip photos)
        for (let s = 0; s < countPerCol; s++) {
          const p = photos[s] || photos[0];
          const y = topY + s * (itemH + sp);

          ctx.save();
          ctx.beginPath();
          ctx.rect(col1X, y, itemW, itemH);
          ctx.clip();
          const img = new Image();
          img.src = (f % 2 === 1 && p?.gifUrl) ? p.gifUrl : p?.dataUrl;
          await new Promise(res => { img.onload = res; img.onerror = res; });

          const zoom = p?.zoom || 1.0;
          const offX = ((p?.offsetX || 0) / 100) * itemW;
          const offY = ((p?.offsetY || 0) / 100) * itemH;
          const sW = img.naturalWidth || img.width || itemW;
          const sH = img.naturalHeight || img.height || itemH;
          const targetR = itemW / itemH;
          const sourceR = sW / sH;
          let bW = itemW;
          let bH = itemH;
          if (sourceR > targetR) {
            bW = itemH * sourceR;
          } else {
            bH = itemW / sourceR;
          }
          const dW = bW * zoom;
          const dH = bH * zoom;
          const dX = col1X + (itemW - dW) / 2 + offX;
          const dY = y + (itemH - dH) / 2 + offY;
          ctx.drawImage(img, dX, dY, dW, dH);

          // Stickers on GIF
          if (p?.stickers && p.stickers.length > 0) {
            const sc = itemW / 200;
            for (const stk of p.stickers) {
              const stkX = col1X + ((stk.x ?? 50) / 100) * itemW;
              const stkY = y + ((stk.y ?? 50) / 100) * itemH;
              const stkSize = (stk.size || 28) * sc;
              if (stk.type === 'emoji' || stk.text) {
                ctx.font = `${Math.round(stkSize)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(stk.text, stkX, stkY);
              }
            }
          }

          ctx.restore();
        }

        // Draw right col photos (only for 4R)
        if (!isStrip) {
          for (let s = 0; s < countPerCol; s++) {
            const p = photos[s + countPerCol] || photos[s] || photos[0];
            const y = topY + s * (itemH + sp);

            ctx.save();
            ctx.beginPath();
            ctx.rect(col2X, y, itemW, itemH);
            ctx.clip();
            const img = new Image();
            img.src = (f % 2 === 1 && p?.gifUrl) ? p.gifUrl : p?.dataUrl;
            await new Promise(res => { img.onload = res; img.onerror = res; });

            const zoom = p?.zoom || 1.0;
            const offX = ((p?.offsetX || 0) / 100) * itemW;
            const offY = ((p?.offsetY || 0) / 100) * itemH;
            const sW = img.naturalWidth || img.width || itemW;
            const sH = img.naturalHeight || img.height || itemH;
            const targetR = itemW / itemH;
            const sourceR = sW / sH;
            let bW = itemW;
            let bH = itemH;
            if (sourceR > targetR) {
              bW = itemH * sourceR;
            } else {
              bH = itemW / sourceR;
            }
            const dW = bW * zoom;
            const dH = bH * zoom;
            const dX = col2X + (itemW - dW) / 2 + offX;
            const dY = y + (itemH - dH) / 2 + offY;
            ctx.drawImage(img, dX, dY, dW, dH);

            // Stickers on GIF
            if (p?.stickers && p.stickers.length > 0) {
              const sc = itemW / 200;
              for (const stk of p.stickers) {
                const stkX = col2X + ((stk.x ?? 50) / 100) * itemW;
                const stkY = y + ((stk.y ?? 50) / 100) * itemH;
                const stkSize = (stk.size || 28) * sc;
                if (stk.type === 'emoji' || stk.text) {
                  ctx.font = `${Math.round(stkSize)}px sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(stk.text, stkX, stkY);
                }
              }
            }

            ctx.restore();
          }

          // Dotted Center Cut Line
          ctx.save();
          ctx.strokeStyle = activeFrame.text === '#FFFFFF' ? 'rgba(255,255,255,0.45)' : 'rgba(239,68,68,0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(cutX, 8);
          ctx.lineTo(cutX, gifHeight - 8);
          ctx.stroke();
          ctx.restore();
        }

        // Mini footers (centers at 80 for strip, 80 and 240 for 4R)
        ctx.fillStyle = activeFrame.text;
        ctx.textAlign = 'center';
        ctx.font = "bold 10px 'Inter', sans-serif";
        ctx.fillText(appConfig.website?.brandName || 'snap.e', 80, gifHeight - 32);
        if (!isStrip) {
          ctx.fillText(appConfig.website?.brandName || 'snap.e', 240, gifHeight - 32);
        }
        ctx.font = "italic 9px 'Playfair Display', serif";
        ctx.fillText(customText, 80, gifHeight - 18);
        if (!isStrip) {
          ctx.fillText(customText, 240, gifHeight - 18);
        }
        if (showDate) {
          ctx.font = "7px 'Inter', sans-serif";
          ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), 80, gifHeight - 7);
          if (!isStrip) {
            ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), 240, gifHeight - 7);
          }
        }

        framesList.push(canvas.toDataURL('image/jpeg', 0.85));
      }

      const gifData = await generateGifFromFrames(framesList, gifWidth, gifHeight, 0.25);
      if (gifData) {
        const link = document.createElement('a');
        link.download = `snap_e_${isStrip ? 'strip' : '4R'}_animated_${Date.now()}.gif`;
        link.href = gifData;
        link.click();
        showToast(`Strip GIF ${isStrip ? 'Strip Portrait' : '4R Portrait'} berhasil diunduh!`);
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

  // Render a single photo slot inside the frame (direct gestures, in-frame controls, stickers)
  const renderPhotoSlot = (idx) => {
    const p = photos[idx];
    const isActive = activePhotoIdx === idx;
    const isAdjusted = (p?.zoom && p.zoom !== 1.0) || (p?.offsetX && p.offsetX !== 0) || (p?.offsetY && p.offsetY !== 0);
    const slotAspectClass = photoOrientation === 'portrait' ? 'aspect-[3/4]' : photoOrientation === 'square' ? 'aspect-square' : 'aspect-[4/3]';

    return (
      <div
        key={idx}
        data-photo-slot="true"
        onClick={() => setActivePhotoIdx(idx)}
        onPointerDown={(e) => handlePhotoPointerDown(e, idx)}
        onWheel={(e) => handleSlotWheel(e, idx)}
        className={`flex-1 ${slotAspectClass} bg-gray-200 rounded-xs overflow-hidden relative group border-2 transition-all select-none cursor-grab active:cursor-grabbing touch-none ${
          isActive ? 'border-red-500 shadow-md ring-2 ring-red-500/40' : 'border-transparent hover:border-gray-400/50'
        }`}
        title={`Foto #${idx + 1}: Tahan & geser untuk atur posisi, scroll atau tombol untuk zoom`}
      >
        {p?.dataUrl ? (
          <div className="w-full h-full relative overflow-hidden pointer-events-none">
            <img
              src={p?.dataUrl}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover select-none"
              style={{
                filter: p?.filterCss || 'none',
                transform: `scale(${p?.zoom || 1.0}) translate(${p?.offsetX || 0}%, ${p?.offsetY || 0}%)`,
                transformOrigin: 'center center',
                transition: dragState?.slotIdx === idx ? 'none' : 'transform 0.1s ease-out'
              }}
              draggable={false}
            />

            {/* IN-FRAME ACTIVE CONTROLS: ZOOM -, +, READOUT, RESET GESER & ZOOM, DAN TAMBAH STIKER */}
            {isActive && (
              <div
                className="absolute top-1.5 left-1/2 -translate-x-1/2 z-30 bg-black/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xl border border-white/30 text-[9px] select-none pointer-events-auto animate-fadeIn max-w-[96%]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepZoom(idx, -0.1);
                  }}
                  disabled={(p?.zoom || 1.0) <= 1.0}
                  className="w-4 h-4 rounded hover:bg-white/25 flex items-center justify-center font-bold disabled:opacity-30 transition-colors text-[10px]"
                  title="Perkecil zoom"
                >
                  -
                </button>

                <span className="font-mono font-bold text-amber-300 text-[8.5px] min-w-[20px] text-center">
                  {(p?.zoom || 1.0).toFixed(1)}x
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepZoom(idx, 0.1);
                  }}
                  disabled={(p?.zoom || 1.0) >= 3.0}
                  className="w-4 h-4 rounded hover:bg-white/25 flex items-center justify-center font-bold disabled:opacity-30 transition-colors text-[10px]"
                  title="Perbesar zoom"
                >
                  +
                </button>

                <span className="w-px h-3 bg-white/30" />

                {/* FITUR RESET UNTUK GESER & ZOOM LANGSUNG DI DALAM FRAME */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetPhotoAdjust(idx);
                  }}
                  className={`flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded transition-colors text-[8px] whitespace-nowrap ${
                    isAdjusted ? 'bg-amber-500/80 hover:bg-amber-500 text-white shadow-xs' : 'text-gray-300 hover:text-white hover:bg-white/20'
                  }`}
                  title="Reset posisi geser & zoom foto ini (1.0x, tengah)"
                >
                  <RotateCcw size={8} />
                  <span>Reset</span>
                </button>

                <span className="w-px h-3 bg-white/30" />

                {/* QUICK STIKER BUTTON INSIDE FRAME */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('sticker');
                    setActivePhotoIdx(idx);
                  }}
                  className="hover:text-amber-300 flex items-center gap-0.5 font-bold px-1 py-0.5 rounded hover:bg-white/20 transition-colors text-[8px] whitespace-nowrap"
                  title="Buka pilihan stiker untuk foto ini"
                >
                  <Sparkles size={8} className="text-amber-400" />
                  <span>Stiker</span>
                </button>
              </div>
            )}

            {/* Helper hint for drag when active */}
            {isActive && !dragState && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-xs text-white/90 text-[7px] font-medium px-2 py-0.5 rounded-full pointer-events-none whitespace-nowrap shadow-xs">
                👆 Geser foto / stiker di dalam frame
              </div>
            )}

            {/* Render Stickers placed strictly inside this photo slot */}
            {p?.stickers?.map((stk) => {
              const isStkActive = selectedStickerId === stk.id;
              return (
                <div
                  key={stk.id}
                  data-sticker-item="true"
                  onPointerDown={(e) => handleStickerPointerDown(e, idx, stk.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIdx(idx);
                    setSelectedStickerId(stk.id);
                  }}
                  className={`absolute select-none cursor-move transform -translate-x-1/2 -translate-y-1/2 z-20 group/stk touch-none pointer-events-auto ${
                    isStkActive ? 'ring-2 ring-amber-400 rounded' : ''
                  }`}
                  style={{
                    left: `${stk.x ?? 50}%`,
                    top: `${stk.y ?? 50}%`,
                    fontSize: `${stk.size || 30}px`,
                    lineHeight: 1
                  }}
                  title="Geser stiker di dalam frame"
                >
                  {stk.type === 'emoji' || stk.text ? (
                    <span className="drop-shadow-sm select-none">{stk.text}</span>
                  ) : (
                    <img
                      src={stk.imageUrl}
                      alt={stk.name || 'sticker'}
                      className="object-contain pointer-events-none select-none drop-shadow-sm"
                      style={{ width: `${stk.size || 30}px`, height: `${stk.size || 30}px` }}
                      draggable={false}
                    />
                  )}

                  {/* Quick actions on sticker: Size -/+, Delete */}
                  <div className="absolute -top-3 -right-3 flex items-center gap-0.5 opacity-0 group-hover/stk:opacity-100 transition-opacity pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeStickerSize(idx, stk.id, -4);
                      }}
                      className="w-3.5 h-3.5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-md hover:bg-black"
                      title="Perkecil stiker"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeStickerSize(idx, stk.id, 4);
                      }}
                      className="w-3.5 h-3.5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-md hover:bg-black"
                      title="Perbesar stiker"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSticker(idx, stk.id);
                      }}
                      className="w-3.5 h-3.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-md hover:bg-red-700"
                      title="Hapus stiker ini"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-1 text-center pointer-events-none select-none">
            <Camera size={13} className="text-gray-300" />
            <span className="text-[8px] font-bold font-mono text-gray-500">#{idx + 1}</span>
          </div>
        )}

        {/* Top/Corner indicators */}
        <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 pointer-events-none z-10">
          {isAdjusted && (
            <span className="bg-amber-500/90 text-white text-[6.5px] font-mono font-bold px-1 rounded flex items-center gap-0.5">
              <Move size={6} />
              {(p?.zoom || 1.0).toFixed(1)}x
            </span>
          )}
          <span className="bg-black/60 text-white text-[7px] font-mono px-1 rounded">
            #{idx + 1}
          </span>
        </div>
      </div>
    );
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
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'sticker' ? 'bg-white shadow-xs text-amber-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sparkles size={13} />
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
                              <div className="flex flex-wrap gap-1">
                                {Array.from({ length: totalSlots }).map((_, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => handleAssignPhotoToSlot(item, sIdx)}
                                    className={`flex-1 min-w-[50px] py-1 text-[10px] font-bold rounded border transition-colors ${
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
                  <div className="flex flex-wrap gap-1.5">
                    {photos.slice(0, totalSlots).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhotoIdx(i)}
                        className={`flex-1 min-w-[55px] py-1.5 rounded-lg text-xs font-bold flex flex-col items-center transition-colors ${
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

            {/* Section 3: STICKERS & DECORATIONS */}
            {activeTab === 'sticker' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-500" />
                    Koleksi Stiker & Dekorasi
                  </h3>
                  <p className="text-xs text-gray-500">
                    Klik stiker untuk menempelkan ke foto. Drag pada foto untuk memindahkan posisi.
                  </p>
                </div>

                {/* Target Photo Slot Selector for Stickers */}
                <div className="bg-gray-50 p-2.5 rounded-xl space-y-2 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-700">Target Foto Stiker:</span>
                    <span className="text-[10px] text-amber-600 font-semibold font-mono bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                      {photos[activePhotoIdx]?.stickers?.length || 0} Terpasang
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {photos.slice(0, totalSlots).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhotoIdx(i)}
                        className={`flex-1 min-w-[50px] py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          activePhotoIdx === i
                            ? 'bg-gray-900 text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Foto {i + 1}
                      </button>
                    ))}
                  </div>

                  {/* Reset Geser & Zoom for Active Photo */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60">
                    <span className="text-[10px] text-gray-500">Atur Foto #{activePhotoIdx + 1}:</span>
                    <button
                      type="button"
                      onClick={() => handleResetPhotoAdjust(activePhotoIdx)}
                      className="text-[10px] font-bold text-gray-700 hover:text-black bg-white hover:bg-gray-100 px-2 py-1 rounded border border-gray-300 flex items-center gap-1 transition-colors"
                      title="Reset posisi geser & zoom foto aktif ke tengah dan 1.0x"
                    >
                      <RotateCcw size={10} className="text-red-500" />
                      <span>Reset Geser & Zoom</span>
                    </button>
                  </div>
                </div>

                {/* Sticker Category Filter Chips */}
                <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1 border-b border-gray-100 text-[11px]">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'Aesthetic', label: '✨ Aesthetic' },
                    { id: 'Love', label: '💖 Love' },
                    { id: 'Cute', label: '🎀 Cute' },
                    { id: 'Nature', label: '🌸 Nature' },
                    { id: 'Studio', label: '📸 Studio' },
                    { id: 'Party', label: '🎉 Party' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setStickerFilterCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                        stickerFilterCategory === cat.id
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Stickers Grid */}
                <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {availableStickers
                    .filter((s) => stickerFilterCategory === 'all' || s.category === stickerFilterCategory)
                    .map((stk) => (
                      <button
                        key={stk.id}
                        type="button"
                        onClick={() => handleAddSticker(stk, activePhotoIdx)}
                        className="h-16 p-1.5 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 bg-white flex flex-col items-center justify-center transition-all group active:scale-95 shadow-2xs"
                        title={`Tambah stiker ${stk.name || stk.text} ke Foto #${activePhotoIdx + 1}`}
                      >
                        {stk.type === 'emoji' || stk.text ? (
                          <span className="text-2xl group-hover:scale-110 transition-transform">
                            {stk.text}
                          </span>
                        ) : (
                          <img
                            src={stk.imageUrl}
                            alt={stk.name}
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        )}
                        <span className="text-[9px] font-semibold text-gray-500 truncate w-full text-center mt-1">
                          {stk.name || stk.text}
                        </span>
                      </button>
                    ))}
                </div>

                {/* Manage Active Stickers on Current Slot */}
                {(photos[activePhotoIdx]?.stickers?.length || 0) > 0 && (
                  <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">
                        Kelola Stiker (Foto #{activePhotoIdx + 1})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleClearSlotStickers(activePhotoIdx)}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                      >
                        Hapus Semua
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {photos[activePhotoIdx]?.stickers?.map((stk, sIndex) => {
                        const isSelected = selectedStickerId === stk.id;
                        return (
                          <div
                            key={stk.id}
                            onClick={() => setSelectedStickerId(stk.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-white border-amber-500 text-gray-900 shadow-2xs ring-1 ring-amber-400'
                                : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-white'
                            }`}
                          >
                            <span>{stk.text || '🎨'}</span>
                            <span className="text-[10px]">#{sIndex + 1}</span>

                            {/* Resize buttons */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStickerSize(activePhotoIdx, stk.id, -4);
                              }}
                              className="text-[10px] w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center font-bold"
                              title="Perkecil stiker"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStickerSize(activePhotoIdx, stk.id, 4);
                              }}
                              className="text-[10px] w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center font-bold"
                              title="Perbesar stiker"
                            >
                              +
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSticker(activePhotoIdx, stk.id);
                              }}
                              className="text-gray-400 hover:text-red-600 ml-0.5"
                              title="Hapus stiker ini"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

                  <div className="flex flex-col gap-2.5 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showBadge}
                        onChange={(e) => setShowBadge(e.target.checked)}
                        className="rounded text-gray-900 focus:ring-gray-900"
                      />
                      <span>Tampilkan Logo {appConfig.website?.brandName || 'snap.e'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showDate}
                        onChange={(e) => setShowDate(e.target.checked)}
                        className="rounded text-gray-900 focus:ring-gray-900"
                      />
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Calendar size={13} className="text-rose-500" />
                        Tampilkan Tanggal pada Frame
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* CENTER COLUMN: Interactive Photostrip Preview & DOCKED ZOOM/PAN CONTROLLER (Berdampingan) */}
        <div className="flex-1 flex flex-col items-center justify-start gap-4 w-full min-w-0">
          
          {/* Quick Format Portrait & Date / Orientation Toggle Bar */}
          <div className="w-full max-w-[500px] bg-white border border-gray-200/90 rounded-2xl p-2.5 sm:p-3 shadow-sm flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Format Selection - 100% Mode Portrait */}
              <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLayout('strip_3cut')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    layout === 'strip_3cut'
                      ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Strip Portrait Vertikal Klasik (1 Kolom × 3 Foto)"
                >
                  <span>Strip 3-Cut</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayout('strip_4cut')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    layout === 'strip_4cut'
                      ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Strip Portrait Vertikal Life4Cuts (1 Kolom × 4 Foto)"
                >
                  <span>Strip 4-Cut</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayout('4r_4cut')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    layout === '4r_4cut'
                      ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="4R Portrait Dual Strip (2 Kolom × 2 Foto dengan Garis Potong ✂)"
                >
                  <span>4R 4-Cut</span>
                  <span className="text-[10px] text-red-500 font-bold">✂</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayout('4r_6cut')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    layout === '4r_6cut'
                      ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="4R Portrait Dual Strip (2 Kolom × 3 Foto dengan Garis Potong ✂)"
                >
                  <span>4R 6-Cut</span>
                  <span className="text-[10px] text-red-500 font-bold">✂</span>
                </button>
              </div>

              {/* Mode Portrait Indicator Badge */}
              <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-xl font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>Mode: Portrait (Tegak)</span>
              </div>
            </div>

            {/* Sub-bar: Reset All Button, Photo Orientation Toggle, Date Toggle & PNG Template */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-1">
                {/* Reset All Adjustments Button */}
                <button
                  type="button"
                  onClick={handleResetAllPhotosAdjust}
                  className="px-2 py-1 rounded-lg font-bold flex items-center gap-1 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Reset semua posisi geser dan zoom foto ke default (1.0x, tengah)"
                >
                  <RotateCcw size={11} className="text-gray-500" />
                  <span>Reset Semua Foto</span>
                </button>

                {/* Photo Slot Orientation Toggle */}
                <button
                  type="button"
                  onClick={() => setPhotoOrientation(prev => prev === 'portrait' ? 'square' : 'portrait')}
                  className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors border ${
                    photoOrientation === 'portrait'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  title="Ganti orientasi kotak foto: Mode Portrait (Tegak 3:4) atau Persegi (1:1)"
                >
                  <span>Foto: {photoOrientation === 'portrait' ? 'Tegak (3:4)' : 'Persegi (1:1)'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* Toggle Tanggal Frame */}
                <button
                  type="button"
                  onClick={() => setShowDate(!showDate)}
                  className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all border ${
                    showDate
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                  title="Tampilkan atau sembunyikan tanggal pada bingkai foto"
                >
                  <Calendar size={11} className={showDate ? 'text-rose-600' : 'text-gray-400'} />
                  <span>Tanggal: {showDate ? 'Tampil' : 'Sembunyi'}</span>
                </button>

                {/* Unduh Template Frame PNG Fix Portrait */}
                <button
                  type="button"
                  onClick={handleDownloadFrameTemplatePng}
                  className="px-2 py-1 rounded-lg font-bold flex items-center gap-1 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                  title="Unduh template bingkai ini format PNG transparan ukuran fix portrait"
                >
                  <Download size={11} className="text-gray-600" />
                  <span>PNG Fix</span>
                </button>
              </div>
            </div>
          </div>

          {/* Photostrip Card Container - STRICT FIXED PORTRAIT ASPECT RATIO (Tegak Vertikal) */}
          <div
            ref={stripPreviewRef}
            className={`shadow-2xl rounded-sm p-3 sm:p-4 relative transition-all duration-200 w-full ${
              isSingleStrip ? 'max-w-[240px] sm:max-w-[270px] aspect-[1/3]' : 'max-w-[360px] sm:max-w-[400px] aspect-[2/3]'
            } overflow-hidden shrink-0 flex flex-col justify-between`}
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
                <div className="absolute inset-y-0 left-0 w-3 bg-[#08080A] flex flex-col justify-around py-2 pointer-events-none z-10">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-1.5 h-2 bg-white/90 mx-auto rounded-xs shadow-xs" />
                  ))}
                </div>
                <div className="absolute inset-y-0 right-0 w-3 bg-[#08080A] flex flex-col justify-around py-2 pointer-events-none z-10">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-1.5 h-2 bg-white/90 mx-auto rounded-xs shadow-xs" />
                  ))}
                </div>
              </>
            )}

            {/* Sakura blossom corner icons */}
            {activeFrame.overlayType === 'sakura' && (
              <>
                <span className="absolute top-1 left-2 text-base pointer-events-none z-10 animate-pulse">🌸</span>
                <span className="absolute top-1 right-2 text-base pointer-events-none z-10 animate-pulse">🌸</span>
              </>
            )}

            {/* Y2K Stars */}
            {activeFrame.overlayType === 'y2k' && (
              <>
                <span className="absolute top-1 left-2 text-sm pointer-events-none z-10 text-purple-600">✦</span>
                <span className="absolute top-1 right-2 text-sm pointer-events-none z-10 text-purple-600">✦</span>
              </>
            )}

            {/* Cat Cafe */}
            {activeFrame.overlayType === 'cat_cafe' && (
              <>
                <span className="absolute top-1 left-2 text-sm pointer-events-none z-10">🐱</span>
                <span className="absolute top-1 right-2 text-sm pointer-events-none z-10">🐾</span>
              </>
            )}

            {/* Botanical */}
            {activeFrame.overlayType === 'botanical' && (
              <>
                <span className="absolute top-1 left-2 text-sm pointer-events-none z-10">🌿</span>
                <span className="absolute top-1 right-2 text-sm pointer-events-none z-10">🌿</span>
              </>
            )}

            {/* Party Celebration */}
            {activeFrame.overlayType === 'party' && (
              <>
                <span className="absolute top-1 left-2 text-sm pointer-events-none z-10">🎈</span>
                <span className="absolute top-1 right-2 text-sm pointer-events-none z-10">🎉</span>
              </>
            )}

            {/* Coquette Bow */}
            {activeFrame.overlayType === 'coquette' && (
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-base pointer-events-none z-10">🎀</span>
            )}

            {/* Strip Top Header - Fixed Reserved Height */}
            <div className="flex justify-between items-center h-4 px-1 text-[8px] sm:text-[8.5px] font-bold tracking-widest opacity-80 shrink-0">
              <span>{activeFrame.overlayType === 'film' ? '► KODAK 400 35MM' : 'SNAP.E MEMORIES'}</span>
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[7px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold whitespace-nowrap">
                  {isSingleStrip 
                    ? `Strip Portrait • ${layout === 'strip_4cut' ? '4 Foto' : '3 Foto'}`
                    : `4R Portrait • ${layout === '4r_6cut' ? '6 Foto' : '4 Foto'}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleResetPhotoAdjust(activePhotoIdx)}
                  className="text-[7.5px] bg-black/60 hover:bg-black text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors font-semibold shadow-2xs whitespace-nowrap"
                  title="Reset posisi geser & zoom foto aktif ke normal (1.0x, tengah)"
                >
                  <RotateCcw size={8} />
                  <span>Reset Foto #{activePhotoIdx + 1}</span>
                </button>
              </div>
            </div>

            {/* Photos Layout Rendering - Strictly Mode Portrait */}
            {isSingleStrip ? (
              /* Single Strip Portrait (1 Kolom Vertikal) */
              <div className="flex-1 flex flex-col justify-between min-h-0 my-1">
                <div className={`flex flex-col gap-1 sm:gap-1.5 flex-1 min-h-0 ${layout === 'strip_4cut' ? 'justify-between' : 'justify-center gap-2 sm:gap-2.5'}`}>
                  {(layout === 'strip_4cut' ? [0, 1, 2, 3] : [0, 1, 2]).map((idx) => renderPhotoSlot(idx))}
                </div>

                {/* Single Strip Fixed Footer */}
                <div className="h-11 sm:h-12 shrink-0 pt-0.5 text-center border-t border-black/10 flex flex-col justify-center overflow-hidden">
                  <p className="font-bold text-[9px] leading-tight truncate">{appConfig.website?.brandName || 'snap.e'}</p>
                  <p className="font-serif italic text-[8px] opacity-90 truncate leading-tight">{customText || 'Tangible Memories'}</p>
                  <p className={`text-[6.5px] font-mono leading-none mt-0.5 ${showDate ? 'opacity-75' : 'invisible'}`}>
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ) : (
              /* Dual Strip 4R Portrait (2 Kolom Berdampingan dengan Garis Potong Tengah) */
              <div className="relative flex gap-2 sm:gap-2.5 flex-1 min-h-0 items-stretch my-1">
                {/* Dotted Center Cut Line with Scissors */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-red-500/70 z-10 flex flex-col justify-between py-1 pointer-events-none">
                  <span className="text-[9px] text-red-600 bg-white/90 px-0.5 rounded -translate-x-1/2 shadow-xs">✂</span>
                  <span className="text-[7px] text-red-600 font-mono font-bold bg-white/90 px-1 py-0.5 rounded -translate-x-1/2 rotate-90 shadow-xs whitespace-nowrap">
                    POTONG
                  </span>
                  <span className="text-[9px] text-red-600 bg-white/90 px-0.5 rounded -translate-x-1/2 shadow-xs">✂</span>
                </div>

                {/* Left Strip */}
                <div className="flex-1 flex flex-col justify-between min-h-0">
                  <div className={`flex flex-col gap-1 sm:gap-1.5 flex-1 min-h-0 ${layout === '4r_6cut' ? 'justify-between' : 'justify-center gap-2.5 sm:gap-3'}`}>
                    {(layout === '4r_6cut' ? [0, 1, 2] : [0, 1]).map((idx) => renderPhotoSlot(idx))}
                  </div>

                  {/* Left Strip Fixed Footer */}
                  <div className="h-11 sm:h-12 shrink-0 pt-0.5 text-center border-t border-black/10 flex flex-col justify-center overflow-hidden">
                    <p className="font-bold text-[9px] leading-tight truncate">{appConfig.website?.brandName || 'snap.e'}</p>
                    <p className="font-serif italic text-[8px] opacity-90 truncate leading-tight">{customText || 'Tangible Memories'}</p>
                    <p className={`text-[6.5px] font-mono leading-none mt-0.5 ${showDate ? 'opacity-75' : 'invisible'}`}>
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Right Strip */}
                <div className="flex-1 flex flex-col justify-between min-h-0">
                  <div className={`flex flex-col gap-1 sm:gap-1.5 flex-1 min-h-0 ${layout === '4r_6cut' ? 'justify-between' : 'justify-center gap-2.5 sm:gap-3'}`}>
                    {(layout === '4r_6cut' ? [3, 4, 5] : [2, 3]).map((idx) => renderPhotoSlot(idx))}
                  </div>

                  {/* Right Strip Fixed Footer */}
                  <div className="h-11 sm:h-12 shrink-0 pt-0.5 text-center border-t border-black/10 flex flex-col justify-center overflow-hidden">
                    <p className="font-bold text-[9px] leading-tight truncate">{appConfig.website?.brandName || 'snap.e'}</p>
                    <p className="font-serif italic text-[8px] opacity-90 truncate leading-tight">{customText || 'Tangible Memories'}</p>
                    <p className={`text-[6.5px] font-mono leading-none mt-0.5 ${showDate ? 'opacity-75' : 'invisible'}`}>
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
