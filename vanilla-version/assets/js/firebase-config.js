import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// PETUNJUK DEPLOYMENT:
// Ganti konfigurasi di bawah ini dengan kredensial dari project Firebase Anda
// (Buka Console Firebase -> Project Settings -> Web App)
// ==========================================
const firebaseConfig = {
    apiKey: "GANTI_DENGAN_API_KEY_ANDA",
    authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
    projectId: "GANTI_DENGAN_PROJECT_ID",
    storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
    messagingSenderId: "GANTI_DENGAN_SENDER_ID",
    appId: "GANTI_DENGAN_APP_ID"
};

let app, db;

try {
    // Mengecek apakah konfigurasi sudah diganti (mencegah error pada dummy API key)
    if (!firebaseConfig.apiKey.includes("GANTI")) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase Database terhubung!");
    } else {
        console.warn("Firebase belum dikonfigurasi. Menggunakan LocalStorage sebagai fallback database.");
    }
} catch (error) {
    console.error("Gagal menginisialisasi Firebase:", error);
}

export { db, doc, getDoc, setDoc };
