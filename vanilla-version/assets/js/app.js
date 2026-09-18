import { getAppConfig } from './db.js';

let appConfig;

const CONFIG = {
    layouts: { strip: { shots: 3 }, grid: { shots: 4 } },
    frames: {
        minimal: { bg: '#FFFFFF', text: '#111827', border: false },
        noir: { bg: '#111827', text: '#FFFFFF', border: false },
        film: { bg: '#E8E6E1', text: '#374151', border: true, borderColor: '#D1D5DB' }
    },
    filters: [
        { id: 'none', name: 'Normal', css: 'none' },
        { id: 'bw', name: 'B&W', css: 'grayscale(100%)' },
        { id: 'sepia', name: 'Sepia', css: 'sepia(100%)' },
        { id: 'retro', name: 'Retro', css: 'sepia(50%) hue-rotate(-30deg) saturate(140%) contrast(110%)' },
        { id: 'invert', name: 'Invert', css: 'invert(100%)' }
    ]
};

const state = {
    username: localStorage.getItem('ldr_display_name') || '',
    isLoginMode: true,
    mode: null, layout: 'strip', frame: 'minimal',
    peer: null, localStream: null, remoteStream: null,
    photos: [], // { dataUrl, zoom, offsetX, offsetY, filterCss, stickers: [] }
    liveFilterCss: 'none',
    isJoiner: false, joinId: null,
    editingIdx: -1
};

const DOM = {
    secLogin: document.getElementById('section-login'), secSetup: document.getElementById('section-setup'),
    secPayment: document.getElementById('section-payment'), secLdr: document.getElementById('section-ldr-connect'),
    secBooth: document.getElementById('section-booth'), secEditing: document.getElementById('section-editing'),
    secResult: document.getElementById('section-result'),
    btnProceed: document.getElementById('btn-proceed'),
    localVideo: document.getElementById('local-video'), remoteVideo: document.getElementById('remote-video')
};

// ==========================================
// INISIALISASI UI
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    appConfig = await getAppConfig();
    buildDynamicUI();

    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('join')) {
        state.isJoiner = true; state.joinId = urlParams.get('join'); state.mode = 'ldr';
        document.getElementById('header-subtitle').innerText = "Bergabung dengan sesi booth...";
    }
    
    if(localStorage.getItem('ldr_mock_session')) proceedAfterLogin();
    else showSection(DOM.secLogin);
});

function buildDynamicUI() {
    document.getElementById('header-title').innerText = appConfig.title;
    document.getElementById('header-subtitle').innerText = appConfig.subtitle;
    document.getElementById('payment-price-text').innerText = `Rp ${appConfig.payment.price.toLocaleString('id-ID')}`;
    if(appConfig.payment.qrisUrl) document.getElementById('payment-qris-img').src = appConfig.payment.qrisUrl;

    const frameContainer = document.getElementById('frame-selector-container');
    if (frameContainer) {
        frameContainer.innerHTML = '';
        const addFrameBtn = (id, name, bg, isBuiltIn) => {
            if(!isBuiltIn) CONFIG.frames[id] = { bg: bg, text: '#111827', border: false };
            const div = document.createElement('div');
            div.innerHTML = `<button onclick="window.selectFrame('${id}')" id="frame-${id}" class="option-card p-3 rounded-lg flex flex-col items-center gap-2 w-full"><div class="w-6 h-6 border border-gray-300 rounded-sm" style="background-color: ${bg}"></div><span class="text-[10px] font-medium text-gray-600 truncate w-full text-center">${name}</span></button>`;
            frameContainer.appendChild(div.firstElementChild);
        };

        addFrameBtn('minimal', 'Minimal', '#FFFFFF', true);
        addFrameBtn('noir', 'Noir', '#111827', true);
        addFrameBtn('film', 'Retro', '#E8E6E1', true);
        appConfig.customFrames.forEach(f => addFrameBtn(f.id, f.name, f.color, false));
    }

    const filterContainer = document.getElementById('camera-filter-container');
    if (filterContainer) {
        filterContainer.innerHTML = '';
        const allFilters = [...CONFIG.filters, ...(appConfig.customFilters || [])];
        
        allFilters.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `px-4 py-1.5 text-xs border rounded-full whitespace-nowrap transition-colors live-filter-btn ${f.id === 'none' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`;
            btn.dataset.css = f.css;
            btn.innerText = f.name;
            btn.onclick = () => window.setLiveFilter(btn, f.css);
            filterContainer.appendChild(btn);
        });
    }
}

