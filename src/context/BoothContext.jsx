/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, db, handleFirestoreError } from '../firebase';
import { CAMERA_PRESETS } from '../data/cameraPresets';
import { DEFAULT_FRAMES } from '../data/defaultFrames';

export const ADMIN_EMAILS = [
  '0601randikurnia.s@gmail.com',
  'admin@snape.studio'
];

export function isUserAdmin(user) {
  if (!user) return false;
  if (user.email && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase())) {
    return true;
  }
  if (user.isAdmin === true || user.role === 'admin') {
    return true;
  }
  return false;
}

const DEFAULT_STICKERS = [
  { id: 'stk_1', type: 'emoji', text: '✨', name: 'Sparkles', category: 'Aesthetic' },
  { id: 'stk_2', type: 'emoji', text: '💖', name: 'Sparkle Heart', category: 'Love' },
  { id: 'stk_3', type: 'emoji', text: '🎀', name: 'Coquette Bow', category: 'Cute' },
  { id: 'stk_4', type: 'emoji', text: '⭐', name: 'Star', category: 'Aesthetic' },
  { id: 'stk_5', type: 'emoji', text: '🍒', name: 'Cherry', category: 'Cute' },
  { id: 'stk_6', type: 'emoji', text: '🌸', name: 'Sakura Blossom', category: 'Nature' },
  { id: 'stk_7', type: 'emoji', text: '📸', name: 'Retro Camera', category: 'Studio' },
  { id: 'stk_8', type: 'emoji', text: '💌', name: 'Love Letter', category: 'Love' },
  { id: 'stk_9', type: 'emoji', text: '🧸', name: 'Teddy Bear', category: 'Cute' },
  { id: 'stk_10', type: 'emoji', text: '🕊️', name: 'Dove', category: 'Aesthetic' },
  { id: 'stk_11', type: 'emoji', text: '🐱', name: 'Cute Cat', category: 'Cute' },
  { id: 'stk_12', type: 'emoji', text: '☕', name: 'Cafe Coffee', category: 'Aesthetic' },
  { id: 'stk_13', type: 'emoji', text: '🎉', name: 'Confetti Party', category: 'Party' },
  { id: 'stk_14', type: 'emoji', text: '🎞️', name: 'Film Strip', category: 'Studio' },
  { id: 'stk_15', type: 'emoji', text: '🐾', name: 'Paws', category: 'Cute' }
];

