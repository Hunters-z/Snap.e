import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Download, 
  Share2, 
  Check, 
  Play, 
  Pause, 
  Edit3, 
  Image as ImageIcon, 
  Film, 
  Clock, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Cloud,
  Maximize2,
  RefreshCw,
  Lock,
  Eye
} from 'lucide-react';
import { useBooth } from '../context/BoothContext';
import { 
  getPersistedAlbum, 
  getPersistedCapturedPhotos, 
  getAllPersistedAlbums,
  persistAlbum
} from '../utils/persistentStorage';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Standardize any photo object format into a consistent display structure
 */
function normalizePhoto(p, idx) {
  if (!p) return null;
  if (typeof p === 'string') {
    return {
      id: `photo_${idx}_${Date.now()}`,
      dataUrl: p,
      url: p,
      filterName: 'Natural',
      filterCss: 'none',
      capturedAt: 'snap.e photo',
      dateStamp: null,
      gifUrl: null
    };
  }
  const dataUrl = p.fullUrl || p.dataUrl || p.url || p.src || p.imageUrl || p.previewUrl || p.thumbUrl || '';
  if (!dataUrl) return null;
  return {
    id: p.id || `photo_${idx}`,
    dataUrl,
    gifUrl: p.gifUrl || null,
    filterName: p.filterName || 'Natural',
    filterCss: p.filterCss || 'none',
    capturedAt: p.capturedAt || 'snap.e photo',
    dateStamp: p.dateStamp || null,
    createdAt: p.createdAt || null
  };
}

