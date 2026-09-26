import { useState } from 'react';
import { X, Upload, Palette, Image as ImageIcon, Sparkles, BookOpen, CheckCircle } from 'lucide-react';
import { useBooth } from '../context/BoothContext';

export default function AddFrameModal({ isOpen, onClose, onOpenGuide }) {
  const { addCustomFrame, capturedPhotos } = useBooth();

  // Form State
  const [frameName, setFrameName] = useState('');
  const [frameType, setFrameType] = useState('graphic'); // 'graphic' | 'solid'
  const [frameBg, setFrameBg] = useState('#FDF2F4');
  const [frameText, setFrameText] = useState('#9F1239');
  const [frameImage, setFrameImage] = useState('');
  const [overlayTheme, setOverlayTheme] = useState('sakura'); // 'sakura' | 'film' | 'y2k' | 'coquette' | 'doodle' | 'newspaper' | 'none'
  const [badgeLabel, setBadgeLabel] = useState('CUSTOM');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle local file upload (converts to base64 Data URL)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMsg('Ukuran file terlalu besar (maksimal 2.5 MB). Silakan gunakan gambar yang lebih ringan.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setFrameImage(event.target.result);
      setOverlayTheme('custom-image');
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!frameName.trim()) {
      setErrorMsg('Harap masukkan nama frame.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addCustomFrame({
        name: frameName.trim(),
        category: frameType,
        badge: badgeLabel.toUpperCase() || (frameType === 'graphic' ? 'DESIGN' : 'SOLID'),
        bg: frameBg,
        text: frameText,
        imageUrl: frameImage || null,
        overlayType: overlayTheme === 'none' ? null : overlayTheme,
        description: `Frame kustom ${frameName.trim()} dengan tema ${frameType === 'graphic' ? overlayTheme : 'solid'}.`
      });

      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menyimpan frame ke database. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sample photo URLs for live preview
  const samplePhoto = capturedPhotos[0]?.dataUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=225&fit=crop';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn text-gray-900">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 sm:p-8 relative text-left"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-gray-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
              Kustomisasi Photostrip
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
              Tambah Frame Manual Baru
            </h2>
            <p className="text-xs text-gray-500">
              Buat frame bergambar kustom atau warna solid yang tersimpan langsung ke bilik photobooth.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-colors shrink-0"
          >
            <BookOpen size={14} className="text-amber-600" />
            <span>Panduan & Ukuran Frame</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* LEFT: FORM INPUTS */}
          <form onSubmit={handleSubmit} className="md:col-span-7 space-y-4">
            
            {/* Frame Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Nama Frame</label>
              <input
                type="text"
                required
                value={frameName}
                onChange={(e) => setFrameName(e.target.value)}
                placeholder="Contoh: Sakura Spring, Y2K Cyber, Vintage 35mm"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-gray-900"
              />
            </div>

            {/* Frame Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Tipe Frame</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFrameType('graphic')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    frameType === 'graphic'
                      ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900 font-bold'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ImageIcon size={18} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-900">Bergambar / Grafis</p>
                    <p className="text-[10px] text-gray-400 font-normal">Ilustrasi & Ornamen</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFrameType('solid')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    frameType === 'solid'
                      ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900 font-bold'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Palette size={18} className="text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-900">Warna Solid</p>
                    <p className="text-[10px] text-gray-400 font-normal">Minimalis Bersih</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Graphic Preset Theme Or Image Upload */}
            {frameType === 'graphic' && (
              <div className="space-y-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-red-500" />
                    Pilih Ornamen Grafis
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { id: 'sakura', name: '🌸 Sakura Petals', bg: '#FDF2F4', text: '#9F1239' },
                      { id: 'film', name: '🎞️ 35mm Film', bg: '#141416', text: '#E5E7EB' },
                      { id: 'y2k', name: '✦ Y2K Stars', bg: '#F5F3FF', text: '#4C1D95' },
                      { id: 'cat_cafe', name: '🐱 Cat Cafe', bg: '#FFFDF9', text: '#5B3A29' },
                      { id: 'botanical', name: '🌿 Botanical', bg: '#F4F9F4', text: '#1C3A27' },
                      { id: 'party', name: '🎈 Party Pop', bg: '#FEF9F5', text: '#9A3412' },
                      { id: 'coquette', name: '🎀 Coquette Bow', bg: '#FFF8F6', text: '#831843' },
                      { id: 'doodle', name: '☕ Cafe Doodle', bg: '#FAF7F2', text: '#451A03' },
                      { id: 'newspaper', name: '📰 Retro Gazette', bg: '#F5EBE1', text: '#292524' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setOverlayTheme(theme.id);
                          setFrameBg(theme.bg);
                          setFrameText(theme.text);
                        }}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          overlayTheme === theme.id
                            ? 'bg-gray-900 text-white font-bold border-gray-900 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Custom Image Overlay */}
                <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Upload size={14} className="text-emerald-600" />
                    Atau Unggah Gambar Bingkai Kustom (PNG / JPG)
                  </label>
                  
                  <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer transition-colors">
                    <Upload size={14} />
                    <span>{frameImage ? 'Ganti File Gambar' : 'Pilih Gambar dari Perangkat'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  {/* Or image URL */}
                  <input
                    type="url"
                    value={frameImage.startsWith('data:') ? '' : frameImage}
                    onChange={(e) => {
                      setFrameImage(e.target.value);
                      if (e.target.value) setOverlayTheme('custom-image');
                    }}
                    placeholder="Atau tempel URL gambar latar frame (https://...)"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] font-mono outline-none"
                  />
                </div>
              </div>
            )}

            {/* Color Controls (Background & Text) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Warna Latar (BG)</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
                  <input
                    type="color"
                    value={frameBg}
                    onChange={(e) => setFrameBg(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs font-bold text-gray-700 uppercase">{frameBg}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Warna Teks & Logo</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
                  <input
                    type="color"
                    value={frameText}
                    onChange={(e) => setFrameText(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs font-bold text-gray-700 uppercase">{frameText}</span>
                </div>
              </div>
            </div>

            {/* Badge Label */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Label Badge (Singkat)</label>
              <input
                type="text"
                maxLength={10}
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value.toUpperCase())}
                placeholder="Contoh: DESIGN, Y2K, FLORAL"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold uppercase"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <CheckCircle size={16} className="text-emerald-400" />
                <span>Simpan Frame ke Studio</span>
              </button>
            </div>
          </form>

          {/* RIGHT: LIVE PREVIEW */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-gray-100/70 p-4 rounded-2xl border border-gray-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Pratinjau Langsung (Live Preview)
            </span>

            {/* Mini Photostrip Strip Simulation */}
            <div
              className="w-[190px] p-3 rounded-xs shadow-xl relative transition-all duration-200 overflow-hidden"
              style={{
                backgroundColor: frameBg,
                color: frameText,
                backgroundImage: frameImage ? `url(${frameImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-center text-[8px] font-bold tracking-widest opacity-70 mb-2">
                <span>SNAP.E</span>
                <span className="font-mono">#SNP-TEST</span>
              </div>

              {/* Photos simulation */}
              <div className="space-y-2">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="aspect-[4/3] bg-gray-300 rounded-xs overflow-hidden relative border border-black/10">
                    <img src={samplePhoto} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[7px] font-mono px-1 rounded">
                      #{num}
                    </span>
                  </div>
                ))}
              </div>

              {/* Graphic Overlay Mock for themes */}
              {frameType === 'graphic' && (
                <>
                  {frameImage && (
                    <img
                      src={frameImage}
                      alt="Overlay Preview"
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 opacity-90"
                    />
                  )}
                  {overlayTheme === 'sakura' && (
                    <>
                      <div className="absolute top-1 right-2 text-sm pointer-events-none">🌸</div>
                      <div className="absolute top-1 left-2 text-sm pointer-events-none">🌸</div>
                    </>
                  )}
                  {overlayTheme === 'y2k' && (
                    <>
                      <div className="absolute top-1 right-2 text-xs pointer-events-none">✦</div>
                      <div className="absolute top-1 left-2 text-xs pointer-events-none">✧</div>
                    </>
                  )}
                  {overlayTheme === 'cat_cafe' && (
                    <>
                      <div className="absolute top-1 right-2 text-sm pointer-events-none">🐱</div>
                      <div className="absolute top-1 left-2 text-xs pointer-events-none">🐾</div>
                    </>
                  )}
                  {overlayTheme === 'botanical' && (
                    <>
                      <div className="absolute top-1 right-2 text-sm pointer-events-none">🌿</div>
                      <div className="absolute top-1 left-2 text-sm pointer-events-none">🌿</div>
                    </>
                  )}
                  {overlayTheme === 'party' && (
                    <>
                      <div className="absolute top-1 right-2 text-sm pointer-events-none">🎈</div>
                      <div className="absolute top-1 left-2 text-sm pointer-events-none">🎉</div>
                    </>
                  )}
                  {overlayTheme === 'coquette' && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 text-sm pointer-events-none">🎀</div>
                  )}
                  {overlayTheme === 'film' && (
                    <div className="absolute inset-y-0 left-0 w-2.5 bg-black flex flex-col justify-around py-2 pointer-events-none">
                      <div className="w-1.5 h-2 bg-white/70 mx-auto rounded-xs"></div>
                      <div className="w-1.5 h-2 bg-white/70 mx-auto rounded-xs"></div>
                      <div className="w-1.5 h-2 bg-white/70 mx-auto rounded-xs"></div>
                    </div>
                  )}
                </>
              )}

              {/* Footer */}
              <div className="mt-3 pt-1 text-left space-y-0.5">
                <p className="font-bold text-[10px] leading-tight">snap.e</p>
                <p className="italic text-[8px] opacity-80 truncate">{frameName || 'Judul Memori Anda'}</p>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center mt-3">
              Tampilan live akan diterapkan pada unduhan HD & cetak fisik.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
