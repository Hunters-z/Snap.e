import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Camera, 
  SwitchCamera, 
  ArrowRight, 
  Volume2, 
  VolumeX,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useBooth } from '../context/BoothContext';
import { FILTER_CATEGORIES, CAMERA_PRESETS } from '../data/cameraPresets';
import Peer from 'peerjs';

export default function LiveCapture() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    appConfig, 
    userName, 
    mode, 
    layout, 
    updateCapturedPhotos 
  } = useBooth();

  // Route parameters for LDR
  const roomParam = searchParams.get('room');
  const roleParam = searchParams.get('role') || 'host';

  const totalShots = layout === 'grid' ? 4 : 3;

  // Local state
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [countdown, setCountdown] = useState(null); // null or number
  const [timerDuration, setTimerDuration] = useState(3); // 3 or 5
  
  // Available filters from appConfig or default presets
  const availableFilters = appConfig.customFilters?.length > 0 ? appConfig.customFilters : CAMERA_PRESETS;
  const [activeFilter, setActiveFilter] = useState(availableFilters[0] || CAMERA_PRESETS[0]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [enableDateStamp, setEnableDateStamp] = useState(true);
  const [enableFilmGrain, setEnableFilmGrain] = useState(true);

  const [flashActive, setFlashActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [shotsTaken, setShotsTaken] = useState([]);
  const [isCapturingSession, setIsCapturingSession] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isSimulatedCam, setIsSimulatedCam] = useState(false);

  // LDR Peer state
  const [peerConnected, setPeerConnected] = useState(false);
  const [remotePeerName] = useState('Pasangan LDR');

  // Video and stream refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerInstanceRef = useRef(null);
  const animCanvasRef = useRef(null);

  // Retro date stamp string (e.g. '26 09 25)
  const getAnalogDateStamp = () => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `'${yy} ${mm} ${dd}`;
  };

  // Filtered preset list by category
  const filteredPresets = selectedCategory === 'all' 
    ? availableFilters 
    : availableFilters.filter(f => f.category === selectedCategory || (selectedCategory === 'vintage' && f.category === 'vintage'));

  // Synthesize Web Audio beeps & camera shutter
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'beep') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'shutter') {
        // High click followed by mechanical sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      }
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  };

  // Start Camera
  const startCamera = useCallback(async (facing = facingMode) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      setCameraError(null);
      setIsSimulatedCam(false);

      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access failed or unavailable, activating simulated camera:", err);
      setCameraError("Kamera perangkat tidak dapat diakses langsung. Mengaktifkan kamera simulasi studio.");
      setIsSimulatedCam(true);
    }
  }, [facingMode]);

  // Toggle Camera (Front / Back)
  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Setup PeerJS for LDR
  useEffect(() => {
    let peer = null;

    if (mode === 'ldr' && roomParam) {
      const peerId = roleParam === 'host' ? roomParam : `${roomParam}-guest-${Math.floor(Math.random() * 1000)}`;
      try {
        peer = new Peer(peerId);
        peerInstanceRef.current = peer;

        peer.on('open', (id) => {
          console.log('PeerJS connected with ID:', id);
          if (roleParam === 'guest' && localStreamRef.current) {
            // Call host
            const call = peer.call(roomParam, localStreamRef.current);
            call.on('stream', (remoteStream) => {
              setPeerConnected(true);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
            });
          }
        });

        peer.on('call', (call) => {
          call.answer(localStreamRef.current);
          setPeerConnected(true);
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
        });

        peer.on('error', (err) => {
          console.warn('PeerJS connection error:', err);
          // Still allow solo simulation
        });
      } catch (e) {
        console.warn('PeerJS setup failed:', e);
      }
    }

    return () => {
      if (peer) peer.destroy();
    };
  }, [mode, roomParam, roleParam]);

  // Initial camera start
  useEffect(() => {
    startCamera();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  // Draw simulated camera if camera is blocked/denied
  useEffect(() => {
    if (!isSimulatedCam) return;
    let animId;
    const canvas = animCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let t = 0;
    const renderSim = () => {
      t += 0.03;
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient backdrop
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#27272a');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated studio silhouette
      const cx = canvas.width / 2 + Math.sin(t * 1.2) * 15;
      const cy = canvas.height / 2 + Math.cos(t) * 8;

      // Glow behind head
      const radial = ctx.createRadialGradient(cx, cy - 30, 20, cx, cy - 30, 160);
      radial.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
      radial.addColorStop(1, 'transparent');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Head silhouette
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cx, cy - 40, 55, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 90, 110, 70, 0, 0, Math.PI * 2);
      ctx.fill();

      // Text label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Kamera Virtual: ${userName}`, canvas.width / 2, canvas.height - 30);

      animId = requestAnimationFrame(renderSim);
    };

    renderSim();
    return () => cancelAnimationFrame(animId);
  }, [isSimulatedCam, userName]);

  // Capture a single frame from video/canvas
  const captureFrame = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');

    const videoEl = localVideoRef.current;
    const remoteEl = remoteVideoRef.current;

    // Apply active camera simulation filter directly to canvas rendering
    ctx.filter = activeFilter.css || 'none';

    if (isSimulatedCam || !videoEl || videoEl.videoWidth === 0) {
      // Draw from simulated canvas or fallback
      const simCanvas = animCanvasRef.current;
      if (simCanvas) {
        ctx.drawImage(simCanvas, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SNAP.E POSE #${shotsTaken.length + 1}`, 450, 337);
      }
    } else {
      if (mode === 'solo' || !peerConnected || !remoteEl || remoteEl.videoWidth === 0) {
        // Solo mode: draw local mirrored
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // LDR mode: split canvas 50/50
        const halfW = canvas.width / 2;
        // Left: Local
        ctx.save();
        ctx.translate(halfW, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, 0, 0, halfW, canvas.height);
        ctx.restore();

        // Right: Remote
        ctx.drawImage(remoteEl, halfW, 0, halfW, canvas.height);

        // Subtle split line
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(halfW, 0);
        ctx.lineTo(halfW, canvas.height);
        ctx.stroke();
      }
    }

    // Reset filter for stamp and grain overlays
    ctx.filter = 'none';

    // 1. Organic Film Grain (if enabled)
    if (enableFilmGrain) {
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 8) {
          const noise = (Math.random() - 0.5) * 14;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // Continue if getImageData is tainted
      }
    }

    // 2. Retro Orange Digital Date Stamp (if enabled)
    if (enableDateStamp) {
      const stampStr = getAnalogDateStamp();
      ctx.save();
      ctx.font = "bold 24px 'Courier New', monospace";
      ctx.fillStyle = '#FF7A00';
      ctx.shadowColor = 'rgba(255, 122, 0, 0.75)';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'right';
      ctx.fillText(stampStr, canvas.width - 28, canvas.height - 24);
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    return {
      dataUrl,
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0,
      filterCss: activeFilter.css,
      filterId: activeFilter.id,
      filterName: activeFilter.name,
      filterBrand: activeFilter.brand,
      dateStamp: enableDateStamp ? getAnalogDateStamp() : null,
      stickers: []
    };
  };

  // Run full photo session
  const startPhotoSession = async () => {
    if (isCapturingSession) return;
    setIsCapturingSession(true);
    const captured = [];

    for (let i = 0; i < totalShots; i++) {
      setCurrentShotIndex(i + 1);

      // Countdown loop
      for (let c = timerDuration; c > 0; c--) {
        setCountdown(c);
        playSound('beep');
        await new Promise(r => setTimeout(r, 1000));
      }

      // Flash & Click
      setCountdown(null);
      setFlashActive(true);
      playSound('shutter');
      setTimeout(() => setFlashActive(false), 200);

      // Snap
      const shot = captureFrame();
      captured.push(shot);
      setShotsTaken([...captured]);

      // Small pause between poses
      if (i < totalShots - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setIsCapturingSession(false);
    updateCapturedPhotos(captured);

    // Short delay then navigate to editor
    setTimeout(() => {
      navigate('/editor');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white flex flex-col h-[100dvh] overflow-hidden select-none">
      
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 shrink-0 border-b border-white/10 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs">
            s
          </div>
          <div className="flex flex-col text-center">
            <span className="font-bold text-xs sm:text-sm tracking-tight">snap.e booth</span>
            <span className="text-[10px] text-gray-400 font-mono">
              {mode === 'ldr' ? 'LDR DUAL MODE' : 'SOLO SESSION'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-gray-400" />}
          </button>

          {/* Switch Camera */}
          <button
            onClick={toggleCameraFacing}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Putar Kamera"
          >
            <SwitchCamera size={16} />
          </button>
        </div>
      </header>

      {/* Status Bar */}
      <div className="px-4 py-2 flex items-center justify-between shrink-0 bg-black/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-gray-300 font-medium">
            {mode === 'ldr' 
              ? (peerConnected ? `Tersambung · ${remotePeerName}` : 'Menunggu pasangan LDR tersambung...') 
              : `Bilik Foto: ${userName}`}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono font-semibold text-gray-400">
          <span>Pose: {currentShotIndex > 0 ? currentShotIndex : 1} / {totalShots}</span>
        </div>
      </div>

      {/* Camera Alert / Fallback indicator if any */}
      {cameraError && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 text-[11px] text-amber-200 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5 truncate">
            <AlertCircle size={14} className="shrink-0 text-amber-400" />
            {cameraError}
          </span>
          <button 
            onClick={() => startCamera()} 
            className="underline font-bold shrink-0 ml-2 hover:text-white"
          >
            Coba Kamera Asli
          </button>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="flex-1 relative p-2 sm:p-4 flex items-center justify-center min-h-0">
        
        {/* Flash Overlay */}
        <div 
          className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${
            flashActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Big Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-fadeIn">
            <div className="w-32 h-32 rounded-full bg-black/60 backdrop-blur-md border-4 border-red-500 flex items-center justify-center text-7xl font-extrabold text-white animate-ping">
              {countdown}
            </div>
          </div>
        )}

        {/* Video Wrapper */}
        <div 
          className={`w-full max-w-3xl h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black/80 relative shadow-2xl border border-white/10 flex ${
            mode === 'ldr' && peerConnected ? 'flex-col sm:flex-row' : 'flex-col'
          }`}
          style={{ filter: activeFilter.css }}
        >
          {/* Simulated Canvas (shown if camera blocked) */}
          <canvas
            ref={animCanvasRef}
            width={640}
            height={480}
            className={`w-full h-full object-cover ${isSimulatedCam ? 'block' : 'hidden'}`}
          />

          {/* Local Video Stream */}
          <div className={`relative flex-1 h-full min-h-0 overflow-hidden ${isSimulatedCam ? 'hidden' : 'block'}`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {userName} (Lokal)
            </div>
          </div>

          {/* Remote Video Stream for LDR */}
          {mode === 'ldr' && (
            <div className="relative flex-1 h-full min-h-0 overflow-hidden border-t sm:border-t-0 sm:border-l border-white/20 bg-gray-900">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${peerConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                {peerConnected ? remotePeerName : 'Menghubungkan Pasangan...'}
              </div>
            </div>
          )}

          {/* Analog Film Grain Overlay */}
          {enableFilmGrain && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-25 bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:6px_6px] z-10" />
          )}

          {/* Retro Orange Digital Date Stamp */}
          {enableDateStamp && (
            <div className="absolute bottom-3 right-3 pointer-events-none font-mono font-bold text-xs sm:text-sm text-[#FF7A00] drop-shadow-[0_0_8px_rgba(255,122,0,0.9)] z-10 select-none tracking-wider">
              {getAnalogDateStamp()}
            </div>
          )}

          {/* Camera Model Badge */}
          <div className="absolute top-3 right-3 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-gray-200 flex items-center gap-1.5 z-10 border border-white/10">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFilter.accentColor || '#10B981' }}></span>
            <span className="opacity-75">{activeFilter.brand || 'CAM'}</span>
            <span className="text-white">{activeFilter.shortName || activeFilter.name}</span>
          </div>

          {/* Subtle Viewfinder Grid lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-1/3 border-b border-white"></div>
            <div className="w-full h-2/3 border-b border-white"></div>
            <div className="h-full w-1/3 border-r border-white absolute top-0 left-0"></div>
            <div className="h-full w-2/3 border-r border-white absolute top-0 left-0"></div>
          </div>
        </div>
      </div>

      {/* Preset Category Bar */}
      <div className="px-3 sm:px-6 pt-1 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar max-w-xl mx-auto justify-start sm:justify-center border-b border-white/10 pb-1.5">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Presets Carousel */}
      <div className="px-3 sm:px-6 py-1.5 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 max-w-2xl mx-auto justify-start sm:justify-center">
          {filteredPresets.map((f) => {
            const isSelected = activeFilter.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-md font-bold scale-102'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                }`}
                title={f.description}
              >
                <span 
                  className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-black text-white' : 'bg-white/20 text-gray-200'
                  }`}
                >
                  {f.brand || 'CAM'}
                </span>
                <span>{f.shortName || f.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Preset Description & Analog Toggles */}
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 pt-1 text-[11px] text-gray-400">
          <p className="truncate flex-1 hidden sm:block">
            <span className="font-semibold text-gray-300">{activeFilter.name}:</span> {activeFilter.description}
          </p>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={() => setEnableDateStamp(!enableDateStamp)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                enableDateStamp 
                  ? 'bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40' 
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              title="Stempel tanggal analog di foto"
            >
              <Calendar size={12} />
              Stempel Tanggal
            </button>
            <button
              onClick={() => setEnableFilmGrain(!enableFilmGrain)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                enableFilmGrain 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
              title="Tekstur grain film analog"
            >
              <Sparkles size={12} />
              Grain Film
            </button>
          </div>
        </div>
      </div>

      {/* Shutter & Controls Section */}
      <div className="px-4 py-3 sm:py-4 shrink-0 bg-[#161619] border-t border-white/10 flex items-center justify-between max-w-xl mx-auto w-full">
        {/* Timer selector */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex bg-white/10 rounded-full p-0.5">
            <button
              onClick={() => setTimerDuration(3)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                timerDuration === 3 ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              3s
            </button>
            <button
              onClick={() => setTimerDuration(5)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                timerDuration === 5 ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              5s
            </button>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Timer</span>
        </div>

        {/* Big Shutter Trigger Button */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-red-600 rounded-full blur-md opacity-40 animate-pulse pointer-events-none"></div>
          <button
            onClick={startPhotoSession}
            disabled={isCapturingSession}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-red-500/80 flex items-center justify-center relative z-10 transition-transform active:scale-95 disabled:opacity-50"
            title="Ambil Foto"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center text-red-600 shadow-inner">
              <Camera size={26} />
            </div>
          </button>
        </div>

        {/* Direct to editor if shots already taken */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => navigate('/editor')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-200 transition-colors"
            title="Lompat ke Editor"
          >
            <ArrowRight size={18} />
          </button>
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Editor</span>
        </div>
      </div>

      {/* Filmstrip Bottom Thumbnails */}
      <div className="bg-[#0A0A0C] px-4 py-2.5 pb-4 shrink-0 border-t border-white/5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: totalShots }).map((_, idx) => {
              const shot = shotsTaken[idx];
              return (
                <div
                  key={idx}
                  className={`w-12 h-16 sm:w-14 sm:h-18 rounded-md overflow-hidden border relative flex items-center justify-center shrink-0 transition-all ${
                    shot
                      ? 'border-red-500 shadow-xs'
                      : 'border-white/10 bg-white/5 text-gray-500'
                  }`}
                >
                  {shot ? (
                    <img 
                      src={shot.dataUrl} 
                      alt={`Pose ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-xs font-mono font-bold">{idx + 1}</span>
                  )}
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/70 px-1 rounded font-mono">
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {shotsTaken.length > 0 && (
            <button
              onClick={() => navigate('/editor')}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 shadow-md shadow-red-600/20"
            >
              Selesai ({shotsTaken.length}/{totalShots})
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
