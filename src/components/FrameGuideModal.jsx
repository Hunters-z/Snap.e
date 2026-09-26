import { useState } from 'react';
import { X, BookOpen, Layers, CheckCircle2, AlertCircle, FileText, Sparkles, Download, Plus } from 'lucide-react';
import { useBooth } from '../context/BoothContext';

export default function FrameGuideModal({ isOpen, onClose, onOpenAddFrame }) {
  const { addCustomFrame } = useBooth();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sampleLoaded, setSampleLoaded] = useState(false);

  if (!isOpen) return null;

  // Generate downloadable 600x1800 Blueprint PNG
  const handleDownloadBlueprint = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1800;
    const ctx = canvas.getContext('2d');

    // Transparent / Grid background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 600, 1800);

    // Margins
    const margin = 40;
    const contentW = 600 - margin * 2; // 520 px
    const photoH = 390;
    const gap = 24;

    // Outer Bleed Margin line (safe zone)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(margin, margin, contentW, 1800 - margin * 2);

    // Header Area
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(margin, margin, contentW, 60);
    ctx.fillStyle = '#4B5563';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HEADER AREA (Logo / Hiasan Atas)', 300, margin + 35);

    // 3 Photo Cutout Boxes
    const startY = margin + 60 + 20;
    for (let i = 0; i < 3; i++) {
      const y = startY + i * (photoH + gap);

      // Cutout box
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(margin, y, contentW, photoH);

      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 6]);
      ctx.strokeRect(margin, y, contentW, photoH);

      // Text label inside cutout
      ctx.fillStyle = '#991B1B';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`LUBANG CUTOUT FOTO #${i + 1}`, 300, y + photoH / 2 - 15);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(`Ukuran: 520 × 390 px (Rasio 4:3) • Buat transparan!`, 300, y + photoH / 2 + 15);
    }

    // Footer Area
    const footerY = startY + 3 * (photoH + gap) + 10;
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(margin, footerY, contentW, 1800 - margin - footerY);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('FOOTER AREA (Branding, Tanggal, Caption)', 300, footerY + 90);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#4B5563';
    ctx.fillText('snap.e atelier • 600 × 1800 px Blueprint Template', 300, footerY + 125);

    // Trigger download
    const link = document.createElement('a');
    link.download = 'blueprint_panduan_frame_snap_e.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  // Quick load sample illustrated custom frame
  const handleLoadSampleFrame = async () => {
    try {
      await addCustomFrame({
        name: 'Sakura Petals Vintage',
        category: 'graphic',
        badge: 'FLORAL',
        bg: '#FFF5F7',
        text: '#9F1239',
        overlayType: 'sakura',
        description: 'Contoh frame ilustrasi kelopak sakura pastel dengan aksen merah anggur.'
      });
      setSampleLoaded(true);
      setTimeout(() => setSampleLoaded(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn text-gray-900">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 sm:p-8 relative text-left"
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
        <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
              Panduan Resmi Studio
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
              Panduan Membuat & Menambah Frame Manual
            </h2>
            <p className="text-xs text-gray-500">
              Spesifikasi ukuran, format file, dan apa saja yang dibutuhkan untuk bingkai photostrip kustom.
            </p>
          </div>
        </div>

        {/* Action Quick Bar */}
        <div className="flex flex-wrap gap-2.5 mb-5 p-3 bg-gray-50 rounded-2xl border border-gray-200/80 items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadBlueprint}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Download size={14} className="text-red-500" />
            <span>{downloadSuccess ? '✓ Template Blueprint Terunduh!' : 'Unduh Template Blueprint (PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleFrame}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-colors"
          >
            <Sparkles size={14} className="text-emerald-600" />
            <span>{sampleLoaded ? '✓ Contoh Frame Ditambahkan!' : 'Muat Contoh Frame Siap Pakai'}</span>
          </button>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-gray-600 leading-relaxed">
          
          {/* Section 1: Apa yang Dibutuhkan */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600" />
              1. Apa Saja yang Dibutuhkan untuk Frame Manual?
            </h3>
            <ul className="space-y-2 text-xs text-amber-900">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span><strong>File Gambar Desain:</strong> Format <strong>PNG Transparan 24-bit</strong> (jika ingin frame dengan jendela tembus pandang berlubang) atau <strong>JPG/PNG Background</strong> (pola motif/tekstur penuh).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Nama Frame:</strong> Judul pengenal unik (contoh: <em>Summer Fest, Y2K Hologram, Wedding Day, Cat Cafe</em>).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Warna Latar Belakang (Hex Color):</strong> Warna di balik foto atau cadangan saat gambar dimuat (contoh: <code className="font-mono bg-white px-1 py-0.5 rounded text-amber-950 font-bold">#FFF5F7</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Warna Teks & Logo Kontras:</strong> Warna untuk judul memori dan logo snap.e agar mudah terbaca (teks gelap untuk frame terang, teks putih untuk frame gelap).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Label Badge (Singkat):</strong> Label penanda kategori, misalnya: <em>ANALOG, FLORAL, Y2K, DOODLE, CUSTOM</em>.</span>
              </li>
            </ul>
          </div>

          {/* Section 2: Dimensi & Resolusi */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Layers size={16} className="text-red-600" />
              2. Spesifikasi Dimensi & Resolusi Kanvas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>Classic 3-Cut Strip</span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Rasio 1:3</span>
                </div>
                <p className="text-gray-500">Ukuran fisik: 2 × 6 inci (5 × 15 cm)</p>
                <div className="font-mono font-bold text-gray-800 bg-white p-2 rounded-lg border border-gray-200/80 space-y-0.5">
                  <p>Resolusi Preview: 600 × 1800 px</p>
                  <p className="text-red-600 text-[11px]">Lab Print (300 DPI): 1200 × 3600 px</p>
                </div>
                <p className="text-[11px] text-gray-500">3 jendela foto vertikal ukuran masing-masing ~520 × 390 px.</p>
              </div>

              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>Quad Grid 2×2</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Rasio 3:4</span>
                </div>
                <p className="text-gray-500">Ukuran fisik: 4 × 6 inci (10 × 15 cm)</p>
                <div className="font-mono font-bold text-gray-800 bg-white p-2 rounded-lg border border-gray-200/80 space-y-0.5">
                  <p>Resolusi Preview: 1200 × 1600 px</p>
                  <p className="text-indigo-600 text-[11px]">Lab Print (300 DPI): 1800 × 2400 px</p>
                </div>
                <p className="text-[11px] text-gray-500">4 jendela foto dalam susunan kisi 2 baris × 2 kolom.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Struktur Layout Visual */}
          <div className="p-4 bg-gray-900 text-white rounded-2xl space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <FileText size={15} className="text-yellow-400" />
              Struktur Pembagian Ruang Kanvas (Strip 600 × 1800 px)
            </h4>
            
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-2 bg-white/10 rounded-lg flex justify-between items-center border border-white/10">
                <span>[01] Header Area (Y: 0 - 80 px)</span>
                <span className="text-gray-400 text-[10px]">Logo mini / Hiasan atas</span>
              </div>
              <div className="p-2.5 bg-red-500/20 text-red-200 rounded-lg flex justify-between items-center border border-red-500/30">
                <span>[02] Foto 1 (Y: 80 - 470 px)</span>
                <span className="text-white text-[10px]">Lubang Foto 520 × 390 px</span>
              </div>
              <div className="p-2.5 bg-red-500/20 text-red-200 rounded-lg flex justify-between items-center border border-red-500/30">
                <span>[03] Foto 2 (Y: 494 - 884 px)</span>
                <span className="text-white text-[10px]">Lubang Foto 520 × 390 px</span>
              </div>
              <div className="p-2.5 bg-red-500/20 text-red-200 rounded-lg flex justify-between items-center border border-red-500/30">
                <span>[04] Foto 3 (Y: 908 - 1298 px)</span>
                <span className="text-white text-[10px]">Lubang Foto 520 × 390 px</span>
              </div>
              <div className="p-2 bg-white/10 rounded-lg flex justify-between items-center border border-white/10">
                <span>[05] Footer Typography (Y: 1300 - 1800 px)</span>
                <span className="text-gray-400 text-[10px]">Teks custom, tanggal, logo snap.e</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              * Tips Desain: Sisakan jarak batas aman (<em>safe margin bleed</em>) minimal 20-40 piksel di sisi kiri dan kanan agar karya ilustrasi tidak terpotong oleh pisau pemotong mesin printer lab.
            </p>
          </div>

          {/* Section 4: Langkah Praktis Menambahkan */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900">3. Cara Menambahkan Frame ke snap.e</h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-gray-700">
              <li>Buat gambar desain bingkai Anda di <strong>Canva, Photoshop, Figma, atau Procreate</strong> menggunakan ukuran kanvas <strong>600 × 1800 px</strong> (atau 1200 × 3600 px untuk HD).</li>
              <li>Ekspor gambar dalam format <strong>PNG Transparan</strong> dengan lubang tembus pandang pada slot foto.</li>
              <li>Buka tombol <strong>&ldquo;+ Tambah Frame Manual&rdquo;</strong> pada tab bingkai atau di Dashboard Admin Studio.</li>
              <li>Ketik nama bingkai, unggah file gambar (atau tempel URL gambar), lalu tentukan warna latar & warna teks yang cocok.</li>
              <li>Periksa <em>Live Preview</em> di samping form, lalu klik <strong>Simpan Frame</strong>.</li>
              <li>Frame baru Anda otomatis tersimpan di Cloud Firestore dan langsung dapat digunakan oleh seluruh pengunjung photobooth!</li>
            </ol>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <AlertCircle size={14} className="text-emerald-600" />
            <span>Format gambar maksimal 2.5 MB untuk performa optimal.</span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {onOpenAddFrame && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddFrame();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                <span>Buat Frame Sekarang</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
            >
              Tutup Panduan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
