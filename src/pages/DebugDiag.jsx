import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, onSnapshot, collection, getDocs, limit, query } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

/**
 * /debug — LDR signaling diagnostic page.
 * Shows live: auth state, firestore read/write, snapshot latency, ICE gathering.
 */
export default function DebugPage() {
  const [log, setLog] = useState([]);
  const [authState, setAuthState] = useState('checking...');
  const [firestoreWrite, setFirestoreWrite] = useState('pending...');
  const [firestoreRead, setFirestoreRead] = useState('pending...');
  const [snapshotLive, setSnapshotLive] = useState('pending...');
  const [iceResult, setIceResult] = useState('pending...');
  const pushed = useRef(false);

  const add = (msg) => {
    if (!pushed.current) pushed.current = true;
    setLog(prev => [...prev.slice(-40), `${new Date().toLocaleTimeString()} — ${msg}`]);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthState(`logged in: ${user.uid.slice(0, 10)} (${user.isAnonymous ? 'anon' : user.email || 'known'})`);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setAuthState(`anonymous sign-in OK: ${cred.user.uid.slice(0, 10)}`);
        } catch (e) {
          setAuthState(`AUTH FAIL: ${e.code || e.message}`);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let unsub;
    (async () => {
      const roomRef = doc(db, 'ldr_rooms', 'debug_diag_room');

      // WRITE test
      try {
        const t0 = Date.now();
        await setDoc(roomRef, { debug: true, ts: Date.now() }, { merge: true });
        setFirestoreWrite(`WRITE OK (${Date.now() - t0}ms)`);
        add('firestore write OK');
      } catch (e) {
        setFirestoreWrite(`WRITE FAIL: ${e.code || e.message}`);
        add(`write FAIL: ${e.code}`);
        return;
      }

      // READ test
      try {
        const q = query(collection(db, 'ldr_rooms'), limit(1));
        await getDocs(q);
        setFirestoreRead('READ OK');
        add('firestore read OK');
      } catch (e) {
        setFirestoreRead(`READ FAIL: ${e.code || e.message}`);
        add(`read FAIL: ${e.code}`);
      }

      // SNAPSHOT (realtime) test — writes to same doc and expects echo
      unsub = onSnapshot(roomRef, (snap) => {
        setSnapshotLive(`LIVE — data: ${JSON.stringify(snap.data() || {}).slice(0, 60)}`);
        add('snapshot fired');
      }, (e) => {
        setSnapshotLive(`SNAPSHOT FAIL: ${e.code || e.message}`);
        add(`snapshot FAIL: ${e.code}`);
      });

      // ICE gathering test
      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.relay.metered.ca:80' },
            { urls: 'turn:global.relay.metered.ca:80', username: '0cbf189db1e644abd33a4068', credential: 'KZg5YAjoC4AXCbML' },
            { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: '0cbf189db1e644abd33a4068', credential: 'KZg5YAjoC4AXCbML' }
          ]
        });
        pc.createDataChannel('probe');
        const candidates = [];
        pc.onicecandidate = (ev) => {
          if (ev.candidate) {
            candidates.push(ev.candidate);
            const type = (ev.candidate.candidate.match(/typ (\w+)/) || [])[1];
            add(`ICE: ${type || 'unknown'} — ${ev.candidate.address || ''}`);
            if (type === 'relay') setIceResult('TURN RELAY candidate obtained ✅');
          }
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        setTimeout(() => {
          const hasRelay = candidates.some(c => /typ relay/.test(c.candidate));
          const hasSrflx = candidates.some(c => /typ srflx/.test(c.candidate));
          setIceResult(`done: ${candidates.length} candidates | srflx(NAT): ${hasSrflx ? 'YES' : 'NO'} | relay(TURN): ${hasRelay ? 'YES ✅' : 'NO ❌'}`);
          pc.close();
        }, 6000);
      } catch (e) {
        setIceResult(`ICE FAIL: ${e.message}`);
      }
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const box = (title, value, ok) => (
    <div style={{ padding: 12, borderRadius: 10, marginBottom: 10, background: ok === false ? '#fee2e2' : ok === true ? '#dcfce7' : '#f3f4f6' }}>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 12, wordBreak: 'break-all' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 640, margin: '0 auto', fontFamily: 'monospace' }}>
      <h2 style={{ fontSize: 18 }}>🔧 snap.e LDR Diagnostic</h2>
      {box('1. Auth', authState, !authState.includes('FAIL'))}
      {box('2. Firestore Write', firestoreWrite, firestoreWrite.includes('OK'))}
      {box('3. Firestore Read', firestoreRead, firestoreRead.includes('OK'))}
      {box('4. Realtime Snapshot', snapshotLive, !snapshotLive.includes('FAIL'))}
      {box('5. ICE / TURN', iceResult, iceResult.includes('relay(TURN): YES'))}
      <h3 style={{ fontSize: 14 }}>Log</h3>
      <div style={{ background: '#111', color: '#9f9', padding: 10, borderRadius: 8, fontSize: 11, minHeight: 120 }}>
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
