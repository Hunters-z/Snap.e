import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Printer, 
  ExternalLink, 
  Smartphone, 
  Printer as PrinterIcon, 
  Lock,
  LogOut,
  CheckCircle,
  Trash2,
  Menu,
  X,
  Palette,
  Sliders,
  DollarSign
} from 'lucide-react';
import { useBooth } from '../context/BoothContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { 
    appConfig, 
    updateAppConfig, 
    orders, 
    updateOrderStatus, 
    deleteOrder, 
    isAdminAuth, 
    adminLogin, 
    adminLogout 
  } = useBooth();

  // Admin Login Form State
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'orders' | 'config' | 'hardware'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Config editing states
  const [configPrice, setConfigPrice] = useState(appConfig.payment?.price || 15000);
  const [configQrisUrl, setConfigQrisUrl] = useState(appConfig.payment?.qrisUrl || '');
  const [newFrameName, setNewFrameName] = useState('');
  const [newFrameColor, setNewFrameColor] = useState('#FFE4E6');
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterCss, setNewFilterCss] = useState('');
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Handle Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const success = adminLogin(adminPassword);
    if (!success) {
      setLoginError(true);
    } else {
      setLoginError(false);
    }
  };

  // Handle Save Pricing & Frames
  const handleSaveConfig = (e) => {
    e.preventDefault();
    const updated = {
      ...appConfig,
      payment: {
        ...appConfig.payment,
        price: parseInt(configPrice, 10) || 15000,
        qrisUrl: configQrisUrl
      }
    };

    if (newFrameName.trim()) {
      const frameId = `custom_${Date.now()}`;
      updated.customFrames = [
        ...(updated.customFrames || []),
        { id: frameId, name: newFrameName.trim(), bg: newFrameColor, text: '#111827' }
      ];
      setNewFrameName('');
    }

    if (newFilterName.trim() && newFilterCss.trim()) {
      const filterId = `filter_${Date.now()}`;
      updated.customFilters = [
        ...(updated.customFilters || []),
        { id: filterId, name: newFilterName.trim(), css: newFilterCss.trim() }
      ];
      setNewFilterName('');
      setNewFilterCss('');
    }

    updateAppConfig(updated);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
  };

  // IF NOT AUTHENTICATED: Show Dedicated Admin Login Screen
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#18181B] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 mx-auto flex items-center justify-center">
              <Lock size={22} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Studio Admin Console</h1>
            <p className="text-xs text-gray-400">
              Akses khusus pemilik studio foto snap.e atelier
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Kata Sandi / Kunci Otorisasi</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Masukkan kata sandi admin..."
                className="w-full px-4 py-3 bg-[#27272A] border border-white/10 rounded-xl text-sm outline-none focus:border-red-500 transition-colors text-white"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/50">
                Kata sandi salah. Gunakan kata sandi default: <b>admin123</b>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-red-600/20"
            >
              Masuk ke Konsol Studio
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <span>Petunjuk: Kata sandi bawaan adalah <code className="text-red-400">admin123</code></span>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white underline"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden text-gray-900 font-sans">
      
      {/* Toast Notification */}
      {configSavedToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl animate-fadeIn flex items-center gap-2">
          <CheckCircle size={16} />
          Pengaturan Studio Berhasil Disimpan!
        </div>
      )}

      {/* SIDEBAR (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
              s
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900">snap.e</h2>
              <p className="text-[9px] text-gray-400 font-bold tracking-widest">STUDIO OWNER CONSOLE</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => { setActiveTab('console'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'console'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard size={16} />
            Studio Console
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <Printer size={16} />
              Pesanan Cetak Lab
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-100 text-red-700">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('config'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'config'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sliders size={16} />
            Tarif, Frame & Preset
          </button>

          <button
            onClick={() => { setActiveTab('hardware'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hardware'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PrinterIcon size={16} />
            Hardware Mesin Cetak
          </button>
        </nav>

        {/* Studio Info & Logout */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg">
            <p className="font-semibold text-gray-800">Hub: Jakarta Selatan</p>
            <p className="text-[10px] text-gray-400">snap.e v2.4 Atelier Edition</p>
          </div>

          <button
            onClick={() => { adminLogout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Keluar dari Admin
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="text-xs font-mono text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              STUDIO AKTIF • SNP-JKT-882
            </div>
            <div className="hidden sm:flex text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-md items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              FIRESTORE CLOUD SYNCED
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Buka Tampilan Publik</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            
            {/* TAB 1: CONSOLE OVERVIEW */}
            {activeTab === 'console' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Studio Console & Telemetri Real-Time
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Monitoring antrean cetak fisik, room WebRTC LDR aktif, dan performa omzet studio.
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Antrean Cetak</p>
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Printer size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{orders.length}</h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      {orders.filter(o => o.status === 'pending').length} pesanan baru menunggu
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bilik LDR Aktif</p>
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Smartphone size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">4 Sesi</h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Latensi sinkron 18ms
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tarif Booth Aktif</p>
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      Rp {appConfig.payment.price.toLocaleString('id-ID')}
                    </h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      Settlement otomatis QRIS
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Koleksi Frame</p>
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Palette size={16} /></div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      {appConfig.customFrames?.length || 7} Desain
                    </h3>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      Tersedia untuk pelanggan
                    </p>
                  </div>
                </div>

                {/* Live LDR Rooms simulation item */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Monitoring Bilik LDR Streaming</h3>
                      <p className="text-xs text-gray-500">Koneksi WebRTC peer-to-peer antar perangkat pengguna</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      Live
                    </span>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Sesi Bilik #ROOM-9021</p>
                        <p className="text-xs text-gray-500">Jakarta &bull; Melbourne (Dual Stream Aktif)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-gray-200">
                        Pose 2 / 3 Selesai
                      </span>
                      <button
                        onClick={() => navigate('/capture')}
                        className="text-xs font-bold px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black"
                      >
                        Buka Booth
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRINT ORDERS QUEUE */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Pesanan Cetak Fisik Lab Studio
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Kelola antrean cetak mesin foto, packaging, dan status pengiriman ke pelanggan.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-4">ID Pesanan</th>
                          <th className="p-4">Pelanggan</th>
                          <th className="p-4">Paket & Nilai</th>
                          <th className="p-4">Alamat Pengiriman</th>
                          <th className="p-4">Status Cetak</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-400">
                              Belum ada pesanan cetak fisik.
                            </td>
                          </tr>
                        ) : (
                          orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-gray-900">
                                {ord.id}
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-gray-900">{ord.customerName}</p>
                                <p className="text-gray-500 text-[11px]">{ord.phone}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold text-gray-800">{ord.paperType}</p>
                                <p className="font-mono text-gray-500">Rp {ord.totalPrice?.toLocaleString('id-ID')}</p>
                              </td>
                              <td className="p-4 max-w-xs text-gray-600 truncate">
                                {ord.address}
                              </td>
                              <td className="p-4">
                                <select
                                  value={ord.status}
                                  onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-bold border outline-none ${
                                    ord.status === 'printing'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : ord.status === 'ready'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : ord.status === 'shipped'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  <option value="pending">Belum Dicetak</option>
                                  <option value="printing">Sedang Dicetak Lab</option>
                                  <option value="ready">Siap Kirim / Selesai Cetak</option>
                                  <option value="shipped">Telah Dikirim Kurir</option>
                                </select>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => deleteOrder(ord.id)}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                  title="Hapus Pesanan"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONFIGURATION (PRICE, QRIS, FRAMES) */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Pengaturan Tarif, QRIS & Kustomisasi
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Sesuaikan harga photobooth dan tambah frame warna baru secara instan.
                  </p>
                </div>

                <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pricing Card */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-600" />
                      Tarif Sesi & QRIS
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Harga per Sesi Photobooth (Rp)</label>
                      <input
                        type="number"
                        value={configPrice}
                        onChange={(e) => setConfigPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">URL Gambar QRIS</label>
                      <input
                        type="text"
                        value={configQrisUrl}
                        onChange={(e) => setConfigQrisUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Add Custom Frame Card */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <Palette size={16} className="text-rose-600" />
                      Tambah Warna Frame Baru
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Nama Frame</label>
                      <input
                        type="text"
                        value={newFrameName}
                        onChange={(e) => setNewFrameName(e.target.value)}
                        placeholder="Contoh: Matcha Latte, Baby Blue"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Pilih Warna Frame</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={newFrameColor}
                          onChange={(e) => setNewFrameColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                        />
                        <span className="font-mono text-xs text-gray-600 uppercase">{newFrameColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                    >
                      Simpan Semua Pengaturan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: HARDWARE LAB */}
            {activeTab === 'hardware' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Mesin Cetak Lab & Telemetri Hardware
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    DNP RX1-HS Dye-Sublimation Photo Lab Printer status & kalibrasi pemotong.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <PrinterIcon size={24} className="text-emerald-600" />
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">DNP Fotolusio RX1-HS</h3>
                        <p className="text-xs text-gray-500">USB Connected • Firmware v2.10</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      ONLINE & READY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Sisa Kertas Cetak</p>
                      <p className="text-2xl font-extrabold text-gray-900 mt-1">482 / 700</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Lembar Roll 4R</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Kaset Ribbon Tinta</p>
                      <p className="text-2xl font-extrabold text-gray-900 mt-1">74%</p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Kondisi Prima</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Suhu Print Head</p>
                      <p className="text-2xl font-extrabold text-gray-900 mt-1">33.5°C</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Normal (Batas Max 55°C)</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => alert("Perintah kalibrasi pisau potong 2x6 telah dikirim ke mesin.")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
                    >
                      Uji Kalibrasi Potong (2x6 Cut)
                    </button>
                    <button
                      onClick={() => alert("Kertas test strip sedang dicetak.")}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Cetak Lembar Uji Warna Lab
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

    </div>
  );
}
