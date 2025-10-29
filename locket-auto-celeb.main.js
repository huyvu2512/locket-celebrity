// ==Auto Locket Celeb - Core (v1.1)==
// Features: Smart Resume (localStorage), Auto Update, Retry, Speed selector, Timer, Progress, UI
(function() {
    'use strict';

    // ---------- CONFIG ----------
    const CONFIG = {
        STORAGE_KEY: 'autoCelebState',
        RESUME_KEY: 'autoCelebResume_v1',
        TIMER_CONFIG_KEY: 'autoCelebTimerConfig_v1',
        TIMER_RESTART_KEY: 'autoCelebTimerRestart_v1',
        TIMER_END_TIME_KEY: 'autoCelebTimerEndTime_v1',
        TARGET_PAGE: 'https://locket.binhake.dev/celebrity.html',
        SITE_HOST: 'https://locket.binhake.dev',
        VERSION: '1.1',
        VERSION_URL: 'https://raw.githubusercontent.com/huyvu2512/locket-celebrity/main/version.json' // ✅ updated to match your repo
    };

    // ---------- STATE ----------
    let activeTimerId = null;
    let currentTimerConfig = { enabled: false, minutes: 60 };
    let currentSpeedDelay = 2000; // default 2s
    const MAX_RETRIES = 3;

    // ---------- UTIL ----------
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const lget = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
    const lset = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    const lrm = k => localStorage.removeItem(k);

    function log(msg, type = 'info') {
        const prefix = '[Auto Locket Celeb]';
        if (type === 'error') console.error(prefix, msg);
        else if (type === 'success') console.info(prefix, msg);
        else console.log(prefix, msg);
        const box = document.getElementById('autoCelebLog');
        if (box) box.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${msg}</div>`;
    }

    // ---------- STYLE & UI ----------
    function injectStyles() {
        if (document.getElementById('autoCelebStyles')) return;
        const s = document.createElement('style');
        s.id = 'autoCelebStyles';
        s.textContent = `
            #auto-celeb-main-container { position: fixed; bottom: 18px; right: 18px; z-index:99999; width: 240px; font-family: Inter, Roboto, sans-serif; }
            #auto-celeb-control-button { width:100%; padding:10px 12px; border-radius:12px; border:none; color:#fff; font-weight:700; cursor:pointer; background:linear-gradient(135deg,#16a34a,#15803d); box-shadow:0 8px 30px rgba(16,185,129,0.15); }
            #auto-celeb-timer-ui { margin-top:8px; padding:10px; border-radius:12px; background:rgba(30,30,30,0.5); color:#fff; text-align:center; user-select:none; }
            #speed-selector { width:100%; padding:6px; border-radius:8px; border:none; font-weight:600; margin-top:8px; }
            #autoCelebLog { max-height:160px; overflow:auto; font-size:12px; margin-top:8px; background:rgba(0,0,0,0.4); padding:6px; border-radius:8px; color:#fff; }
            .small-btn { padding:6px 8px; border-radius:8px; border:none; cursor:pointer; }
            .celeb-popup-item { position: fixed; top: 80px; right: 25px; z-index:100000; background:rgba(255,255,255,0.95); padding:10px 14px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.15); color:#111; font-weight:600; }
            #auto-progress-bar { position:fixed; bottom:0; left:0; height:6px; background:#22c55e; transition:width .3s; z-index:99998; width:0%; }
        `;
        document.head.appendChild(s);
    }

    function createUI() {
        if (document.getElementById('auto-celeb-main-container')) return;
        const container = document.createElement('div');
        container.id = 'auto-celeb-main-container';

        container.innerHTML = `
            <button id="auto-celeb-control-button">Bắt đầu Auto Celeb</button>
            <div id="auto-celeb-timer-ui">
                <div id="timer-status-text">Timer: <span id="timer-state-text">TẮT</span></div>
                <div style="display:flex;gap:6px;justify-content:center;margin-top:6px;">
                    <button id="timer-decr" class="small-btn">-5m</button>
                    <button id="timer-toggle" class="small-btn">Bật/Tắt</button>
                    <button id="timer-incr" class="small-btn">+5m</button>
                </div>
                <select id="speed-selector">
                    <option value="3000">🐢 Chậm (3s)</option>
                    <option value="2000" selected>⚙️ Trung bình (2s)</option>
                    <option value="1000">⚡ Nhanh (1s)</option>
                </select>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="btn-stop" class="small-btn" style="background:#ef4444;color:#fff;">Dừng</button>
                    <button id="btn-clear" class="small-btn">Xóa Resume</button>
                </div>
                <div id="autoCelebLog"></div>
            </div>
        `;
        document.body.appendChild(container);
        const bar = document.createElement('div');
        bar.id = 'auto-progress-bar';
        document.body.appendChild(bar);
    }

    // ---------- SMART RESUME ----------
    function saveProgress(ids, total, index) {
        lset(CONFIG.RESUME_KEY, { celebIds: ids, totalCount: total, currentIndex: index, timestamp: Date.now(), isRunning: true });
    }
    function loadProgress() { return lget(CONFIG.RESUME_KEY); }
    function clearProgress() { lrm(CONFIG.RESUME_KEY); }

    async function checkAndResume(autoStartSec = 5) {
        const saved = loadProgress();
        if (!saved?.isRunning) return;
        const remaining = saved.celebIds.slice(saved.currentIndex || 0);
        log(`🧠 Phát hiện tiến trình cũ: còn ${remaining.length}/${saved.totalCount}`);
        let answered = false;
        setTimeout(() => {
            if (!answered) {
                log(`Tự resume sau ${autoStartSec}s...`);
                processNextCeleb(saved.celebIds, saved.totalCount, saved.currentIndex);
            }
        }, autoStartSec * 1000);

        try {
            answered = confirm(`Tiếp tục từ celeb #${saved.currentIndex + 1}? (tự chạy sau ${autoStartSec}s nếu không bấm)`);
            if (answered) processNextCeleb(saved.celebIds, saved.totalCount, saved.currentIndex);
            else clearProgress();
        } catch {}
    }

    // ---------- AUTO UPDATE ----------
    async function checkForUpdate() {
        try {
            const res = await fetch(CONFIG.VERSION_URL + '?t=' + Date.now());
            const data = await res.json();
            if (data.version && data.version !== CONFIG.VERSION) showUpdatePopup(data);
            else log(`✅ Phiên bản ${CONFIG.VERSION} là mới nhất.`);
        } catch (e) { log('Không thể kiểm tra cập nhật: ' + e.message, 'error'); }
    }

    function showUpdatePopup(d) {
        const el = document.createElement('div');
        el.className = 'celeb-popup-item';
        el.innerHTML = `
            <b>🚀 Bản mới v${d.version}</b><br>${d.changelog || 'Cải tiến mới.'}
            <div style="margin-top:8px">
                <button id="updateNowBtn" class="small-btn" style="background:#22c55e;color:#fff;">Cập nhật ngay</button>
            </div>
        `;
        document.body.appendChild(el);
        document.getElementById('updateNowBtn').onclick = () => window.open(d.download_url, '_blank');
        setTimeout(() => el.remove(), 12000);
    }

    // ---------- TIMER ----------
    function loadTimerConfig() {
        const c = lget(CONFIG.TIMER_CONFIG_KEY) || {};
        currentTimerConfig = { enabled: !!c.enabled, minutes: c.minutes || 60 };
        updateTimerUI();
    }
    function saveTimerConfig() { lset(CONFIG.TIMER_CONFIG_KEY, currentTimerConfig); }
    function updateTimerUI(mode, val) {
        const el = document.getElementById('timer-state-text');
        if (!el) return;
        el.textContent = currentTimerConfig.enabled ? `BẬT (${currentTimerConfig.minutes}m)` : 'TẮT';
        if (mode === 'counting') el.textContent = `ĐẾM ${Math.floor(val/60)}:${String(val%60).padStart(2,'0')}`;
    }
    function startReloadTimer(mins) {
        if (activeTimerId) clearInterval(activeTimerId);
        const endTime = Date.now() + mins * 60000;
        sessionStorage.setItem(CONFIG.TIMER_END_TIME_KEY, endTime);
        activeTimerId = setInterval(() => {
            const remain = Math.floor((endTime - Date.now())/1000);
            if (remain <= 0) {
                clearInterval(activeTimerId);
                executeTimerReset();
            } else updateTimerUI('counting', remain);
        }, 1000);
    }
    function cancelReloadTimer() { if (activeTimerId) clearInterval(activeTimerId); activeTimerId = null; }
    function executeTimerReset() {
        log('Timer kết thúc – reload trang...');
        localStorage.setItem(CONFIG.TIMER_RESTART_KEY, 'true');
        location.reload();
    }

    // ---------- MAIN PROCESS ----------
    async function processNextCeleb(ids, total, index = 0) {
        if (index >= ids.length) { log('✅ Hoàn tất danh sách.'); clearProgress(); return; }
        saveProgress(ids, total, index);
        const id = ids[index];
        const parent = document.getElementById(id + '_parentElement');
        const name = parent?.querySelector('.profile-name')?.textContent.trim() || `ID:${id}`;
        const count = `(${index + 1}/${total})`;
        log(`${count} Xử lý ${name}`);
        const btn = parent?.querySelector('button[data-status="waitlist"]');
        if (!btn) return processNextCeleb(ids, total, index + 1);
        btn.click();
        await sleep(currentSpeedDelay);
        const startBtn = document.getElementById(id + '_startButton');
        if (startBtn) startBtn.click();
        updateProgressBar(index + 1, total);
        await sleep(currentSpeedDelay);
        processNextCeleb(ids, total, index + 1);
    }

    function updateProgressBar(done, total) {
        const bar = document.getElementById('auto-progress-bar');
        if (bar) bar.style.width = `${(done/total)*100}%`;
    }

    // ---------- CONTROL ----------
    function startProcess() {
        const btns = document.querySelectorAll('button[data-status="waitlist"]');
        if (!btns.length) return log('Không có celeb khả dụng.');
        const ids = [...btns].map(b => b.parentElement.id.replace('_parentElement', ''));
        saveProgress(ids, ids.length, 0);
        updateControlButton(true);
        if (currentTimerConfig.enabled) startReloadTimer(currentTimerConfig.minutes);
        processNextCeleb(ids, ids.length, 0);
    }

    function stopProcess() {
        cancelReloadTimer();
        const p = loadProgress(); if (p) p.isRunning = false; lset(CONFIG.RESUME_KEY, p);
        log('⛔ Dừng tiến trình.');
        updateControlButton(false);
    }

    function updateControlButton(running) {
        const b = document.getElementById('auto-celeb-control-button');
        if (!b) return;
        if (running) { b.textContent = 'Đang chạy...'; b.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)'; }
        else { b.textContent = 'Bắt đầu Auto Celeb'; b.style.background = 'linear-gradient(135deg,#16a34a,#15803d)'; }
    }

    // ---------- INIT ----------
    (async function init() {
        injectStyles();
        createUI();
        loadTimerConfig();
        checkForUpdate();

        document.getElementById('auto-celeb-control-button').onclick = () => {
            if (window.location.href !== CONFIG.TARGET_PAGE) location.href = CONFIG.TARGET_PAGE;
            else startProcess();
        };
        document.getElementById('btn-stop').onclick = stopProcess;
        document.getElementById('btn-clear').onclick = () => { clearProgress(); log('Đã xóa resume.'); };
        document.getElementById('speed-selector').onchange = e => currentSpeedDelay = +e.target.value;
        document.getElementById('timer-toggle').onclick = () => {
            currentTimerConfig.enabled = !currentTimerConfig.enabled; saveTimerConfig(); updateTimerUI();
        };
        document.getElementById('timer-incr').onclick = () => { currentTimerConfig.minutes += 5; saveTimerConfig(); updateTimerUI(); };
        document.getElementById('timer-decr').onclick = () => { currentTimerConfig.minutes = Math.max(5, currentTimerConfig.minutes - 5); saveTimerConfig(); updateTimerUI(); };

        const restartFlag = localStorage.getItem(CONFIG.TIMER_RESTART_KEY);
        if (restartFlag === 'true') {
            localStorage.removeItem(CONFIG.TIMER_RESTART_KEY);
            log('⚙️ Auto restart sau reload...');
            setTimeout(startProcess, 2000);
        }
        if (window.location.href === CONFIG.TARGET_PAGE) await checkAndResume();
    })();
})();
