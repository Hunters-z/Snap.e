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
  Sparkles,
  Clock,
  RotateCcw,
  Image,
  Trash2,
  X,
  Play,
  Copy,
  Check,
  Heart,
  Grid,
  Download,
  Cloud,
  CreditCard
} from 'lucide-react';
import { useBooth } from '../context/BoothContext';
import { FILTER_CATEGORIES, CAMERA_PRESETS } from '../data/cameraPresets';
import { 
  drawCover, 
  formatSessionTime, 
  generateGifFromFrames, 
  recordLiveVideoClip 
} from '../utils/photoCaptureHelper';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import PaymentModal from '../components/PaymentModal';

export default function LiveCapture() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    appConfig, 
    userName, 
    mode, 
    setMode,
    layout, 
    capturedPhotos,
    sessionTimeRemaining,
    startOrResumeSession,
    startNewSession,
    currentSessionId,
    sessionAlbum,
    addPhotoToAlbum,
    deletePhotoFromAlbum,
    selectPhotoForSlot
  } = useBooth();

  // Route parameters for LDR
  const roomParam = searchParams.get('room');
  const roleParam = searchParams.get('role') || 'host';

  // Ensure mode is set to 'ldr' whenever roomParam is present in URL
  useEffect(() => {
    if (roomParam && mode !== 'ldr' && setMode) {
      setMode('ldr');
    }
  }, [roomParam, mode, setMode]);

  // Only 4R formats: 6 cuts or 4 cuts
  const totalShots = layout === '4r_6cut' ? 6 : 4;

  // Active slot being captured (0 = Pose 1, 1 = Pose 2, etc.)
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  // Countdown timer state (only runs when Ambil Foto is tapped!)
  const [countdown, setCountdown] = useState(null); // null or number (3, 2, 1)
  const [timerDuration, setTimerDuration] = useState(3); // 3 or 5 seconds
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLiveRecording, setIsLiveRecording] = useState(false);

  // Available filters
  const availableFilters = appConfig.customFilters?.length > 0 ? appConfig.customFilters : CAMERA_PRESETS;
  const [activeFilter, setActiveFilter] = useState(availableFilters[0] || CAMERA_PRESETS[0]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [enableDateStamp, setEnableDateStamp] = useState(true);
  const [enableFilmGrain, setEnableFilmGrain] = useState(true);

  // Camera & Device states
  const [flashActive, setFlashActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [cameraError, setCameraError] = useState(null);
  const [isSimulatedCam, setIsSimulatedCam] = useState(false);

  // Album Modal & Persistence States
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [previewLiveItem, setPreviewLiveItem] = useState(null);
  const [albumFilter, setAlbumFilter] = useState('all'); // 'all' | 'photo' | 'gif'
  const [autoPlayAllGifs, setAutoPlayAllGifs] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showPaymentModalInCapture, setShowPaymentModalInCapture] = useState(false);

  // Automatically open the Album Modal immediately when session timer expires!
  useEffect(() => {
    if (sessionTimeRemaining <= 0) {
      setShowAlbumModal(true);
    }
  }, [sessionTimeRemaining]);

  // LDR Peer and Realtime states
  const [peerConnected, setPeerConnected] = useState(false);
  const [remotePeerName, setRemotePeerName] = useState('Pasangan LDR');
  const [remoteLiveFrame, setRemoteLiveFrame] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const lastShutterTriggerRef = useRef(0);
  const handleTriggerCaptureRef = useRef(null);

  const handleCopyLdrLink = () => {
    if (!roomParam) return;
    const shareUrl = `${window.location.origin}/capture?room=${encodeURIComponent(roomParam)}&role=guest`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Video and stream refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const animCanvasRef = useRef(null);

  // Initialize or resume the 15-minute session
  useEffect(() => {
    startOrResumeSession();
  }, [startOrResumeSession]);

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
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      }
    } catch {
      // AudioContext blocked or unavailable
    }
  };

  // Start Camera with resilient fallback and hardware release wait
  const startCamera = useCallback(async (facing = facingMode) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      setCameraError(null);
      setIsSimulatedCam(false);

      // Give browser hardware driver a brief pause (100ms) to release previous camera hardware lock
      await new Promise(r => setTimeout(r, 100));

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false
        });
      } catch (err1) {
        console.warn('Attempt with ideal facingMode failed, retrying plain facingMode:', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false
          });
        } catch (err2) {
          console.warn('Attempt with plain facingMode failed, retrying generic video constraint:', err2);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.onloadedmetadata = async () => {
          try {
            await localVideoRef.current.play();
          } catch (e) {
            console.warn('Video play onloadedmetadata caught:', e);
          }
        };
        try {
          await localVideoRef.current.play();
        } catch (playErr) {
          console.warn('Initial video play caught:', playErr);
        }
      }
    } catch (err) {
      console.warn("Camera access failed, activating simulated studio camera:", err);
      setCameraError("Kamera perangkat tidak dapat diakses langsung. Mengaktifkan kamera simulasi studio.");
      setIsSimulatedCam(true);
    }
  }, [facingMode]);

  // Toggle Camera (Front / Back)
  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    await startCamera(nextFacing);
  };

  // Setup WebRTC + Firestore Realtime Signaling and Live Frame Sync
  useEffect(() => {
    if (mode !== 'ldr' || !roomParam) return;

    const sanitizedRoom = roomParam.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const roomRef = doc(db, 'ldr_rooms', sanitizedRoom);
    let unsubSnapshot = null;
    let frameBroadcastTimer = null;
    let pc = null;

    const RTC_CONFIG = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp'
          ],
          username: 'openrelay',
          credential: 'openrelay'
        }
      ]
    };

    try {
      pc = new RTCPeerConnection(RTC_CONFIG);

      // Add local tracks if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try {
            pc.addTrack(track, localStreamRef.current);
          } catch (e) {
            console.warn('WebRTC addTrack warning:', e);
          }
        });
      }

      // Handle incoming remote media track
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setPeerConnected(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setPeerConnected(true);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setPeerConnected(false);
        }
      };

      // Gather ICE candidates and push to Firestore array
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const targetField = roleParam === 'host' ? 'hostCandidates' : 'guestCandidates';
          updateDoc(roomRef, {
            [targetField]: arrayUnion(event.candidate.toJSON())
          }).catch(() => {});
        }
      };
    } catch (e) {
      console.warn('RTCPeerConnection init warning:', e);
    }

    // Initialize Room & SDP exchange
    const initSignaling = async () => {
      try {
        if (roleParam === 'host') {
          if (pc) {
            const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
            await pc.setLocalDescription(offer);

            await setDoc(roomRef, {
              roomId: sanitizedRoom,
              hostName: userName || 'Host',
              hostOnline: true,
              hostOffer: { type: offer.type, sdp: offer.sdp },
              createdAt: Date.now(),
              lastPing: Date.now()
            }, { merge: true });
          } else {
            await setDoc(roomRef, {
              roomId: sanitizedRoom,
              hostName: userName || 'Host',
              hostOnline: true,
              createdAt: Date.now(),
              lastPing: Date.now()
            }, { merge: true });
          }
        } else {
          // Guest announces presence
          await setDoc(roomRef, {
            roomId: sanitizedRoom,
            guestName: userName || 'Pasangan',
            guestOnline: true,
            lastPing: Date.now()
          }, { merge: true });
        }
      } catch (err) {
        console.warn('Signaling init warning:', err);
      }
    };

    initSignaling();

    // Listen to Room updates via Firestore Snapshot
    const processedCandidates = new Set();

    unsubSnapshot = onSnapshot(roomRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      if (roleParam === 'host') {
        if (data.guestName) setRemotePeerName(data.guestName);
        if (data.guestOnline) setPartnerOnline(true);
        if (data.guestFrame) setRemoteLiveFrame(data.guestFrame);

        // Host receives Answer from Guest
        if (pc && data.guestAnswer && !pc.currentRemoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.guestAnswer));
          } catch (e) {
            console.warn('Host setRemoteDescription error:', e);
          }
        }

        // Host adds Guest's ICE candidates
        if (pc && Array.isArray(data.guestCandidates)) {
          for (const cand of data.guestCandidates) {
            const candKey = cand?.candidate;
            if (candKey && !processedCandidates.has(candKey)) {
              processedCandidates.add(candKey);
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                // Ignore timing races
              }
            }
          }
        }
      } else {
        // Guest handles Host
        if (data.hostName) setRemotePeerName(data.hostName);
        if (data.hostOnline) setPartnerOnline(true);
        if (data.hostFrame) setRemoteLiveFrame(data.hostFrame);

        // Guest receives Offer and creates Answer
        if (pc && data.hostOffer && !pc.currentRemoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.hostOffer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateDoc(roomRef, {
              guestAnswer: { type: answer.type, sdp: answer.sdp },
              guestOnline: true,
              lastPing: Date.now()
            });
          } catch (e) {
            console.warn('Guest answer error:', e);
          }
        }

        // Guest adds Host's ICE candidates
        if (pc && Array.isArray(data.hostCandidates)) {
          for (const cand of data.hostCandidates) {
            const candKey = cand?.candidate;
            if (candKey && !processedCandidates.has(candKey)) {
              processedCandidates.add(candKey);
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                // Ignore timing races
              }
            }
          }
        }
      }

      // Synchronized Shutter
      if (data.syncShutter && data.syncShutter.timestamp) {
        if (data.syncShutter.timestamp > lastShutterTriggerRef.current) {
          lastShutterTriggerRef.current = data.syncShutter.timestamp;
          if (data.syncShutter.slot !== undefined) {
            setActiveSlotIndex(data.syncShutter.slot);
          }
          if (handleTriggerCaptureRef.current && !isCapturing) {
            handleTriggerCaptureRef.current(true);
          }
        }
      }
    });

    // Realtime Lightweight Live Frame Sync (Fallback if direct WebRTC blocked by mobile carrier)
    frameBroadcastTimer = setInterval(() => {
      try {
        const videoEl = localVideoRef.current;
        if (!videoEl || videoEl.videoWidth === 0) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 240;
        tempCanvas.height = 180;
        const ctx = tempCanvas.getContext('2d');
        drawCover(ctx, videoEl, 0, 0, 240, 180, facingMode === 'user');
        const frameData = tempCanvas.toDataURL('image/jpeg', 0.4);

        const frameField = roleParam === 'host' ? 'hostFrame' : 'guestFrame';
        const onlineField = roleParam === 'host' ? 'hostOnline' : 'guestOnline';
        updateDoc(roomRef, {
          [frameField]: frameData,
          [onlineField]: true,
          lastPing: Date.now()
        }).catch(() => {});
      } catch (e) {
        // Ignore canvas export errors
      }
    }, 1800);

    return () => {
      if (unsubSnapshot) unsubSnapshot();
      if (frameBroadcastTimer) clearInterval(frameBroadcastTimer);
      if (pc) {
        pc.close();
      }
    };
  }, [mode, roomParam, roleParam, userName, facingMode, isCapturing]);

  // Initial camera start
  useEffect(() => {
    startCamera();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  // Simulated camera animation fallback
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

      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#27272a');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2 + Math.sin(t * 1.2) * 15;
      const cy = canvas.height / 2 + Math.cos(t) * 8;

      const radial = ctx.createRadialGradient(cx, cy - 30, 20, cx, cy - 30, 160);
      radial.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
      radial.addColorStop(1, 'transparent');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cx, cy - 40, 55, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 90, 110, 70, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Kamera Virtual: ${userName}`, canvas.width / 2, canvas.height - 30);

      animId = requestAnimationFrame(renderSim);
    };

    renderSim();
    return () => cancelAnimationFrame(animId);
  }, [isSimulatedCam, userName]);

  /**
   * Capture a single pristine 4:3 frame using drawCover to completely prevent stretching/distortion.
   */
  const captureRawFrame = (targetW = 900, targetH = 675, withOverlays = true) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    const videoEl = localVideoRef.current;
    const remoteEl = remoteVideoRef.current;

    // Apply color simulation filter
    ctx.filter = activeFilter.css || 'none';

    if (isSimulatedCam || !videoEl || videoEl.videoWidth === 0) {
      const simCanvas = animCanvasRef.current;
      if (simCanvas) {
        drawCover(ctx, simCanvas, 0, 0, canvas.width, canvas.height, false);
      } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SNAP.E POSE #${activeSlotIndex + 1}`, canvas.width / 2, canvas.height / 2);
      }
    } else {
      const hasRemoteVideo = peerConnected && remoteEl && remoteEl.videoWidth > 0;
      const hasRemoteLiveFrame = Boolean(remoteLiveFrame);

      if (mode === 'solo' || (!hasRemoteVideo && !hasRemoteLiveFrame)) {
        // Solo mode: drawCover with mirror = true, center-cropped to target aspect ratio (4:3)
        // No stretching or distorting!
        drawCover(ctx, videoEl, 0, 0, canvas.width, canvas.height, true);
      } else {
        // LDR mode: Split 50/50 vertically
        const halfW = canvas.width / 2;
        // Left: Local user (mirrored, center cropped to 2:3)
        drawCover(ctx, videoEl, 0, 0, halfW, canvas.height, true);

        // Right: Remote user (center cropped to 2:3)
        if (hasRemoteVideo) {
          drawCover(ctx, remoteEl, halfW, 0, halfW, canvas.height, false);
        } else if (hasRemoteLiveFrame) {
          const img = new window.Image();
          img.src = remoteLiveFrame;
          drawCover(ctx, img, halfW, 0, halfW, canvas.height, false);
        }

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

    if (withOverlays) {
      // 1. Organic Film Grain
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
          // ignore if tainted
        }
      }

      // 2. Retro Orange Digital Date Stamp
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
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  /**
   * Take single photo on demand:
   * Timer countdown ONLY starts when user taps "Ambil Foto"!
   * Also captures Live Photo video clip and generates an Animated GIF!
   */
  const handleTriggerCapture = async (isRemoteInitiated = false) => {
    if (sessionTimeRemaining <= 0) {
      setShowAlbumModal(true);
      return;
    }
    if (isCapturing) return;
    setIsCapturing(true);

    // If local user tapped capture and in LDR mode, sync to partner via Firestore
    if (!isRemoteInitiated && mode === 'ldr' && roomParam) {
      const sanitizedRoom = roomParam.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      updateDoc(doc(db, 'ldr_rooms', sanitizedRoom), {
        syncShutter: {
          timestamp: Date.now(),
          slot: activeSlotIndex,
          sender: roleParam
        }
      }).catch(() => {});
    }

    const burstFrames = [];

    // Countdown loop (3, 2, 1)
    for (let c = timerDuration; c > 0; c--) {
      setCountdown(c);
      playSound('beep');

      // Start capturing burst frames and live video in the last 1.5 seconds
      if (c <= 2) {
        setIsLiveRecording(true);
      }

      // Capture burst frames during countdown for GIF
      if (c <= 2) {
        for (let sub = 0; sub < 4; sub++) {
          burstFrames.push(captureRawFrame(360, 270, false));
          await new Promise(r => setTimeout(r, 220));
        }
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Capture the final high-res frame at moment of flash
    setCountdown(null);
    setFlashActive(true);
    playSound('shutter');
    setTimeout(() => setFlashActive(false), 200);

    // Final high-res photo with grain & date stamp
    const stillDataUrl = captureRawFrame(960, 720, true);
    burstFrames.push(captureRawFrame(360, 270, false));
    setIsLiveRecording(false);

    // Generate Animated GIF from burst frames asynchronously
    let gifUrl = null;
    try {
      gifUrl = await generateGifFromFrames(burstFrames, 360, 270, 0.14);
    } catch (e) {
      console.warn('GIF creation failed:', e);
    }

    // Try recording short live video clip
    let liveVideoUrl = null;
    if (localStreamRef.current) {
      try {
        liveVideoUrl = await recordLiveVideoClip(localStreamRef.current, 1200);
      } catch (e) {
        console.warn('Live video recording failed:', e);
      }
    }

    const newPhotoItem = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      dataUrl: stillDataUrl,
      liveVideoUrl: liveVideoUrl || null,
      gifUrl: gifUrl || stillDataUrl,
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0,
      filterCss: activeFilter.css,
      filterId: activeFilter.id,
      filterName: activeFilter.name,
      filterBrand: activeFilter.brand,
      dateStamp: enableDateStamp ? getAnalogDateStamp() : null,
      stickers: [],
      capturedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      slotIndex: activeSlotIndex
    };

    // 1. Add to session album (temporary 7-day storage)
    addPhotoToAlbum(newPhotoItem);

    // 2. Assign to current active slot in photostrip
    selectPhotoForSlot(activeSlotIndex, newPhotoItem);

    // 3. Immediately advance to next photo slot without having to select pose 1, 2, or 3
    const nextSlot = (activeSlotIndex + 1) % totalShots;
    setActiveSlotIndex(nextSlot);

    setIsCapturing(false);
  };

  // Retake current slot
  const handleRetakeActiveSlot = () => {
    handleTriggerCapture();
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white flex flex-col h-[100dvh] overflow-hidden select-none">
      
      {/* Top Bar with 15-Minute Countdown Timer */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 shrink-0 border-b border-white/10 z-20 bg-[#141417]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/10">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center font-bold text-[10px]">
              s
            </div>
            <span className="font-bold text-xs tracking-tight">snap.e booth</span>
          </div>
        </div>

        {/* 15-Minute Overall Session Timer Badge */}
        <div className="flex items-center gap-2">
          <div 
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
              sessionTimeRemaining < 120 
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : sessionTimeRemaining < 300
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/10 text-gray-200 border-white/15'
            }`}
            title="Sisa waktu sesi photobooth (15 menit)"
          >
            <Clock size={13} className={sessionTimeRemaining < 120 ? 'text-red-400' : 'text-gray-400'} />
            <span>Sisa Sesi: {formatSessionTime(sessionTimeRemaining)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Temporary Album Button with Counter */}
          <button
            onClick={() => setShowAlbumModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-xs"
            title="Buka Album Sementara"
          >
            <Image size={14} />
            <span>Album ({sessionAlbum?.length || 0})</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-gray-400" />}
          </button>

          {/* Grid Viewfinder Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              showGrid ? 'bg-white text-black font-bold shadow-xs' : 'bg-white/10 hover:bg-white/20 text-gray-400'
            }`}
            title={showGrid ? 'Matikan Grid Kamera' : 'Nyalakan Grid Kamera (Rule of Thirds)'}
          >
            <Grid size={15} />
          </button>

          {/* Switch Camera */}
          <button
            onClick={toggleCameraFacing}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Putar Kamera"
          >
            <SwitchCamera size={15} />
          </button>
        </div>
      </header>

      {/* Sub Header / Active Slot Selector */}
      <div className="px-3 sm:px-6 py-1.5 flex items-center justify-between shrink-0 bg-black/60 text-xs border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${peerConnected ? 'bg-emerald-500' : (remoteLiveFrame ? 'bg-cyan-400' : 'bg-amber-400 animate-pulse')}`}></span>
          <span className="text-gray-300 font-medium text-[11px] sm:text-xs">
            {mode === 'ldr' 
              ? (peerConnected ? `Tersambung (HD) · ${remotePeerName}` : (remoteLiveFrame ? `Live Sync · ${remotePeerName}` : 'Menunggu pasangan LDR...')) 
              : `Bilik Foto: ${userName}`}
          </span>
          {mode === 'ldr' && roomParam && (
            <button
              onClick={handleCopyLdrLink}
              className="ml-1 px-2.5 py-0.5 rounded-full bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 font-mono text-[10px] flex items-center gap-1 border border-rose-500/30 transition-all"
              title="Salin tautan ruangan untuk dikirim ke pasangan"
            >
              {copiedLink ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
              <span>{copiedLink ? 'Tersalin!' : `Room: ${roomParam}`}</span>
            </button>
          )}
        </div>

        {/* Slot selector chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider hidden sm:inline">
            Ambil Slot:
          </span>
          {Array.from({ length: totalShots }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlotIndex(idx)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                activeSlotIndex === idx
                  ? 'bg-red-600 text-white shadow-xs'
                  : capturedPhotos[idx]
                  ? 'bg-white/20 text-gray-200 hover:bg-white/30'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Pose #{idx + 1} {capturedPhotos[idx] ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* LDR Partner Waiting / Invitation Banner */}
      {mode === 'ldr' && !peerConnected && !remoteLiveFrame && (
        <div className="bg-rose-950/70 border-b border-rose-500/30 px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-rose-200 shrink-0">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-rose-400 fill-rose-400 shrink-0" />
            <span>
              Kode Ruangan: <strong className="text-white font-mono bg-black/40 px-2 py-0.5 rounded border border-rose-400/30">{roomParam}</strong>
              <span className="opacity-90 ml-1.5">— Pasangan belum terhubung ke bilik.</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLdrLink}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 text-xs shadow-xs transition-colors"
            >
              <Copy size={13} />
              <span>{copiedLink ? 'Tersalin!' : 'Salin Tautan'}</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Yuk foto bareng di snap.e photo booth! Buka tautan ini untuk masuk ke ruang foto kita: ${window.location.origin}/capture?room=${encodeURIComponent(roomParam)}&role=guest`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 text-xs shadow-xs transition-colors"
            >
              <span>Kirim via WA</span>
            </a>
          </div>
        </div>
      )}

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

        {/* Big Countdown Overlay (Only appears when Ambil Foto is tapped!) */}
        {countdown !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-black/70 backdrop-blur-md border-4 border-red-500 flex flex-col items-center justify-center text-6xl sm:text-7xl font-extrabold text-white animate-ping">
              <span>{countdown}</span>
            </div>
          </div>
        )}

        {/* Video Wrapper (Center Cropped 4:3 Aspect Ratio) */}
        <div 
          className={`w-full max-w-3xl aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-black/90 relative shadow-2xl border border-white/10 flex ${
            mode === 'ldr' ? 'flex-col sm:flex-row' : 'flex-col'
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

          {/* Local Video Stream with object-cover */}
          <div className={`relative flex-1 h-full min-h-0 overflow-hidden ${isSimulatedCam ? 'hidden' : 'block'}`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform transition-transform ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-100'}`}
            />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {userName} (Lokal)
            </div>
          </div>

          {/* Remote Video Stream for LDR */}
          {mode === 'ldr' && (
            <div className="relative flex-1 h-full min-h-0 overflow-hidden border-t sm:border-t-0 sm:border-l border-white/20 bg-gray-950 flex items-center justify-center">
              {/* WebRTC Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${peerConnected ? 'block' : 'hidden'}`}
              />

              {/* Fallback Live Stream frame from Partner */}
              {!peerConnected && remoteLiveFrame && (
                <img
                  src={remoteLiveFrame}
                  alt="Partner Stream"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Waiting placeholder when neither is active */}
              {!peerConnected && !remoteLiveFrame && (
                <div className="flex flex-col items-center justify-center p-4 text-center text-gray-400 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center animate-pulse">
                    <Heart size={20} className="fill-rose-400" />
                  </div>
                  <p className="text-xs font-bold text-gray-200">{remotePeerName}</p>
                  <p className="text-[10px] text-gray-400 max-w-[200px] leading-tight">
                    {partnerOnline 
                      ? 'Pasangan sedang menyiapkan kamera...' 
                      : 'Menunggu pasangan bergabung. Klik "Salin Link" dan kirimkan ke pasangan.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLdrLink}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-bold flex items-center gap-1 mt-1 transition-all"
                  >
                    <Copy size={11} />
                    <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Pasangan'}</span>
                  </button>
                </div>
              )}

              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 z-10">
                <span className={`w-1.5 h-1.5 rounded-full ${peerConnected ? 'bg-emerald-400' : (remoteLiveFrame ? 'bg-cyan-400' : 'bg-amber-400 animate-pulse')}`}></span>
                {peerConnected 
                  ? `${remotePeerName} (WebRTC HD)` 
                  : (remoteLiveFrame ? `${remotePeerName} (Live Sync)` : 'Menghubungkan Pasangan...')}
              </div>
            </div>
          )}

          {/* Live Recording Motion Badge */}
          {isLiveRecording && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse z-20">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>MEREKAM LIVE PHOTO & GIF...</span>
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

          {/* Viewfinder Grid (Rule of Thirds + Corner Brackets + Center Target) */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-15">
              {/* Symmetrical 3x3 Rule-of-Thirds Grid */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25 flex items-center justify-center">
                  {/* Center Target Mark */}
                  <div className="w-7 h-7 rounded-full border border-white/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  </div>
                </div>
                <div className="border-b border-white/25" />
                <div className="border-r border-white/25" />
                <div className="border-r border-white/25" />
                <div />
              </div>

              {/* Viewfinder Corner Framing Brackets */}
              <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-white/60 rounded-tl-xs pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-white/60 rounded-tr-xs pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-white/60 rounded-bl-xs pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-white/60 rounded-br-xs pointer-events-none" />
            </div>
          )}
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
      <div className="px-3 sm:px-6 py-1 shrink-0">
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

        {/* Date Stamp & Grain Toggles */}
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
      <div className="px-4 py-2.5 sm:py-3.5 shrink-0 bg-[#161619] border-t border-white/10 flex items-center justify-between max-w-xl mx-auto w-full">
        {sessionTimeRemaining <= 0 ? (
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-3 py-1 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5 justify-center sm:justify-start">
                <Clock size={13} className="text-amber-400" />
                <span>Waktu Sesi Telah Selesai (15 Menit)</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Pengambilan foto baru dikunci. Album foto & gambar gerak Anda tetap tersimpan di Cloud selama 7 hari.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              <button
                onClick={() => setShowAlbumModal(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Image size={14} />
                <span>Buka Album ({sessionAlbum?.length || 0})</span>
              </button>
              <button
                onClick={() => setShowPaymentModalInCapture(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
              >
                <CreditCard size={14} />
                <span>Beli Sesi Baru (Bayar)</span>
              </button>
              <button
                onClick={() => navigate('/editor')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors"
              >
                <span>Ke Editor</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Timer duration selector */}
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
              <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Jeda Shutter</span>
            </div>

            {/* Retake Button (if current slot already has a photo) */}
            {capturedPhotos[activeSlotIndex] && (
              <button
                onClick={handleRetakeActiveSlot}
                disabled={isCapturing}
                className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors"
                title="Ambil Ulang Pose Ini"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                  <RotateCcw size={16} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider">Ulangi #{activeSlotIndex + 1}</span>
              </button>
            )}

            {/* Big Shutter Trigger Button (Timer ONLY starts here when tapped!) */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-red-600 rounded-full blur-md opacity-40 animate-pulse pointer-events-none"></div>
              <button
                onClick={handleTriggerCapture}
                disabled={isCapturing}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-red-500/80 flex items-center justify-center relative z-10 transition-transform active:scale-95 disabled:opacity-50"
                title={`Ambil Foto untuk Pose #${activeSlotIndex + 1}`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex flex-col items-center justify-center text-red-600 shadow-inner">
                  <Camera size={24} />
                  <span className="text-[9px] font-bold text-gray-900 leading-none mt-0.5">#{activeSlotIndex + 1}</span>
                </div>
              </button>
            </div>

            {/* Next Slot or Jump to Editor */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => navigate('/editor')}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-200 transition-colors"
                title="Lanjut ke Editor Photostrip"
              >
                <ArrowRight size={18} />
              </button>
              <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Editor</span>
            </div>
          </>
        )}
      </div>

      {/* Filmstrip Bottom Thumbnails & Active Slot Selectors */}
      <div className="bg-[#0A0A0C] px-4 py-2 pb-3 shrink-0 border-t border-white/5">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: totalShots }).map((_, idx) => {
              const photo = capturedPhotos[idx];
              const isCurrent = activeSlotIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => setActiveSlotIndex(idx)}
                  className={`w-12 h-16 sm:w-14 sm:h-18 rounded-lg overflow-hidden border-2 relative cursor-pointer flex items-center justify-center shrink-0 transition-all ${
                    isCurrent
                      ? 'border-red-500 ring-2 ring-red-500/30 scale-102'
                      : photo
                      ? 'border-white/30 hover:border-white/60'
                      : 'border-white/10 bg-white/5 text-gray-500'
                  }`}
                  title={`Klik untuk memilih atau retake Pose #${idx + 1}`}
                >
                  {photo ? (
                    <img 
                      src={photo.dataUrl} 
                      alt={`Pose ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-xs font-mono font-bold">#{idx + 1}</span>
                      <p className="text-[8px] text-gray-400">Kosong</p>
                    </div>
                  )}

                  <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/75 px-1 rounded font-mono font-bold">
                    #{idx + 1}
                  </span>

                  {photo?.gifUrl && (
                    <span className="absolute top-0.5 left-0.5 text-[7px] bg-purple-600/90 text-white px-1 rounded font-bold">
                      GIF
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAlbumModal(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Image size={14} />
              <span className="hidden sm:inline">Pilih dari</span> Album
            </button>

            <button
              onClick={() => navigate('/editor')}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-md shadow-red-600/20"
            >
              <span>Lanjut Editor</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </div>

      {/* TEMPORARY & CLOUD SESSION ALBUM MODAL */}
      {showAlbumModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#18181C] border border-white/15 w-full max-w-2xl max-h-[88vh] rounded-3xl p-4 sm:p-6 flex flex-col shadow-2xl space-y-3.5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Image size={18} className="text-red-500" />
                  <span>Album Foto & Gambar Gerak</span>
                  <span className="text-xs font-mono font-normal text-gray-400">({sessionAlbum?.length || 0} Media)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>Tersimpan di Cloud selama 7 hari · Foto diam & gambar gerak (GIF).</span>
                  <span className="text-[10px] text-gray-400 bg-white/10 px-1.5 py-0.5 rounded font-mono">Sesi: {currentSessionId}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowAlbumModal(false); setPreviewLiveItem(null); }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Expired Session Lock Banner */}
            {sessionTimeRemaining <= 0 && (
              <div className="bg-rose-950/70 border border-rose-500/40 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-rose-200">
                <div className="flex items-center gap-2 text-center sm:text-left">
                  <Clock size={16} className="text-rose-400 shrink-0" />
                  <div>
                    <p className="font-bold text-rose-100">Waktu Sesi Selesai (15 Menit) — Pengambilan Foto Terkunci</p>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">
                      Album Anda tetap tersimpan aman di Cloud selama 7 hari. Untuk berfoto kembali, lakukan pembayaran sesi baru.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModalInCapture(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md transition-colors"
                >
                  <CreditCard size={14} />
                  <span>Beli Sesi Baru (Bayar)</span>
                </button>
              </div>
            )}

            {/* Cloud Storage & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white/5 border border-white/10 p-2 sm:p-2.5 rounded-2xl text-xs">
              {/* Media type filter tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
                <button
                  onClick={() => setAlbumFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    albumFilter === 'all' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Semua ({sessionAlbum?.length || 0})
                </button>
                <button
                  onClick={() => setAlbumFilter('photo')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    albumFilter === 'photo' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Foto ({sessionAlbum?.filter(i => i.dataUrl).length || 0})
                </button>
                <button
                  onClick={() => setAlbumFilter('gif')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                    albumFilter === 'gif' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <Sparkles size={11} />
                  Gambar Gerak ({sessionAlbum?.filter(i => i.gifUrl).length || 0})
                </button>
              </div>

              {/* Auto play GIF toggle & Cloud Guarantee */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoPlayAllGifs(!autoPlayAllGifs)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                    autoPlayAllGifs
                      ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                  }`}
                  title="Putar semua animasi gambar gerak / GIF secara otomatis"
                >
                  <Play size={10} className={autoPlayAllGifs ? 'fill-purple-200' : ''} />
                  <span>{autoPlayAllGifs ? 'Semua GIF Berputar' : 'Putar Semua Gerak'}</span>
                </button>

                <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <Cloud size={12} />
                  <span>Cloud 7 Hari</span>
                </div>
              </div>
            </div>

            {/* Album Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {sessionAlbum?.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Camera size={36} className="mx-auto text-gray-600" />
                  <p className="text-sm font-semibold">Belum ada foto dalam album sesi.</p>
                  <p className="text-xs text-gray-500">
                    {sessionTimeRemaining > 0 
                      ? 'Tutup album dan tekan tombol kamera untuk mulai berfoto.' 
                      : 'Waktu sesi telah habis. Bayar sesi baru untuk berfoto kembali.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sessionAlbum
                    .filter(item => {
                      if (albumFilter === 'photo') return Boolean(item.dataUrl);
                      if (albumFilter === 'gif') return Boolean(item.gifUrl);
                      return true;
                    })
                    .map((item, idx) => {
                      const isPreviewingLive = autoPlayAllGifs || previewLiveItem?.id === item.id;
                      const hasMotion = Boolean(item.gifUrl || item.liveVideoUrl);

                      return (
                        <div
                          key={item.id || idx}
                          className="bg-black/50 border border-white/10 rounded-2xl overflow-hidden group hover:border-white/30 transition-all flex flex-col"
                        >
                          {/* Media display (Still or Live/GIF) */}
                          <div className="aspect-[4/3] bg-gray-900 relative overflow-hidden">
                            {isPreviewingLive && hasMotion ? (
                              <img
                                src={item.gifUrl || item.dataUrl}
                                alt="Foto Gerak / GIF"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={item.dataUrl}
                                alt="Foto Diam"
                                className="w-full h-full object-cover"
                              />
                            )}

                            {/* Live Photo / GIF Badge */}
                            {hasMotion && (
                              <button
                                onClick={() => setPreviewLiveItem(isPreviewingLive && !autoPlayAllGifs ? null : item)}
                                className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 z-10 transition-colors ${
                                  isPreviewingLive 
                                    ? 'bg-purple-600 text-white animate-pulse' 
                                    : 'bg-black/60 text-purple-300 hover:bg-purple-600 hover:text-white'
                                }`}
                                title="Klik untuk memutar foto gerak / GIF"
                              >
                                <Play size={8} className={isPreviewingLive ? 'fill-white' : ''} />
                                <span>{isPreviewingLive ? 'Gerak Aktif' : 'Foto Gerak'}</span>
                              </button>
                            )}

                            <span className="absolute bottom-1 right-2 text-[9px] font-mono text-gray-300 bg-black/60 px-1.5 py-0.5 rounded">
                              {item.capturedAt || `#${idx + 1}`}
                            </span>
                          </div>

                          {/* Controls to assign photo to Slots & Download */}
                          <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                              <span className="truncate max-w-[100px] font-medium text-gray-300">{item.filterName || 'Natural'}</span>
                              <div className="flex items-center gap-1">
                                {/* Download Still */}
                                <a
                                  href={item.dataUrl}
                                  download={`snap_photo_${item.id || idx + 1}.jpg`}
                                  className="text-gray-400 hover:text-white p-1 transition-colors"
                                  title="Unduh Foto Diam (JPG)"
                                >
                                  <Download size={12} />
                                </a>
                                {/* Download GIF if available */}
                                {item.gifUrl && (
                                  <a
                                    href={item.gifUrl}
                                    download={`snap_motion_${item.id || idx + 1}.gif`}
                                    className="text-purple-400 hover:text-purple-300 p-1 transition-colors font-bold text-[10px]"
                                    title="Unduh Gambar Gerak (GIF)"
                                  >
                                    GIF
                                  </a>
                                )}
                                <button
                                  onClick={() => deletePhotoFromAlbum(item.id)}
                                  className="text-gray-400 hover:text-red-400 p-1 transition-colors ml-0.5"
                                  title="Hapus foto dari album"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Slot Buttons */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                                Pasang ke Frame:
                              </span>
                              <div className="grid grid-cols-3 gap-1">
                                {Array.from({ length: totalShots }).map((_, slotIdx) => (
                                  <button
                                    key={slotIdx}
                                    onClick={() => {
                                      selectPhotoForSlot(slotIdx, item);
                                      setShowAlbumModal(false);
                                    }}
                                    className={`py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                                      capturedPhotos[slotIdx]?.dataUrl === item.dataUrl
                                        ? 'bg-emerald-600 text-white border-emerald-500'
                                        : 'bg-white/10 hover:bg-white/20 text-gray-200 border-white/10'
                                    }`}
                                    title={`Jadikan foto ini untuk Pose #${slotIdx + 1}`}
                                  >
                                    Slot {slotIdx + 1}
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              {sessionTimeRemaining > 0 ? (
                <button
                  onClick={() => { setShowAlbumModal(false); setPreviewLiveItem(null); }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Kembali ke Kamera
                </button>
              ) : (
                <button
                  onClick={() => setShowPaymentModalInCapture(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                >
                  <CreditCard size={14} />
                  <span>Beli Sesi Baru (Bayar)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowAlbumModal(false);
                  navigate('/editor');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-red-600/20"
              >
                <span>Bawa ke Editor Photostrip</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Payment Modal for Expired Session */}
      <PaymentModal
        isOpen={showPaymentModalInCapture}
        onClose={() => setShowPaymentModalInCapture(false)}
        onSuccess={() => {
          startNewSession();
          setShowPaymentModalInCapture(false);
          setShowAlbumModal(false);
        }}
        title="Beli Sesi Photobooth Baru (15 Menit)"
      />

    </div>
  );
}
