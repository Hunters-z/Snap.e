# Fase 2: Redesign "Polaroid Malam" + PWA Meta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti identitas visual Snap.e dari template-generic menjadi "polaroid malam" (ivory hangat, ink, rose film, serif display) + tambahkan PWA/OG meta.

**Architecture:** Token system di tailwind.config.theme.extend, utility di index.css, lalu perubahan per-halaman (hero, countdown/flash, empty state, CTA). Tidak ada perubahan logika bisnis.

**Tech Stack:** Tailwind CSS 3, React 18, Vite.

**Spec:** Hasil audit PIXEL (deleg_cb2991c4 task-2) — 8 temuan prioritas.

## Global Constraints
- Semua token baru WAJIB didaftarkan di tailwind.config.js (kelas di luar theme dibuang saat build).
- CTA utama satu warna: rose token; ink hanya sekunder; hijau hanya status sukses.
- Budget animasi non-user-triggered HANYA countdown + flash.
- Touch target minimal 44x44px (w-11 h-11) untuk tombol interaktif utama.
- Hormati prefers-reduced-motion pada animasi baru.

## Review Focus
- Font Google DM Serif Display harus di-preconnect — FOIT di mobile lambat.
- Class token baru dipakai sebelum didefinisikan = silent build loss — cek build output size berubah.
- Countdown keyframe harus re-trigger per digit (key={n}).
- OG image 1200x630 PNG harus ada di public/ — kalau tidak, preview share rusak.

---

### Task 1: Token system + font + PWA meta
**Files:** Modify `tailwind.config.js`, `src/index.css`, `index.html`, Create `public/manifest.webmanifest`, `public/og-image.png` (generate dari logo).

- [ ] tailwind.config: colors {ivory:#FAF6F0, ink:#2B2118, rose-film:#E4405F, film-gold:#C9A227}, fontFamily display DM Serif Display.
- [ ] index.css: keyframes digit-pop (scale 1.4→1 + opacity), flash-vignette (putih→dim), utility .font-display.
- [ ] index.html: font link DM Serif Display, theme-color #FAF6F0, manifest link, og:image/twitter:card, viewport-fit (sudah ada).
- [ ] manifest.webmanifest: name Snap.e, icons logo.jpeg, display standalone, theme/ivory.
- [ ] Verify: `npm run build` OK; grep dist CSS untuk token hex.
- [ ] Commit "feat(design): polaroid-malam tokens + PWA/OG meta".

### Task 2: Hero & CTA BoothHome
**Files:** Modify `src/pages/BoothHome.jsx` (hero ~176-191, CTA 409-425), `src/components/Topbar.jsx` (logo dot statis).

- [ ] Hero: hapus gradient text 3 warna + eyebrow ALL-CAPS; headline font-display ink; subteks LDR copy "Dua kamera, satu jepretan bersamaan."; tambah photostrip dekoratif miring (border putih, rotate -3deg, stamp snap.e).
- [ ] CTA: satu warna rose-film; label jujur "Bayar & Mulai Booth — Rp XX" bila harga ada; hitam jadi sekunder.
- [ ] Hapus animate-spin Sparkles, titik logo statis.
- [ ] Verify: build OK, `grep -c 'bg-clip-text' BoothHome.jsx` = 0.
- [ ] Commit "feat(design): BoothHome hero + CTA polaroid-malam".

### Task 3: Countdown & flash sinematik LiveCapture
**Files:** Modify `src/pages/LiveCapture.jsx` (countdown overlay ~1400-1406, flash ~1388-1393).

- [ ] Countdown: per-digit keyframes digit-pop, key={countdown}, digit rose→amber di ≤1s, ring conic-gradient per detik; media (prefers-reduced-motion) tanpa animasi.
- [ ] Flash: putih 0→100→0 + dim #000/30 120ms + shake viewport 80ms.
- [ ] Verify: build OK; manual grep keyframes terpakai.
- [ ] Commit "feat(design): cinematic countdown + flash".

### Task 4: Empty state + footer restraint
**Files:** Modify `src/pages/EditorPhotostrip.jsx` (empty ~1671-1685), `src/pages/PublicAlbum.jsx` (expired copy), `src/pages/BoothHome.jsx` (footer).

- [ ] Empty state editor: strip kosong ilusi (3-4 kotak putih 2:3 + stamp), copy "Strip masih kosong — jepret 4 pose pertama kalian" + tombol "Buka Kamera".
- [ ] PublicAlbum: pisah copy "diproses" vs "kedaluwarsa" (+tanggal, CTA "Mulai Sesi Baru").
- [ ] Footer: 2 baris ringkas di mobile.
- [ ] Verify: build OK. Commit "feat(design): empty states + footer cleanup".

### Task 5: Final verify + push
- [ ] `npx eslint src` 0 error baru.
- [ ] `npm run build` OK.
- [ ] Commit tersisa dipush; curl live bundle hash berubah & HTTP 200.
