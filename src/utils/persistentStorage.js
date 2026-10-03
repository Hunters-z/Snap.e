/**
 * Robust Client & Cloud Persistence for snap.e Photobooth
 * Uses IndexedDB to bypass the 5MB browser localStorage limit so photos,
 * motion GIFs, and live captures NEVER disappear on page reload or refresh.
 */

const DB_NAME = 'snape_booth_v2';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
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
      } catch (err) {
        console.warn('IndexedDB initialization failed:', err);
        resolve(null);
      }
    });
  }

  return dbPromise;
}

/**
 * Save album photos into IndexedDB (persists across page reloads & browser restarts)
 */
export async function persistAlbum(sessionId, photos) {
  if (!sessionId) return false;
  try {
    const db = await openDB();
    if (!db) {
      // Fallback: try saving stripped metadata to localStorage
      try {
        const light = (photos || []).slice(0, 15).map(p => ({
          id: p.id,
          sessionId: p.sessionId,
          capturedAt: p.capturedAt,
          filterName: p.filterName,
          dateStamp: p.dateStamp,
          createdAt: p.createdAt,
          expiresAt: p.expiresAt,
          dataUrl: p.dataUrl ? p.dataUrl.slice(0, 1000) : null // light preview only
        }));
        localStorage.setItem(`snape_album_meta_${sessionId}`, JSON.stringify(light));
      } catch {
        // ignore
      }
      return false;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('albums', 'readwrite');
        const store = tx.objectStore('albums');
        store.put({
          sessionId,
          photos: photos || [],
          updatedAt: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => {
          console.warn('persistAlbum transaction error:', e);
          resolve(false);
        };
      } catch (err) {
        console.warn('persistAlbum error:', err);
        resolve(false);
      }
    });
  } catch (e) {
    console.warn('persistAlbum exception:', e);
    return false;
  }
}

/**
 * Load album photos from IndexedDB
 */
export async function getPersistedAlbum(sessionId) {
  if (!sessionId) return null;
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('albums', 'readonly');
        const store = tx.objectStore('albums');
        const req = store.get(sessionId);

        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result.photos)) {
            resolve(req.result.photos);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      } catch (err) {
        console.warn('getPersistedAlbum error:', err);
        resolve(null);
      }
    });
  } catch (e) {
    console.warn('getPersistedAlbum exception:', e);
    return null;
  }
}

/**
 * Save captured photostrip slots (4 or 6 photos)
 */
export async function persistCapturedPhotos(sessionId, photos) {
  if (!sessionId) return false;
  try {
    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('captured_photos', 'readwrite');
        const store = tx.objectStore('captured_photos');
        store.put({
          sessionId,
          photos: photos || [],
          updatedAt: Date.now()
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (err) {
        console.warn('persistCapturedPhotos error:', err);
        resolve(false);
      }
    });
  } catch (e) {
    console.warn('persistCapturedPhotos exception:', e);
    return false;
  }
}

/**
 * Load captured photostrip slots
 */
export async function getPersistedCapturedPhotos(sessionId) {
  if (!sessionId) return null;
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('captured_photos', 'readonly');
        const store = tx.objectStore('captured_photos');
        const req = store.get(sessionId);

        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result.photos)) {
            resolve(req.result.photos);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Get all albums persisted locally across sessions
 */
export async function getAllPersistedAlbums() {
  try {
    const db = await openDB();
    if (!db) return [];

    return new Promise((resolve) => {
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
  } catch {
    return [];
  }
}