const DEFAULT_CONFIG = {
  title: 'snap.e',
  subtitle: 'Tangible Memories, Synchronized Distances',
  payment: {
    price: 15000,
    sessionDurationMinutes: 15,
    printFee: 20000,
    qrisUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126570014ID.LINKAJA.WWW01189360091100000000005204581253033605802ID5906SNAP_E6007JAKARTA5405150005802ID63041234',
  },
  paymentGateway: {
    provider: 'doku', // 'doku' | 'midtrans' | 'xendit' | 'manual'
    merchantId: 'MALL-DOKU-882190',
    clientKey: 'pk_live_doku_a89123bc891',
    secretKey: 'sk_live_doku_993821736152',
    webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/qris-webhook` : '',
    environment: 'sandbox', // 'sandbox' | 'production'
    activeMethods: ['qris_bca', 'qris_gopay', 'qris_shopeepay', 'qris_dana', 'qris_ovo'],
    qrisCustomImage: '',
    enableAutoVerify: true,
    settlementType: 'instant'
  },
  customFrames: DEFAULT_FRAMES,
  customFilters: CAMERA_PRESETS,
  customStickers: DEFAULT_STICKERS,
  website: {
    brandName: 'snap.e',
    heroTagline: 'Momen Berharga, Synchronized Distances',
    taglineGradient: 'from-rose-600 via-purple-600 to-indigo-600',
    heroDescription: 'Foto bersama pasangan atau sahabat dari jarak jauh secara real-time, atau nikmati sesi solo dengan photostrip estetik gaya Korea.',
    announcement: '✨ Selamat datang di Studio snap.e! Cetak strip foto kualitas lab dan simpan live photo memori Anda.',
    showAnnouncement: true,
    showHero: true,
    showSetupCard: true,
    showFeatures: true,
    showFramesShowcase: true,
    showPricing: true,
    showHowItWorks: true,
    showTestimonials: true,
    showFaq: true,
    showFooter: true,
    showFloatingWhatsapp: true,
    whatsappNumber: '0812-3456-7890',
    instagramHandle: '@snape.photobooth',
    studioAddress: 'Jl. Senopati No. 88, Jakarta Selatan',
    openingHours: '10:00 - 22:00 WIB',
    isOpen: true,
    accentColor: '#E11D48',
    promoBadge: 'PHOTO BOOTH ONLINE & LDR DUAL-STREAM',
    primaryCtaText: 'Mulai Sesi Booth Sekarang',
    secondaryCtaText: 'Lihat Pilihan Frame',
    metaTitle: 'snap.e - Tangible Memories, Synchronized Distances',
    metaDescription: 'Tangible Memories, Synchronized Distances - Online photobooth for solo and LDR couples with customizable photostrips and studio management.',
    metaKeywords: 'photobooth online, ldr photobooth, photo strip korea, cetak foto lab'
  }
};

const DEFAULT_SAMPLE_PHOTOS = [
  {
    dataUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=450&fit=crop',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
    filterCss: 'none',
    stickers: [{ text: '✨', x: 25, y: 25 }]
  },
  {
    dataUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=450&fit=crop',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
    filterCss: 'none',
    stickers: []
  },
  {
    dataUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&h=450&fit=crop',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
    filterCss: 'none',
    stickers: []
  },
  {
    dataUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=450&fit=crop',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
    filterCss: 'none',
    stickers: [{ text: '💖', x: 75, y: 75 }]
  }
];

const defaultContextValue = {
  appConfig: DEFAULT_CONFIG,
  currentUser: null,
  authLoading: false,
  isAdminAuth: false,
  isAdmin: false,
  showAuthModal: false,
  authRedirectUrl: null,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  loginWithGoogle: async () => ({ success: false }),
  loginWithEmailPassword: async () => ({ success: false }),
  registerWithEmailPassword: async () => ({ success: false }),
  loginDirectly: async () => ({ success: false }),
  loginWithDemo: async () => ({ success: false }),
  logout: async () => {},
  adminLogin: () => {},
  adminLogout: () => {},
  isFirebaseConnected: true,
  cameraPresets: CAMERA_PRESETS,
  defaultFrames: DEFAULT_FRAMES,
  stickers: DEFAULT_STICKERS,
  photos: DEFAULT_SAMPLE_PHOTOS,
  setPhotos: () => {},
  activePhotoIdx: 0,
  setActivePhotoIdx: () => {},
  activeFrame: DEFAULT_FRAMES[0],
  setActiveFrame: () => {},
  customText: '',
  setCustomText: () => {},
  layout: 'strip',
  setLayout: () => {},
  showBadge: true,
  setShowBadge: () => {},
  showQr: true,
  setShowQr: () => {},
  userName: '',
  setUserName: () => {},
  boothMode: 'solo',
  setBoothMode: () => {},
  sessionSecondsLeft: 900,
  sessionAlbum: [],
  orders: [],
  registeredUsers: [],
  registeredUsersCount: 0,
  startOrResumeSession: () => {},
  resetSession: () => {},
  addPhotoToAlbum: () => {},
  deletePhotoFromAlbum: () => {},
  selectPhotoForSlot: () => {},
  addOrder: () => {},
  updateOrderStatus: () => {},
  deleteOrder: () => {},
  addCustomFrame: () => {},
  deleteCustomFrame: () => {},
  addCustomSticker: () => {},
  deleteCustomSticker: () => {},
  addCustomFilter: () => {},
  deleteCustomFilter: () => {},
  updatePaymentGatewayConfig: () => {},
  updateWebsiteConfig: () => {},
};

export const BoothContext = createContext(defaultContextValue);

const SESSION_MAX_SECONDS = 15 * 60; // 900s = 15 minutes
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function BoothProvider({ children }) {
  // App configuration (pricing, frames, filters)
  const [appConfig, setAppConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('snape_app_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Current user & session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('snape_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState(null);

  // Registered users state for admin dashboard
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const [userName, setUserName] = useState(() => {
    try {
      const savedUser = localStorage.getItem('snape_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.displayName) return parsed.displayName;
      }
    } catch {
      // ignore
    }
    return localStorage.getItem('snape_user_name') || 'Pengguna';
  });
  const [mode, setMode] = useState('solo'); // 'solo' | 'ldr'
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem('snape_layout');
      return saved || '4r_4cut';
    } catch {
      return '4r_4cut';
    }
  }); // 'strip' (3 cuts) | 'grid' (4 grid) | '4r_4cut' (4R 2x2 with center cut line) | '4r_6cut' (4R 2x3 with center cut line)
  
  // Session timer (15 minutes overall session)
  const [sessionStartTime, setSessionStartTime] = useState(() => {
    try {
      const saved = localStorage.getItem('snape_session_start_time');
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(() => {
    try {
      const saved = localStorage.getItem('snape_session_start_time');
      if (saved) {
        const elapsed = Math.floor((Date.now() - parseInt(saved, 10)) / 1000);
        return Math.max(0, SESSION_MAX_SECONDS - elapsed);
      }
    } catch {
      // fallback
    }
    return SESSION_MAX_SECONDS;
  });

  // Helper to get or initialize session ID (each session has its own isolated album storage)
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem('snape_current_session_id');
      if (saved) return saved;
      const initialId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      localStorage.setItem('snape_current_session_id', initialId);
      return initialId;
    } catch {
      return `sess_${Date.now()}`;
    }
  });

  // Session Album: stored separately per session in `snape_album_${currentSessionId}`
  const [sessionAlbum, setSessionAlbum] = useState(() => {
    try {
      const sessId = localStorage.getItem('snape_current_session_id');
      if (sessId) {
        const saved = localStorage.getItem(`snape_album_${sessId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const now = Date.now();
            const valid = parsed.filter(p => p && !p.id?.startsWith('sample_') && !p.dataUrl?.includes('images.unsplash.com') && (!p.expiresAt || new Date(p.expiresAt).getTime() > now));
            return valid;
          }
        }
      }
    } catch {
      // fallback
    }
    return []; // Album starts completely empty for each new session!
  });

  // Photos captured in booth
  const [capturedPhotos, setCapturedPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem('snape_captured_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validCaptured = parsed.filter(p => p && !p.id?.startsWith('sample_') && !p.dataUrl?.includes('images.unsplash.com'));
          return validCaptured;
        }
      }
    } catch {
      // fallback
    }
    return []; // Starts empty!
  });

  // Session ticker timer effect
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const remaining = Math.max(0, SESSION_MAX_SECONDS - elapsed);
      setSessionTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const startOrResumeSession = useCallback(() => {
    let startTime = sessionStartTime;
    // If no start time OR if previous session is already expired, start fresh 15-minute session
    if (!startTime || (Date.now() - startTime) >= SESSION_MAX_SECONDS * 1000) {
      startTime = Date.now();
      localStorage.setItem('snape_session_start_time', String(startTime));
      setSessionStartTime(startTime);
    }
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    setSessionTimeRemaining(Math.max(0, SESSION_MAX_SECONDS - elapsed));
  }, [sessionStartTime]);

  const resetSession = useCallback(() => {
    const now = Date.now();
    localStorage.setItem('snape_session_start_time', String(now));
    setSessionStartTime(now);
    setSessionTimeRemaining(SESSION_MAX_SECONDS);
  }, []);

  // Start an entirely new session with its own distinct album storage
  const startNewSession = useCallback(() => {
    const now = Date.now();
    const newSessionId = `sess_${now}_${Math.random().toString(36).substr(2, 4)}`;
    try {
      localStorage.setItem('snape_current_session_id', newSessionId);
      localStorage.setItem('snape_session_start_time', String(now));
      localStorage.setItem(`snape_album_${newSessionId}`, JSON.stringify([]));
      localStorage.setItem('snape_captured_photos', JSON.stringify([]));
    } catch (e) {
      console.warn('Session init warning:', e);
    }
    setCurrentSessionId(newSessionId);
    setSessionStartTime(now);
    setSessionTimeRemaining(SESSION_MAX_SECONDS);
    setSessionAlbum([]);
    setCapturedPhotos([]);
    return newSessionId;
  }, []);

  // Album actions with 7-day expiration (scoped per session storage)
  const addPhotoToAlbum = useCallback((newPhoto) => {
    const now = Date.now();
    const photoWithId = {
      id: newPhoto.id || `snap_${now}_${Math.random().toString(36).substr(2, 4)}`,
      sessionId: currentSessionId,
      capturedAt: newPhoto.capturedAt || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SEVEN_DAYS_MS).toISOString(),
      ...newPhoto
    };

    setSessionAlbum(prev => {
      const updated = [photoWithId, ...prev];
      try {
        localStorage.setItem(`snape_album_${currentSessionId}`, JSON.stringify(updated.slice(0, 50)));
        localStorage.setItem('snape_session_album', JSON.stringify(updated.slice(0, 50)));
      } catch (e) {
        console.warn('Storage warning for album:', e);
      }
      return updated;
    });

    return photoWithId;
  }, [currentSessionId]);

  const deletePhotoFromAlbum = useCallback((photoId) => {
    setSessionAlbum(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      try {
        localStorage.setItem(`snape_album_${currentSessionId}`, JSON.stringify(updated));
        localStorage.setItem('snape_session_album', JSON.stringify(updated));
      } catch (err) {
        console.warn('Storage error:', err);
      }
      return updated;
    });
  }, [currentSessionId]);

  const selectPhotoForSlot = useCallback((slotIndex, photoItem) => {
    setCapturedPhotos(prev => {
      const next = [...prev];
      next[slotIndex] = {
        ...photoItem,
        zoom: photoItem.zoom ?? 1.0,
        offsetX: photoItem.offsetX ?? 0,
        offsetY: photoItem.offsetY ?? 0,
        stickers: photoItem.stickers || []
      };
      try {
        localStorage.setItem('snape_captured_photos', JSON.stringify(next));
      } catch (err) {
        console.warn('Storage error:', err);
      }
      return next;
    });
  }, []);

  // Print orders list (for studio admin) - synced with Firestore
  const [orders, setOrders] = useState([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Admin authentication state
  const [isAdminAuth, setIsAdminAuth] = useState(() => {
    try {
      const savedUser = localStorage.getItem('snape_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (isUserAdmin(parsed)) return true;
      }
    } catch {
      // ignore
    }
    return localStorage.getItem('snape_admin_authenticated') === 'true';
  });

  // Synchronize Firebase Auth changes & catch redirect sign-in
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const user = result.user;
          const admin = isUserAdmin(user);
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || null,
            isAdmin: admin
          };
          setCurrentUser(userData);
          setUserName(userData.displayName);
          localStorage.setItem('snape_current_user', JSON.stringify(userData));
          if (admin) {
            setIsAdminAuth(true);
            localStorage.setItem('snape_admin_authenticated', 'true');
          }
        }
      })
      .catch((err) => {
        console.warn('Redirect sign-in check:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const admin = isUserAdmin(firebaseUser);
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || null,
          isAdmin: admin
        };
        setCurrentUser(userData);
        setUserName(userData.displayName);
        localStorage.setItem('snape_current_user', JSON.stringify(userData));
        if (admin) {
          setIsAdminAuth(true);
          localStorage.setItem('snape_admin_authenticated', 'true');
        }
      } else {
        // Authentic Firebase user is signed out
        setCurrentUser(null);
        setIsAdminAuth(false);
        localStorage.removeItem('snape_current_user');
        localStorage.removeItem('snape_admin_authenticated');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Synchronize Studio Config with Firestore
  useEffect(() => {
    const configDocRef = doc(db, 'studio_config', 'main');

    const unsubscribe = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          let mergedFilters = CAMERA_PRESETS;
          if (Array.isArray(remoteData.customFilters) && remoteData.customFilters.length > 0) {
            const presetIds = new Set(CAMERA_PRESETS.map(p => p.id));
            const additional = remoteData.customFilters.filter(f => !presetIds.has(f.id));
            mergedFilters = [...CAMERA_PRESETS, ...additional];
          }

          let mergedFrames = DEFAULT_FRAMES;
          if (Array.isArray(remoteData.customFrames) && remoteData.customFrames.length > 0) {
            const defaultFrameIds = new Set(DEFAULT_FRAMES.map(f => f.id));
            const customOnly = remoteData.customFrames.filter(f => !defaultFrameIds.has(f.id));
            mergedFrames = [...DEFAULT_FRAMES, ...customOnly];
          }

          let mergedStickers = DEFAULT_STICKERS;
          if (Array.isArray(remoteData.customStickers) && remoteData.customStickers.length > 0) {
            const defaultStickerIds = new Set(DEFAULT_STICKERS.map(s => s.id));
            const customOnly = remoteData.customStickers.filter(s => !defaultStickerIds.has(s.id));
            mergedStickers = [...DEFAULT_STICKERS, ...customOnly];
          }

          setAppConfig((prev) => ({
            ...prev,
            ...remoteData,
            payment: {
              ...prev.payment,
              price: remoteData.price ?? prev.payment.price,
              qrisUrl: remoteData.qrisUrl ?? prev.payment.qrisUrl,
            },
            website: {
              ...prev.website,
              ...(remoteData.website || {})
            },
            customFrames: mergedFrames,
            customFilters: mergedFilters,
            customStickers: mergedStickers,
          }));
          setIsFirebaseConnected(true);
        } else {
          // Initialize default config in Firestore
          setDoc(configDocRef, {
            price: DEFAULT_CONFIG.payment.price,
            qrisUrl: DEFAULT_CONFIG.payment.qrisUrl,
            customFrames: DEFAULT_CONFIG.customFrames,
            customFilters: DEFAULT_CONFIG.customFilters,
            customStickers: DEFAULT_CONFIG.customStickers,
            website: DEFAULT_CONFIG.website,
            updatedAt: new Date().toISOString()
          }).catch(err => console.warn('Could not bootstrap default Firestore config:', err));
        }
      },
      (error) => {
        handleFirestoreError(error, 'get', 'studio_config/main');
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Synchronize Print Orders with Firestore Real-time
  useEffect(() => {
    const ordersColRef = collection(db, 'print_orders');

    const unsubscribe = onSnapshot(
      ordersColRef,
      (snapshot) => {
        const remoteOrders = snapshot.docs.map(docItem => ({
          id: docItem.id,
          ...docItem.data()
        }));

        // Sort latest first
        remoteOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        // If firestore is empty on first run, seed with starter orders
        if (remoteOrders.length === 0) {
          const seed1 = {
            id: 'ORD-8921',
            customerName: 'Alisya & Dimas',
            phone: '0812-9847-1102',
            address: 'Jl. Kemang Raya No. 42, Jakarta Selatan',
            paperType: 'Glossy 3R Extended',
            totalPrice: 48000,
            status: 'printing',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=150&fit=crop'
          };
          const seed2 = {
            id: 'ORD-8920',
            customerName: 'Rian & Nabila',
            phone: '0857-1122-3344',
            address: 'Tebet Barat Dalam VII, Jakarta Selatan',
            paperType: 'Matte Scandinavian Frame',
            totalPrice: 35000,
            status: 'pending',
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            thumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=150&fit=crop'
          };
          setDoc(doc(db, 'print_orders', seed1.id), seed1).catch(() => {});
          setDoc(doc(db, 'print_orders', seed2.id), seed2).catch(() => {});
          setOrders([seed1, seed2]);
        } else {
          setOrders(remoteOrders);
        }
        setIsFirebaseConnected(true);
      },
      (error) => {
        handleFirestoreError(error, 'list', 'print_orders');
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Synchronize Registered Users with Firestore Real-time
  useEffect(() => {
    const usersColRef = collection(db, 'users');

    const unsubscribe = onSnapshot(
      usersColRef,
      (snapshot) => {
        const remoteUsers = snapshot.docs.map(docItem => ({
          id: docItem.id,
          ...docItem.data()
        }));

        if (remoteUsers.length === 0) {
          const starterUsers = [
            {
              uid: 'usr_admin',
              displayName: 'Randi Kurnia',
              email: '0601randikurnia.s@gmail.com',
              role: 'admin',
              createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
              lastLoginAt: new Date().toISOString()
            },
            {
              uid: 'usr_nabila',
              displayName: 'Nabila Azzahra',
              email: 'nabila.azzahra@gmail.com',
              role: 'customer',
              createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
              lastLoginAt: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
              uid: 'usr_dimas',
              displayName: 'Dimas Prasetya',
              email: 'dimas.prasetya@gmail.com',
              role: 'customer',
              createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
              lastLoginAt: new Date(Date.now() - 3600000 * 6).toISOString()
            },
            {
              uid: 'usr_alisya',
              displayName: 'Alisya Putri',
              email: 'alisya.putri@gmail.com',
              role: 'customer',
              createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
              lastLoginAt: new Date(Date.now() - 3600000 * 12).toISOString()
            },
            {
              uid: 'usr_kevin',
              displayName: 'Kevin Pratama',
              email: 'kevin.pratama@gmail.com',
              role: 'customer',
              createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
              lastLoginAt: new Date(Date.now() - 3600000 * 24).toISOString()
            }
          ];

          starterUsers.forEach(u => {
            setDoc(doc(db, 'users', u.uid), u).catch(() => {});
          });
          setRegisteredUsers(starterUsers);
        } else {
          remoteUsers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setRegisteredUsers(remoteUsers);
        }
      },
      (error) => {
        handleFirestoreError(error, 'list', 'users');
      }
    );

    return () => unsubscribe();
  }, []);

  // Save config changes to Firestore & local
  const updateAppConfig = async (newConfig) => {
    setAppConfig(newConfig);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(newConfig));
      const configDocRef = doc(db, 'studio_config', 'main');
      await setDoc(configDocRef, {
        price: newConfig.payment.price,
        qrisUrl: newConfig.payment.qrisUrl,
        customFrames: newConfig.customFrames,
        customFilters: newConfig.customFilters,
        customStickers: newConfig.customStickers || DEFAULT_STICKERS,
        website: newConfig.website || DEFAULT_CONFIG.website,
        paymentGateway: newConfig.paymentGateway || DEFAULT_CONFIG.paymentGateway,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Error saving to Firestore:', e);
    }
  };

  // Payment Gateway Config Update
  const updatePaymentGatewayConfig = async (gwData) => {
    const mergedGateway = {
      ...(appConfig.paymentGateway || DEFAULT_CONFIG.paymentGateway),
      ...gwData
    };
    const updated = {
      ...appConfig,
      paymentGateway: mergedGateway
    };
    setAppConfig(updated);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(updated));
      await updateDoc(doc(db, 'studio_config', 'main'), {
        paymentGateway: mergedGateway,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not save payment gateway config:', err);
    }
    return mergedGateway;
  };

  // Custom Preset Filters Management
  const addCustomFilter = async (filterData) => {
    const newFilter = {
      id: `flt_${Date.now()}`,
      name: filterData.name || 'Preset Baru',
      brand: filterData.brand || 'CUSTOM',
      category: filterData.category || 'vintage',
      css: filterData.css || 'contrast(1.1) saturate(1.2)',
      description: filterData.description || 'Preset kustom buatan studio',
      createdAt: new Date().toISOString()
    };
    const nextFilters = [...(appConfig.customFilters || CAMERA_PRESETS), newFilter];
    const updated = {
      ...appConfig,
      customFilters: nextFilters
    };
    setAppConfig(updated);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(updated));
      await updateDoc(doc(db, 'studio_config', 'main'), {
        customFilters: nextFilters,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not save filter:', err);
    }
    return newFilter;
  };

  const deleteCustomFilter = async (filterId) => {
    const nextFilters = (appConfig.customFilters || CAMERA_PRESETS).filter(f => f.id !== filterId);
    const updated = {
      ...appConfig,
      customFilters: nextFilters
    };
    setAppConfig(updated);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(updated));
      await updateDoc(doc(db, 'studio_config', 'main'), {
        customFilters: nextFilters,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not delete filter:', err);
    }
  };

  // Save photos to local state
  const updateCapturedPhotos = useCallback((photos) => {
    setCapturedPhotos(photos);
    try {
      localStorage.setItem('snape_captured_photos', JSON.stringify(photos));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, []);

  // Add print order to Firestore
  const addOrder = async (orderData) => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      customerName: orderData.customerName,
      phone: orderData.phone,
      address: orderData.address,
      paperType: orderData.paperType,
      totalPrice: Number(orderData.totalPrice) || 35000,
      status: 'pending',
      createdAt: new Date().toISOString(),
      thumbnail: orderData.thumbnail || ''
    };

    // Optimistic UI update
    setOrders(prev => [newOrder, ...prev]);

    try {
      await setDoc(doc(db, 'print_orders', orderId), newOrder);
    } catch (error) {
      handleFirestoreError(error, 'create', `print_orders/${orderId}`);
    }

    return newOrder;
  };

  // Update order status in Firestore
  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      await updateDoc(doc(db, 'print_orders', orderId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, 'update', `print_orders/${orderId}`);
    }
  };

  // Delete order in Firestore
  const deleteOrder = async (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    try {
      await deleteDoc(doc(db, 'print_orders', orderId));
    } catch (error) {
      handleFirestoreError(error, 'delete', `print_orders/${orderId}`);
    }
  };

  // Authentication handlers
  const loginWithGoogle = async (useRedirect = false) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // Explicit redirect request (recommended for mobile browsers)
    if (useRedirect) {
      await signInWithRedirect(auth, provider);
      return { redirected: true };
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const admin = isUserAdmin(user);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        isAdmin: admin
      };
      setCurrentUser(userData);
      localStorage.setItem('snape_current_user', JSON.stringify(userData));
      setUserName(userData.displayName);

      // Register or update user record in Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          role: admin ? 'admin' : 'customer',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not save user profile to Firestore:', e);
      }

      if (admin) {
        setIsAdminAuth(true);
        localStorage.setItem('snape_admin_authenticated', 'true');
      }
      return { success: true, user: userData, isAdmin: admin };
    } catch (error) {
      console.error('Google sign-in error:', error);
      // Auto-fallback to redirect if popup is blocked
      if (error?.code === 'auth/popup-blocked') {
        console.log('Popup was blocked by browser, attempting redirect flow...');
        await signInWithRedirect(auth, provider);
        return { redirected: true };
      }
      throw error;
    }
  };

  // Firebase Email & Password Authentication
  const loginWithEmailPassword = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = result.user;
      const admin = isUserAdmin(user);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        isAdmin: admin
      };
      setCurrentUser(userData);
      localStorage.setItem('snape_current_user', JSON.stringify(userData));
      setUserName(userData.displayName);

      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          role: admin ? 'admin' : 'customer',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not save user profile to Firestore:', e);
      }

      if (admin) {
        setIsAdminAuth(true);
        localStorage.setItem('snape_admin_authenticated', 'true');
      }
      return { success: true, user: userData, isAdmin: admin };
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const registerWithEmailPassword = async (email, password, displayName = '') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = result.user;
      const name = displayName.trim() || email.split('@')[0];
      const admin = isUserAdmin(user);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: null,
        isAdmin: admin
      };
      setCurrentUser(userData);
      localStorage.setItem('snape_current_user', JSON.stringify(userData));
      setUserName(name);

      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          photoURL: null,
          role: admin ? 'admin' : 'customer',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not save user profile to Firestore:', e);
      }

      if (admin) {
        setIsAdminAuth(true);
        localStorage.setItem('snape_admin_authenticated', 'true');
      }
      return { success: true, user: userData, isAdmin: admin };
    } catch (error) {
      console.error('Email registration error:', error);
      throw error;
    }
  };

  // Direct login fallback (works in iframe / when popup is blocked)
  const loginDirectly = async (customEmail = '0601randikurnia.s@gmail.com', customName = 'Randi Kurnia') => {
    const email = (customEmail || '0601randikurnia.s@gmail.com').trim().toLowerCase();
    const displayName = (customName || '').trim() || email.split('@')[0];
    const admin = isUserAdmin({ email });
    const uid = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const userData = {
      uid,
      email,
      displayName,
      photoURL: null,
      isAdmin: admin
    };

    setCurrentUser(userData);
    localStorage.setItem('snape_current_user', JSON.stringify(userData));
    setUserName(displayName);

    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        displayName,
        photoURL: null,
        role: admin ? 'admin' : 'customer',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not save user profile to Firestore:', e);
    }

    if (admin) {
      setIsAdminAuth(true);
      localStorage.setItem('snape_admin_authenticated', 'true');
    }

    return { success: true, user: userData, isAdmin: admin };
  };

  const loginWithDemo = () => {
    return loginDirectly('0601randikurnia.s@gmail.com', 'Randi Kurnia (Admin)');
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setCurrentUser(null);
    setIsAdminAuth(false);
    localStorage.removeItem('snape_current_user');
    localStorage.removeItem('snape_admin_authenticated');
  };

  const openAuthModal = (redirectPath = null) => {
    setAuthRedirectUrl(redirectPath);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthRedirectUrl(null);
  };

  // Custom Frames Management (Manual Frame Addition)
  const addCustomFrame = async (frameData) => {
    const frameId = `frame_${Date.now()}`;
    const newFrame = {
      id: frameId,
      name: frameData.name || 'Frame Kustom',
      category: frameData.category || (frameData.imageUrl ? 'graphic' : 'solid'),
      badge: frameData.badge || (frameData.imageUrl ? 'CUSTOM' : 'SOLID'),
      bg: frameData.bg || '#F9F6F0',
      text: frameData.text || '#111827',
      imageUrl: frameData.imageUrl || null,
      overlayType: frameData.overlayType || null,
      description: frameData.description || 'Frame kustom buatan studio.',
      createdAt: new Date().toISOString()
    };

    const nextFrames = [...(appConfig.customFrames || []), newFrame];
    const updated = {
      ...appConfig,
      customFrames: nextFrames
    };

    setAppConfig(updated);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(updated));
    } catch {
      // ignore
    }

    try {
      await updateDoc(doc(db, 'studio_config', 'main'), {
        customFrames: nextFrames,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not update Firestore customFrames:', err);
    }

    return newFrame;
  };

  const deleteCustomFrame = async (frameId) => {
    const nextFrames = (appConfig.customFrames || []).filter(f => f.id !== frameId);
    const updated = {
      ...appConfig,
      customFrames: nextFrames
    };
    setAppConfig(updated);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(updated));
    } catch {
      // ignore
    }
    try {
      await updateDoc(doc(db, 'studio_config', 'main'), {
        customFrames: nextFrames,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not delete frame in Firestore:', err);
    }
  };

  // Custom Sticker Management (Admin independent sticker addition)
  const addCustomSticker = async (stickerData) => {
    const stickerId = `stk_${Date.now()}`;
    const newSticker = {
      id: stickerId,
      type: stickerData.type || 'emoji', // 'emoji' | 'image'
      text: stickerData.text || '✨',
      imageUrl: stickerData.imageUrl || null,
      name: stickerData.name || 'Stiker Kustom',
      category: stickerData.category || 'Aesthetic',
      createdAt: new Date().toISOString()
    };

    const nextStickers = [...(appConfig.customStickers || DEFAULT_STICKERS), newSticker];
    const updated = {
      ...appConfig,
      customStickers: nextStickers
    };

    setAppConfig(updated);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    try {
      await updateDoc(doc(db, 'studio_config', 'main'), {
        customStickers: nextStickers,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not update Firestore customStickers:', err);
    }

    return newSticker;
  };

  const deleteCustomSticker = async (stickerId) => {
    const nextStickers = (appConfig.customStickers || DEFAULT_STICKERS).filter(s => s.id !== stickerId);
    const updated = {
      ...appConfig,
      customStickers: nextStickers
    };

    setAppConfig(updated);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    try {
      await updateDoc(doc(db, 'studio_config', 'main'), {
        customStickers: nextStickers,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not delete sticker in Firestore:', err);
    }
  };

  // Website Config Management (Admin Website Content Editor)
  const updateWebsiteConfig = async (websiteData) => {
    const mergedWebsite = {
      ...(appConfig.website || DEFAULT_CONFIG.website),
      ...websiteData
    };

    const updated = {
      ...appConfig,
      website: mergedWebsite
    };

    setAppConfig(updated);
    try {
      localStorage.setItem('snape_app_config', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    try {
      await updateDoc(doc(db, 'studio_config', 'main'), {
        website: mergedWebsite,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not update Firestore website config:', err);
    }

    return mergedWebsite;
  };

  // Admin PIN Login / Logout (legacy / fallback support)
  const adminLogin = (password) => {
    if (password === 'admin123' || password === 'snape2024' || password === 'admin') {
      setIsAdminAuth(true);
      localStorage.setItem('snape_admin_authenticated', 'true');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    logout();
  };

  useEffect(() => {
    localStorage.setItem('snape_user_name', userName);
  }, [userName]);

  useEffect(() => {
    if (layout) {
      localStorage.setItem('snape_layout', layout);
    }
  }, [layout]);

  return (
    <BoothContext.Provider
      value={{
        appConfig,
        updateAppConfig,
        userName,
        setUserName,
        mode,
        setMode,
        layout,
        setLayout,
        capturedPhotos,
        updateCapturedPhotos,
        sessionTimeRemaining,
        currentSessionId,
        startNewSession,
        startOrResumeSession,
        resetSession,
        sessionAlbum,
        addPhotoToAlbum,
        deletePhotoFromAlbum,
        selectPhotoForSlot,
        orders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        addCustomFrame,
        deleteCustomFrame,
        addCustomSticker,
        deleteCustomSticker,
        addCustomFilter,
        deleteCustomFilter,
        updatePaymentGatewayConfig,
        updateWebsiteConfig,
        registeredUsers,
        registeredUsersCount: registeredUsers.length,
        currentUser,
        authLoading,
        isAdminAuth: Boolean(currentUser?.isAdmin || isAdminAuth),
        isAdmin: Boolean(currentUser?.isAdmin || isAdminAuth),
        showAuthModal,
        authRedirectUrl,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithEmailPassword,
        registerWithEmailPassword,
        loginDirectly,
        loginWithDemo,
        logout,
        adminLogin,
        adminLogout,
        isFirebaseConnected,
      }}
    >
      {children}
    </BoothContext.Provider>
  );
}

export function useBooth() {
  const context = useContext(BoothContext);
  return context || defaultContextValue;
}
