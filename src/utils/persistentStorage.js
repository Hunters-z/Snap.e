/**
 * Robust Client & Local Persistence for snap.e Photobooth
 * Uses IndexedDB to bypass the 5MB browser localStorage limit so photos,
 * motion GIFs, and live captures NEVER disappear on page reload or refresh.
 */

const DB_NAME = 'snape_booth_v2';
const DB_VERSION = 1;

export function openDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('albums')) {
          db.createObjectStore('albums', { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains('captured_photos')) {
          db.createObjectStore('captured_photos', { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'sessionId' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (err) => {
        console.warn('IndexedDB open error:', err);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('IndexedDB open blocked');
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB initialization failed:', err);
      resolve(null);
    }
  });
}

// In-memory hot cache across the session
export const memoryAlbums = new Map();
export const memoryCaptures = new Map();

/**
 * Save album photos into IndexedDB + in-memory cache + localStorage backup
 */
export async function persistAlbum(sessionId, photos) {
  if (!sessionId) return false;
  const cleanId = String(sessionId).trim();
  const altId = cleanId.startsWith('sess_') ? cleanId.slice(5) : `sess_${cleanId}`;

  if (Array.isArray(photos) && photos.length > 0) {
    memoryAlbums.set(cleanId, photos);
    memoryAlbums.set(altId, photos);
  }

  // Safe localStorage mirror
  try {
    if (Array.isArray(photos)) {
      const light = photos.slice(0, 10).map(p => ({
        id: p.id,
        sessionId: p.sessionId || cleanId,
        capturedAt: p.capturedAt,
        filterName: p.filterName,
        dateStamp: p.dateStamp,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
        dataUrl: p.dataUrl || p.url,
        thumbUrl: p.thumbUrl || p.dataUrl || p.url,
        gifUrl: p.gifUrl || null
      }));
      const str = JSON.stringify(light);
      localStorage.setItem(`snape_album_${cleanId}`, str);
      localStorage.setItem(`snape_album_${altId}`, str);
      localStorage.setItem('snape_session_album', str);
      localStorage.setItem('snape_last_active_album', cleanId);
    }
  } catch (_lsErr) {
    // If full data exceeds quota, save lightweight thumbnails
    try {
      const thumbOnly = (photos || []).slice(0, 8).map(p => ({
        id: p.id,
        sessionId: p.sessionId || cleanId,
        capturedAt: p.capturedAt,
        dataUrl: p.thumbUrl || (p.dataUrl ? p.dataUrl.slice(0, 15000) : ''),
        thumbUrl: p.thumbUrl || '',
        createdAt: p.createdAt
      }));
      localStorage.setItem(`snape_album_${cleanId}`, JSON.stringify(thumbOnly));
    } catch (_e2) {
      console.warn('localStorage backup skipped due to quota limits');
    }
  }

  // IndexedDB full resolution storage
  try {
    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('albums', 'readwrite');
        const store = tx.objectStore('albums');
        store.put({
          sessionId: cleanId,
          photos: photos || [],
          updatedAt: Date.now()
        });
        // Also put altId for fast lookup
        store.put({
          sessionId: altId,
          photos: photos || [],
          updatedAt: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => {
          console.warn('persistAlbum transaction error:', e);
          resolve(true);
        };
      } catch (err) {
        console.warn('persistAlbum store error:', err);
        resolve(true);
      }
    });
  } catch (e) {
    console.warn('persistAlbum exception:', e);
    return true;
  }
}

/**
 * Load album photos from in-memory cache, IndexedDB, or localStorage
 */
export async function getPersistedAlbum(sessionId) {
  if (!sessionId) return null;
  const cleanId = String(sessionId).trim();
  const altId = cleanId.startsWith('sess_') ? cleanId.slice(5) : `sess_${cleanId}`;

  // 1. Hot memory cache
  if (memoryAlbums.has(cleanId)) {
    const cached = memoryAlbums.get(cleanId);
    if (Array.isArray(cached) && cached.length > 0) return cached;
  }
  if (memoryAlbums.has(altId)) {
    const cached = memoryAlbums.get(altId);
    if (Array.isArray(cached) && cached.length > 0) return cached;
  }

  // 2. IndexedDB
  try {
    const db = await openDB();
    if (db) {
      const fromDb = await new Promise((resolve) => {
        try {
          const tx = db.transaction('albums', 'readonly');
          const store = tx.objectStore('albums');
          const req = store.get(cleanId);

          req.onsuccess = () => {
            if (req.result && Array.isArray(req.result.photos) && req.result.photos.length > 0) {
              resolve(req.result.photos);
            } else {
              // Try altId
              const reqAlt = store.get(altId);
              reqAlt.onsuccess = () => {
                if (reqAlt.result && Array.isArray(reqAlt.result.photos) && reqAlt.result.photos.length > 0) {
                  resolve(reqAlt.result.photos);
                } else {
                  resolve(null);
                }
              };
              reqAlt.onerror = () => resolve(null);
            }
          };

          req.onerror = () => resolve(null);
        } catch (err) {
          console.warn('getPersistedAlbum read error:', err);
          resolve(null);
        }
      });

      if (fromDb && fromDb.length > 0) {
        memoryAlbums.set(cleanId, fromDb);
        memoryAlbums.set(altId, fromDb);
        return fromDb;
      }
    }
  } catch (e) {
    console.warn('IndexedDB getPersistedAlbum error:', e);
  }

  // 3. LocalStorage fallback
  try {
    const keysToTry = [
      `snape_album_${cleanId}`,
      `snape_album_${altId}`,
      `snape_captured_${cleanId}`,
      `snape_captured_${altId}`,
      'snape_session_album',
      'snape_captured_photos'
    ];
    for (const k of keysToTry) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryAlbums.set(cleanId, parsed);
          return parsed;
        }
      }
    }
  } catch (_e) {
    // ignore localStorage reading error
  }

  return null;
}