window.showToast = (msg, isErr = false) => {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.className = `fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-md shadow-lg text-sm font-medium z-50 transition-all duration-300 ${isErr ? 'bg-red-600' : 'bg-gray-900'} text-white`;
    t.style.opacity = '1';
    setTimeout(() => t.style.opacity = '0', 3000);
};

// ==========================================
// AUTENTIKASI
// ==========================================
window.toggleAuthMode = () => {
    state.isLoginMode = !state.isLoginMode;
    document.getElementById('auth-title').innerText = state.isLoginMode ? 'Masuk' : 'Daftar Akun';
    document.getElementById('btn-submit-auth').innerText = state.isLoginMode ? 'Lanjutkan' : 'Daftar';
    document.getElementById('name-field-container').classList.toggle('hidden');
};

window.handleAuth = (e) => {
    e.preventDefault();
    const name = document.getElementById('auth-name').value || 'User';
    localStorage.setItem('ldr_display_name', name);
    localStorage.setItem('ldr_mock_session', 'true');
    state.username = name; proceedAfterLogin();
};

window.loginWithGoogle = () => {
    state.username = "Google User";
    localStorage.setItem('ldr_display_name', "Google User");
    localStorage.setItem('ldr_mock_session', 'true');
    proceedAfterLogin();
};

window.logout = () => { localStorage.removeItem('ldr_mock_session'); window.location.reload(); };

function proceedAfterLogin() {
    document.getElementById('user-greeting').innerText = `Hai, ${state.username}`;
    if (state.isJoiner) startLdrJoinerProcess(); else showSection(DOM.secSetup);
}

function showSection(activeSection) {
    Object.values(DOM).forEach(el => el?.classList.add('hide-section'));
    activeSection.classList.remove('hide-section'); window.scrollTo(0, 0);
}

// ==========================================
// FLOW ALUR APLIKASI
// ==========================================
window.selectMode = (mode) => {
    state.mode = mode;
    document.querySelectorAll('#mode-solo, #mode-ldr').forEach(el => el.classList.remove('selected'));
    document.getElementById(`mode-${mode}`).classList.add('selected');
    DOM.btnProceed.disabled = false;
    DOM.btnProceed.className = 'w-full py-3.5 bg-gray-900 text-white rounded-md font-medium transition-colors hover:bg-black';
    DOM.btnProceed.innerText = 'Lanjut ke Pembayaran';
};

window.selectLayout = (layout) => {
    state.layout = layout;
    document.querySelectorAll('#layout-strip, #layout-grid').forEach(el => el.classList.remove('selected'));
    document.getElementById(`layout-${layout}`).classList.add('selected');
};

window.proceedToPayment = () => showSection(DOM.secPayment);
window.paymentSuccess = async () => {
    window.showToast("Pembayaran Berhasil!");
    if (state.mode === 'solo') { await setupCamera(); startBoothUI(); }
    else if (state.mode === 'ldr') { await setupCamera(); startLdrHostProcess(); }
};
window.backToSetup = (stopCam = false) => {
    if(stopCam) stopAllStreams();
    if(state.peer) { state.peer.destroy(); state.peer = null; }
    state.isJoiner = false; showSection(DOM.secSetup);
};
window.openAdminPage = () => { window.location.href = 'admin.html'; };

// ==========================================
// KAMERA & LDR (PEERJS)
// ==========================================
async function startLdrHostProcess() {
    showSection(DOM.secLdr); state.peer = new Peer();
    state.peer.on('open', (id) => {
        const joinUrl = new URL(window.location.href); joinUrl.searchParams.set('join', id);
        document.getElementById('my-peer-id').innerText = joinUrl.toString();
        document.getElementById('qrcode').innerHTML = '';
        new QRCode(document.getElementById('qrcode'), { text: joinUrl.toString(), width: 150, height: 150 });
    });
    state.peer.on('call', (call) => {
        call.answer(state.localStream);
        document.getElementById('connection-status').innerText = "Terhubung! Menyiapkan kamera...";
        call.on('stream', (r) => { state.remoteStream = r; DOM.remoteVideo.srcObject = r; setTimeout(startBoothUI, 1000); });
    });
}

async function startLdrJoinerProcess() {
    DOM.secLogin.innerHTML = `<div class="p-10 text-center"><p>Menghubungkan ke host...</p></div>`;
    showSection(DOM.secLogin); await setupCamera();
    state.peer = new Peer();
    state.peer.on('open', () => {
        const call = state.peer.call(state.joinId, state.localStream);
        call.on('stream', (r) => { state.remoteStream = r; DOM.remoteVideo.srcObject = r; setTimeout(startBoothUI, 1000); });
    });
}

