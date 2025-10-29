// ==Auto Locket Celeb - Core (v1.1)==
// Features: Smart Resume (localStorage), Auto Update, Retry, Speed selector, Timer, Progress, UI
(function() {
    'use strict';

    // ---------- CONFIG ----------
    const CONFIG = {
        STORAGE_KEY: 'autoCelebState',               // old session format (used for parity)
        RESUME_KEY: 'autoCelebResume_v1',            // smart resume stored in localStorage
        TIMER_CONFIG_KEY: 'autoCelebTimerConfig_v1',
        TIMER_RESTART_KEY: 'autoCelebTimerRestart_v1',
        TIMER_END_TIME_KEY: 'autoCelebTimerEndTime_v1',
        TARGET_PAGE: 'https://locket.binhake.dev/celebrity.html',
        SITE_HOST: 'https://locket.binhake.dev',
        VERSION: '1.1',
        VERSION_URL: 'https://raw.githubusercontent.com/huyvu2512/auto-locket-celeb/main/version.json' // change to your raw URL
    };

    // ---------- STATE ----------
    let activeTimerId = null;
    let currentTimerConfig = { enabled: false, minutes: 60 };
    let currentSpeedDelay = 2000; // default 2s (medium)
    const MAX_RETRIES = 3;

    // ---------- UTIL ----------
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function lget(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return localStorage.getItem(key); } }
    function lset(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
    function lrm(key) { localStorage.removeItem(key); }

    function log(message, type = 'log') {
        const prefix = '[Auto Locket Celeb]';
        if (type === 'error') console.error(prefix, message);
        else if (type === 'success') console.info(prefix, message);
        else console.log(prefix, message);
        const box = document.getElementById('autoCelebLog');
        if (box) box.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${message}</div>`;
    }

    // ---------- UI: styles + main control ----------
    function injectStyles() {
        if (document.getElementById('autoCelebStyles')) return;
        const s = document.createElement('style');
        s.id = 'autoCelebStyles';
        s.textContent = `
            /* compact glass UI */
            #auto-celeb-main-container { position: fixed; bottom: 18px; right: 18px; z-index:99999; width: 240px; font-family: Inter, Roboto, sans-serif; }
            #auto-celeb-control-button { width:100%; padding:10px 12px; border-radius:12px; border:none; color:#fff; font-weight:700; cursor:pointer; background:linear-gradient(135deg,#16a34a,#15803d); box-shadow:0 8px 30px rgba(16,185,129,0.15); }
            #auto-celeb-timer-ui { margin-top:8px; padding:10px; border-radius:12px; background:rgba(30,30,30,0.5); color:#fff; text-align:center; user-select:none; }
            #auto-celeb-controls { display:flex; gap:8px; margin-top:8px; }
            #speed-selector { width:100%; padding:6px; border-radius:8px; border:none; font-weight:600; }
            .celeb-popup-item { position: fixed; top: 80px; right: 25px; z-index:100000; background:rgba(255,255,255,0.95); padding:10px 14px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.15); color:#111; font-weight:600; }
            #auto-progress-bar { position:fixed; bottom:0; left:0; height:6px; background:#22c55e; transition:width .3s; z-index:99998; width:0%; }
            #autoCelebLog { max-height:160px; overflow:auto; font-size:12px; margin-top:8px; background:rgba(0,0,0,0.4); padding:6px; border-radius:8px; color:#fff; }
            .small-btn { padding:6px 8px; border-radius:8px; border:none; cursor:pointer; }
        `;
        document.head.appendChild(s);
    }

    function createUI() {
        if (document.getElementById('auto-celeb-main-container')) return;
        const container = document.createElement('div');
        container.id = 'auto-celeb-main-container';

        const btn = document.createElement('button');
        btn.id = 'auto-celeb-control-button';
        btn.textContent = 'Bắt đầu Auto Celeb';
        container.appendChild(btn);

        const timerUI = document.createElement('div');
        timerUI.id = 'auto-celeb-timer-ui';
        timerUI.innerHTML = `
            <div id="timer-status-text">Timer: <span id="timer-state-text">TẮT</span></div>
            <div id="timer-controls" style="display:flex;gap:8px;margin-top:8px;">
                <button id="timer-decr" class="small-btn">-5m</button>
                <button id="timer-toggle" class="small-btn">Bật/Tắt</button>
                <button id="timer-incr" class="small-btn">+5m</button>
            </div>
            <div style="margin-top:8px;">
                <select id="speed-selector">
                    <option value="3000">🐢 Chậm (3s)</option>
                    <option value="2000" selected>⚙️ Trung bình (2s)</option>
                    <option value="1000">⚡ Nhanh (1s)</option>
                </select>
            </div>
            <div id="controls-row" style="display:flex;gap:8px;margin-top:8px;">
                <button id="btn-stop" class="small-btn" style="background:#ef4444;color:#fff;">Dừng</button>
                <button id="btn-clear" class="small-btn">Xóa Resume</button>
            </div>
            <div id="autoCelebLog" style="margin-top:8px;"></div>
        `;
        container.appendChild(timerUI);
        document.body.appendChild(container);

        // progress bar
        const bar = document.createElement('div');
        bar.id = 'auto-progress-bar';
        document.body.appendChild(bar);
    }

    // ---------- Persistent Smart Resume (localStorage) ----------
    function saveProgress(celebIds, totalCount, currentIndex) {
        const payload = {
            celebIds,
            totalCount,
            currentIndex,
            timestamp: Date.now(),
            isRunning: true
        };
        try { localStorage.setItem(CONFIG.RESUME_KEY, JSON.stringify(payload)); } catch (e) { log('Lưu tiến trình thất bại: ' + e.message, 'error'); }
    }
    function loadProgress() {
        try {
            const raw = localStorage.getItem(CONFIG.RESUME_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch { return null; }
    }
    function clearProgress() {
        localStorage.removeItem(CONFIG.RESUME_KEY);
    }

    // ---------- Auto Update ----------
    async function checkForUpdate() {
        try {
            const res = await fetch(CONFIG.VERSION_URL + '?t=' + Date.now(), {cache:'no-store'});
            if (!res.ok) throw new Error('Fetch failed: ' + res.status);
            const data = await res.json();
            if (data.version && data.version !== CONFIG.VERSION) {
                showUpdatePopup(data);
            } else {
                log(`Phiên bản hiện tại ${CONFIG.VERSION} là mới nhất.`, 'info');
            }
        } catch (err) {
            log('Không kiểm tra được update: ' + err.message, 'error');
        }
    }
    function showUpdatePopup(data) {
        const popup = document.createElement('div');
        popup.className = 'celeb-popup-item';
        popup.style.minWidth = '320px';
        popup.innerHTML = `
            <div style="font-weight:800;margin-bottom:6px">🚀 Cập nhật mới: v${data.version}</div>
            <div style="font-size:13px;margin-bottom:10px">${data.changelog || ''}</div>
            <div style="display:flex;gap:8px;justify-content:center">
                <button id="updateNowBtn" class="small-btn" style="background:#22c55e;color:#fff">Cập nhật ngay</button>
                <button id="dismissUpdateBtn" class="small-btn">Đóng</button>
            </div>
        `;
        document.body.appendChild(popup);
        document.getElementById('updateNowBtn').addEventListener('click', () => {
            window.open(data.download_url || CONFIG.VERSION_URL, '_blank');
            popup.remove();
        });
        document.getElementById('dismissUpdateBtn').addEventListener('click', () => popup.remove());
        setTimeout(()=> popup.remove(), 15000);
    }

    // ---------- Progress bar ----------
    function updateProgressBar(done, total) {
        const bar = document.getElementById('auto-progress-bar');
        if (!bar) return;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        bar.style.width = percent + '%';
    }

    // ---------- Popup celeb small ----------
    function showCelebPopup(celebName, countText) {
        const p = document.createElement('div');
        p.className = 'celeb-popup-item';
        p.innerHTML = `<div style="font-weight:700">${celebName}</div><div style="font-size:13px;opacity:.8">${countText}</div>`;
        document.body.appendChild(p);
        setTimeout(()=> { try{p.remove();}catch(e){} }, 3500);
    }

    // ---------- Timer: reload/auto-reset ----------
    function loadTimerConfig() {
        const raw = localStorage.getItem(CONFIG.TIMER_CONFIG_KEY);
        if (raw) {
            try {
                const cfg = JSON.parse(raw);
                currentTimerConfig.minutes = cfg.minutes || 60;
                currentTimerConfig.enabled = !!cfg.enabled;
            } catch { /* ignore */ }
        } else {
            currentTimerConfig = { enabled: false, minutes: 60 };
        }
        updateTimerUI();
    }
    function saveTimerConfig() {
        localStorage.setItem(CONFIG.TIMER_CONFIG_KEY, JSON.stringify(currentTimerConfig));
    }
    function updateTimerUI(mode, value) {
        const stateText = document.getElementById('timer-state-text');
        if (!stateText) return;
        stateText.textContent = currentTimerConfig.enabled ? `BẬT (${currentTimerConfig.minutes}m)` : 'TẮT';
        if (mode === 'counting' && typeof value === 'number') {
            stateText.textContent = `ĐẾM ${formatTime(value)}`;
        }
    }
    function formatTime(seconds) {
        const m = Math.floor(seconds/60).toString().padStart(2,'0');
        const s = Math.floor(seconds%60).toString().padStart(2,'0');
        return `${m}:${s}`;
    }

    function startReloadTimer(minutes) {
        if (activeTimerId) clearInterval(activeTimerId);
        let endTimeStr = sessionStorage.getItem(CONFIG.TIMER_END_TIME_KEY);
        let endTime;
        if (!endTimeStr) {
            endTime = Date.now() + minutes * 60 * 1000;
            sessionStorage.setItem(CONFIG.TIMER_END_TIME_KEY, endTime.toString());
            log(`Bắt đầu đồng hồ đếm ngược ${minutes} phút.`, 'info');
        } else {
            endTime = parseInt(endTimeStr, 10);
            log('Tiếp tục đồng hồ đếm ngược cũ.', 'info');
        }
        function tick() {
            const now = Date.now();
            const secs = Math.max(0, Math.round((endTime - now)/1000));
            updateTimerUI('counting', secs);
            if (secs <= 0) {
                clearInterval(activeTimerId);
                activeTimerId = null;
                sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
                executeTimerReset();
            }
        }
        tick();
        activeTimerId = setInterval(tick, 1000);
    }
    function cancelReloadTimer() {
        if (activeTimerId) {
            clearInterval(activeTimerId); activeTimerId = null;
            log('Hủy đồng hồ đếm ngược.', 'info');
        }
        sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
        updateTimerUI();
    }
    function executeTimerReset() {
        log('Timer kết thúc: đặt cờ restart và reload...', 'info');
        localStorage.setItem(CONFIG.TIMER_RESTART_KEY, 'true');
        // Clear resume old state (we will let resume logic decide after reload)
        try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch {}
        sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
        location.reload();
    }

    // ---------- Retry helper ----------
    async function safeClick(button, tries = MAX_RETRIES) {
        for (let i=1;i<=tries;i++) {
            try {
                button.click();
                return true;
            } catch (e) {
                log(`Click thất bại (thử ${i}/${tries}): ${e.message}`, 'error');
                await sleep(800);
            }
        }
        return false;
    }

    // ---------- Main processing logic ----------
    async function processNextCeleb(celebIds, totalCount, currentIndex = 0) {
        // celebIds: array of ids (strings)
        // currentIndex: index in celebIds to process next
        if (!Array.isArray(celebIds)) celebIds = [];
        if (currentIndex >= celebIds.length) {
            log('Hoàn thành danh sách celeb.', 'success');
            clearProgress();
            updateProgressBar(totalCount, totalCount);
            return;
        }

        // Save progress immediately (so resume knows position)
        saveProgress(celebIds, totalCount, currentIndex);

        const id = celebIds[currentIndex];
        const parentId = id + '_parentElement';
        const parentElement = document.getElementById(parentId);
        let celebName = `ID:${id}`;
        if (parentElement) {
            const nameEl = parentElement.closest('.profile')?.querySelector('.profile-name');
            celebName = nameEl ? nameEl.textContent.trim() : celebName;
        } else {
            log(`Không tìm thấy phần tử cho ${id}, sẽ bỏ qua.`, 'error');
            // continue to next
            return processNextCeleb(celebIds, totalCount, currentIndex + 1);
        }

        const countText = `(${currentIndex+1}/${totalCount})`;
        log(`${countText} Đang xử lý: ${celebName}`);
        showCelebPopup(celebName, countText);

        // find the waitlist button
        const button = parentElement.querySelector('button[data-status="waitlist"]');
        if (!button) {
            log(`${countText} Không có nút waitlist cho ${celebName}. Bỏ qua.`, 'info');
            return processNextCeleb(celebIds, totalCount, currentIndex + 1);
        }

        // click + handle potential states (with retries)
        let attempt = 0;
        let success = false;
        while (attempt < MAX_RETRIES && !success) {
            attempt++;
            // click
            await safeClick(button, 2);
            // wait short delay then check response indicator in DOM
            await sleep(800 + currentSpeedDelay/3);

            // check for common states (full / ready / undefined)
            // For compatibility, look for elements or logs on page
            const statusBadge = parentElement.querySelector('[data-status]')?.getAttribute('data-status');
            if (statusBadge === 'full') {
                log(`[${celebName}] Full! Thử lại ${attempt}/${MAX_RETRIES}`, 'info');
                if (attempt >= MAX_RETRIES) {
                    log(`[${celebName}] Bị full liên tục. Bỏ qua.`, 'error');
                } else {
                    await sleep(1200);
                }
            } else {
                // assume clicked successfully
                success = true;
            }
        }

        if (!success) {
            // move on
            return processNextCeleb(celebIds, totalCount, currentIndex + 1);
        }

        // now click the start button (if present)
        await sleep(currentSpeedDelay);
        const startButton = document.getElementById(id + '_startButton');
        if (startButton) {
            await safeClick(startButton, 2);
            log(`Nhấn "Bắt đầu" cho ${celebName}`);
            // after starting, wait for operation to complete and then return to celeb list
            await sleep(currentSpeedDelay + 800);
        } else {
            log(`Không tìm thấy nút "Bắt đầu" cho ${celebName}`, 'error');
        }

        // update progress bar & save progress
        updateProgressBar(currentIndex + 1, totalCount);
        saveProgress(celebIds, totalCount, currentIndex + 1);

        // go back to celebrity list (attempt)
        const celebToolsLink = document.querySelector('a.nav-link[href="celebrity.html"], a[href="celebrity.html"]');
        if (celebToolsLink) {
            try { celebToolsLink.click(); } catch { window.location.href = CONFIG.TARGET_PAGE; }
        } else {
            // attempt to navigate
            if (window.location.href !== CONFIG.TARGET_PAGE) window.location.href = CONFIG.TARGET_PAGE;
        }

        // wait a bit and process next
        await sleep(1200 + (currentSpeedDelay/2));
        return processNextCeleb(celebIds, totalCount, currentIndex + 1);
    }

    // ---------- Controller: start/stop ----------
    function startProcess() {
        log('Khởi động Auto Celeb...', 'info');
        const availableButtons = document.querySelectorAll('button[data-status="waitlist"]');
        if (!availableButtons || availableButtons.length === 0) {
            log('Không tìm thấy celeb có trạng thái waitlist.', 'info');
            updateControlButtonState(false);
            return;
        }
        const celebIds = Array.from(availableButtons).map(btn => {
            const parent = btn.parentElement;
            return (parent && parent.id && parent.id.endsWith('_parentElement')) ? parent.id.replace('_parentElement','') : null;
        }).filter(Boolean);

        if (celebIds.length === 0) {
            log('Không thể trích xuất ID celeb.', 'error');
            updateControlButtonState(false);
            return;
        }

        // save resume initial state (full array)
        saveProgress(celebIds, celebIds.length, 0);
        updateControlButtonState(true);
        if (currentTimerConfig.enabled && currentTimerConfig.minutes > 0) startReloadTimer(currentTimerConfig.minutes);
        processNextCeleb(celebIds, celebIds.length, 0);
    }

    function stopProcess(shouldReload = true) {
        cancelReloadTimer();
        lrm(CONFIG.TIMER_RESTART_KEY);
        // mark resume as not running but keep last progress (so manual resume possible)
        const p = loadProgress();
        if (p) { p.isRunning = false; localStorage.setItem(CONFIG.RESUME_KEY, JSON.stringify(p)); }
        log('Dừng Auto Celeb theo yêu cầu.', 'info');
        if (shouldReload) {
            log('Reload trang để reset trạng thái UI...');
            setTimeout(()=> location.reload(), 600);
        } else updateControlButtonState(false);
    }

    function updateControlButtonState(isRunning) {
        const btn = document.getElementById('auto-celeb-control-button');
        if (!btn) return;
        if (isRunning) {
            btn.textContent = 'Đang chạy... (Nhấn để dừng)';
            btn.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
        } else {
            btn.textContent = 'Bắt đầu Auto Celeb';
            btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
        }
    }

    // ---------- Resume logic on load ----------
    async function checkAndResume(autoStartAfterSec = 5) {
        const saved = loadProgress();
        if (!saved || !Array.isArray(saved.celebIds) || saved.celebIds.length === 0) return;
        if (!saved.isRunning) {
            log('Phát hiện tiến trình đã dừng trước đó (manual stop). Bạn có thể xóa resume nếu muốn.', 'info');
            return;
        }
        const remaining = saved.celebIds.slice(saved.currentIndex || 0);
        log(`Phát hiện tiến trình trước còn ${remaining.length}/${saved.totalCount} celeb.`, 'info');

        // show confirm dialog — if user does not respond, auto start after timeout
        let userResponded = false;
        setTimeout(() => {
            if (!userResponded) {
                log(`Tự động khôi phục tiến trình sau ${autoStartAfterSec}s...`, 'info');
                processNextCeleb(saved.celebIds, saved.totalCount, saved.currentIndex || 0);
            }
        }, autoStartAfterSec * 1000);

        try {
            userResponded = confirm(`Phát hiện tiến trình trước còn ${remaining.length}/${saved.totalCount} celeb.\nBấm OK để tiếp tục ngay, Cancel để hủy (hoặc tự chạy sau ${autoStartAfterSec}s).`);
            if (userResponded) {
                log('Người dùng chọn khôi phục tiến trình...', 'info');
                await sleep(800);
                processNextCeleb(saved.celebIds, saved.totalCount, saved.currentIndex || 0);
            } else {
                log('Người dùng hủy resume. Xóa resume cũ.', 'info');
                clearProgress();
            }
        } catch (e) {
            // if confirm not allowed, we'll auto start after timeout
        }
    }

    // ---------- Hook up UI events ----------
    function setupUIHandlers() {
        const btn = document.getElementById('auto-celeb-control-button');
        const speedSel = document.getElementById('speed-selector');
        const timerToggle = document.getElementById('timer-toggle');
        const timerIncr = document.getElementById('timer-incr');
        const timerDecr = document.getElementById('timer-decr');
        const btnStop = document.getElementById('btn-stop');
        const btnClear = document.getElementById('btn-clear');

        if (speedSel) {
            speedSel.value = String(currentSpeedDelay);
            speedSel.addEventListener('change', (e) => {
                currentSpeedDelay = parseInt(e.target.value, 10);
                log('Đã đổi tốc độ: ' + (currentSpeedDelay/1000) + 's', 'info');
            });
        }

        if (btn) {
            btn.addEventListener('click', () => {
                // if not on target page, navigate
                if (window.location.href !== CONFIG.TARGET_PAGE) {
                    log('Chuyển hướng về celebrity tools page...', 'info');
                    window.location.href = CONFIG.TARGET_PAGE;
                    return;
                }
                // check current state and toggle
                const p = loadProgress();
                if (p && p.isRunning) {
                    stopProcess();
                } else {
                    startProcess();
                }
            });
        }

        if (timerToggle) {
            timerToggle.addEventListener('click', () => {
                currentTimerConfig.enabled = !currentTimerConfig.enabled;
                saveTimerConfig();
                updateTimerUI();
                log('Timer ' + (currentTimerConfig.enabled ? 'BẬT' : 'TẮT'), 'info');
                if (currentTimerConfig.enabled) startReloadTimer(currentTimerConfig.minutes);
                else cancelReloadTimer();
            });
        }
        if (timerIncr) {
            timerIncr.addEventListener('click', () => { currentTimerConfig.minutes += 5; saveTimerConfig(); updateTimerUI(); });
        }
        if (timerDecr) {
            timerDecr.addEventListener('click', () => { currentTimerConfig.minutes = Math.max(5, currentTimerConfig.minutes - 5); saveTimerConfig(); updateTimerUI(); });
        }
        if (btnStop) {
            btnStop.addEventListener('click', () => stopProcess(true));
        }
        if (btnClear) {
            btnClear.addEventListener('click', () => { clearProgress(); log('Đã xóa resume.', 'info'); updateProgressBar(0,0); });
        }
    }

    // ---------- Main init ----------
    (async function main() {
        try {
            injectStyles();
            createUI();
            loadTimerConfig();
            setupUIHandlers();
            log('Auto Locket Celeb v' + CONFIG.VERSION + ' đã được tải.', 'success');

            // show restart flag: if timer set reload flag, auto start after reload
            const needsTimerRestart = localStorage.getItem(CONFIG.TIMER_RESTART_KEY) === 'true';
            if (needsTimerRestart) {
                localStorage.removeItem(CONFIG.TIMER_RESTART_KEY);
                log('Phát hiện cờ restart. Bắt đầu sau 2s...', 'info');
                setTimeout(() => {
                    // start process if on target page
                    if (window.location.href === CONFIG.TARGET_PAGE) startProcess();
                    else window.location.href = CONFIG.TARGET_PAGE;
                }, 2000);
            }

            // If on target page, scroll and attempt resume
            if (window.location.href === CONFIG.TARGET_PAGE) {
                try { document.getElementById('usernameSearch')?.scrollIntoView({behavior:'smooth'}); } catch {}
                await checkForUpdate();
                await checkAndResume(5); // auto resume after 5 seconds if user doesn't respond
            } else {
                // still check for update globally
                checkForUpdate();
            }
        } catch (e) {
            console.error('[Auto Locket Celeb] Init error:', e);
        }
    })();

})();