/**
 * Save captured photostrip slots (4 or 6 photos)
 */
export async function persistCapturedPhotos(sessionId, photos) {
  if (!sessionId) return false;
  const cleanId = String(sessionId).trim();
  const altId = cleanId.startsWith('sess_') ? cleanId.slice(5) : `sess_${cleanId}`;

  if (Array.isArray(photos) && photos.length > 0) {
    memoryCaptures.set(cleanId, photos);
    memoryCaptures.set(altId, photos);
  }

  try {
    if (Array.isArray(photos)) {
      localStorage.setItem(`snape_captured_${cleanId}`, JSON.stringify(photos.slice(0, 8)));
      localStorage.setItem(`snape_captured_${altId}`, JSON.stringify(photos.slice(0, 8)));
      localStorage.setItem('snape_captured_photos', JSON.stringify(photos.slice(0, 8)));
    }
  } catch (_e) {
    // ignore localStorage quota error
  }

  try {
    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('captured_photos', 'readwrite');
        const store = tx.objectStore('captured_photos');
        store.put({
          sessionId: cleanId,
          photos: photos || [],
          updatedAt: Date.now()
        });
        store.put({
          sessionId: altId,
          photos: photos || [],
          updatedAt: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(true);
      } catch (err) {
        console.warn('persistCapturedPhotos error:', err);
        resolve(true);
      }
    });
  } catch (e) {
    console.warn('persistCapturedPhotos exception:', e);
    return true;
  }
}

/**
 * Load captured photostrip slots
 */
export async function getPersistedCapturedPhotos(sessionId) {
  if (!sessionId) return null;
  const cleanId = String(sessionId).trim();
  const altId = cleanId.startsWith('sess_') ? cleanId.slice(5) : `sess_${cleanId}`;

  if (memoryCaptures.has(cleanId)) {
    const cached = memoryCaptures.get(cleanId);
    if (Array.isArray(cached) && cached.length > 0) return cached;
  }
  if (memoryCaptures.has(altId)) {
    const cached = memoryCaptures.get(altId);
    if (Array.isArray(cached) && cached.length > 0) return cached;
  }

  try {
    const db = await openDB();
    if (db) {
      const fromDb = await new Promise((resolve) => {
        try {
          const tx = db.transaction('captured_photos', 'readonly');
          const store = tx.objectStore('captured_photos');
          const req = store.get(cleanId);

          req.onsuccess = () => {
            if (req.result && Array.isArray(req.result.photos) && req.result.photos.length > 0) {
              resolve(req.result.photos);
            } else {
              const reqAlt = store.get(altId);
              reqAlt.onsuccess = () => {
                if (reqAlt.result && Array.isArray(reqAlt.result.photos) && reqAlt.result.photos.length > 0) {
                  resolve(reqAlt.result.photos);
                } else {
                  resolve(null);
                }
              };
              reqAlt.onerror = () => resolve(null);
            }
          };

          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (fromDb && fromDb.length > 0) {
        memoryCaptures.set(cleanId, fromDb);
        return fromDb;
      }
    }
  } catch {
    // fallback
  }

  try {
    const keys = [
      `snape_captured_${cleanId}`,
      `snape_captured_${altId}`,
      'snape_captured_photos'
    ];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCaptures.set(cleanId, parsed);
          return parsed;
        }
      }
    }
  } catch (_e) {
    // ignore localStorage reading error
  }

  return null;
}

/**
 * Get all albums persisted locally across sessions
 */
export async function getAllPersistedAlbums() {
  const result = [];
  try {
    const db = await openDB();
    if (db) {
      const fromDb = await new Promise((resolve) => {
        try {
          const tx = db.transaction('albums', 'readonly');
          const store = tx.objectStore('albums');
          const req = store.getAll();

          req.onsuccess = () => {
            resolve(req.result || []);
          };

          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
      if (Array.isArray(fromDb) && fromDb.length > 0) {
        result.push(...fromDb);
      }
    }
  } catch {
    // fallback
  }

  // Also include items from memory
  for (const [sessId, photos] of memoryAlbums.entries()) {
    if (!result.some(r => r.sessionId === sessId) && Array.isArray(photos) && photos.length > 0) {
      result.push({
        sessionId: sessId,
        photos,
        updatedAt: Date.now()
      });
    }
  }

  // Also include items from localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('snape_album_')) {
        const sessId = k.replace('snape_album_', '');
        if (!result.some(r => r.sessionId === sessId)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              result.push({
                sessionId: sessId,
                photos: parsed,
                updatedAt: Date.now()
              });
            }
          }
        }
      }
    }
  } catch (_e) {
    // ignore scanning error
  }

  return result;
}
