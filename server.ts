import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directory exists for disk persistence of public albums
const DATA_DIR = path.join(__dirname, 'data', 'albums');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create data dir:', err);
}

// In-memory album cache for ultra-fast lookup
const albumsCache = new Map<string, any>();

// Pre-load existing albums from disk if available
try {
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    for (const f of files) {
      if (f.endsWith('.json')) {
        const id = f.replace(/\.json$/, '');
        const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
        albumsCache.set(id, JSON.parse(content));
      }
    }
    console.log(`Loaded ${albumsCache.size} albums from persistent storage.`);
  }
} catch (err) {
  console.warn('Error reading album cache from disk:', err);
}

// SECURITY: CORS was open to all origins (`cors()`) — fine for a public SPA,
// but restrict in production via ALLOWED_ORIGIN env when behind a known domain.
const corsOptions = process.env.ALLOWED_ORIGIN
  ? { origin: process.env.ALLOWED_ORIGIN.split(',') }
  : {};
app.use(cors(corsOptions));
// SECURITY: cap request size — base64 photos for a session never need 50MB
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

// SECURITY: naive per-IP rate limit for writes (no dependency, ponytail-style)
const WRITE_LIMIT_MS = 60 * 1000;
const writeHits = new Map<string, number[]>(); // ip -> timestamps
function writeLimit(req: any, res: any, next: any) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const hits = (writeHits.get(ip) || []).filter((t) => now - t < WRITE_LIMIT_MS);
  hits.push(now);
  writeHits.set(ip, hits);
  if (writeHits.size > 5000) writeHits.clear(); // avoid unbounded growth
  if (hits.length > 10) {
    return res.status(429).json({ success: false, error: 'Terlalu banyak permintaan, coba lagi sebentar.' });
  }
  next();
}

// Helper to normalize album ID
function getCleanId(id: string): string {
  return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

// BUGFIX: expiresAt was written but never enforced — expired albums were
// still served forever. Reject anything past its expiry (with 1-day grace).
function isExpired(album: any): boolean {
  if (!album?.expiresAt) return false;
  const t = Date.parse(album.expiresAt);
  return Number.isFinite(t) && t < Date.now() - 24 * 60 * 60 * 1000;
}

// API: Save or update public album. SECURITY: requires an upload token that
// was issued when the session started — prevents anyone overwriting others' albums.
// Tokens are derived with HMAC(secret, albumId) so the server stays stateless.
import crypto from 'crypto';
const ALBUM_SECRET = process.env.ALBUM_SECRET || process.env.JWT_SECRET || 'snap-e-dev-secret-change-me';
function albumToken(id: string): string {
  return crypto.createHmac('sha256', ALBUM_SECRET).update(id).digest('hex').slice(0, 32);
}

app.post('/api/albums/:id', writeLimit, (req, res) => {
  try {
    const rawId = req.params.id;
    const cleanId = getCleanId(rawId);
    if (!cleanId || cleanId === 'latest') {
      return res.status(400).json({ success: false, error: 'Invalid album ID' });
    }

    // SECURITY: create-if-absent is allowed; OVERWRITE requires the token
    // returned when the album was first created (proof of ownership).
    const existing = albumsCache.get(cleanId);
    const token = String(req.query.token || req.headers['x-album-token'] || '');
    if (existing && token !== albumToken(cleanId)) {
      return res.status(403).json({ success: false, error: 'Token album tidak valid' });
    }

    const { photos = [], sessionId, userName, layout } = req.body;
    // SECURITY: validate photos shape and cap count/size (disk & memory DoS)
    if (!Array.isArray(photos) || photos.length > 12) {
      return res.status(400).json({ success: false, error: 'photos harus array maks 12 foto' });
    }
    for (const p of photos) {
      if (typeof p !== 'object' || p === null || typeof p.data !== 'string' ||
          !(p.data.startsWith('data:image/') || p.data.startsWith('http'))) {
        return res.status(400).json({ success: false, error: 'Format foto tidak valid' });
      }
    }
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const albumRecord = {
      id: cleanId,
      sessionId: sessionId || cleanId,
      userName: userName || 'snap.e guest',
      layout: layout || '4r_4cut',
      photosCount: Array.isArray(photos) ? photos.length : 0,
      photos: Array.isArray(photos) ? photos : [],
      updatedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SEVEN_DAYS_MS).toISOString()
    };

    // Store in memory
    albumsCache.set(cleanId, albumRecord);
    // Also alias with/without sess_ prefix for convenience
    if (cleanId.startsWith('sess_')) {
      albumsCache.set(cleanId.slice(5), albumRecord);
    } else {
      albumsCache.set(`sess_${cleanId}`, albumRecord);
    }

    // Persist to disk asynchronously
    const filePath = path.join(DATA_DIR, `${cleanId}.json`);
    fs.writeFile(filePath, JSON.stringify(albumRecord), (err) => {
      if (err) console.warn('Disk write warning for album:', cleanId, err);
    });

    return res.status(200).json({
      success: true,
      id: cleanId,
      photosCount: albumRecord.photosCount,
      updatedAt: albumRecord.updatedAt,
      uploadToken: albumToken(cleanId)
    });
  } catch (error: any) {
    console.error('Error saving album to API:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Server error' });
  }
});

// API: Get album by ID (Public access for ANYONE with link, NO LOGIN REQUIRED)
app.get('/api/albums/:id', (req, res) => {
  try {
    const rawId = req.params.id;
    const cleanId = getCleanId(rawId);
    const altId = cleanId.startsWith('sess_') ? cleanId.slice(5) : `sess_${cleanId}`;

    let album = albumsCache.get(cleanId) || albumsCache.get(altId);

    // If not in memory, try disk
    if (!album) {
      const p1 = path.join(DATA_DIR, `${cleanId}.json`);
      const p2 = path.join(DATA_DIR, `${altId}.json`);
      if (fs.existsSync(p1)) {
        album = JSON.parse(fs.readFileSync(p1, 'utf-8'));
        albumsCache.set(cleanId, album);
      } else if (fs.existsSync(p2)) {
        album = JSON.parse(fs.readFileSync(p2, 'utf-8'));
        albumsCache.set(altId, album);
      }
    }

    // SECURITY: /latest removed — it leaked the newest album of ANY user to
    // anyone who asked. PublicAlbum now resolves its own ID from localStorage.
    if (!album || isExpired(album)) {
      return res.status(404).json({ success: false, error: 'Album tidak ditemukan' });
    }

    return res.status(200).json({ success: true, album });
  } catch (error: any) {
    console.error('Error fetching album from API:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Server error' });
  }
});

// List endpoint also never expires albums — filter expired ones and cap payload size
app.get('/api/albums', (req, res) => {
  // SECURITY: listing every album ID is admin-only (same HMAC token scheme)
  if (String(req.query.token || '') !== albumToken('admin-list')) {
    return res.status(403).json({ success: false, error: 'Token tidak valid' });
  }
  try {
    const list = Array.from(albumsCache.values())
      .filter(a => !isExpired(a))
      .map(a => ({
        id: a.id,
        sessionId: a.sessionId,
        photosCount: a.photosCount,
        updatedAt: a.updatedAt,
        expiresAt: a.expiresAt
      }))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 50);

    return res.status(200).json({ success: true, albums: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Server error' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Vite middleware in development vs static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`snap.e full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