export default function PublicAlbum() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { 
    appConfig, 
    sessionAlbum, 
    capturedPhotos,
    currentSessionId,
    currentUser,
    showToast 
  } = useBooth();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'photo' | 'gif'
  const [playingGifId, setPlayingGifId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const effectiveAlbumId = useMemo(() => {
    return albumId || 
      currentSessionId || 
      (typeof localStorage !== 'undefined' ? localStorage.getItem('snape_current_session_id') : null) || 
      (typeof localStorage !== 'undefined' ? localStorage.getItem('snape_last_active_album') : null) || 
      '';
  }, [albumId, currentSessionId]);

  const albumUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      const shareId = effectiveAlbumId || 'latest';
      return `${window.location.origin}/album/${shareId}`;
    }
    return '';
  }, [effectiveAlbumId]);

  // Load photos for this unique album ID with multi-source fallback
  const loadAlbumPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const targetId = effectiveAlbumId;
      const cleanId = String(targetId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const altId = cleanId.startsWith('sess_') ? cleanId.slice(5) : `sess_${cleanId}`;

      // 1. Check in-memory sessionAlbum in context
      if (Array.isArray(sessionAlbum) && sessionAlbum.length > 0) {
        const isSessionMatch = !targetId || 
          targetId === 'latest' ||
          currentSessionId === targetId || 
          currentSessionId === cleanId ||
          currentSessionId === altId || 
          sessionAlbum.some(p => p.sessionId === targetId || p.sessionId === cleanId || p.sessionId === altId);

        if (isSessionMatch || sessionAlbum.length > 0) {
          const valid = sessionAlbum.map(normalizePhoto).filter(Boolean);
          if (valid.length > 0) {
            setPhotos(valid);
            setLoading(false);
            return;
          }
        }
      }

      // 2. Check in-memory capturedPhotos in context
      if (Array.isArray(capturedPhotos) && capturedPhotos.length > 0) {
        const valid = capturedPhotos.map(normalizePhoto).filter(Boolean);
        if (valid.length > 0) {
          setPhotos(valid);
          setLoading(false);
          return;
        }
      }

      // 3. Try loading directly from IndexedDB on this browser
      if (targetId && targetId !== 'latest') {
        const idbAlbum = await getPersistedAlbum(targetId);
        if (Array.isArray(idbAlbum) && idbAlbum.length > 0) {
          const valid = idbAlbum.map(normalizePhoto).filter(Boolean);
          if (valid.length > 0) {
            setPhotos(valid);
            setLoading(false);
            return;
          }
        }

        const idbCleanAlbum = await getPersistedAlbum(cleanId);
        if (Array.isArray(idbCleanAlbum) && idbCleanAlbum.length > 0) {
          const valid = idbCleanAlbum.map(normalizePhoto).filter(Boolean);
          if (valid.length > 0) {
            setPhotos(valid);
            setLoading(false);
            return;
          }
        }

        const idbCaptured = await getPersistedCapturedPhotos(targetId);
        if (Array.isArray(idbCaptured) && idbCaptured.length > 0) {
          const valid = idbCaptured.map(normalizePhoto).filter(Boolean);
          if (valid.length > 0) {
            setPhotos(valid);
            setLoading(false);
            return;
          }
        }
      }

      // 4. Try finding in all persisted albums in IndexedDB
      const allLocal = await getAllPersistedAlbums();
      if (Array.isArray(allLocal) && allLocal.length > 0) {
        const found = allLocal.find(a => 
          a.sessionId === targetId || 
          a.sessionId === cleanId || 
          a.sessionId === altId ||
          (a.sessionId && targetId && (a.sessionId.includes(targetId) || targetId.includes(a.sessionId)))
        );
        if (found && Array.isArray(found.photos) && found.photos.length > 0) {
          const valid = found.photos.map(normalizePhoto).filter(Boolean);
          if (valid.length > 0) {
            setPhotos(valid);
            setLoading(false);
            return;
          }
        }

        // If local albums exist on this device, fallback to latest album
        const sorted = [...allLocal].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        if (sorted[0] && Array.isArray(sorted[0].photos) && sorted[0].photos.length > 0) {
          const valid = sorted[0].photos.map(normalizePhoto).filter(Boolean);
          if (valid.length > 0) {
            setPhotos(valid);
            setLoading(false);
            return;
          }
        }
      }

      // 5. Try localStorage fallback on this device
      const lsKeys = [
        `snape_album_${targetId}`,
        `snape_album_${cleanId}`,
        `snape_album_${altId}`,
        `snape_captured_${targetId}`,
        `snape_captured_${cleanId}`,
        'snape_session_album',
        'snape_captured_photos'
      ];

      for (const k of lsKeys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const valid = parsed.map(normalizePhoto).filter(Boolean);
              if (valid.length > 0) {
                setPhotos(valid);
                setLoading(false);
                return;
              }
            }
          }
        } catch (_e) {
          // ignore parsing error
        }
      }

      // 6. Remote cross-device public load from Cloud Firestore
      if (db) {
        const idsToTry = [cleanId, targetId, altId].filter(id => Boolean(id) && id !== 'latest');

        for (const tid of idsToTry) {
          // A. Check parent doc cloud_albums/{tid}
          try {
            const parentSnap = await getDoc(doc(db, 'cloud_albums', tid));
            if (parentSnap.exists()) {
              const data = parentSnap.data();
              if (Array.isArray(data?.photos) && data.photos.length > 0) {
                const valid = data.photos.map(normalizePhoto).filter(Boolean);
                if (valid.length > 0) {
                  setPhotos(valid);
                  setLoading(false);

                  // In background, also attempt to enrich with high-res or GIFs from subcollection
                  try {
                    const subCol = collection(db, 'cloud_albums', tid, 'photos');
                    getDocs(subCol).then(subSnap => {
                      if (!subSnap.empty) {
                        const subList = [];
                        subSnap.forEach(d => {
                          const dData = d.data();
                          if (dData && (dData.dataUrl || dData.url)) subList.push({ id: d.id, ...dData });
                        });
                        if (subList.length > 0) {
                          const merged = subList.map(normalizePhoto).filter(Boolean);
                          setPhotos(merged);
                          persistAlbum(tid, merged);
                        }
                      }
                    }).catch(() => {
                      // ignore background subcollection fetch error
                    });
                  } catch (_enrichErr) {
                    // ignore enrich error
                  }

                  return;
                }
              }
            }
          } catch (cloudErr) {
            console.warn('Firestore parent doc check warning:', cloudErr);
          }

          // B. Check subcollection cloud_albums/{tid}/photos
          try {
            const subCol = collection(db, 'cloud_albums', tid, 'photos');
            const subSnap = await getDocs(subCol);
            if (!subSnap.empty) {
              const list = [];
              subSnap.forEach(d => {
                const dData = d.data();
                if (dData && (dData.dataUrl || dData.url)) {
                  list.push({ id: d.id, ...dData });
                }
              });
              list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
              const valid = list.map(normalizePhoto).filter(Boolean);
              if (valid.length > 0) {
                setPhotos(valid);
                persistAlbum(tid, valid);
                setLoading(false);
                return;
              }
            }
          } catch (subErr) {
            console.warn('Firestore subcollection fetch warning:', subErr);
          }
        }

        // C. Fallback: try latest cloud_albums if specific ID not found or targetId was 'latest'
        try {
          const colRef = collection(db, 'cloud_albums');
          const recentSnap = await getDocs(colRef);
          if (!recentSnap.empty) {
            const allDocs = [];
            recentSnap.forEach(d => {
              const data = d.data();
              if (data && Array.isArray(data.photos) && data.photos.length > 0) {
                allDocs.push(data);
              }
            });
            allDocs.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
            if (allDocs[0] && Array.isArray(allDocs[0].photos) && allDocs[0].photos.length > 0) {
              const valid = allDocs[0].photos.map(normalizePhoto).filter(Boolean);
              if (valid.length > 0) {
                setPhotos(valid);
                setLoading(false);
                return;
              }
            }
          }
        } catch (_recentErr) {
          // ignore fallback error
        }
      }

      setPhotos([]);
      setLoading(false);
    } catch (err) {
      console.error('Error loading public album photos:', err);
      setPhotos([]);
      setLoading(false);
    }
  }, [effectiveAlbumId, currentSessionId, sessionAlbum, capturedPhotos]);

  useEffect(() => {
    loadAlbumPhotos();
  }, [loadAlbumPhotos]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(albumUrl);
    setCopiedLink(true);
    if (showToast) showToast('Tautan unik album berhasil disalin!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredPhotos = useMemo(() => {
    if (activeFilter === 'gif') {
      return photos.filter(p => !!p.gifUrl);
    }
    if (activeFilter === 'photo') {
      return photos.filter(p => !p.gifUrl || activeFilter === 'photo');
    }
    return photos;
  }, [photos, activeFilter]);

  const handleDownloadSingle = (photoItem, e) => {
    if (e) e.stopPropagation();
    const url = photoItem.dataUrl || photoItem.url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `snap_e_${photoItem.id || 'photo'}_${Date.now()}.jpg`;
    a.click();
    if (showToast) showToast('Foto HD berhasil diunduh!');
  };

  const handleDownloadGifSingle = (photoItem, e) => {
    if (e) e.stopPropagation();
    const url = photoItem.gifUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `snap_e_motion_${photoItem.id || 'gif'}_${Date.now()}.gif`;
    a.click();
    if (showToast) showToast('Animasi GIF berhasil diunduh!');
  };

  const handleDownloadAll = () => {
    if (photos.length === 0) return;
    photos.forEach((p, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = p.dataUrl || p.url;
        a.download = `snap_e_album_${idx + 1}.jpg`;
        a.click();
      }, idx * 250);
    });
    if (showToast) showToast(`Sedang mengunduh ${photos.length} foto serentak...`);
  };

  const handleOpenEditor = () => {
    navigate('/editor');
  };

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') setLightboxIndex(null);
    if (e.key === 'ArrowRight') {
      setLightboxIndex((prev) => (prev + 1) % filteredPhotos.length);
    }
    if (e.key === 'ArrowLeft') {
      setLightboxIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  }, [lightboxIndex, filteredPhotos.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-gray-900 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo with Official Image */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-xs flex items-center justify-center bg-gray-900 group-hover:scale-105 transition-transform">
                <img 
                  src="/logo.jpeg" 
                  alt="snap.e logo" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                  }} 
                />
              </div>
              <span className="font-extrabold text-base tracking-tight text-gray-950 flex items-center gap-1">
                {appConfig?.website?.brandName || 'snap.e'}
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              </span>
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ALBUM PUBLIK
            </span>
          </div>

          {/* Right Header Action: Mode Publik (Hanya Lihat & Unduh) vs Mode Pemilik (Editor) */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                onClick={handleOpenEditor}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20 flex items-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                title="Buka Editor Photostrip (Mode Pemilik)"
              >
                <Edit3 size={13} />
                <span>Buka di Editor</span>
              </button>
            ) : (
              <div 
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100/90 px-3.5 py-2 rounded-xl border border-gray-200/80 font-medium select-none"
                title="Pengunjung publik hanya memiliki hak melihat & mengunduh foto. Pengeditan dikunci."
              >
                <Lock size={12} className="text-gray-400" />
                <span className="hidden sm:inline">Mode Publik (Hanya Lihat & Unduh)</span>
                <span className="sm:hidden">Hanya Lihat</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Album Hero Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-linear-to-bl from-red-500/5 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/60 font-mono">
                  Sesi #{albumId}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                  <Clock size={11} className="text-amber-600" />
                  Masa Simpan 7 Hari
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  <Cloud size={11} className="text-blue-500" />
                  Akses Publik Tanpa Login
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <Eye size={11} className="text-emerald-600" />
                  Bebas Lihat & Unduh
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200/60">
                  <Lock size={11} className="text-gray-500" />
                  Edit Terkunci
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Galeri Album Sesi snap.e
              </h1>

              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
                Sebagai pengunjung publik, Anda dapat melihat galeri foto dan mengunduh seluruh file (foto resolusi HD & animasi gerak GIF) secara bebas hanya dengan link unik ini. 
                Pengeditan isi album dikunci demi menjaga keaslian momen, dan editor hanya tersedia bagi pemilik sesi yang telah login.
              </p>
            </div>

            {/* Sharing & Download Actions */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`w-full px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-900 hover:bg-black text-white'
                }`}
              >
                {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copiedLink ? 'Link Berhasil Disalin!' : 'Salin Link Album Publik'}</span>
              </button>

              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors border border-gray-200 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Unduh Semua Foto ({photos.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Unique Link Input Preview */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium shrink-0 flex items-center gap-1">
              <ExternalLink size={12} className="text-gray-400" />
              Tautan Unik Album:
            </span>
            <div className="w-full flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 overflow-hidden">
              <span className="font-mono text-gray-700 truncate select-all text-[11px] flex-1">
                {albumUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 shrink-0 ml-1 cursor-pointer"
              >
                Salin
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Control Bar: Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ImageIcon size={13} />
              <span>Semua Foto ({photos.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('gif')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeFilter === 'gif'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Film size={13} />
              <span>Gambar Gerak / GIF ({photos.filter(p => !!p.gifUrl).length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            <button
              onClick={loadAlbumPhotos}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              title="Muat ulang foto album"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Segarkan</span>
            </button>
            <span>Menampilkan <strong className="text-gray-900">{filteredPhotos.length}</strong> item</span>
          </div>
        </div>

        {/* Photo Grid / Gallery */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-red-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-600">Memuat album sesi studio...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-gray-100 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <ImageIcon size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Belum Ada Foto dalam Album Ini</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Foto pada sesi ini belum tersimpan atau masa simpan 7 hari telah berakhir.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={loadAlbumPhotos}
                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md shadow-gray-900/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Muat Ulang Album</span>
              </button>
              <Link
                to="/"
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredPhotos.map((item, idx) => {
              const hasGif = Boolean(item.gifUrl);
              const isPlayingGif = playingGifId === item.id;
              const displayUrl = isPlayingGif && item.gifUrl ? item.gifUrl : (item.dataUrl || item.url || '');

              return (
                <div
                  key={item.id || idx}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs group hover:shadow-md transition-all flex flex-col"
                >
                  {/* Photo Preview Container (Strict 4:3 Aspect Ratio) */}
                  <div 
                    onClick={() => setLightboxIndex(idx)}
                    className="aspect-[4/3] bg-gray-950 relative overflow-hidden cursor-pointer"
                  >
                    <img
                      src={displayUrl}
                      alt={`Foto Pose ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102 select-none"
                      style={{ filter: item.filterCss || 'none' }}
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to still photo if GIF failed to load
                        if (item.dataUrl && e.currentTarget.src !== item.dataUrl) {
                          e.currentTarget.src = item.dataUrl;
                        }
                      }}
                    />

                    {/* GIF Indicator / Toggle Button */}
                    {hasGif && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingGifId(isPlayingGif ? null : item.id);
                        }}
                        className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10 shadow-md transition-all cursor-pointer ${
                          isPlayingGif
                            ? 'bg-purple-600 text-white animate-pulse'
                            : 'bg-black/60 backdrop-blur-xs text-purple-200 hover:bg-purple-600 hover:text-white'
                        }`}
                        title="Putar animasi GIF"
                      >
                        {isPlayingGif ? <Pause size={9} /> : <Play size={9} className="fill-current" />}
                        <span>{isPlayingGif ? 'Gerak' : 'GIF'}</span>
                      </button>
                    )}

                    {/* Filter / Preset Badge */}
                    {item.filterName && (
                      <span className="absolute bottom-2 left-2 text-[9px] font-medium text-white/90 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md">
                        {item.filterName}
                      </span>
                    )}

                    {/* Maximize Icon on Hover */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg">
                        <Maximize2 size={16} />
                      </div>
                    </div>

                    <span className="absolute top-2 right-2 text-[9px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Photo Info & Quick Actions Footer */}
                  <div className="p-3 flex items-center justify-between gap-2 border-t border-gray-100 bg-white mt-auto">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {item.capturedAt || 'snap.e photo'}
                    </span>

                    <div className="flex items-center gap-1">
                      {hasGif && (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadGifSingle(item, e)}
                          className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Unduh GIF"
                        >
                          <Film size={11} />
                          <span>GIF</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDownloadSingle(item, e)}
                        className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Unduh foto resolusi tinggi"
                      >
                        <Download size={11} />
                        <span>HD</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {currentLightboxPhoto && (
        <div 
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
        >
          {/* Lightbox Header Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded-lg font-bold">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </span>
              <span className="text-xs text-gray-300 hidden sm:inline">
                {currentLightboxPhoto.filterName || 'Original'} • {currentLightboxPhoto.capturedAt}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentLightboxPhoto.gifUrl && (
                <button
                  type="button"
                  onClick={(e) => handleDownloadGifSingle(currentLightboxPhoto, e)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Film size={13} />
                  <span>Unduh GIF</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleDownloadSingle(currentLightboxPhoto, e)}
                className="px-3 py-1.5 rounded-xl bg-white text-gray-950 hover:bg-gray-100 font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
              >
                <Download size={13} />
                <span>Unduh HD</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Prev / Next */}
          {filteredPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center z-20 transition-all border border-white/20 cursor-pointer"
                title="Foto Sebelumnya"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev + 1) % filteredPhotos.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center z-20 transition-all border border-white/20 cursor-pointer"
                title="Foto Berikutnya"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Main Photo Center Container */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[82vh] relative flex items-center justify-center"
          >
            <img
              src={
                playingGifId === currentLightboxPhoto.id && currentLightboxPhoto.gifUrl
                  ? currentLightboxPhoto.gifUrl
                  : (currentLightboxPhoto.dataUrl || currentLightboxPhoto.url)
              }
              alt="Lightbox Preview"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
              style={{ filter: currentLightboxPhoto.filterCss || 'none' }}
            />

            {currentLightboxPhoto.gifUrl && (
              <button
                type="button"
                onClick={() => setPlayingGifId(playingGifId === currentLightboxPhoto.id ? null : currentLightboxPhoto.id)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/80 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl transition-colors border border-white/20 cursor-pointer"
              >
                {playingGifId === currentLightboxPhoto.id ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
                <span>{playingGifId === currentLightboxPhoto.id ? 'Jeda Animasi' : 'Putar Animasi GIF'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer with Official Logo */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-900">
              <img 
                src="/logo.jpeg" 
                alt="snap.e" 
                className="w-full h-full object-cover" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                }} 
              />
            </div>
            <span className="font-bold text-gray-900">{appConfig?.website?.brandName || 'snap.e'}</span>
            <span>— Photobooth Studio & Creative Strip Lab</span>
          </div>
          <p>© {new Date().getFullYear()} {appConfig?.website?.brandName || 'snap.e'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
