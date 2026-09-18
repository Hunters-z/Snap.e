import { getAppConfig, saveAppConfig } from './db.js';

let appConfig;

window.addEventListener('DOMContentLoaded', async () => {
    appConfig = await getAppConfig();
    populateAdminForm();
});

function populateAdminForm() {
    document.getElementById('admin-title').value = appConfig.title;
    document.getElementById('admin-subtitle').value = appConfig.subtitle;
    document.getElementById('admin-price').value = appConfig.payment?.price || 15000;
    document.getElementById('admin-qris').value = appConfig.payment?.qrisUrl || '';
    document.getElementById('admin-api-payment').value = appConfig.api?.paymentKey || '';
    document.getElementById('admin-api-firebase').value = appConfig.api?.firebaseKey || '';
}

window.switchAdminTab = (tabId) => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`admin-tab-${tabId}`).classList.add('active');
};

window.saveAdmin = async () => {
    const btn = document.getElementById('btn-save-admin');
    btn.innerText = "Menyimpan...";
    btn.disabled = true;

    appConfig.title = document.getElementById('admin-title').value || 'snap.e';
    appConfig.subtitle = document.getElementById('admin-subtitle').value || '';
    
    if(!appConfig.payment) appConfig.payment = {};
    appConfig.payment.price = parseInt(document.getElementById('admin-price').value) || 15000;
    appConfig.payment.qrisUrl = document.getElementById('admin-qris').value;
    
    if(!appConfig.api) appConfig.api = {};
    appConfig.api.paymentKey = document.getElementById('admin-api-payment').value;
    appConfig.api.firebaseKey = document.getElementById('admin-api-firebase').value;
    
    const frameName = document.getElementById('admin-frame-name').value;
    if(frameName) {
        if(!appConfig.customFrames) appConfig.customFrames = [];
        appConfig.customFrames.push({ 
            id: 'c_'+Date.now(), 
            name: frameName, 
            color: document.getElementById('admin-frame-color').value 
        });
        document.getElementById('admin-frame-name').value = '';
    }
    
    const filterName = document.getElementById('admin-filter-name').value;
    const filterCss = document.getElementById('admin-filter-css').value;
    if(filterName && filterCss) {
        if(!appConfig.customFilters) appConfig.customFilters = [];
        appConfig.customFilters.push({ 
            id: 'f_'+Date.now(), 
            name: filterName, 
            css: filterCss 
        });
        document.getElementById('admin-filter-name').value = '';
        document.getElementById('admin-filter-css').value = '';
    }

    await saveAppConfig(appConfig);
    
    btn.innerText = "Simpan Pengaturan";
    btn.disabled = false;
    alert("Pengaturan Admin Berhasil Disimpan ke Database!");
};

window.logoutAdmin = () => {
    window.location.href = 'index.html';
};
