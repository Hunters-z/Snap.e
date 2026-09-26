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

const BoothContext = createContext(null);

const DEFAULT_CONFIG = {
  title: 'snap.e',
  subtitle: 'Tangible Memories, Synchronized Distances',
  payment: {
    price: 15000,
    qrisUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126570014ID.LINKAJA.WWW01189360091100000000005204581253033605802ID5906SNAP_E6007JAKARTA5405150005802ID63041234',
  },
  customFrames: DEFAULT_FRAMES,
  customFilters: CAMERA_PRESETS
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
    return localStorage.getItem('snape_user_name') || 'Tamu';
  });
  const [mode, setMode] = useState('solo'); // 'solo' | 'ldr'
  const [layout, setLayout] = useState('strip'); // 'strip' (3 shots) | 'grid' (4 shots)
  
  // Photos captured in booth
  const [capturedPhotos, setCapturedPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem('snape_captured_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SAMPLE_PHOTOS;
  });

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

  // Synchronize Firebase Auth changes
  useEffect(() => {
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
        // If not firebase user, check if we have an active demo session
        const saved = localStorage.getItem('snape_current_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCurrentUser(parsed);
            if (parsed.isAdmin) {
              setIsAdminAuth(true);
              localStorage.setItem('snape_admin_authenticated', 'true');
            }
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
          setIsAdminAuth(false);
          localStorage.removeItem('snape_admin_authenticated');
        }
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

          setAppConfig((prev) => ({
            ...prev,
            ...remoteData,
            payment: {
              ...prev.payment,
              price: remoteData.price ?? prev.payment.price,
              qrisUrl: remoteData.qrisUrl ?? prev.payment.qrisUrl,
            },
            customFrames: mergedFrames,
            customFilters: mergedFilters,
          }));
          setIsFirebaseConnected(true);
        } else {
          // Initialize default config in Firestore
          setDoc(configDocRef, {
            price: DEFAULT_CONFIG.payment.price,
            qrisUrl: DEFAULT_CONFIG.payment.qrisUrl,
            customFrames: DEFAULT_CONFIG.customFrames,
            customFilters: DEFAULT_CONFIG.customFilters,
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
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Error saving to Firestore:', e);
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
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
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
      if (admin) {
        setIsAdminAuth(true);
        localStorage.setItem('snape_admin_authenticated', 'true');
      }
      return { success: true, user: userData, isAdmin: admin };
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const loginWithDemo = (role = 'user') => {
    const admin = role === 'admin';
    const demoUser = {
      uid: admin ? 'admin_0601randikurnia' : `user_${Date.now()}`,
      email: admin ? '0601randikurnia.s@gmail.com' : 'pengguna@snap.e',
      displayName: admin ? 'Randi Kurnia (Admin)' : 'Pengguna Photobooth',
      photoURL: null,
      isAdmin: admin,
      isDemo: true
    };
    setCurrentUser(demoUser);
    localStorage.setItem('snape_current_user', JSON.stringify(demoUser));
    setUserName(demoUser.displayName);
    if (admin) {
      setIsAdminAuth(true);
      localStorage.setItem('snape_admin_authenticated', 'true');
    }
    return { success: true, user: demoUser, isAdmin: admin };
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
        orders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        addCustomFrame,
        deleteCustomFrame,
        currentUser,
        authLoading,
        isAdminAuth: Boolean(currentUser?.isAdmin || isAdminAuth),
        isAdmin: Boolean(currentUser?.isAdmin || isAdminAuth),
        showAuthModal,
        authRedirectUrl,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
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
  if (!context) {
    throw new Error('useBooth must be used within BoothProvider');
  }
  return context;
}
