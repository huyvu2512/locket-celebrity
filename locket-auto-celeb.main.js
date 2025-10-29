// =============================================================
//  Auto Locket Celeb (Core Logic)
//  Version: 1.1
// =============================================================

// ================= CONFIG =================
const CONFIG = {
    STORAGE_KEY: 'autoCelebState',
    RESUME_KEY: 'autoCelebResume',
    VERSION: '1.1',
    VERSION_URL: 'https://raw.githubusercontent.com/yourname/auto-locket-celeb/main/version.json',
};

// ================== UTILITIES ==================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg, type = 'info') => {
    console.log(`[AutoCeleb][${type}] ${msg}`);
    const box = document.getElementById('autoCelebLog');
    if (box) box.innerHTML += `<div>${msg}</div>`;
};

// ================== SMART RESUME ==================
function saveProgress(celebIds, totalCount, currentIndex) {
    const progress = {
        celebIds,
        totalCount,
        currentIndex,
        timestamp: Date.now(),
        isRunning: true
    };
    localStorage.setItem(CONFIG.RESUME_KEY, JSON.stringify(progress));
}
function clearProgress() { localStorage.removeItem(CONFIG.RESUME_KEY); }
function loadProgress() {
    try { return JSON.parse(localStorage.getItem(CONFIG.RESUME_KEY)); }
    catch { return null; }
}

async function checkAndResume() {
    const saved = loadProgress();
    if (saved && saved.celebIds?.length > 0 && saved.isRunning) {
        const remaining = saved.celebIds.slice(saved.currentIndex);
        log(`🧠 Phát hiện tiến trình cũ (${remaining.length}/${saved.totalCount}) celeb.`);
        const popup = confirm(`Khôi phục từ celeb #${saved.currentIndex + 1}?`);
        if (popup) {
            log('Khôi phục tiến trình trước...');
            await sleep(2000);
            processNextCeleb(remaining, saved.totalCount, saved.currentIndex);
        } else clearProgress();
    }
}

// ================== AUTO UPDATE ==================
async function checkForUpdate() {
    try {
        const res = await fetch(CONFIG.VERSION_URL + '?t=' + Date.now());
        const data = await res.json();
        if (data.version && data.version !== CONFIG.VERSION) {
            showUpdatePopup(data);
        } else {
            log(`✅ Phiên bản ${CONFIG.VERSION} là mới nhất.`);
        }
    } catch (err) {
        log('⚠️ Không thể kiểm tra cập nhật: ' + err.message, 'error');
    }
}
function showUpdatePopup(data) {
    const div = document.createElement('div');
    div.innerHTML = `
        <div style="
            position:fixed;top:30%;left:50%;transform:translateX(-50%);
            background:#fff;padding:20px 25px;border-radius:12px;
            box-shadow:0 6px 25px rgba(0,0,0,0.25);z-index:99999;text-align:center;">
            <h2>🚀 Có bản cập nhật mới!</h2>
            <p><b>v${data.version}</b> – ${data.changelog || 'Cải tiến mới.'}</p>
            <button id="updateNowBtn" style="
                margin-top:10px;padding:10px 16px;border:none;border-radius:8px;
                background:#22c55e;color:#fff;font-weight:600;cursor:pointer;">Cập nhật ngay</button>
        </div>`;
    document.body.appendChild(div);
    document.getElementById('updateNowBtn').addEventListener('click', () => {
        window.open(data.download_url, '_blank');
        div.remove();
    });
}

// ================== MAIN PROCESS ==================
async function processNextCeleb(celebIds, totalCount, index = 0) {
    if (index >= celebIds.length) {
        log('✅ Hoàn tất tất cả Celeb!');
        clearProgress();
        return;
    }

    const celebName = celebIds[index];
    log(`🔹 Đang xử lý ${celebName} (${index + 1}/${totalCount})`);

    // Giả lập hành động kết bạn
    await sleep(1500);

    saveProgress(celebIds, totalCount, index + 1);
    updateProgressBar(index + 1, totalCount);
    await processNextCeleb(celebIds, totalCount, index + 1);
}

// ================== UI ==================
function updateProgressBar(done, total) {
    let bar = document.getElementById('auto-progress-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'auto-progress-bar';
        bar.style = `
            position:fixed;bottom:0;left:0;height:6px;background:#22c55e;
            transition:width 0.3s;z-index:99999;`;
        document.body.appendChild(bar);
    }
    const percent = Math.min((done / total) * 100, 100);
    bar.style.width = percent + '%';
}

// ================== INIT ==================
(async function initAutoCeleb() {
    log('🚀 Auto Locket Celeb v' + CONFIG.VERSION + ' khởi động...');
    await checkForUpdate();
    await checkAndResume();
})();
