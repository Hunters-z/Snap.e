import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Download, 
  Share2, 
  Check, 
  Play, 
  Pause, 
  Camera, 
  Edit3, 
  Image as ImageIcon, 
  Film, 
  Clock, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Cloud,
  Maximize2
} from 'lucide-react';
import { useBooth } from '../context/BoothContext';
import { getPersistedAlbum } from '../utils/persistentStorage';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function PublicAlbum() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { 
    appConfig, 
    sessionAlbum, 
    currentSessionId,
    showToast 
  } = useBooth();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'photo' | 'gif'
  const [playingGifId, setPlayingGifId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const albumUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/album/${albumId}`;
    }
    return '';
  }, [albumId]);

  // Load photos for this unique album ID
  useEffect(() => {
    let isMounted = true;

    async function loadAlbumPhotos() {
      setLoading(true);
      try {
        // 1. If currently in the active session on this device
        if (currentSessionId === albumId && Array.isArray(sessionAlbum) && sessionAlbum.length > 0) {
          if (isMounted) {
            setPhotos(sessionAlbum);
            setLoading(false);
          }
          return;
        }

        // 2. Try loading from IndexedDB on this device
        const localAlbum = await getPersistedAlbum(albumId);
        if (Array.isArray(localAlbum) && localAlbum.length > 0) {
          if (isMounted) {
            setPhotos(localAlbum);
            setLoading(false);
          }
          return;
        }

        // 3. Fallback: try localStorage on this device
        try {
          const lsData = localStorage.getItem(`snape_album_${albumId}`);
          if (lsData) {
            const parsed = JSON.parse(lsData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (isMounted) {
                setPhotos(parsed);
                setLoading(false);
              }
              return;
            }
          }
        } catch (_e) {
          // ignore parsing error
        }

        // 4. Remote / Public cross-device load from Cloud Firestore
        if (db) {
          try {
            const q = collection(db, 'cloud_albums', albumId, 'photos');
            const snap = await getDocs(q);
            if (!snap.empty) {
              const remotePhotos = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              // Sort by captured timestamp or order
              remotePhotos.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
              if (isMounted) {
                setPhotos(remotePhotos);
                setLoading(false);
              }
              return;
            }
          } catch (cloudErr) {
            console.warn('Could not fetch public cloud album:', cloudErr);
          }
        }

        if (isMounted) {
          setPhotos([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading album:', err);
        if (isMounted) {
          setPhotos([]);
          setLoading(false);
        }
      }
    }

    if (albumId) {
      loadAlbumPhotos();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [albumId, currentSessionId, sessionAlbum]);

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
    const url = photoItem.dataUrl;
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
        a.href = p.dataUrl;
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
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gray-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                📸
              </div>
              <span className="font-extrabold text-base tracking-tight text-gray-950">
                {appConfig?.website?.brandName || 'snap.e'}
              </span>
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ALBUM PUBLIK
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/capture"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-950 hover:bg-gray-100 flex items-center gap-1.5 transition-colors"
            >
              <Camera size={14} className="text-red-600" />
              <span className="hidden sm:inline">Bilik Kamera</span>
            </Link>

            <button
              onClick={handleOpenEditor}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20 flex items-center gap-1.5 transition-all active:scale-98"
              title="Buka Editor Photostrip (memerlukan login)"
            >
              <Edit3 size={13} />
              <span>Buka di Editor</span>
            </button>
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
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Galeri Album Sesi snap.e
              </h1>

              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
                Album ini dapat dilihat secara publik oleh siapa saja hanya dengan link unik ini. 
                Anda dapat melihat foto hasil jepretan, memutar animasi gerak GIF, mengunduh file HD, atau melanjutkan kreasi photostrip ke editor.
              </p>
            </div>

            {/* Sharing & Download Actions */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`w-full px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
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
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors border border-gray-200"
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
                className="text-[11px] font-bold text-red-600 hover:text-red-700 shrink-0 ml-1"
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
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeFilter === 'gif'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Film size={13} />
              <span>Gambar Gerak / GIF ({photos.filter(p => !!p.gifUrl).length})</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-900">{filteredPhotos.length}</span> item
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
              <Link
                to="/capture"
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/20"
              >
                Mulai Jepret di Bilik Foto
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredPhotos.map((item, idx) => {
              const hasGif = !!item.gifUrl;
              const isPlayingGif = playingGifId === item.id;
              const displayUrl = isPlayingGif && item.gifUrl ? item.gifUrl : item.dataUrl;

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
                      alt={`Pose ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102 select-none"
                      style={{ filter: item.filterCss || 'none' }}
                      loading="lazy"
                    />

                    {/* GIF Indicator / Toggle Button */}
                    {hasGif && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingGifId(isPlayingGif ? null : item.id);
                        }}
                        className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10 shadow-md transition-all ${
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
                          className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          title="Unduh GIF"
                        >
                          <Film size={11} />
                          <span>GIF</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDownloadSingle(item, e)}
                        className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold flex items-center gap-1 transition-colors"
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
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                >
                  <Film size={13} />
                  <span>Unduh GIF</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleDownloadSingle(currentLightboxPhoto, e)}
                className="px-3 py-1.5 rounded-xl bg-white text-gray-950 hover:bg-gray-100 font-bold text-xs flex items-center gap-1 shadow-md"
              >
                <Download size={13} />
                <span>Unduh HD</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center z-20 transition-all border border-white/20"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center z-20 transition-all border border-white/20"
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
                  : currentLightboxPhoto.dataUrl
              }
              alt="Lightbox Preview"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
              style={{ filter: currentLightboxPhoto.filterCss || 'none' }}
            />

            {currentLightboxPhoto.gifUrl && (
              <button
                type="button"
                onClick={() => setPlayingGifId(playingGifId === currentLightboxPhoto.id ? null : currentLightboxPhoto.id)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/80 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl transition-colors border border-white/20"
              >
                {playingGifId === currentLightboxPhoto.id ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
                <span>{playingGifId === currentLightboxPhoto.id ? 'Jeda Animasi' : 'Putar Animasi GIF'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{appConfig?.website?.brandName || 'snap.e'}</span>
            <span>— Photobooth Studio & Creative Strip Lab</span>
          </div>
          <p>© {new Date().getFullYear()} {appConfig?.website?.brandName || 'snap.e'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