window.copyJoinLink = () => { navigator.clipboard.writeText(document.getElementById('my-peer-id').innerText); window.showToast("Link disalin!"); };

async function setupCamera() {
    try {
        state.localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 1280, height: 720 }, audio: false });
        DOM.localVideo.srcObject = state.localStream;
    } catch (err) { window.showToast("Kamera ditolak/tidak ditemukan.", true); }
}

function stopAllStreams() {
    if(state.localStream) state.localStream.getTracks().forEach(t => t.stop());
    if(state.remoteStream) state.remoteStream.getTracks().forEach(t => t.stop());
}

// ==========================================
// PEMOTRETAN (BOOTH UI)
// ==========================================
window.setLiveFilter = (btnEl, css) => {
    state.liveFilterCss = css;
    document.getElementById('video-wrapper').style.filter = css;
    document.querySelectorAll('.live-filter-btn').forEach(b => { b.classList.remove('bg-gray-900', 'text-white'); b.classList.add('bg-white', 'text-gray-700'); });
    btnEl.classList.add('bg-gray-900', 'text-white'); btnEl.classList.remove('bg-white', 'text-gray-700');
};

function startBoothUI() {
    showSection(DOM.secBooth);
    document.getElementById('booth-mode-text').innerText = state.mode === 'ldr' ? 'Dual Mode' : 'Solo Mode';
    document.getElementById('video-wrapper').className = state.mode === 'ldr' ? 'split-screen' : 'solo-screen';
    DOM.remoteVideo.classList.toggle('hidden', state.mode !== 'ldr');
    document.getElementById('capture-btn').style.display = 'flex';
}

window.startPhotoSession = async () => {
    document.getElementById('capture-btn').style.display = 'none';
    state.photos = [];
    const shots = CONFIG.layouts[state.layout].shots;
    for(let i = 0; i < shots; i++) {
        document.getElementById('shots-counter-text').innerText = `Jepretan ${i+1} dari ${shots}`;
        await runCountdown();
        captureSingleFrame(i);
        await new Promise(res => setTimeout(res, 800));
    }
    startEditingUI();
};

async function runCountdown() {
    const el = document.getElementById('countdown-text'); el.style.display = 'block';
    for(let i=3; i>0; i--) { el.innerText = i; await new Promise(res => setTimeout(res, 1000)); }
    el.style.display = 'none';
    const flash = document.getElementById('flash-overlay'); flash.classList.add('flash-active');
    setTimeout(() => flash.classList.remove('flash-active'), 150);
}

function captureSingleFrame(idx) {
    const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (state.mode === 'solo') {
        drawImageProp(ctx, DOM.localVideo, 0, 0, 800, 600);
    } else {
        drawImageProp(ctx, DOM.localVideo, 0, 0, 400, 600);
        if(DOM.remoteVideo.videoWidth > 0) drawImageProp(ctx, DOM.remoteVideo, 400, 0, 400, 600);
    }
    state.photos.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.95), zoom: 1.0, offsetX: 0, offsetY: 0, filterCss: state.liveFilterCss, stickers: [] });
}

function drawImageProp(ctx, img, x, y, w, h) {
    let scale = Math.max(w / img.videoWidth, h / img.videoHeight);
    let drawW = img.videoWidth * scale, drawH = img.videoHeight * scale;
    let offsetX = (w - drawW) / 2, offsetY = (h - drawH) / 2;
    if(img === DOM.localVideo) {
        ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH, 0, 0, w, h);
        ctx.restore();
    } else {
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH, x, y, w, h);
    }
}

