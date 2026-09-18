import { useState } from 'react';
import { ChevronLeft, User, Volume2, Wifi, Camera as CameraSwitch, RotateCcw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LiveCapture() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('Natural');

  const filters = ['Natural', 'Monochrome', 'Warm Tone', 'Vintage Film'];

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col h-[100dvh] overflow-hidden">
      
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-4 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
        <div className="flex items-center gap-2">
          <img src="/logo.jpeg" className="w-8 h-8 rounded-full" />
          <div>
            <h1 className="font-bold text-sm leading-tight">snap.e</h1>
            <p className="text-[10px] tracking-widest text-gray-400 font-semibold uppercase">Live Capture Session</p>
          </div>
        </div>
        <button className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><User size={18} /></button>
      </header>

      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-medium text-gray-200">Tersambung · Anya R. (Bandung)</span>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium">Pose 2 / 4</div>
          <button className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"><Volume2 size={14}/></button>
        </div>
      </div>

      {/* Camera Feeds */}
      <div className="flex-1 px-4 py-2 flex flex-col gap-3 min-h-0">
        
        {/* Remote Feed (Anya) */}
        <div className="flex-1 relative rounded-3xl overflow-hidden bg-gray-900 shadow-lg shadow-black/50">
          <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold">Anya</span>
          </div>
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            <Wifi size={12} /> Lancar
          </div>
        </div>

        {/* Local Feed (Kamu) */}
        <div className="flex-1 relative rounded-3xl overflow-hidden bg-gray-900 shadow-lg shadow-black/50">
          <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&h=600&fit=crop" className="w-full h-full object-cover transform scale-x-[-1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
            <span className="text-xs font-semibold">Kamu</span>
          </div>
          
          <button className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60">
            <CameraSwitch size={16} />
          </button>
          
          {/* Rule of Thirds Guide (Subtle) */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="w-full h-[33.33%] border-b border-white/50"></div>
             <div className="w-full h-[33.33%] border-b border-white/50"></div>
             <div className="h-full w-[33.33%] border-r border-white/50 absolute top-0 left-0"></div>
             <div className="h-full w-[33.33%] border-r border-white/50 absolute top-0 left-[33.33%]"></div>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="px-4 py-2 shrink-0">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {filters.map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Controls */}
      <div className="px-8 py-4 flex items-center justify-between shrink-0 mb-2">
        <div className="flex flex-col items-center gap-2">
          <div className="flex bg-white/10 rounded-full p-1">
            <button className="px-3 py-1 bg-white text-black text-xs font-bold rounded-full">3s</button>
            <button className="px-3 py-1 text-gray-400 text-xs font-bold rounded-full">5s</button>
          </div>
          <span className="text-[10px] font-bold tracking-widest text-gray-400">TIMER</span>
        </div>

        {/* Shutter Button */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[#FF4757] rounded-full blur-md opacity-50 animate-pulse"></div>
          <button className="w-20 h-20 rounded-full border-[3px] border-[#FF4757]/80 flex items-center justify-center relative z-10">
            <div className="w-16 h-16 bg-white rounded-full transition-transform active:scale-95"></div>
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
            <RotateCcw size={18} className="text-gray-300" />
          </button>
          <span className="text-[10px] font-bold tracking-widest text-gray-400">ULANG</span>
        </div>
      </div>

      {/* Bottom Strip Preview */}
      <div className="bg-gray-900 rounded-t-3xl p-5 pb-8 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-semibold text-white">Strip Film Anda <span className="text-gray-400 font-normal ml-1">(2/4 Siap)</span></p>
          <button onClick={() => navigate('/editor')} className="text-sm font-bold text-[#FF4757] hover:text-[#ff3043] flex items-center gap-1 transition-colors">
            Selesai & Edit <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {/* Slot 1 */}
          <div className="aspect-[3/4] bg-white p-1 rounded relative">
             <div className="w-full h-1/2 bg-gray-200 mb-0.5"><img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=150&fit=crop" className="w-full h-full object-cover"/></div>
             <div className="w-full h-1/2 bg-gray-200"><img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=150&fit=crop" className="w-full h-full object-cover"/></div>
             <span className="absolute -bottom-2 -right-2 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-gray-900">1</span>
          </div>
          {/* Slot 2 */}
          <div className="aspect-[3/4] bg-white p-1 rounded relative border-2 border-[#FF4757]">
             <div className="w-full h-1/2 bg-gray-200 mb-0.5"><img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=200&h=150&fit=crop" className="w-full h-full object-cover"/></div>
             <div className="w-full h-1/2 bg-gray-200"><img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&h=150&fit=crop" className="w-full h-full object-cover"/></div>
             <span className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#FF4757] text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-gray-900">2</span>
          </div>
          {/* Slot 3 */}
          <div className="aspect-[3/4] bg-gray-800 rounded flex flex-col items-center justify-center gap-2">
            <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
            <span className="text-xs text-gray-500 font-bold">3</span>
          </div>
          {/* Slot 4 */}
          <div className="aspect-[3/4] bg-gray-800 rounded flex flex-col items-center justify-center gap-2">
            <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
            <span className="text-xs text-gray-500 font-bold">4</span>
          </div>
        </div>
      </div>

    </div>
  );
}
