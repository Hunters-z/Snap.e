import { LayoutDashboard, Users, CreditCard, LayoutTemplate, Printer, Plus, ExternalLink, RefreshCw, Smartphone, Printer as PrinterIcon, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden text-gray-900 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <img src="/logo.jpeg" alt="logo" className="w-8 h-8 rounded-full" />
          <div>
            <h2 className="font-bold text-sm">snap.e</h2>
            <p className="text-[10px] text-gray-500 font-semibold tracking-wider">ADMIN STUDIO</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium">
            <LayoutDashboard size={18} />
            Studio Console
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
            <CreditCard size={18} />
            Sesi & Transaksi
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
            <LayoutTemplate size={18} />
            Layout & Preset
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
            <Printer size={18} />
            Pesanan Cetak
          </a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
            snap.e v2.4 // studio engine
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-700"><RefreshCw size={18}/></button>
            <button className="text-gray-400 hover:text-gray-700"><MessageSquare size={18}/></button>
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white"><Users size={16}/></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            
            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  MODE PEMILIK STUDIO • SNAP.E ATELIER <span className="text-gray-400 font-normal ml-2">• Jakarta Selatan Hub</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dasbor Studio & Konsol Kamera</h1>
                  <span className="text-xs font-mono text-gray-400">ID: SNP-JKT-882</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                  Ringkasan sinkronisasi peer dual-stream, antrean cetak fisik, serta pengelolaan frame otomatis.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                  <ExternalLink size={16} /> Lihat Toko Publik
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                  <Plus size={16} /> Buat Sesi Manual
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Paket Aktif</p>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md"><LayoutTemplate size={16}/></div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">8</h3>
                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <span>LDR, Solo, Maternity...</span> <span className="text-indigo-600 cursor-pointer">Semua Aktif &rarr;</span>
                </p>
              </div>
              
              {/* Card 2 */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Booking Pending</p>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md"><CreditCard size={16}/></div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">4</h3>
                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <span>12 total booking minggu ini</span> <span className="text-amber-600 cursor-pointer">Butuh Konfirmasi</span>
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm ring-1 ring-red-100">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Sesi LDR Berjalan</p>
                  <div className="p-1.5 bg-red-50 text-red-600 rounded-md animate-pulse"><Smartphone size={16}/></div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-3xl font-bold text-gray-900">6</h3>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Live Streaming</span>
                </div>
                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <span>Koneksi WebRTC stabil 99.4%</span>
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pendapatan Hari Ini</p>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><CreditCard size={16}/></div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">Rp 1.450k</h3>
                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span>26 transaksi QRIS instan</span> <span className="text-emerald-600 font-bold">+18% d/d</span>
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (Span 2) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Sesi Live Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Sesi Live & Monitoring LDR <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold tracking-wider">6 BILIK AKTIF</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Dual-peer synchronization & shutter status real-time</p>
                    </div>
                    <button className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium"><RefreshCw size={14}/> Refresh Telemetri</button>
                  </div>

                  <div className="space-y-4">
                    {/* Session Item */}
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Smartphone size={16}/></div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Alisya & Dimas <span className="text-[10px] font-mono text-gray-400 ml-2">ROOM-0402</span></p>
                            <p className="text-xs text-gray-500">Bandung &harr; Melbourne (LDR Dual Cam)</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sync 24ms
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono mt-1">14:22 / 20m</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-16 w-24 bg-gray-200 rounded-md overflow-hidden relative"><img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=200&fit=crop" className="w-full h-full object-cover" /><span className="absolute bottom-1 left-1 text-[8px] bg-black/50 text-white px-1 rounded">P1: JKT</span></div>
                        <div className="h-16 w-24 bg-gray-200 rounded-md overflow-hidden relative"><img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=200&fit=crop" className="w-full h-full object-cover" /><span className="absolute bottom-1 left-1 text-[8px] bg-black/50 text-white px-1 rounded">P2: MEL</span></div>
                        <div className="flex-1 flex flex-col justify-center items-end pr-2">
                           <span className="text-[10px] font-bold text-gray-500">LAYOUT STRIP</span>
                           <span className="text-sm font-bold">3-Cut Pastel</span>
                           <span className="text-[10px] text-emerald-600 font-semibold">5 Foto Terambil</span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                         <span className="text-xs text-gray-600">Preset: <b>Tokyo 90s Grain</b></span>
                         <div className="flex gap-2">
                           <button className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-100">Pantau Sesi</button>
                           <button className="text-xs font-medium px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-black">Kirim Trigger Shutter</button>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pesanan Cetak Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Pesanan Cetak Fisik & Merchandise
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Status cetak strip foto lab, packaging, dan pickup kurir</p>
                    </div>
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">Lihat Semua (24)</button>
                  </div>
                  
                  <div className="space-y-0 text-sm">
                    {/* List Item */}
                    <div className="flex justify-between items-center py-4 border-b border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0"><img src="https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=100&h=100&fit=crop" className="w-full h-full object-cover"/></div>
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-2">Rian & Nabila <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold tracking-wider">BELUM CETAK</span></p>
                          <p className="text-xs text-gray-500 mt-0.5">2x Glossy Strip (3R Extended) • DNP RX1-HS Print Lab</p>
                          <p className="text-[10px] text-gray-400 mt-1">Kirim ke: Tebet Barat, Jakarta Selatan (JNE YES)</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold">Rp 48.000</span>
                        <button className="text-xs font-medium px-3 py-1.5 bg-black text-white rounded hover:bg-gray-800">Kirim ke Mesin Lab</button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-6">
                
                {/* Template & Filter Config */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Template Frame & Filter</h3>
                      <p className="text-[10px] text-gray-500">Katalog overlay SVG & tarif QRIS</p>
                    </div>
                    <button className="text-xs text-gray-600 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50">Upload SVG</button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="aspect-[3/4] bg-pink-50 border border-pink-100 rounded-md flex flex-col items-center justify-center p-2 text-center">
                      <div className="w-4 h-6 bg-white border border-pink-200 mb-1"></div>
                      <span className="text-[8px] font-bold">Classic Pink</span>
                    </div>
                    <div className="aspect-[3/4] bg-blue-50 border border-blue-100 rounded-md flex flex-col items-center justify-center p-2 text-center">
                      <div className="w-4 h-6 bg-white border border-blue-200 mb-1"></div>
                      <span className="text-[8px] font-bold">Y2K Chrome</span>
                    </div>
                    <div className="aspect-[3/4] bg-gray-50 border border-gray-200 rounded-md flex flex-col items-center justify-center p-2 text-center">
                      <div className="grid grid-cols-2 gap-0.5 w-6 h-6 mb-1">
                        <div className="bg-white border border-gray-300"></div><div className="bg-white border border-gray-300"></div><div className="bg-white border border-gray-300"></div><div className="bg-white border border-gray-300"></div>
                      </div>
                      <span className="text-[8px] font-bold">Quad Grid</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">Stiker Musiman Aktif</p>
                        <p className="text-[10px] text-gray-500">Heart doodle, cat paws</p>
                      </div>
                      <div className="w-8 h-4 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">Dynamic QRIS Settlement</p>
                        <p className="text-[10px] text-gray-500">Kunci bilik sampai sukses</p>
                      </div>
                      <div className="w-8 h-4 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div></div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Bot */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><MessageSquare size={20}/></div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">WhatsApp Studio Bot</h3>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Terhubung: +62 812-9901-SNAP</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Kirim tautan cloud HD, video timelapse GIF 15 detik, dan kuitansi pembayaran secara otomatis.</p>
                  
                  <div className="space-y-3 mb-4">
                     <div className="flex justify-between items-center border border-gray-100 p-2 rounded-md bg-gray-50">
                        <span className="text-xs font-medium text-gray-700">Auto-Kirim Link Cloud</span>
                        <div className="w-8 h-4 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div></div>
                     </div>
                     <div className="flex justify-between items-center border border-gray-100 p-2 rounded-md bg-gray-50">
                        <span className="text-xs font-medium text-gray-700">Generate & Kirim GIF Loop</span>
                        <div className="w-8 h-4 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div></div>
                     </div>
                  </div>

                  <div className="bg-gray-900 text-gray-300 p-3 rounded-lg font-mono text-[9px] leading-relaxed">
                    <p className="text-emerald-400 mb-1">LOG PENGIRIMAN TERAKHIR <span className="float-right text-gray-500">100% Terkirim</span></p>
                    <p>[14:18] WA sent to +62813****802 • 6 RAW + 1 Strip PDF</p>
                    <p>[13:54] WA sent to +62857****110 • QRIS Lunas Rp 35.000</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Hardware Status Bottom Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <PrinterIcon size={24} className="text-gray-400" />
                <div>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-2">DNP Fotolusio RX1-HS Print Lab Hardware <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold tracking-wider">ONLINE</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">Sisa Kertas: 382/700 Lembar • Ribbon Kaset: 64% • Suhu Head: 34°C Normal</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded hover:bg-gray-50">Uji Potong Kalibrasi</button>
                <button className="px-3 py-1.5 text-xs font-medium bg-black text-white rounded hover:bg-gray-800">Cetak Antrean Menunggu (1)</button>
              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