// ==========================================
// EDITING & STIKER
// ==========================================
function startEditingUI() {
    showSection(DOM.secEditing);
    const gal = document.getElementById('editing-gallery');
    gal.innerHTML = '';
    state.photos.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'flex flex-col gap-2 items-center';
        div.innerHTML = `
            <div class="edit-canvas-wrapper w-full aspect-[4/3] relative" id="edit-wrap-${idx}">
                <img src="${p.dataUrl}" id="edit-img-${idx}" class="w-full h-full object-cover" style="filter: ${p.filterCss}; transform: scale(${p.zoom}) translate(${p.offsetX}px, ${p.offsetY}px);">
            </div>
            <button onclick="window.openEditControls(${idx})" class="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 font-medium">Hias Foto ${idx+1}</button>
        `;
        gal.appendChild(div);
        
        const wrap = div.querySelector(`#edit-wrap-${idx}`);
        const img = div.querySelector(`#edit-img-${idx}`);
        let isDrag = false, sx = 0, sy = 0;
        
        const startPan = (cX, cY) => { isDrag = true; sx = cX - p.offsetX; sy = cY - p.offsetY; };
        const movePan = (cX, cY) => { if(!isDrag) return; p.offsetX = cX - sx; p.offsetY = cY - sy; img.style.transform = `scale(${p.zoom}) translate(${p.offsetX}px, ${p.offsetY}px)`; };
        
        wrap.addEventListener('mousedown', (e) => { if(e.target === img || e.target === wrap) startPan(e.clientX, e.clientY); });
        window.addEventListener('mouseup', () => { isDrag = false; });
        window.addEventListener('mousemove', (e) => { if(e.target === img || e.target === wrap) movePan(e.clientX, e.clientY); });
        
        wrap.addEventListener('touchstart', (e) => { if(e.target === img || e.target === wrap) startPan(e.touches[0].clientX, e.touches[0].clientY); });
        window.addEventListener('touchend', () => { isDrag = false; });
        window.addEventListener('touchmove', (e) => { if(e.target === img || e.target === wrap) movePan(e.touches[0].clientX, e.touches[0].clientY); });
    });
    window.closeEditControls();
}

window.openEditControls = (idx) => {
    state.editingIdx = idx;
    document.getElementById('edit-photo-idx').innerText = idx + 1;
    document.getElementById('edit-zoom').value = state.photos[idx].zoom;
    document.getElementById('edit-controls').classList.remove('hidden');
};

window.updateEditPreview = () => {
    if(state.editingIdx < 0) return;
    const p = state.photos[state.editingIdx];
    p.zoom = document.getElementById('edit-zoom').value;
    document.getElementById(`edit-img-${state.editingIdx}`).style.transform = `scale(${p.zoom}) translate(${p.offsetX}px, ${p.offsetY}px)`;
};

window.addSticker = (emoji) => {
    if(state.editingIdx < 0) return window.showToast("Pilih foto terlebih dahulu (klik 'Hias Foto')");
    const p = state.photos[state.editingIdx];
    const wrap = document.getElementById(`edit-wrap-${state.editingIdx}`);
    
    const sticker = { text: emoji, x: 50, y: 50 }; 
    p.stickers.push(sticker);
    
    const el = document.createElement('div');
    el.className = 'sticker-el'; el.innerText = emoji; el.style.left = '50%'; el.style.top = '50%';
    wrap.appendChild(el);

    let isDragStk = false, sX = 0, sY = 0;
    const down = (cx, cy) => { isDragStk = true; sX = cx - el.offsetLeft; sY = cy - el.offsetTop; };
    const move = (cx, cy) => {
        if(!isDragStk) return;
        const rect = wrap.getBoundingClientRect();
        let nx = cx - sX, ny = cy - sY;
        el.style.left = nx + 'px'; el.style.top = ny + 'px';
        sticker.x = (nx / rect.width) * 100; sticker.y = (ny / rect.height) * 100;
    };
    
    el.addEventListener('mousedown', (e) => { e.stopPropagation(); down(e.clientX, e.clientY); });
    window.addEventListener('mouseup', () => isDragStk = false);
    window.addEventListener('mousemove', (e) => { if(isDragStk) move(e.clientX, e.clientY); });
    
    el.addEventListener('touchstart', (e) => { e.stopPropagation(); down(e.touches[0].clientX, e.touches[0].clientY); });
    window.addEventListener('touchend', () => isDragStk = false);
    window.addEventListener('touchmove', (e) => { if(isDragStk) move(e.touches[0].clientX, e.touches[0].clientY); });
};

window.closeEditControls = () => { state.editingIdx = -1; document.getElementById('edit-controls').classList.add('hidden'); };
window.finishEditing = () => renderFinalLayout();

// ==========================================
// RENDER HASIL & EXPORT
// ==========================================
window.selectFrame = (frameId) => {
    state.frame = frameId;
    document.querySelectorAll('[id^="frame-"]').forEach(el => el.classList.remove('selected'));
    document.getElementById(`frame-${frameId}`).classList.add('selected');
    if (!DOM.secResult.classList.contains('hide-section') && state.photos.length > 0) renderFinalLayout();
};

