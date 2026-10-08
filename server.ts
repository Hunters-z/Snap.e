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

app.use(cors());
// Support base64 image uploads from photo sessions up to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to normalize album ID
function getCleanId(id: string): string {
  return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

// API: Save or update public album (Instant save, no timeout, accessible by anyone with the link)
app.post('/api/albums/:id', (req, res) => {
  try {
    const rawId = req.params.id;
    const cleanId = getCleanId(rawId);
    if (!cleanId) {
      return res.status(400).json({ success: false, error: 'Invalid album ID' });
    }

    const { photos = [], sessionId, userName, layout } = req.body;
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
      updatedAt: albumRecord.updatedAt
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

    if (!album) {
      // If latest requested, return newest album
      if (cleanId === 'latest' && albumsCache.size > 0) {
        const all = Array.from(albumsCache.values()).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        if (all[0]) {
          return res.status(200).json({ success: true, album: all[0] });
        }
      }
      return res.status(404).json({ success: false, error: 'Album tidak ditemukan' });
    }

    return res.status(200).json({ success: true, album });
  } catch (error: any) {
    console.error('Error fetching album from API:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Server error' });
  }
});

// API: List recent public albums
app.get('/api/albums', (_req, res) => {
  try {
    const list = Array.from(albumsCache.values())
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
