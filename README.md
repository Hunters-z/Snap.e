# 📸 Snap.e — Photobooth Online untuk Pasangan LDR

**Dua kamera, satu jepretan bersamaan.** Snap.e adalah aplikasi photobooth web open-source untuk pasangan jarak jauh (LDR) dan sesi solo — ambil 4 foto secara **sinkron real-time** dari dua perangkat berbeda, susun jadi photostrip, lalu bagikan albumnya lewat satu link.

![Snap.e](public/logo.jpeg)

> ✨ Dibangun dengan React 18, Vite, Tailwind CSS, Firebase, dan WebRTC.

---

## ✨ Fitur

| Fitur | Deskripsi |
|---|---|
| 🤳 **Booth Solo** | Kamera depan/belakang, countdown sinematik, filter, frame, sticker |
| 💞 **Mode LDR Sinkron** | Dua perangkat terhubung via WebRTC — shutter berjalan **bersamaan** di dua tempat, hasil langsung jadi satu strip |
| 🎞️ **Editor Photostrip** | Layout 4-cut klasik Korea, filter vintage, frame & sticker custom |
| 🔗 **Album Publik** | Satu link album yang bisa dibuka siapa saja, berlaku 7 hari |
| 🛠️ **Dashboard Admin** | Kelola harga, frame, sticker, filter, pesanan cetak, dan pengguna |
| 📱 **PWA** | Bisa di-install ke home screen, aman untuk iPhone (safe-area) |
| 💳 **QRIS** | Alur pembayaran terpasang (integrasi gateway penuh = langkah opsional) |

## 🚀 Quick Start

**Prasyarat:** Node.js ≥ 18, akun Firebase (gratis).

```bash
# 1. Clone & install
git clone https://github.com/Hunters-z/Snap.e.git
cd Snap.e
npm install --registry=https://registry.npmjs.org

# 2. Konfigurasi environment
cp .env.example .env
# → isi nilai Firebase + email admin Anda (lihat bagian di bawah)

# 3. Jalankan
npm run dev
# → buka http://localhost:3000
```

## 🔥 Setup Firebase (wajib, ±10 menit)

1. Buat project di [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Authentication** → Sign-in method → aktifkan **Google** dan **Email/Password**.
3. **Firestore Database** → Create database → mode production.
4. **Project settings** → Your apps → **Web app** → daftarkan → copy nilai config.
5. Paste nilai tersebut ke `.env` (sesuai `.env.example`):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

6. (Disarankan) Pasang security rules dari [`firestore.rules`](firestore.rules) — via Firebase Console → Firestore → Rules, atau `firebase deploy --only firestore:rules`.

## 👑 Setup Akun Admin

Admin ditentukan lewat **email**, tidak ada password khusus:

1. Buka `.env`, isi email yang jadi admin (pisahkan dengan koma untuk lebih dari satu):

```env
VITE_ADMIN_EMAILS=email-anda@gmail.com,admin kedua@domain.com
```

2. Restart dev server (`npm run dev`).
3. Sign-in di aplikasi memakai **Google** dengan email tersebut → akses `/admin` langsung terbuka.

> 🔐 Email admin **tidak** disimpan di kode — semua lewat environment variable, jadi repo tetap aman dibagikan.

## ☁️ Deploy ke Vercel

1. Push repo ini ke GitHub Anda.
2. [vercel.com/new](https://vercel.com/new) → import repo.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
4. Tambahkan semua variabel `VITE_*` di **Settings → Environment Variables**.
5. Deploy — selesai. Tambahkan domain Firebase Anda di Auth → Settings → Authorized domains.

### Self-host server API (opsional)

Album publik bisa jalan tanpa server tambahan (via Firestore). Jika ingin memakai API album bawaan ([`server.ts`](server.ts) — Express, album tersimpan di disk):

```bash
npm start                # PORT=3000 default
ALBUM_SECRET=kunci-panjang-acu npm start
```

`ALBUM_SECRET` dipakai menandatangani token upload album — set string acak yang panjang.

## 📁 Struktur Proyek

```
├── src/
│   ├── pages/           # BoothHome, LiveCapture, EditorPhotostrip, PublicAlbum, Admin
│   ├── components/      # Topbar, modals, ErrorBoundary
│   ├── context/         # BoothContext (state global sesi)
│   ├── data/            # preset kamera, frame default
│   └── utils/           # storage persisten (IndexedDB), helper foto
├── server.ts            # API album (Express) — opsional
├── firestore.rules      # security rules Firebase
└── vite.config.js
```

## 🗺️ Roadmap

- [ ] Integrasi payment gateway asli (Midtrans/Xendit) untuk QRIS dinamis
- [ ] GIF booth (frame burst → animasi)
- [ ] Cetak fisik + ongkir
- [ ] Multi-bahasa

## 🤝 Kontribusi

PR terbuka! Untuk perubahan besar, buka issue dulu agar kita bisa mendiskusikannya.

## 📄 Lisensi

[MIT](LICENSE)