function renderFinalLayout() {
    showSection(DOM.secResult);
    const canvas = document.getElementById('strip-canvas');
    const ctx = canvas.getContext('2d');
    const theme = CONFIG.frames[state.frame] || { bg: '#fff', text: '#000' };
    
    let cWidth, cHeight;
    const PADDING = 30, SPACING = 20, FOOTER_H = 140;
    let photoDrawArr = [];

    if (state.layout === 'strip') {
        cWidth = 600; const photoW = cWidth - (PADDING * 2); const photoH = photoW * 0.75;
        cHeight = PADDING + (photoH * 3) + (SPACING * 2) + FOOTER_H;
        for(let i=0; i<3; i++) photoDrawArr.push({ x: PADDING, y: PADDING + (i * (photoH + SPACING)), w: photoW, h: photoH, p: state.photos[i] });
    } else {
        cWidth = 800; const innerW = cWidth - (PADDING * 2); const photoW = (innerW - SPACING) / 2; const photoH = photoW * 0.75;
        cHeight = PADDING + (photoH * 2) + SPACING + FOOTER_H;
        const pos = [{x: PADDING, y: PADDING}, {x: PADDING + photoW + SPACING, y: PADDING},
                     {x: PADDING, y: PADDING + photoH + SPACING}, {x: PADDING + photoW + SPACING, y: PADDING + photoH + SPACING}];
        for(let i=0; i<4; i++) photoDrawArr.push({ x: pos[i].x, y: pos[i].y, w: photoW, h: photoH, p: state.photos[i] });
    }

    canvas.width = cWidth; canvas.height = cHeight;
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (theme.border) { ctx.strokeStyle = theme.borderColor; ctx.lineWidth = 1; ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20); }

    let loadedCount = 0;
    photoDrawArr.forEach((data) => {
        const img = new Image();
        img.onload = () => {
            const tempC = document.createElement('canvas'); tempC.width = data.w; tempC.height = data.h;
            const tCtx = tempC.getContext('2d');
            
            if(tCtx.filter !== undefined) tCtx.filter = data.p.filterCss;
            tCtx.translate(data.w/2, data.h/2); tCtx.scale(data.p.zoom, data.p.zoom);
            tCtx.translate(-data.w/2 + data.p.offsetX, -data.h/2 + data.p.offsetY);
            tCtx.drawImage(img, 0, 0, data.w, data.h);
            
            tCtx.setTransform(1, 0, 0, 1, 0, 0); tCtx.filter = 'none';
            if(data.p.stickers) {
                tCtx.textAlign = "center"; tCtx.textBaseline = "middle";
                const fontSize = data.w * 0.15; tCtx.font = `${fontSize}px Arial`;
                data.p.stickers.forEach(stk => tCtx.fillText(stk.text, (stk.x / 100) * data.w, (stk.y / 100) * data.h));
            }

            ctx.drawImage(tempC, data.x, data.y);
            loadedCount++;
            if(loadedCount === photoDrawArr.length) drawFooter(ctx, canvas, theme);
        };
        img.src = data.p.dataUrl;
    });
    document.getElementById(`frame-${state.frame}`)?.classList.add('selected');
}

function drawFooter(ctx, canvas, theme) {
    ctx.fillStyle = theme.text;
    ctx.font = "italic 600 48px 'Playfair Display', serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const titleY = canvas.height - 85;
    let footerTitle = appConfig.title.replace('.', '');
    ctx.fillText(footerTitle + (state.username ? ` by ${state.username}` : ''), canvas.width / 2, titleY);
    ctx.font = "400 16px 'Inter', sans-serif";
    ctx.fillText(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase(), canvas.width / 2, titleY + 40);

    document.getElementById('final-strip-img').src = canvas.toDataURL('image/jpeg', 1.0);
}

window.downloadPhoto = () => {
    const link = document.createElement('a'); link.download = `snapp_e_${new Date().getTime()}.jpg`;
    link.href = document.getElementById('final-strip-img').src; link.click();
};

window.sharePhoto = async () => {
    try {
        const res = await fetch(document.getElementById('final-strip-img').src);
        const blob = await res.blob();
        const file = new File([blob], `snap_e_${new Date().getTime()}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: appConfig.title, text: 'Hasil foto snap.e!', files: [file] });
        } else window.showToast("Gunakan tombol Unduh (Share tidak didukung browser ini).", true);
    } catch (e) { window.showToast("Gagal membagikan foto.", true); }
};

window.retakePhoto = () => showSection(DOM.secSetup);
window.requestCetak = () => window.showToast("Request cetak gambar berhasil diajukan! Kami akan menghubungi Anda.");
window.requestAksesoris = () => window.showToast("Request aksesoris diterima!");
