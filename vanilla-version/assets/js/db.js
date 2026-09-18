import { db, doc, getDoc, setDoc } from './firebase-config.js';

// Konfigurasi Bawaan (Default)
export const DEFAULT_CONFIG = {
    title: 'snap.e',
    subtitle: 'Momen berharga tanpa batas jarak',
    payment: { 
        price: 15000, 
        qrisUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg' 
    },
    api: { paymentKey: '', firebaseKey: '' },
    customFrames: [
        { id: 'polaroid', name: 'Polaroid', color: '#f8f8f8' },
        { id: 'valentine', name: 'Valentine', color: '#ffb6c1' }
    ],
    customFilters: [
        { id: 'halus', name: 'Halus (Smooth)', css: 'contrast(0.95) brightness(1.05) blur(0.5px)' },
        { id: 'cerah', name: 'Cerah', css: 'brightness(1.2) saturate(1.1)' }
    ]
};

// ==========================================
// ABSTRAKSI DATABASE (Firestore + LocalStorage Fallback)
// ==========================================

export async function getAppConfig() {
    try {
        if (db) {
            const docRef = doc(db, "settings", "appConfig");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                // Buat dokumen pertama kali di Firestore
                await setDoc(docRef, DEFAULT_CONFIG);
                return DEFAULT_CONFIG;
            }
        }
    } catch (e) {
        console.warn("Gagal membaca Firestore, menggunakan fallback.", e);
    }
    
    // Fallback Local Storage
    return JSON.parse(localStorage.getItem('ldr_app_config')) || DEFAULT_CONFIG;
}

export async function saveAppConfig(newConfig) {
    try {
        if (db) {
            const docRef = doc(db, "settings", "appConfig");
            await setDoc(docRef, newConfig);
        }
    } catch (e) {
        console.error("Gagal menyimpan ke Firestore", e);
    }
    
    // Selalu simpan di LocalStorage sebagai cadangan lokal
    localStorage.setItem('ldr_app_config', JSON.stringify(newConfig));
}
