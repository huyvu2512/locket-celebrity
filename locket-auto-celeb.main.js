(function() {
    'use strict';
    
    const CONFIG = {
        STORAGE_KEY: 'autoCelebState',
        TIMER_CONFIG_KEY: 'autoCelebTimerConfig_v2.9',
        TIMER_RESTART_KEY: 'autoCelebTimerRestart',
        TARGET_PAGE: 'https://locket.binhake.dev/celebrity.html'
    };

    let activeTimerId = null;
    let currentTimerConfig = { enabled: false, minutes: 60 };

    // --- UI & Logging ---
    function log(message, type = 'log') {
        const styles = { log: 'color: inherit;', info: 'color: #3b82f6;', success: 'color: #22c55e;', error: 'color: #ef4444; font-weight: bold;', rocket: '', timer: 'color: #f59e0b;' };
        const prefix = type === 'rocket' ? '🚀' : (type === 'success' ? '✅' : (type === 'info' ? 'ℹ️' : (type === 'timer' ? '⏱️' : '➡️')));
        console.log(`%c[Auto Locket Celeb]%c ${prefix} ${message}`, 'color: #8b5cf6; font-weight: bold;', styles[type] || styles.log);
    }

    /**
     * HIỂN THỊ POPUP THÔNG BÁO MỚI KHI CÓ CELEB
     */
    function showCelebPopup(celebName, countText) {
        let container = document.getElementById('auto-celeb-popup-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'auto-celeb-popup-container';
            document.body.appendChild(container);
        }

        const popup = document.createElement('div');
        popup.className = 'celeb-popup-item';
        popup.innerHTML = `
            <span class="celeb-count">${countText}</span>
            Đang xử lý: <span class="celeb-name">${celebName}</span>
        `;
        container.prepend(popup);

        setTimeout(() => {
            popup.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 4000);
    }


    /**
     * Tiêm CSS (PHONG CÁCH MỚI - GLASS UI)
     */
    function injectNewStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* ---------------------------
                PHONG CÁCH MỚI - GLASS UI
            --------------------------- */

            #auto-celeb-main-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                width: 210px;
                font-family: 'Inter', 'Poppins', 'Segoe UI', sans-serif;
            }
            #auto-celeb-control-button {
                width: 100%;
                padding: 12px 14px;
                border-radius: 14px;
                border: none;
                color: white;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                box-shadow: 0 6px 20px rgba(34,197,94,0.4);
                transition: all 0.25s ease;
                backdrop-filter: blur(10px);
            }
            #auto-celeb-control-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(34,197,94,0.55);
                filter: brightness(1.1);
            }
            #auto-celeb-timer-ui {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 10px 12px;
                border-radius: 14px;
                color: white;
                font-weight: 600;
                text-align: center;
                backdrop-filter: blur(15px);
                background: rgba(30,30,30,0.45);
                border: 1px solid rgba(255,255,255,0.15);
                box-shadow: 0 6px 16px rgba(0,0,0,0.25);
                user-select: none;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            #auto-celeb-timer-ui:hover:not(.timer-counting) {
                transform: scale(1.03);
            }
            #timer-status-text {
                font-size: 18px;
                font-weight: 700;
                letter-spacing: 1px;
                text-shadow: 0 0 4px rgba(255,255,255,0.25);
                margin-bottom: 4px;
            }
            #timer-controls-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
            }
            #auto-celeb-timer-ui.timer-disabled {
                background: linear-gradient(145deg, #dc2626, #b91c1c);
                box-shadow: 0 4px 15px rgba(239,68,68,0.4);
            }
            #auto-celeb-timer-ui.timer-enabled {
                background: linear-gradient(145deg, #16a34a, #15803d);
                box-shadow: 0 4px 15px rgba(34,197,94,0.4);
            }
            #auto-celeb-timer-ui.timer-counting {
                background: linear-gradient(145deg, #0ea5e9, #0284c7);
                cursor: default;
            }
            .timer-btn {
                font-size: 30px;
                font-weight: 700;
                padding: 0 10px;
                cursor: pointer;
                user-select: none;
                transition: transform 0.15s ease, opacity 0.15s ease;
            }
            .timer-btn:hover {
                opacity: 0.75;
                transform: scale(1.15);
            }
            #timer-display {
                flex-grow: 1;
                text-align: center;
                font-family: 'JetBrains Mono', 'Courier New', monospace;
                font-size: 26px;
                letter-spacing: 1px;
            }
            #auto-celeb-popup-container {
                position: fixed;
                top: 80px;
                right: 25px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 12px;
                pointer-events: none;
            }
            .celeb-popup-item {
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
                color: #1f2937;
                padding: 12px 18px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                border: 1px solid rgba(250,204,21,0.6);
                font-size: 15px;
                animation: slideInFadeIn 0.5s forwards, fadeOut 0.5s 3.5s forwards;
                transform: translateX(100%);
                opacity: 0;
            }
            .celeb-popup-item .celeb-name {
                font-weight: 700;
                color: #92400e;
            }
            .celeb-popup-item .celeb-count {
                font-size: 13px;
                opacity: 0.75;
                margin-right: 8px;
            }
            @keyframes slideInFadeIn {
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(50%); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Tạo Bảng điều khiển CHÍNH
     */
    function createMainControlUI() {
        const container = document.createElement('div');
        container.id = 'auto-celeb-main-container';
        const controlButton = document.createElement('button');
        controlButton.id = 'auto-celeb-control-button';
        const timerUI = document.createElement('div');
        timerUI.id = 'auto-celeb-timer-ui';
        timerUI.innerHTML = `
            <div id="timer-status-text"></div>
            <div id="timer-controls-row">
                <span id="timer-minus-btn" class="timer-btn">-</span>
                <span id="timer-display">00:00</span>
                <span id="timer-plus-btn" class="timer-btn">+</span>
            </div>
        `;
        container.appendChild(controlButton);
        container.appendChild(timerUI);
        document.body.appendChild(container);
    }

    /**
     * Cập nhật Nút Bắt đầu/Dừng
     */
    function updateControlButtonState(state) {
        const button = document.getElementById('auto-celeb-control-button');
        if (state.isRunning) {
            button.textContent = 'Dừng Auto Celeb';
            button.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            button.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)';
        } else {
            button.textContent = 'Bắt đầu Auto Celeb';
            button.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            button.style.boxShadow = '0 6px 20px rgba(34,197,94,0.4)';
        }
    }

    /**
     * Cập nhật Nút Hẹn giờ
     */
    function updateTimerUI(mode, value) {
        const timerUI = document.getElementById('auto-celeb-timer-ui');
        const display = document.getElementById('timer-display');
        const plusBtn = document.getElementById('timer-plus-btn');
        const minusBtn = document.getElementById('timer-minus-btn');
        const statusText = document.getElementById('timer-status-text');
        if (!timerUI || !display || !plusBtn || !minusBtn || !statusText) return;
        timerUI.classList.remove('timer-disabled', 'timer-enabled', 'timer-counting');
        if (mode === 'counting') {
            timerUI.classList.add('timer-counting');
            statusText.style.display = 'block';
            statusText.textContent = "ĐANG ĐẾM...";
            plusBtn.style.display = 'none';
            minusBtn.style.display = 'none';
            display.textContent = formatTime(value);
            display.style.fontSize = '30px';
            display.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";
        } else {
            statusText.style.display = 'block';
            plusBtn.style.display = 'block';
            minusBtn.style.display = 'block';
            display.style.fontSize = '26px';
            display.textContent = `${currentTimerConfig.minutes.toString().padStart(2, '0')}:00`;
            if (currentTimerConfig.enabled) {
                timerUI.classList.add('timer-enabled'); // Xanh
                statusText.textContent = 'BẬT';
            } else {
                timerUI.classList.add('timer-disabled'); // Đỏ
                statusText.textContent = 'TẮT';
            }
        }
    }

    // --- Chức năng Hẹn giờ Tự Reset ---
    function loadTimerConfig() {
        const configStr = localStorage.getItem(CONFIG.TIMER_CONFIG_KEY);
        if (configStr) {
            const savedConfig = JSON.parse(configStr);
            currentTimerConfig.minutes = savedConfig.minutes || 60;
        }
        currentTimerConfig.enabled = false; 
        log(`Đã tải Cài đặt Hẹn giờ (Mặc định TẮT, ${currentTimerConfig.minutes} phút).`, 'info');
        updateTimerUI();
    }
    
    function saveTimerConfig() {
        localStorage.setItem(CONFIG.TIMER_CONFIG_KEY, JSON.stringify(currentTimerConfig));
    }
    
    function setupTimerControls() {
        const timerUI = document.getElementById('auto-celeb-timer-ui');
        const plusBtn = document.getElementById('timer-plus-btn');
        const minusBtn = document.getElementById('timer-minus-btn');
    
        const toggleTimer = () => {
            if (activeTimerId) return;
            currentTimerConfig.enabled = !currentTimerConfig.enabled;
            log(`Hẹn giờ ${currentTimerConfig.enabled ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}.`, 'timer');
            saveTimerConfig();
            updateTimerUI();
        };
    
        timerUI.addEventListener('click', () => {
            if (activeTimerId) return;
            if (window.location.href !== CONFIG.TARGET_PAGE) {
                log('Đang ở trang khác. Chuyển hướng về celebrity.html...');
                window.location.href = CONFIG.TARGET_PAGE;
                return;
            }
            toggleTimer();
        });
    
        plusBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (activeTimerId) return;
            currentTimerConfig.minutes += 5;
            log(`Tăng thời gian hẹn giờ lên: ${currentTimerConfig.minutes} phút.`, 'timer');
            saveTimerConfig();
            updateTimerUI();
        });
    
        minusBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (activeTimerId) return;
            if (currentTimerConfig.minutes > 5) {
                currentTimerConfig.minutes -= 5;
                log(`Giảm thời gian hẹn giờ xuống: ${currentTimerConfig.minutes} phút.`, 'timer');
            } else {
                 currentTimerConfig.minutes = 5;
                 log(`Thời gian hẹn giờ tối thiểu là 5 phút.`, 'timer');
            }
            saveTimerConfig();
            updateTimerUI();
        });
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // --- CÁC HÀM LOGIC CHÍNH (CHỈ CHẠY TRÊN TRANG TARGET) ---

    function startReloadTimer(minutes) {
        if (activeTimerId) clearInterval(activeTimerId);
        const durationInSeconds = minutes * 60;
        const endTime = Date.now() + durationInSeconds * 1000;
        log(`Đã bật đồng hồ đếm ngược. Reset sau ${minutes} phút.`, 'timer');
        function updateCountdown() {
            const now = Date.now();
            const secondsRemaining = (endTime - now) / 1000;
            if (secondsRemaining <= 0) {
                clearInterval(activeTimerId);
                activeTimerId = null;
                updateTimerUI('counting', 0);
                executeTimerReset();
            } else {
                updateTimerUI('counting', secondsRemaining);
            }
        }
        updateCountdown();
        activeTimerId = setInterval(updateCountdown, 1000);
    }

    function cancelReloadTimer() {
        if (activeTimerId) {
            clearInterval(activeTimerId);
            activeTimerId = null;
            log('Đã hủy đồng hồ đếm ngược.', 'info');
            updateTimerUI();
        }
    }

    function executeTimerReset() {
        log('Hẹn giờ kết thúc. ĐANG ĐẶT CỜ RESTART VÀ TẢI LẠI TRANG...', 'timer');
        localStorage.setItem(CONFIG.TIMER_RESTART_KEY, 'true');
        sessionStorage.removeItem(CONFIG.STORAGE_KEY);
        location.reload();
    }

    function closeNotificationPopup() {
        setTimeout(() => {
            const closeButton = document.querySelector('#notificationPopup .close, #notificationPopup [data-dismiss="modal"]');
            const popup = document.querySelector('#notificationPopup');
            if (closeButton && popup?.style.display !== 'none') {
                log('Phát hiện và đóng popup thông báo.', 'info');
                closeButton.click();
            }
        }, 500);
    }

    function scrollToCelebSection() {
        const section = document.getElementById('usernameSearch');
        if (section) {
            log('Tự động cuộn đến khu vực Auto Celeb.', 'info');
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function processNextCeleb(celebIds, totalCount) {
        const state = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
        if (!state.isRunning) {
            log('Quá trình đã được dừng lại.', 'info');
            return;
        }
        if (celebIds.length === 0) {
            log('Không còn celeb nào trong danh sách chờ để xử lý. Hoàn thành!', 'success');
            sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ ...state, finished: true }));
            updateControlButtonState({ isRunning: true });
            return;
        }
        const currentId = celebIds.shift();
        sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ isRunning: true, celebIds: [...celebIds], totalCount: totalCount }));
        const parentElement = document.getElementById(currentId + '_parentElement');
        if (!parentElement) {
            log(`Không tìm thấy container cho celeb ID: ${currentId}. Bỏ qua.`, 'error');
            await processNextCeleb(celebIds, totalCount);
            return;
        }
        const button = parentElement.querySelector('button[data-status="waitlist"]');
        const nameElement = parentElement.closest('.profile')?.querySelector('.profile-name');
        const celebName = nameElement ? nameElement.textContent.trim() : `ID: ${currentId}`;
        const processedCount = totalCount - celebIds.length;
        const countText = `(${processedCount}/${totalCount})`;
        if (!button) {
            log(`${countText} ${celebName} đã được thêm hoặc không có sẵn. Bỏ qua.`, 'info');
            await processNextCeleb(celebIds, totalCount);
            return;
        }
        log(`${countText} Đang xử lý: ${celebName}`);
        showCelebPopup(celebName, countText);
        button.click();
        await sleep(1000);
        const startButton = document.getElementById(currentId + '_startButton');
        if (startButton) {
            log(`Nhấn nút "Bắt đầu" cho ${celebName}`);
            startButton.click();
            await sleep(2000);
            if (celebIds.length === 0) {
                log(`Đã xử lý celeb cuối cùng: ${celebName}. Script đã hoàn thành. Nhấn "Dừng" để reset hoặc chờ timer.`, 'success');
                sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ isRunning: true, celebIds: [], totalCount: totalCount, finished: true }));
                updateControlButtonState({ isRunning: true });
                return;
            } else {
                log('Quay trở lại danh sách celeb để xử lý người tiếp theo...');
                const celebToolsLink = document.querySelector('a.nav-link[href="celebrity.html"]');
                if (celebToolsLink) {
                    celebToolsLink.click();
                } else {
                    log('LỖI: Không tìm thấy link "Celebrity Tools". Dừng script.', 'error');
                    stopProcess(false);
                }
            }
        } else {
            log(`KHÔNG TÌM THẤY nút "Bắt đầu" cho ${celebName}. Bỏ qua.`, 'error');
            await processNextCeleb(celebIds, totalCount);
        }
    }

    function startProcess() {
        log('Bắt đầu quá trình tự động thêm celeb...', 'rocket');
        const availableButtons = document.querySelectorAll('button[data-status="waitlist"]');
        if (availableButtons.length === 0) {
            log('Không tìm thấy celeb nào có sẵn để thêm.', 'info');
             updateControlButtonState({ isRunning: false });
            return;
        }
        const celebIds = Array.from(availableButtons).map(btn => {
            const parent = btn.parentElement;
            return (parent && parent.id && parent.id.endsWith('_parentElement')) ? parent.id.replace('_parentElement', '') : null;
        }).filter(id => id !== null);
        if (celebIds.length === 0) {
            log('Không thể trích xuất ID của celeb nào. Dừng lại.', 'error');
             updateControlButtonState({ isRunning: false });
            return;
        }
        const totalCount = celebIds.length;
        log(`Tìm thấy tổng cộng ${totalCount} celeb. Bắt đầu xử lý...`);
        sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ isRunning: true, celebIds: [...celebIds], totalCount: totalCount }));
        updateControlButtonState({ isRunning: true });
        if (currentTimerConfig.enabled && currentTimerConfig.minutes > 0) {
            startReloadTimer(currentTimerConfig.minutes);
        }
        processNextCeleb(celebIds, totalCount);
    };

    function stopProcess(shouldReload = true) {
        cancelReloadTimer();
        localStorage.removeItem(CONFIG.TIMER_RESTART_KEY);
        sessionStorage.removeItem(CONFIG.STORAGE_KEY);
        log('Đã dừng quá trình tự động theo yêu cầu người dùng.', 'info');
        if (shouldReload) {
            log('Đang tải lại trang...');
            location.reload();
        } else {
            updateControlButtonState({ isRunning: false });
        }
    }

    // --- Main Execution (Điểm khởi chạy) ---
    (function main() {
        log('Userscript đã được kích hoạt (v1.0 - Chạy trên toàn trang).', 'success');

        // --- 1. Chạy trên TẤT CẢ các trang ---
        injectNewStyles();
        createMainControlUI();
        loadTimerConfig();
        setupTimerControls();

        const controlButton = document.getElementById('auto-celeb-control-button');
        
        controlButton.addEventListener('click', () => {
            if (window.location.href !== CONFIG.TARGET_PAGE) {
                log('Đang ở trang khác. Chuyển hướng về celebrity.html...');
                window.location.href = CONFIG.TARGET_PAGE;
                return;
            }
            
            const state = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
            if (state.isRunning) {
                stopProcess();
            } else {
                startProcess();
            }
        });

        // --- 2. CHỈ chạy trên trang celebrity.html ---
        if (window.location.href === CONFIG.TARGET_PAGE) {
            log('Đang ở trang celebrity.html. Kích hoạt logic auto-run và UI hỗ trợ.');
            
            scrollToCelebSection();
            closeNotificationPopup();

            const currentState = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
            const needsTimerRestart = localStorage.getItem(CONFIG.TIMER_RESTART_KEY) === 'true';

            updateControlButtonState(currentState);

            if (needsTimerRestart) {
                log('PHÁT HIỆN CỜ RESTART. Tự động bắt đầu sau 2 giây...', 'timer');
                localStorage.removeItem(CONFIG.TIMER_RESTART_KEY);
                setTimeout(startProcess, 2000);
            }
            else if (currentState.isRunning && !currentState.finished && currentState.celebIds && currentState.celebIds.length > 0) {
                log('Phát hiện phiên làm việc chưa hoàn tất. Tự động tiếp tục sau 2 giây...', 'info');
                if (currentTimerConfig.enabled && currentTimerConfig.minutes > 0) {
                    startReloadTimer(currentTimerConfig.minutes);
                }
                setTimeout(() => processNextCeleb(currentState.celebIds, currentState.totalCount), 2000);
            }
            else if (currentState.isRunning && currentState.finished) {
                log('Quá trình đã hoàn thành. Nhấn "Dừng" để reset hoặc chờ timer (nếu bật).', 'success');
                if (currentTimerConfig.enabled && currentTimerConfig.minutes > 0) {
                    startReloadTimer(currentTimerConfig.minutes);
                }
            }
        } else {
            log('Đang ở trang khác. Chỉ hiển thị UI.');
            updateControlButtonState({ isRunning: false });
        }
    })();
// KẾT THÚC DÁN MÃ v2.9.9
})();
