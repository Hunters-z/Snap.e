import { useState } from 'react';
import Topbar from '../components/Topbar';
import { Download, Copy, Printer, RotateCcw, Crop } from 'lucide-react';

export default function EditorPhotostrip() {
  const [frameColor, setFrameColor] = useState('Cream');
  const [text, setText] = useState('Long Distance Soulmate');

  const frames = [
    { name: 'Cream', hex: '#F9F6F0' },
    { name: 'Noir', hex: '#111827' },
    { name: 'Off-White', hex: '#FFFFFF' },
    { name: 'Pastel', hex: '#FDF2F8' },
    { name: 'Sepia', hex: '#FEF3C7' }
  ];

  const stickers = ['✨', '💖', '🎀', '⭐', '🍒'];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Topbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar - Controls */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {/* Frame Colors */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-1">Warna Frame</h3>
              <p className="text-xs text-gray-500 mb-4">Pilih palet minimalis untuk nuansa photostrip Anda</p>
              <div className="flex justify-between">
                {frames.map(f => (
                  <div key={f.name} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setFrameColor(f.name)}>
                    <div 
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${frameColor === f.name ? 'border-gray-900 scale-110' : 'border-transparent shadow-sm'}`}
                      style={{ backgroundColor: f.hex }}
                    ></div>
                    <span className="text-[10px] font-medium text-gray-600">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stickers */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Stiker Esensial</h3>
                <button className="text-[10px] font-bold text-red-500 hover:text-red-700">Hapus Semua</button>
              </div>
              <div className="flex justify-between">
                {stickers.map((s, i) => (
                  <button key={i} className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center text-xl transition-transform hover:scale-110">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Text & Date */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Teks & Tanggal Bawah</h3>
              <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-900 mb-4"
              />
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-gray-900 focus:ring-gray-900" />
                  <span className="text-xs font-medium text-gray-700">Badge snap.e</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-gray-900 focus:ring-gray-900" />
                  <span className="text-xs font-medium text-gray-700">Mini QR</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Canvas Preview */}
        <div className="flex-1 flex flex-col items-center justify-center">
          
          {/* Photostrip Card */}
          <div 
            className="w-[280px] md:w-[320px] shadow-xl rounded-sm p-4 relative transition-colors duration-300"
            style={{ backgroundColor: frames.find(f => f.name === frameColor)?.hex }}
          >
            {/* Strip Header */}
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="text-[9px] font-bold tracking-widest text-gray-600">SNAP.E MEMORIES</span>
              <span className="text-[9px] font-mono text-gray-400">SESSION #8492</span>
            </div>

            {/* Photos */}
            <div className="space-y-3">
              <div className="aspect-[4/3] bg-gray-200 rounded-sm overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">31</span>
                <div className="absolute top-2 left-2 text-2xl">✨</div>
              </div>
              <div className="aspect-[4/3] bg-gray-200 rounded-sm overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=300&fit=crop" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">32</span>
              </div>
              <div className="aspect-[4/3] bg-gray-200 rounded-sm overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=300&fit=crop" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">33</span>
              </div>
              <div className="aspect-[4/3] bg-gray-200 rounded-sm overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">34</span>
                <div className="absolute bottom-2 right-2 text-2xl">💖</div>
              </div>
            </div>

            {/* Strip Footer */}
            <div className="mt-6 px-1 flex justify-between items-end">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <img src="/logo.jpeg" className="w-4 h-4 rounded-full" />
                  <span className="font-bold text-[11px]">snap.e</span>
                </div>
                <p className="text-[10px] text-gray-700 font-medium">{text}</p>
                <p className="text-[8px] text-gray-500 font-mono mt-0.5">24.10.2024 • 21:44 WIB</p>
              </div>
              <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center p-1">
                 <div className="w-full h-full border border-dashed border-white flex flex-wrap"><div className="w-1/2 h-1/2 bg-white"></div><div className="w-1/2 h-1/2"></div><div className="w-1/2 h-1/2"></div><div className="w-1/2 h-1/2 bg-white"></div></div>
              </div>
            </div>
          </div>

          {/* Canvas Tools */}
          <div className="mt-8 flex items-center justify-center gap-6 text-gray-400">
            <button className="hover:text-gray-900 transition-colors"><RotateCcw size={18} /></button>
            <button className="hover:text-gray-900 transition-colors"><Crop size={18} /></button>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-xs font-semibold tracking-wider">SCALE 100% (2x6 INCH)</span>
          </div>

        </div>

        {/* Right Sidebar - Actions */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          
          {/* Download Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Simpan Hasil</h3>
            <p className="text-xs text-gray-500 mb-6">Siap cetak & kualitas tinggi</p>
            
            <button className="w-full bg-black hover:bg-gray-800 text-white py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors mb-4 shadow-md shadow-gray-200">
              <Download size={18} />
              Unduh Foto HD <span className="opacity-50 font-mono ml-1 text-xs">(300 DPI)</span>
            </button>

            <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <input type="text" readOnly value="https://snap.e.studio/view/8492" className="flex-1 bg-transparent px-3 py-2.5 text-xs text-gray-500 outline-none" />
              <button className="px-4 font-bold text-xs hover:bg-gray-100 border-l border-gray-200 transition-colors">Salin</button>
            </div>
          </div>

          {/* Print Order Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-50 text-red-600 font-bold text-[10px] px-3 py-1 rounded-bl-lg">Rp 35.000</div>
            <h3 className="font-bold text-gray-900 mb-3">Pesan Cetak Fisik</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              2x Print photostrip premium + Frame Kayu Oak Scandinavian dikirim ke alamat rumah.
            </p>
            <button className="w-full bg-[#FF4757] hover:bg-[#ff3043] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-100">
              <Printer size={18} />
              Pesan & Kirim ke Rumah
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpeg" className="w-6 h-6 rounded-full grayscale" />
            <span className="font-bold text-gray-900 text-sm">snap.e</span>
            <span className="text-xs text-gray-500 ml-2">— Tangible Memories, Synchronized Distances.</span>
          </div>
          <nav className="flex gap-6 text-xs font-medium text-gray-500">
            <a href="#" className="hover:text-gray-900">Beranda</a>
            <a href="#" className="hover:text-gray-900">Booth Virtual</a>
            <a href="#" className="hover:text-gray-900">Katalog Cetak</a>
            <a href="#" className="hover:text-gray-900">Admin</a>
          </nav>
          <p className="text-xs text-gray-400">© 2024 snap.e studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
