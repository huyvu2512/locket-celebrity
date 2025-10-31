(function() {
    'use strict';

    const CONFIG = {
        STORAGE_KEY: 'autoCelebState',
        LOG_STORAGE_KEY: 'autoCelebScriptLog_v1',
        TIMER_CONFIG_KEY: 'autoCelebTimerConfig_v2.9',
        TIMER_RESTART_KEY: 'autoCelebTimerRestart',
        TIMER_END_TIME_KEY: 'autoCelebTimerEndTime',
        TARGET_PAGE: 'https://locket.binhake.dev/celebrity.html',
        FRIENDS_PAGE: 'https://locket.binhake.dev/friends.html', // <-- MỚI: Thêm trang tool bạn bè
        LOGO_URL: 'https://i.imgur.com/AM2f24N.png',

        // --- MỚI (Task 14): Keys cho việc reset celeb lỗi ---
        CELEB_RESTART_KEY: 'autoCelebCelebRestart',
        CONNECTION_LOST_COUNTER_KEY: 'autoCelebConnectionLostCounter',
        CONNECTION_LOST_TRIGGER_STRING: "The connection was suddenly lost. Reconnecting after 5 second...",
        CONNECTION_LOST_MAX_RETRIES: 5,
        // ---------------------------------------------------

        // --- Cài đặt Key Kích Hoạt ---
        SECRET_KEY: '2025', // <-- Key của bạn
        KEY_STORAGE_KEY: 'autoCelebKeyValidated_v1', // <-- Tên để lưu key
        MESSENGER_LINK: 'https://www.messenger.com/c/655145337208323/',

        // --- Link Update & Version ---
        SCRIPT_VERSION: 'v1.2',
        UPDATE_URL: 'https://raw.githubusercontent.com/huyvu2512/locket-celebrity/main/tampermonkey.user.js'
    };

    // *** SỬA ĐỔI: Danh sách Celeb được trích xuất (Đã cập nhật) ***
    const CELEB_LIST = [
        { name: 'Locket HQ 💛', uid: 'locket.hq' },
        { name: 'SZA & MoRuf Backstage Test', uid: 'szamoruf_1' }
    ];

    let activeTimerId = null;
    let currentTimerConfig = { enabled: false, minutes: 60 };
    let currentTimerTotalDuration = 0;

    let webLogObserver = null;

    // --- MỚI: Biến trạng thái cho Tool Bạn bè ---
    let isFriendSearchRunning = false;
    let friendSearchLoopId = null;

    // --- UI & Logging ---

    function getTimestamp() {
        const now = new Date();
        const date = [now.getDate().toString().padStart(2, '0'), (now.getMonth() + 1).toString().padStart(2, '0'), now.getFullYear()];
        const time = [now.getHours().toString().padStart(2, '0'), now.getMinutes().toString().padStart(2, '0'), now.getSeconds().toString().padStart(2, '0')];
        return `[${date.join('/')} ${time.join(':')}]`;
    }

    /**
     * Ghi log (ĐÃ SỬA - Thêm bộ lọc "Vui lòng nhập...")
     */
    function log(message, type = 'log') {
        // 1. Luôn ghi ra Console
        const styles = { log: 'color: inherit;', info: 'color: #3b82f6;', success: 'color: #22c55e;', error: 'color: #ef4444; font-weight: bold;', rocket: '', timer: 'color: #f59e0b;', warn: 'color: #f59e0b;' };
        const prefix = type === 'rocket' ? '🚀' : (type === 'success' ? '✅' : (type === 'info' ? 'ℹ️' : (type === 'timer' ? '⏱️' : (type === 'warn' ? '⚠️' : '➡️'))));
        console.log(`%c[Auto Locket Celeb]%c ${prefix} ${message}`, 'color: #8b5cf6; font-weight: bold;', styles[type] || styles.log);

        try {
            const logTextarea = document.getElementById('auto-celeb-script-log');

            // ===== BẮT ĐẦU LỌC LOG (Cho đỡ rối UI) =====
            const filteredMessages = [
                "Thời gian hẹn giờ tối thiểu",
                "Tăng thời gian hẹn giờ lên",
                "Giảm thời gian hẹn giờ xuống",
                "Đã TIẾP TỤC đồng hồ đếm ngược",
                "Hẹn giờ ĐÃ TẮT",
                "Hẹn giờ ĐÃ BẬT",
                "Phát hiện popup thông báo cũ. Tự động đóng...",
                'Phát hiện "Thông Báo Quan Trọng". Tự động đóng...',
                'Bắt đầu theo dõi nhật ký của',
                'Tiếp tục xử lý danh sách celeb...',
                'Vui lòng nhập username để bắt đầu lặp.' // <-- MỚI: Thêm dòng này để lọc
            ];

            const isFiltered = filteredMessages.some(filter => message.includes(filter));
            // ===== KẾT THÚC LỌC LOG =====

            const timestamp = getTimestamp();
            const logMessage = `${timestamp} ${message}\n`;

            // 1. Ghi ra Textarea (nếu không bị lọc)
            if (logTextarea && !isFiltered) {
                logTextarea.value += logMessage;
                logTextarea.scrollTop = logTextarea.scrollHeight;
            }

            // 2. MỚI: Ghi vào Session Storage (nếu không bị lọc)
            // Chỉ lưu log vào storage nếu quá trình Celeb đang diễn ra
            const state = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
            const needsTimerRestart = localStorage.getItem(CONFIG.TIMER_RESTART_KEY) === 'true';
            if ((state.isRunning || needsTimerRestart) && !isFiltered) {
                let storedLog = sessionStorage.getItem(CONFIG.LOG_STORAGE_KEY) || "";
                storedLog += logMessage;
                sessionStorage.setItem(CONFIG.LOG_STORAGE_KEY, storedLog);
            }

        } catch (e) {
            // Bỏ qua lỗi
        }
    }

    /**
     * MỚI (Task 2): Tải log đã lưu từ sessionStorage vào textarea
     */
    function loadPersistentLog() {
        // Chỉ chạy ở trang chính (hoặc trang friend)
        if (window.location.href !== CONFIG.TARGET_PAGE && window.location.href !== CONFIG.FRIENDS_PAGE) return;

        try {
            const storedLog = sessionStorage.getItem(CONFIG.LOG_STORAGE_KEY);
            const logTextarea = document.getElementById('auto-celeb-script-log');

            if (logTextarea && storedLog) {
                logTextarea.value = storedLog; // Nạp toàn bộ log cũ
                logTextarea.scrollTop = logTextarea.scrollHeight; // Cuộn xuống dưới
            }
        } catch (e) {
            console.error('[Auto Locket Celeb] Lỗi khi tải log đã lưu: ', e);
        }
    }


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
     * Tiêm CSS (ĐÃ CẬP NHẬT - Sửa CSS Donate Input)
     */
    function injectNewStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* ---------------------------
                PHONG CÁCH CHUNG
            --------------------------- */

            #auto-celeb-main-container {
                position: fixed;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                width: 350px;
                font-family: 'Inter', 'Poppins', 'Segoe UI', sans-serif;
                background: rgba(30,30,30,0.65);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255,255,255,0.15);
                box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                border-radius: 16px;
                padding: 12px;
                top: 90px;
                left: 24px;
                right: auto;
                bottom: auto;
                max-height: 90vh;
                overflow: hidden;
                transition: max-height 0.3s ease, padding-top 0.3s ease, padding-bottom 0.3s ease;
            }

            #auto-celeb-popup-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
                font-size: 18px;
                font-weight: 700;
                border-bottom: 1px solid rgba(255,255,255,0.2);
                padding-bottom: 8px;
                margin-bottom: 4px;
                cursor: default;
            }

            #auto-celeb-popup-title {
                cursor: pointer;
                user-select: none;
                flex-grow: 1;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            #auto-celeb-title-icon {
                width: 22px;
                height: 22px;
                border-radius: 5px;
            }

            #auto-celeb-collapse-toggle {
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                padding: 0 5px;
                transition: transform 0.3s ease;
            }
            #auto-celeb-collapse-toggle:hover {
                opacity: 0.8;
            }

            #auto-celeb-main-container.collapsed {
                max-height: 48px;
                padding-top: 12px;
                padding-bottom: 12px;
                gap: 0;
            }
            #auto-celeb-main-container.collapsed #auto-celeb-popup-header {
                margin-bottom: 0;
                border-bottom: none;
                padding-bottom: 0;
            }
            #auto-celeb-main-container.collapsed #auto-celeb-collapse-toggle {
                transform: rotate(-90deg);
            }
            #auto-celeb-main-container.collapsed > *:not(#auto-celeb-popup-header) {
                display: none;
            }

            /* ===== MỚI: Trạng thái Khóa (Locked) ===== */
            #auto-celeb-main-container.locked #auto-celeb-control-button,
            #auto-celeb-main-container.locked #auto-celeb-timer-ui,
            #auto-celeb-main-container.locked #auto-celeb-log-wrapper,
            #auto-celeb-main-container.locked #auto-celeb-redirect-button,
            #auto-celeb-main-container.locked #auto-friend-tool-wrapper { /* <-- MỚI */
                display: none;
            }
            #auto-celeb-main-container:not(.locked) #auto-celeb-key-wall {
                display: none;
            }

            /* ===== MỚI: Giao diện Key Wall ===== */
            #auto-celeb-key-wall {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                padding: 10px 0;
            }
            #key-wall-icon {
                width: 64px;
                height: 64px;
                opacity: 0.9;
                border-radius: 12px;
            }
            #key-wall-title {
                font-size: 22px;
                font-weight: 700;
                color: white;
                margin: 0;
            }
            #key-wall-message {
                font-size: 14px;
                color: #e0e0e0;
                text-align: center;
                line-height: 1.5;
                margin: 0;
            }
            #btn-get-key {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 12px 14px;
                border-radius: 14px;
                border: none;
                color: white;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                background: linear-gradient(135deg, #00B2FF, #006AFF); /* Messenger Blue */
                box-shadow: 0 6px 20px rgba(0, 150, 255, 0.4);
                transition: all 0.25s ease;
                justify-content: center;
                text-decoration: none;
            }
            #btn-get-key:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 150, 255, 0.55);
            }
            #key-input-field {
                width: 100%;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                padding: 12px 15px;
                font-size: 16px;
                color: white;
                font-family: 'Inter', sans-serif;
                box-sizing: border-box;
            }
            #key-input-field::placeholder {
                color: #888;
            }
            #btn-submit-key {
                width: 100%;
                padding: 12px 14px;
                border-radius: 14px;
                border: none;
                color: white;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                background: linear-gradient(135deg, #8b5cf6, #6d28d9); /* Purple */
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
                transition: all 0.25s ease;
            }
            #btn-submit-key:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(139, 92, 246, 0.55);
            }
            #key-error-message {
                font-size: 14px;
                color: #ef4444; /* red-500 */
                font-weight: 600;
                margin: -5px 0 0 0;
                display: none; /* Ẩn ban đầu */
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .shake {
                animation: shake 0.3s ease;
                border-color: #ef4444 !important;
            }

            /* --- HẾT Giao diện Key Wall --- */

            /* --- Giao diện Tool Celeb --- */
            #auto-celeb-control-button {
                width: 100%; padding: 12px 14px; border-radius: 14px; border: none;
                color: white; font-weight: 600; font-size: 16px; cursor: pointer;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                box-shadow: 0 6px 20px rgba(34,197,94,0.4);
                transition: all 0.25s ease;
            }
            #auto-celeb-control-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(34,197,94,0.55);
                filter: brightness(1.1);
            }
            #auto-celeb-control-button.running {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                box-shadow: 0 6px 20px rgba(239,68,68,0.4);
            }

            #auto-celeb-redirect-button {
                width: 100%; padding: 12px 14px; border-radius: 14px; border: none;
                color: white; font-weight: 600; font-size: 16px; cursor: pointer;
                background: linear-gradient(135deg, #0ea5e9, #0284c7);
                box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
                transition: all 0.25s ease;
            }
            #auto-celeb-redirect-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(14, 165, 233, 0.55);
                filter: brightness(1.1);
            }

            #auto-celeb-timer-ui {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border-radius: 14px;
                color: white;
                font-weight: 600;
                backdrop-filter: blur(15px);
                background: rgba(30,30,30,0.45);
                border: 1px solid rgba(255,255,255,0.15);
                box-shadow: 0 6px 16px rgba(0,0,0,0.25);
                user-select: none;
                transition: all 0.3s ease;
                height: 65px;
            }
            #timer-display-group { display: flex; align-items: center; gap: 10px; }
            #timer-display {
                font-family: 'JetBrains Mono', 'Inter', 'Segoe UI', sans-serif;
                font-size: 32px;
                font-weight: 500;
                letter-spacing: -1px;
                color: #e0e0e0;
                flex-shrink: 0;
                min-width: 80px;
                transition: all 0.2s ease;
                text-align: left;
            }
            #timer-adjust-buttons { display: flex; flex-direction: column; gap: 2px; }
            .timer-adjust-btn {
                background-color: rgba(255,255,255,0.1);
                color: #fff;
                font-size: 13px;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 8px;
                cursor: pointer;
                transition: background-color 0.2s ease, transform 0.1s ease;
                min-width: 38px;
                text-align: center;
            }
            .timer-adjust-btn:hover { background-color: rgba(255,255,255,0.2); transform: scale(1.05); }
            .timer-adjust-btn:active { transform: scale(0.95); }
            #timer-progress-ring { width: 40px; height: 40px; transform: rotate(-90deg); flex-shrink: 0; }
            .timer-ring-bg, .timer-ring-fg { fill: transparent; stroke-width: 4; }
            .timer-ring-bg { stroke: rgba(255, 255, 255, 0.15); }
            .timer-ring-fg { stroke: #0ea5e9; stroke-linecap: round; transition: stroke-dashoffset 0.5s linear; }
            #timer-toggle-switch { position: relative; display: inline-block; width: 50px; height: 30px; flex-shrink: 0; }
            .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
            .toggle-switch-label { display: block; width: 100%; height: 100%; background-color: #8e8e93; border-radius: 15px; cursor: pointer; transition: background-color 0.2s ease; }
            .toggle-switch-handle { position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.2s ease; }
            #timer-toggle-input:checked + .toggle-switch-label { background-color: #34c759; }
            #timer-toggle-input:checked + .toggle-switch-label .toggle-switch-handle { transform: translateX(20px); }

            #auto-celeb-timer-ui.timer-counting #timer-display-group { flex-grow: 1; justify-content: center; gap: 15px; }
            #auto-celeb-timer-ui.timer-counting #timer-display { color: #0ea5e9; font-weight: 700; font-size: 38px; text-align: left; flex-grow: 0; }
            #auto-celeb-timer-ui.timer-counting #timer-adjust-buttons,
            #auto-celeb-timer-ui.timer-counting #timer-toggle-switch { display: none; }

            #auto-celeb-timer-ui:not(.timer-counting) #timer-progress-ring { display: none; }
            #auto-celeb-timer-ui:not(.timer-counting) #timer-display { font-size: 32px; text-align: left; flex-grow: 0; min-width: 90px; }
            #auto-celeb-timer-ui:not(.timer-counting) #timer-adjust-buttons { display: flex; }
            #auto-celeb-timer-ui:not(.timer-counting) #timer-toggle-switch { display: inline-block; }
            /* --- Hết Tool Celeb --- */

            /* ---------------------------
                MỚI: Giao diện Tool Bạn bè (ĐÃ SỬA LẠI)
            --------------------------- */
            #auto-friend-tool-wrapper {
                display: flex;
                flex-direction: column;
                gap: 0; /* Tắt gap, điều khiển bằng margin */
            }

            /* 1. Style the new Title (giống modal h3) */
            #friend-tool-title {
                font-size: 28px;
                font-weight: 700;
                color: #ef4444; /* <-- SỬA MÀU ĐỎ */
                text-align: center;
                margin: 0;
                margin-bottom: 5px; /* Giống #modal-donate h3 */
            }

            /* 2. Style the new Note (giống p.donate-thankyou) */
            #friend-tool-note {
                font-size: 0.9em; /* 14px */
                color: #ccc;
                text-align: center;
                margin: 0;
                margin-bottom: 15px; /* Giống #modal-donate p.donate-lead */
                font-weight: 500;
            }

            /* 3. Style the input */
            /* *** SỬA ĐỔI: CSS cho <select> *** */
            #friend-celeb-select {
                width: 100%;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                padding: 10px 12px;
                font-size: 15px;
                color: white;
                font-family: 'Inter', sans-serif;
                box-sizing: border-box;
                margin-bottom: 12px; /* Thêm khoảng cách trước nút */
            }
            #friend-celeb-select option {
                background: #333;
                color: white;
                padding: 5px;
            }
            #friend-celeb-select:focus {
                outline: none;
                border-color: #0ea5e9;
            }
            /* *** HẾT SỬA ĐỔI CSS *** */

            /* 4. Button style (no change needed) */
            #auto-friend-start-button {
                width: 100%; padding: 12px 14px; border-radius: 14px; border: none;
                color: white; font-weight: 600; font-size: 16px; cursor: pointer;
                background: linear-gradient(135deg, #0ea5e9, #0284c7); /* Blue */
                box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
                transition: all 0.25s ease;
            }
            #auto-friend-start-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(14, 165, 233, 0.55);
            }
            #auto-friend-start-button.running {
                background: linear-gradient(135deg, #ef4444, #dc2626); /* Red */
                box-shadow: 0 6px 20px rgba(239,68,68,0.4);
            }
            /* --- Hết: Giao diện Tool Bạn bè --- */

            /* --- Giao diện Log & Footer (Chung) --- */
            #auto-celeb-log-wrapper { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; min-height: 150px; }
            #auto-celeb-log-wrapper label { color: white; font-weight: bold; text-align: center; margin-bottom: 5px; display: block; user-select: none; }
            #auto-celeb-script-log {
                width: 100%; resize: none; margin: 0;
                font-family: Consolas, 'Courier New', monospace;
                font-size: 12px; font-weight: bold;
                background-color: #111; color: #eee;
                border: 1px solid #444; border-radius: 8px;
                box-sizing: border-box; padding: 8px;
                flex-grow: 1;
                height: 240px;
            }

            #auto-celeb-footer-buttons {
                display: flex;
                justify-content: space-between;
                gap: 8px;
                margin-top: 5px;
            }
            .footer-btn {
                flex-grow: 1;
                padding: 6px;
                border: none;
                border-radius: 5px;
                color: white;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s ease;
                font-size: 13px;
            }
            .footer-btn:hover {
                opacity: 0.8;
                transform: translateY(-1px);
            }
            #btn-update { background-color: #0ea5e9; } /* Blue */
            #btn-bug-report { background-color: #f59e0b; } /* Yellow */
            #btn-donate { background-color: #22c55e; } /* Green */

            /* --- Giao diện Modals (Chung) --- */
            #auto-celeb-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                backdrop-filter: blur(5px);
                z-index: 10001;
            }
            .auto-celeb-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #2c2c2e;
                color: white;
                border-radius: 14px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                z-index: 10002;
                width: 300px;
                padding: 20px;
                padding-top: 40px;
                text-align: center;
                border: 1px solid rgba(255,255,255,0.15);
            }
            .auto-celeb-modal h3 {
                margin-top: 0;
                margin-bottom: 15px;
            }
            .auto-celeb-modal p {
                text-align: center;
                margin-bottom: 15px;
            }
            .auto-celeb-modal-close {
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 28px;
                font-weight: bold;
                color: #aaa;
                cursor: pointer;
                line-height: 1;
            }
            .auto-celeb-modal-close:hover {
                color: white;
            }
            .modal-button {
                display: inline-block;
                background-color: #0a84ff;
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 10px;
                border: none; /* MỚI: Dùng cho nút copy */
                font-family: inherit; /* MỚI: Dùng cho nút copy */
                font-size: 1em; /* MỚI: Dùng cho nút copy */
            }
            .modal-button:hover {
                background-color: #38a0ff;
            }

            /* ===== CSS MODAL UPDATE ===== */
            #modal-update p.update-text {
                font-size: 16px;
                line-height: 1.5;
                text-align: center;
                margin-bottom: 0;
            }
            #modal-update .modal-update-version-display {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 15px;
                padding: 10px 15px;
                background: rgba(0,0,0,0.25);
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.1);
            }
            #modal-update .modal-update-logo {
                width: 24px;
                height: 24px;
                border-radius: 5px;
                flex-shrink: 0;
            }
            #modal-update .modal-update-title-text {
                font-size: 1.15em;
                font-weight: 700;
                color: #ef4444; /* Màu đỏ (red-500) */
            }
            #modal-update .modal-button-group {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            #modal-update .modal-button-group .modal-button {
                flex: 1;
                margin-top: 0;
                text-decoration: none;
                padding: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            #btn-go-to-update {
                background-color: #0a84ff; /* Blue */
            }
            #btn-go-to-update:hover {
                background-color: #38a0ff;
            }
            #btn-copy-update-link {
                background-color: #555;
            }
            #btn-copy-update-link:hover {
                background-color: #777;
            }
            #btn-copy-update-link.copied {
                background-color: #22c55e; /* Green */
                cursor: default;
            }

            /* ===== SỬA LẠI: CSS MODAL DONATE ===== */

            #modal-donate h3 {
                margin-bottom: 5px;
            }

            #modal-donate p.donate-lead {
                margin-bottom: 15px;
            }
            #modal-donate p.donate-thankyou {
                font-size: 0.9em;
                color: #ccc;
                margin-top: 0;
                margin-bottom: 20px;
            }

            .donate-input-wrapper {
                position: relative;
                margin-bottom: 15px;
            }

            /* *** SỬA ĐỔI: ĐỔI MÀU CHỮ SANG XANH *** */
            #donate-amount-input {
                width: 100%;
                padding: 12px;
                padding-right: 45px;
                border-radius: 8px;
                border: 1px solid #777;
                background: #333;
                color: #3b82f6; /* <-- SỬA: Đổi màu chữ sang xanh */
                font-weight: 600; /* <-- MỚI: Thêm đậm */
                font-size: 16px;
                box-sizing: border-box;
                margin-bottom: 0;
            }

            .donate-suffix {
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                color: #aaa;
                font-weight: 600;
                pointer-events: none;
                display: none;
            }
            .donate-input-wrapper input:not(:placeholder-shown) ~ .donate-suffix {
                display: block;
            }

            #donate-amount-input::-webkit-outer-spin-button,
            #donate-amount-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            #donate-amount-input {
                -moz-appearance: textfield;
            }
            /* *** HẾT SỬA ĐỔI CSS DONATE *** */

            #btn-generate-qr {
                background: linear-gradient(135deg, #22c55e, #16a34a);
                width: 100%;
                margin-top: 0;
                font-size: 16px;
                font-weight: 600;
                padding: 12px;
                transition: all 0.2s ease;
            }
            #btn-generate-qr:hover {
                filter: brightness(1.15);
            }
            #donate-qr-result {
                margin-top: 15px;
                min-height: 250px;
                display: none;
                align-items: center;
                justify-content: center;
                background: #fff;
                border-radius: 10px;
                padding: 10px;
            }
            #donate-qr-image {
                max-width: 100%;
                max-height: 250px;
                display: none;
            }
            #donate-loading-text {
                color: #000;
                font-size: 16px;
                font-weight: 600;
                display: none;
            }
            #donate-error-message {
                color: #ef4444;
                font-size: 14px;
                margin-top: 10px;
                font-weight: 600;
                display: none;
            }

            /* ===== CSS POPUP ===== */
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
                background: rgba(30,30,30,0.65);
                backdrop-filter: blur(15px);
                color: #e5e7eb;
                padding: 12px 18px;
                border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.15);
                font-size: 15px;
                animation: slideInFadeIn 0.5s forwards, fadeOut 0.5s 3.5s forwards;
                transform: translateX(100%);
                opacity: 0;
            }
            .celeb-popup-item .celeb-name { font-weight: 700; color: #ffffff; }
            .celeb-popup-item .celeb-count { font-size: 13px; opacity: 0.75; margin-right: 8px; }
            @keyframes slideInFadeIn { to { opacity: 1; transform: translateX(0); } }
            @keyframes fadeOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(50%); } }

            /* ===== CSS MODAL CHỜ 10 GIÂY ===== */
            #auto-celeb-pre-run-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.8);
                backdrop-filter: blur(10px);
                z-index: 20000;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            #auto-celeb-pre-run-modal {
                background: #1e1e1e;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 16px;
                padding: 24px 40px;
                text-align: center;
                color: white;
                font-family: 'Inter', sans-serif;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            #auto-celeb-pre-run-modal h2 {
                margin-top: 0;
                color: #f59e0b; /* yellow */
            }
            #auto-celeb-pre-run-modal p {
                font-size: 16px;
                margin-bottom: 10px;
            }
            #auto-celeb-pre-run-modal #auto-celeb-pre-run-timer {
                font-size: 64px;
                font-weight: 700;
                color: #22c55e; /* green */
                font-family: 'JetBrains Mono', monospace;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Tạo Bảng điều khiển CHÍNH (ĐÃ CẬP NHẬT - Sửa HTML Tool Bạn bè)
     */
    function createMainControlUI() {
        const container = document.createElement('div');
        container.id = 'auto-celeb-main-container';

        // 1. Thêm Header (Hiển thị trên mọi trang)
        container.innerHTML = `
            <div id="auto-celeb-popup-header">
                <span id="auto-celeb-popup-title">
                    <img src="${CONFIG.LOGO_URL}" id="auto-celeb-title-icon">
                    Locket Celebrity ${CONFIG.SCRIPT_VERSION}
                </span>
                <span id="auto-celeb-collapse-toggle">&#9660;</span>
            </div>
        `;

        // 2. MỚI: Thêm Key Wall (Luôn thêm, nhưng sẽ bị ẩn/hiện bằng CSS)
        const keyWall = document.createElement('div');
        keyWall.id = 'auto-celeb-key-wall';
        keyWall.innerHTML = `
            <img id="key-wall-icon" src="${CONFIG.LOGO_URL}" alt="Logo">
            <h3 id="key-wall-title">Kích hoạt Script</h3>
            <p id="key-wall-message">Để sử dụng script, vui lòng nhập key kích hoạt.<br>Truy cập kênh chat messenger để nhận key.</p>
            <a id="btn-get-key" href="${CONFIG.MESSENGER_LINK}" target="_blank">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C13.245 22 14.453 21.801 15.58 21.434C16.035 21.289 16.538 21.414 16.829 21.78C17.72 22.88 19.347 24 21.362 23.86C21.6 23.836 21.821 23.67 21.93 23.44C22.04 23.21 22.023 22.943 21.884 22.73C20.69 20.82 19.998 18.52 20.002 16.06C20.002 16.03 20 15.998 20 15.967C21.232 14.636 22 12.902 22 11C22 6.029 17.523 2 12 2ZM12.002 12.668C11.383 12.668 10.835 12.92 10.45 13.332L6.151 9.032C6.46 8.711 6.84 8.441 7.27 8.232C7.699 8.022 8.169 7.882 8.66 7.822C9.151 7.761 9.652 7.782 10.133 7.885C10.614 7.989 11.065 8.175 11.464 8.435L12.002 8.788L15.54 10.888C15.3 11.198 15.01 11.478 14.68 11.718C14.349 11.958 13.98 12.158 13.582 12.308C13.183 12.459 12.76 12.56 12.321 12.608C11.882 12.657 11.433 12.653 11 12.597L10.99 12.592L12.002 12.668ZM15.849 13.332C15.54 13.021 15.16 12.751 14.73 12.542C14.301 12.332 13.831 12.192 13.34 12.132C12.849 12.071 12.348 12.092 11.867 12.195C11.386 12.3 10.935 12.485 10.536 12.745L10 13.098L6.46 15.198C6.7 15.508 6.99 15.789 7.32 16.029C7.651 16.269 8.02 16.469 8.418 16.619C8.817 16.769 9.24 16.87 9.679 16.918C10.118 16.967 10.567 16.963 11 16.907L11.01 16.892L17.849 13.332L15.849 13.332Z" fill="white"/></svg>
                Lấy Key tại Messenger
            </a>
            <input type="text" id="key-input-field" placeholder="Nhập key...">
            <button id="btn-submit-key">Xác thực Key</button>
            <p id="key-error-message">Key không hợp lệ. Vui lòng thử lại.</p>
        `;
        container.appendChild(keyWall);

        // 3. Thêm nội dung tùy theo trang
        if (window.location.href === CONFIG.TARGET_PAGE) {
            // ----- GIAO DIỆN ĐẦY ĐỦ (Trang celebrity.html) -----
            const controlButton = document.createElement('button');
            controlButton.id = 'auto-celeb-control-button';
            container.appendChild(controlButton);

            const timerUI = document.createElement('div');
            timerUI.id = 'auto-celeb-timer-ui';
            timerUI.innerHTML = `
                <div id="timer-display-group">
                    <svg id="timer-progress-ring" viewBox="0 0 40 40">
                        <circle class="timer-ring-bg" cx="20" cy="20" r="18"></circle>
                        <circle class="timer-ring-fg" cx="20" cy="20" r="18"></circle>
                    </svg>
                    <span id="timer-display">00:00</span>
                    <div id="timer-adjust-buttons">
                        <span id="timer-plus-btn" class="timer-adjust-btn">+5</span>
                        <span id="timer-minus-btn" class="timer-adjust-btn">-5</span>
                    </div>
                </div>
                <div id="timer-toggle-switch">
                    <input type="checkbox" id="timer-toggle-input" class="sr-only">
                    <label for="timer-toggle-input" class="toggle-switch-label">
                        <span class="toggle-switch-handle"></span>
                    </label>
                </div>
            `;
            container.appendChild(timerUI);

            const logWrapper = document.createElement('div');
            logWrapper.id = 'auto-celeb-log-wrapper';
            logWrapper.innerHTML = `
                <label>Nhật ký hệ thống (Script)</label>
                <textarea id="auto-celeb-script-log" rows="10" disabled=""></textarea>
                <div id="auto-celeb-footer-buttons">
                    <button id="btn-update" class="footer-btn">Update</button>
                    <button id="btn-bug-report" class="footer-btn">Báo lỗi</button>
                    <button id="btn-donate" class="footer-btn">Donate</button>
                </div>
            `;
            container.appendChild(logWrapper);

        } else if (window.location.href === CONFIG.FRIENDS_PAGE) { // <-- MỚI
            // ----- GIAO DIỆN BẠN BÈ (SỬA LẠI HTML) -----
            const friendTool = document.createElement('div');
            friendTool.id = 'auto-friend-tool-wrapper';
            // SỬA LẠI HTML ĐỂ GIỐNG ẢNH DONATE
            friendTool.innerHTML = `
                <h3 id="friend-tool-title">TÌM KIẾM TỰ ĐỘNG</h3>
                <p id="friend-tool-note">Chỉ add được đối với tài khoản Locket Celeb!</p>
                <select id="friend-celeb-select">
                    <option value="" selected disabled>-- Chọn Celeb để chạy --</option>
                </select>
                <button id="auto-friend-start-button">Bắt đầu Lặp</button>
            `;
            container.appendChild(friendTool);

            // Thêm log UI (giống hệt trang celeb)
            const logWrapper = document.createElement('div');
            logWrapper.id = 'auto-celeb-log-wrapper';
            logWrapper.innerHTML = `
                <label>Nhật ký hệ thống (Script)</label>
                <textarea id="auto-celeb-script-log" rows="10" disabled=""></textarea>
                <div id="auto-celeb-footer-buttons">
                    <button id="btn-update" class="footer-btn">Update</button>
                    <button id="btn-bug-report" class="footer-btn">Báo lỗi</button>
                    <button id="btn-donate" class="footer-btn">Donate</button>
                </div>
            `;
            container.appendChild(logWrapper);

        } else {
            // ----- GIAO DIỆN TỐI GIẢN (Các trang khác) -----
            const redirectButton = document.createElement('button');
            redirectButton.id = 'auto-celeb-redirect-button';
            redirectButton.textContent = '➡️ Về trang Celebrity';
            container.appendChild(redirectButton);
        }

        // 4. Thêm container vào trang
        document.body.appendChild(container);

        // 5. MỚI: Thêm HTML cho Modals (ẩn ban đầu) - Thêm vào body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div id="auto-celeb-modal-overlay" style="display: none;"></div>

            <div id="modal-bug-report" class="auto-celeb-modal" style="display: none;">
                <span class="auto-celeb-modal-close">&times;</span>
                <h3>Báo lỗi</h3>
                <p>Nếu bạn gặp lỗi, vui lòng báo cho tôi qua Messenger:</p>
                <a href="${CONFIG.MESSENGER_LINK}" target="_blank" class="modal-button">Chat trên Messenger</a>
            </div>

            <div id="modal-update" class="auto-celeb-modal" style="display: none;">
                <span class="auto-celeb-modal-close">&times;</span>
                <h3>Cập nhật phiên bản</h3>

                <div class="modal-update-version-display">
                    <img src="${CONFIG.LOGO_URL}" class="modal-update-logo" alt="Logo">
                    <span class="modal-update-title-text">Locket Celebrity ${CONFIG.SCRIPT_VERSION}</span>
                </div>

                <p class="update-text">
                    Vui lòng cập nhật phiên bản mới.
                </p>

                <div class="modal-button-group">
                    <a id="btn-go-to-update" href="${CONFIG.UPDATE_URL}" target="_blank" class="modal-button">Cài đặt</a>
                    <button id="btn-copy-update-link" class="modal-button">Copy Link</button>
                </div>
            </div>

            <div id="modal-donate" class="auto-celeb-modal" style="display: none;">
                <span class="auto-celeb-modal-close">&times;</span>
                <h3>Donate</h3>

                <p class="donate-thankyou">Cảm ơn sự ủng hộ của bạn!</p>

                <p class="donate-lead">Nhập số tiền bạn muốn donate:</p>

                <div class="donate-input-wrapper">
                    <input type="text" id="donate-amount-input" placeholder="Nhập số tiền (VND)" inputmode="numeric">
                    <span class="donate-suffix">VND</span>
                </div>

                <button id="btn-generate-qr" class="modal-button">Tạo mã QR</button>
                <p id="donate-error-message"></p>
                <div id="donate-qr-result">
                    <span id="donate-loading-text">Đang tạo mã QR...</span>
                    <img id="donate-qr-image" src="" alt="QR Code">
                </div>
            </div>
            `;
        document.body.appendChild(modalContainer);
    }

    /**
     * Cập nhật Nút Bắt đầu/Dừng
     */
    function updateControlButtonState(state) {
        const button = document.getElementById('auto-celeb-control-button');
        if (!button) return;
        if (state.isRunning) {
            button.textContent = 'Dừng Auto Celeb';
            button.classList.add('running');
        } else {
            button.textContent = 'Bắt đầu Auto Celeb';
            button.classList.remove('running');
        }
    }

    /**
     * Cập nhật UI Timer
     */
    function updateTimerUI(mode, value) {
        const timerUI = document.getElementById('auto-celeb-timer-ui');
        if (!timerUI) return;

        const display = document.getElementById('timer-display');
        const toggleInput = document.getElementById('timer-toggle-input');
        const ringFg = document.querySelector('#timer-progress-ring .timer-ring-fg');

        if (!display || !toggleInput || !ringFg) return;

        timerUI.classList.remove('timer-counting');

        const radius = ringFg.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        ringFg.style.strokeDasharray = `${circumference}`;

        if (mode === 'counting') {
            timerUI.classList.add('timer-counting');
            display.textContent = formatTimeWithHours(value);
            toggleInput.checked = true;

            const percentageElapsed = (currentTimerTotalDuration - value) / currentTimerTotalDuration;
            const offset = circumference * (1 - percentageElapsed);

            ringFg.style.strokeDashoffset = offset;

        } else {
            display.textContent = `${currentTimerConfig.minutes.toString().padStart(2, '0')}:00`;
            toggleInput.checked = currentTimerConfig.enabled;
            ringFg.style.strokeDashoffset = circumference;
        }
    }


    // --- Chức năng Hẹn giờ Tự Reset ---

    /**
     * *** ĐÃ SỬA (Task 1) ***
     * Thêm logic để đảm bảo giá trị tối thiểu là 1, và các giá trị < 5 được chuẩn hóa.
     */
    function loadTimerConfig() {
        const configStr = localStorage.getItem(CONFIG.TIMER_CONFIG_KEY);
        if (configStr) {
            const savedConfig = JSON.parse(configStr);
            currentTimerConfig.minutes = savedConfig.minutes || 60;
            currentTimerConfig.enabled = savedConfig.enabled || false;
        } else {
            currentTimerConfig.minutes = 60;
            currentTimerConfig.enabled = false;
        }

        // *** MỚI: Đảm bảo giá trị đã lưu hợp lệ theo logic mới ***
        if (currentTimerConfig.minutes < 1) {
            currentTimerConfig.minutes = 1;
        } else if (currentTimerConfig.minutes > 1 && currentTimerConfig.minutes < 5) {
            currentTimerConfig.minutes = 5; // Nếu lưu 2, 3, 4 -> nhảy lên 5
        }
        // *** HẾT MỚI ***

        if (document.getElementById('auto-celeb-timer-ui')) {
            const activeTimerEndTime = sessionStorage.getItem(CONFIG.TIMER_END_TIME_KEY);
            if (!activeTimerEndTime) {
                updateTimerUI();
            }
        }
    }

    function saveTimerConfig() {
        const configToSave = {
            minutes: currentTimerConfig.minutes,
            enabled: currentTimerConfig.enabled
        };
        localStorage.setItem(CONFIG.TIMER_CONFIG_KEY, JSON.stringify(configToSave));
    }

    // *** SỬA LẠI: HÀM TẠO QR (Thêm xóa dấu phẩy) ***
    function generateDonateQR() {
        const amountInput = document.getElementById('donate-amount-input');

        // *** SỬA ĐỔI: Xóa dấu phẩy trước khi parse ***
        const rawValue = amountInput.value.replace(/,/g, '');
        const amount = parseInt(rawValue, 10);
        // *** HẾT SỬA ĐỔI ***

        const qrResultDiv = document.getElementById('donate-qr-result');
        const qrImage = document.getElementById('donate-qr-image');
        const loadingText = document.getElementById('donate-loading-text');
        const errorText = document.getElementById('donate-error-message');

        // 1. Validate
        if (isNaN(amount) || amount < 1000) {
            errorText.textContent = 'Đã có lỗi xảy ra. Vui lòng thử lại sau';
            errorText.style.display = 'block';
            return;
        }
        errorText.style.display = 'none';

        // 2. Show loading
        qrResultDiv.style.display = 'flex';
        qrImage.style.display = 'none';
        loadingText.style.display = 'block';

        // 3. API Call using GM_xmlhttpRequest
        const apiData = {
            bin: "970407",
            accountNo: "25127777777",
            accountName: "VU QUANG HUY",
            amount: String(amount),
            content: "Donate Locket Celebrity"
        };

        GM_xmlhttpRequest({
            method: "POST",
            url: "https://open.oapi.vn/banking/generate-qr",
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify(apiData),
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);

                    if (data && data.data && data.code === 'success') {
                        // 4. Success
                        qrImage.src = data.data;
                        qrImage.style.display = 'block';
                        loadingText.style.display = 'none';
                    } else {
                        // 5. API Error
                        throw new Error(data.message || 'Phản hồi API không hợp lệ.');
                    }
                } catch (e) {
                    // 5. JSON Parse or Logic Error
                    console.error('Lỗi khi parse response:', e, response.responseText); // Log thêm
                    errorText.textContent = `Lỗi xử lý: ${e.message}`;
                    errorText.style.display = 'block';
                    qrResultDiv.style.display = 'none'; // Hide the white box
                }
            },
            onerror: function(response) {
                // 5. Network Error
                console.error('Lỗi GM_xmlhttpRequest:', response);
                errorText.textContent = 'Lỗi mạng. Không thể kết nối tới API.';
                errorText.style.display = 'block';
                qrResultDiv.style.display = 'none';
            }
        });
    }

    /**
     * Cài đặt TOÀN BỘ điều khiển UI (ĐÃ CẬP NHẬT - Thêm listener format tiền)
     */
    function setupMainUIControls() {
        // --- Điều khiển chung (cho mọi trang) ---
        const mainContainer = document.getElementById('auto-celeb-main-container');
        const collapseToggle = document.getElementById('auto-celeb-collapse-toggle');
        const popupTitle = document.getElementById('auto-celeb-popup-title');

        const toggleCollapse = (e) => {
            mainContainer.classList.toggle('collapsed');
        };

        if (collapseToggle && mainContainer) {
            collapseToggle.addEventListener('click', toggleCollapse);
        }
        if (popupTitle && mainContainer) {
            popupTitle.addEventListener('click', toggleCollapse);
        }

        // --- MỚI: Logic cho Key Wall (luôn chạy) ---
        const btnSubmitKey = document.getElementById('btn-submit-key');
        const keyInput = document.getElementById('key-input-field');
        const keyError = document.getElementById('key-error-message');

        const validateKey = () => {
            const inputVal = keyInput.value.trim();
            if (inputVal === CONFIG.SECRET_KEY) {
                // ĐÚNG KEY
                localStorage.setItem(CONFIG.KEY_STORAGE_KEY, inputVal);
                mainContainer.classList.remove('locked');
                alert('Kích hoạt thành công! Cảm ơn bạn đã sử dụng.');
                keyError.style.display = 'none';
                keyInput.classList.remove('shake');
            } else {
                // SAI KEY
                keyError.style.display = 'block';
                keyInput.classList.add('shake');
                setTimeout(() => keyInput.classList.remove('shake'), 300);
            }
        };

        if(btnSubmitKey && keyInput && keyError) {
            btnSubmitKey.addEventListener('click', validateKey);
            // Cho phép nhấn Enter để xác thực
            keyInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    validateKey();
                }
            });
        }

        // Nút "Lấy Key" không cần listener vì nó là thẻ <a> với target="_blank"

        // --- MỚI: Điều khiển cho trang khác ---
        const redirectButton = document.getElementById('auto-celeb-redirect-button');
        if (redirectButton) {
            redirectButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[Auto Locket Celeb] ➡️ Đang chuyển hướng về celebrity.html...');
                window.location.href = CONFIG.TARGET_PAGE;
            });
        }

        // --- Điều khiển chỉ dành cho trang celebrity.html ---
        const plusBtn = document.getElementById('timer-plus-btn');
        const minusBtn = document.getElementById('timer-minus-btn');
        const toggleInput = document.getElementById('timer-toggle-input');
        const timerUI = document.getElementById('auto-celeb-timer-ui');

        if (plusBtn && minusBtn && toggleInput && timerUI) {
            // *** BẮT ĐẦU SỬA (Task 1) ***
            plusBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                if (activeTimerId) return;

                if (currentTimerConfig.minutes === 1) {
                    currentTimerConfig.minutes = 5;
                } else {
                    currentTimerConfig.minutes += 5;
                }

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
                } else if (currentTimerConfig.minutes === 5) {
                    currentTimerConfig.minutes = 1;
                    log(`Giảm thời gian hẹn giờ xuống: ${currentTimerConfig.minutes} phút.`, 'timer');
                } else { // currentTimerConfig.minutes là 1
                    currentTimerConfig.minutes = 1;
                    log(`Thời gian hẹn giờ tối thiểu là 1 phút.`, 'timer');
                }
                saveTimerConfig();
                updateTimerUI();
            });
            // *** KẾT THÚC SỬA (Task 1) ***

            toggleInput.addEventListener('change', (event) => {
                event.stopPropagation();
                if (activeTimerId) {
                    toggleInput.checked = true;
                    return;
                }
                currentTimerConfig.enabled = toggleInput.checked;
                log(`Hẹn giờ ${currentTimerConfig.enabled ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}.`, 'timer');
                saveTimerConfig();
                updateTimerUI();
            });

            timerUI.addEventListener('click', (event) => {
                if (!event.target.closest('.timer-adjust-btn') && !event.target.closest('#timer-toggle-switch')) {
                    if (window.location.href !== CONFIG.TARGET_PAGE) {
                        log('Đang ở trang khác. Chuyển hướng về celebrity.html...');
                        window.location.href = CONFIG.TARGET_PAGE;
                    }
                }
            });
        }

        // --- MỚI: Logic cho các nút footer và modals (Chạy trên cả 2 trang) ---
        const btnUpdate = document.getElementById('btn-update');
        const btnBugReport = document.getElementById('btn-bug-report');
        const btnDonate = document.getElementById('btn-donate'); // Nút này vẫn tồn tại
        const btnGenerateQR = document.getElementById('btn-generate-qr'); // <-- MỚI (Task 7)

        const modalOverlay = document.getElementById('auto-celeb-modal-overlay');
        const modalBug = document.getElementById('modal-bug-report');
        const modalUpdate = document.getElementById('modal-update');
        const modalDonate = document.getElementById('modal-donate'); // <-- MỚI (Task 7)

        const allModals = document.querySelectorAll('.auto-celeb-modal');
        const allCloseButtons = document.querySelectorAll('.auto-celeb-modal-close');

        // Hàm helper để đóng tất cả modal
        const closeAllModals = () => {
            if (modalOverlay) modalOverlay.style.display = 'none';
            allModals.forEach(modal => {
                if (modal) modal.style.display = 'none';
            });
        };

        // Nút Update
        if (btnUpdate && modalUpdate && modalOverlay) {
            btnUpdate.addEventListener('click', (e) => {
                e.preventDefault();
                modalOverlay.style.display = 'block';
                modalUpdate.style.display = 'block';
            });
        }

        // Nút Báo lỗi
        if (btnBugReport && modalBug && modalOverlay) {
            btnBugReport.addEventListener('click', (e) => {
                e.preventDefault();
                modalOverlay.style.display = 'block';
                modalBug.style.display = 'block';
            });
        }

        // Nút Donate (*** ĐÃ SỬA - Task 7 ***)
        if (btnDonate && modalDonate && modalOverlay) {
            btnDonate.addEventListener('click', (e) => {
                e.preventDefault();

                // Reset QR modal khi mở
                document.getElementById('donate-amount-input').value = '';
                document.getElementById('donate-qr-result').style.display = 'none';
                document.getElementById('donate-error-message').style.display = 'none';
                document.getElementById('donate-qr-image').src = '';

                // (Task 12) Ẩn suffix VND khi mở modal
                const suffix = document.querySelector('.donate-suffix');
                if (suffix) suffix.style.display = 'none';


                modalOverlay.style.display = 'block';
                modalDonate.style.display = 'block';
            });
        }

        // *** MỚI: Logic cho nút "Tạo mã QR" (Task 7) ***
        if (btnGenerateQR) {
            btnGenerateQR.addEventListener('click', (e) => {
                e.preventDefault();
                generateDonateQR();
            });
        }

        // *** MỚI: Logic cho nút copy link update ***
        const btnCopyUpdateLink = document.getElementById('btn-copy-update-link');
        if (btnCopyUpdateLink) {
            btnCopyUpdateLink.addEventListener('click', (e) => {
                e.preventDefault();

                // Tránh copy nhiều lần
                if (btnCopyUpdateLink.classList.contains('copied')) return;

                navigator.clipboard.writeText(CONFIG.UPDATE_URL).then(() => {
                    // Thành công
                    const originalText = btnCopyUpdateLink.textContent;
                    btnCopyUpdateLink.textContent = 'Đã copy!';
                    btnCopyUpdateLink.classList.add('copied');

                    setTimeout(() => {
                        btnCopyUpdateLink.textContent = originalText;
                        btnCopyUpdateLink.classList.remove('copied');
                    }, 2000); // Reset sau 2 giây

                }).catch(err => {
                    // Thất bại (hiếm)
                    console.error('[Auto Locket Celeb] Lỗi khi copy link: ', err);
                    alert('Lỗi khi copy. Vui lòng thử lại.');
                });
            });
        }
        // *** HẾT: Logic nút copy ***

        // *** MỚI: Logic format tiền cho ô Donate ***
        const donateInput = document.getElementById('donate-amount-input');
        if (donateInput) {
            donateInput.addEventListener('input', (e) => {
                // 1. Lấy giá trị, xóa mọi thứ không phải số
                let value = e.target.value.replace(/[^0-9]/g, '');

                // 2. Nếu có giá trị
                if (value.length > 0) {
                    // Chuyển thành số để xóa số 0 ở đầu (vd: "0050" -> 50)
                    // Dùng BigInt để hỗ trợ số tiền lớn
                    const numValue = BigInt(value);
                    // 3. Format lại và gán vào input
                    e.target.value = numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                } else {
                    // 4. Nếu rỗng, set rỗng
                    e.target.value = '';
                }
            });
        }
        // *** HẾT: Logic format tiền ***

        // Sự kiện đóng modal
        if (modalOverlay) modalOverlay.addEventListener('click', closeAllModals);
        allCloseButtons.forEach(btn => btn.addEventListener('click', closeAllModals));
    }


    /**
     * MỚI: Định dạng thời gian thành HH:MM:SS
     */
    function formatTimeWithHours(totalSeconds) {
        const absSeconds = Math.abs(totalSeconds);
        const hours = Math.floor(absSeconds / 3600);
        const minutes = Math.floor((absSeconds % 3600) / 60);
        const seconds = Math.floor(absSeconds % 60);

        const sign = totalSeconds < 0 ? '-' : '';

        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * MỚI: Tìm nút trên trang bằng text (chính xác)
     */
    function findButtonByText(text) {
        const buttons = document.querySelectorAll('button');
        const searchText = text.trim().toLowerCase();
        for (const button of buttons) {
            const buttonText = button.textContent.trim().toLowerCase();
            if (buttonText === searchText) {
                return button;
            }
        }
        return null;
    }


    // --- CÁC HÀM LOGIC CHÍNH (CELEB) ---

    function startReloadTimer(minutes) {
        currentTimerTotalDuration = minutes * 60;

        if (activeTimerId) clearInterval(activeTimerId);
        let endTimeStr = sessionStorage.getItem(CONFIG.TIMER_END_TIME_KEY);
        let endTime;
        if (!endTimeStr) {
            const durationInSeconds = currentTimerTotalDuration;
            endTime = Date.now() + durationInSeconds * 1000;
            sessionStorage.setItem(CONFIG.TIMER_END_TIME_KEY, endTime.toString());
            log(`Đã BẮT ĐẦU đồng hồ đếm ngược. Reset sau ${minutes} phút.`, 'timer');
        } else {
            endTime = parseInt(endTimeStr, 10);
            const remainingMinutes = ((endTime - Date.now()) / 60000).toFixed(1);
            log(`Đã TIẾP TỤC đồng hồ đếm ngược (còn ${remainingMinutes} phút).`, 'timer');
        }
        function updateCountdown() {
            const now = Date.now();
            const secondsRemaining = (endTime - now) / 1000;
            if (secondsRemaining <= 0) {
                clearInterval(activeTimerId);
                activeTimerId = null;
                sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
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
        if (webLogObserver) clearInterval(webLogObserver); // <-- MỚI: Dừng theo dõi
        if (activeTimerId) {
            clearInterval(activeTimerId);
            activeTimerId = null;
            log('Đã hủy đồng hồ đếm ngược.', 'info');
            updateTimerUI();
        }
        sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
    }

    function executeTimerReset() {
        if (webLogObserver) clearInterval(webLogObserver); // <-- MỚI: Dừng theo dõi
        log('Hẹn giờ kết thúc. ĐANG ĐẶT CỜ RESTART VÀ TẢI LẠI TRANG...', 'timer');
        localStorage.setItem(CONFIG.TIMER_RESTART_KEY, 'true');
        sessionStorage.removeItem(CONFIG.STORAGE_KEY);
        sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
        // *** KHÔNG XÓA LOG_STORAGE_KEY (Task 2) ***
        location.reload();
    }

    /**
     * *** MỚI (Task 2) ***
     * Hiển thị modal đếm ngược 10 giây trước khi chạy script để tránh lag.
     * @param {function} callback - Hàm (startProcess) sẽ được gọi sau khi đếm ngược xong.
     */
    function showPreRunCountdown(callback) {
        const overlay = document.createElement('div');
        overlay.id = 'auto-celeb-pre-run-overlay';
        overlay.innerHTML = `
            <div id="auto-celeb-pre-run-modal">
                <h2>Tránh Lag (Máy yếu)</h2>
                <p>Script sẽ tự động bắt đầu sau:</p>
                <div id="auto-celeb-pre-run-timer">10</div>
            </div>
        `;
        document.body.appendChild(overlay);

        let countdown = 10;
        const timerElement = document.getElementById('auto-celeb-pre-run-timer');

        const interval = setInterval(() => {
            countdown--;
            if (timerElement) {
                timerElement.textContent = countdown;
            }

            if (countdown <= 0) {
                clearInterval(interval);
                if (overlay) {
                    overlay.remove();
                }
                callback(); // Chạy hàm startProcess
            }
        }, 1000);
    }

    /**
     * SỬA LẠI: Hàm này sẽ kiểm tra cả 2 loại popup
     */
    function closeNotificationPopup() {
        // 1. Logic cũ để đóng #notificationPopup
        try {
            const oldCloseButton = document.querySelector('#notificationPopup .close, #notificationPopup [data-dismiss="modal"]');
            const oldPopup = document.querySelector('#notificationPopup');
            if (oldCloseButton && oldPopup?.style.display !== 'none') {
                log('Phát hiện popup thông báo cũ. Tự động đóng...', 'info');
                oldCloseButton.click();
            }
        } catch (e) { /* Bỏ qua lỗi */ }

        // 2. Logic MỚI để đóng "THÔNG BÁO QUAN TRỌNG"
        try {
            const allTitles = document.querySelectorAll('h5, h4, strong, div.modal-title');
            let titleElement = null;
            for (const el of allTitles) {
                if (el.textContent.trim() === 'THÔNG BÁO QUAN TRỌNG') {
                    titleElement = el;
                    break;
                }
            }

            if (!titleElement) return; // Không tìm thấy, thoát

            const modal = titleElement.closest('.modal, .modal-dialog, .modal-content');
            if (modal && (modal.style.display !== 'none' && !modal.classList.contains('hidden'))) {

                const buttons = modal.querySelectorAll('button, a');
                for (const btn of buttons) {
                    if (btn.textContent.trim() === 'Đóng') {
                        log('Phát hiện "Thông Báo Quan Trọng". Tự động đóng...', 'info');
                        btn.click();
                        return; // Đã click, thoát
                    }
                }
            }
        } catch (e) { /* Bỏ qua lỗi */ }
    }


    function scrollToCelebSection() {
        const section = document.getElementById('usernameSearch');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function waitForElementById(elementId, timeout = 180000, interval = 500) {
        return new Promise((resolve, reject) => {
            let elapsedTime = 0;
            const check = () => {
                const element = document.getElementById(elementId);
                if (element) {
                    resolve(element);
                } else {
                    elapsedTime += interval;
                    if (elapsedTime >= timeout) {
                        log(`Hết thời gian chờ element ID: ${elementId}`, 'error');
                        reject(new Error(`Timeout waiting for element ID: ${elementId}`));
                    } else {
                        setTimeout(check, interval);
                    }
                }
            };
            check();
        });
    }

    /**
     * *** MỚI (Task 14): Hàm tìm ID celeb cuối cùng ***
     */
    function findLastCelebId() {
        const profileCards = document.querySelectorAll('div.profile');
        let lastCelebId = null;

        // Lấy celeb cuối cùng CÓ THỂ THÊM
        profileCards.forEach(card => {
            const addButton = card.querySelector('button.showMoreBtn');
            const idElement = card.querySelector('[id$="_parentElement"]');
            if (addButton && idElement && addButton.textContent.includes('Thêm bạn bè')) {
                lastCelebId = idElement.id.replace('_parentElement', '');
            }
        });
        return lastCelebId;
    }


    /**
     * *** ĐÃ SỬA (Task 14): Thêm bộ đếm lỗi kết nối ***
     */
    async function startRealtimeLogObserver(celebId) {
        if (webLogObserver) {
            clearInterval(webLogObserver);
            webLogObserver = null;
        }

        const webLogId = celebId + '_log';
        let webLogTextarea;
        try {
            // Chờ cho textarea log của web xuất hiện
            webLogTextarea = await waitForElementById(webLogId, 10000, 250);
        } catch (e) {
            log(`Không tìm thấy nhật ký web (${webLogId}). Không thể đồng bộ real-time.`, 'warn');
            return;
        }

        const scriptLog = document.getElementById('auto-celeb-script-log');
        if (!scriptLog) return; // Thoát nếu không có script log

        // *** MỚI (Task 14): Reset bộ đếm lỗi kết nối khi BẮT ĐẦU theo dõi ***
        // Chỉ reset nếu nó không phải là một phần của quá trình reset celeb (tránh vòng lặp)
        const needsCelebRestart = localStorage.getItem(CONFIG.CELEB_RESTART_KEY) === 'true';
        if (!needsCelebRestart) {
            sessionStorage.setItem(CONFIG.CONNECTION_LOST_COUNTER_KEY, '0');
        }

        log(`Bắt đầu theo dõi nhật ký của ${celebId}...`, 'info');

        let lastLogContent = ""; // <-- Reset khi bắt đầu theo dõi

        webLogObserver = setInterval(() => {
            const currentScriptLog = document.getElementById('auto-celeb-script-log');
            const currentWebLog = document.getElementById(webLogId); // Lấy lại DOM

            if (!currentScriptLog || !currentWebLog) {
                clearInterval(webLogObserver);
                webLogObserver = null;
                return;
            }

            const newLogContent = currentWebLog.value;
            let addedText = ""; // <-- Store added text

            // --- LOGIC MỚI ĐÃ SỬA LỖI ---
            if (newLogContent === lastLogContent) {
                return; // Không có gì thay đổi
            }

            if (newLogContent.length > lastLogContent.length) {
                // Trường hợp BÌNH THƯỜNG: Log được thêm vào
                addedText = newLogContent.substring(lastLogContent.length);
                currentScriptLog.value += addedText; // Thêm vào script log

                // MỚI (Task 2): Thêm vào sessionStorage
                let storedLog = sessionStorage.getItem(CONFIG.LOG_STORAGE_KEY) || "";
                storedLog += addedText;
                sessionStorage.setItem(CONFIG.LOG_STORAGE_KEY, storedLog);

                lastLogContent = newLogContent;
                currentScriptLog.scrollTop = currentScriptLog.scrollHeight;
            } else if (newLogContent.length < lastLogContent.length) {
                // Trường hợp ĐẶC BIỆT: Log đã bị XÓA và ghi lại (khi nhấn "Bắt đầu")
                addedText = newLogContent; // Toàn bộ nội dung là mới
                currentScriptLog.value += newLogContent; // Thêm toàn bộ nội dung mới

                // MỚI (Task 2): Thêm vào sessionStorage
                let storedLog = sessionStorage.getItem(CONFIG.LOG_STORAGE_KEY) || "";
                storedLog += newLogContent;
                sessionStorage.setItem(CONFIG.LOG_STORAGE_KEY, storedLog);

                lastLogContent = newLogContent; // Đặt lại baseline
                currentScriptLog.scrollTop = currentScriptLog.scrollHeight;
            }
            // --- HẾT LOGIC MỚI ---

            // *** MỚI (Task 14): KIỂM TRA LỖI KẾT NỐI ***
            if (addedText.includes(CONFIG.CONNECTION_LOST_TRIGGER_STRING)) {
                let counter = parseInt(sessionStorage.getItem(CONFIG.CONNECTION_LOST_COUNTER_KEY) || '0', 10);
                counter++;
                sessionStorage.setItem(CONFIG.CONNECTION_LOST_COUNTER_KEY, String(counter));
                log(`Phát hiện mất kết nối lần ${counter}/${CONFIG.CONNECTION_LOST_MAX_RETRIES}.`, 'warn');

                if (counter > CONFIG.CONNECTION_LOST_MAX_RETRIES) {
                    log('Mất kết nối quá 5 lần. Đang reset lại celeb này...', 'error');
                    clearInterval(webLogObserver); // Dừng theo dõi
                    webLogObserver = null;

                    // Đặt cờ reset celeb
                    localStorage.setItem(CONFIG.CELEB_RESTART_KEY, 'true');

                    // Xóa bộ đếm
                    sessionStorage.removeItem(CONFIG.CONNECTION_LOST_COUNTER_KEY);

                    // Tải lại trang (KHÔNG clear state, KHÔNG clear timer)
                    location.reload();
                }
            }
            // *** HẾT MỚI (Task 14) ***

        }, 500); // Kiểm tra mỗi 0.5 giây
    }


    /**
     * *** ĐÃ SỬA (Task 1) ***
     * Chuyển startRealtimeLogObserver xuống khối if (celebIds.length === 0)
     */
    async function processNextCeleb(celebIds, totalCount) {
        if (webLogObserver) {
            clearInterval(webLogObserver);
            webLogObserver = null;
        }

        const state = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
        if (!state.isRunning) {
            log('Quá trình đã được dừng lại.', 'info');
            return;
        }
        if (celebIds.length === 0) {
            sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ ...state, finished: true }));
            updateControlButtonState({ isRunning: true });
            return;
        }
        const currentId = celebIds.shift();
        sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ isRunning: true, celebIds: [...celebIds], totalCount: totalCount }));
        let parentElement;
        try {
            const elementId = currentId + '_parentElement';
            parentElement = await waitForElementById(elementId, 180000, 500);
        } catch (error) {
            log(`Không tìm thấy container cho celeb ID: ${currentId} (sau 3 phút chờ). Bỏ qua.`, 'error');
            await processNextCeleb(celebIds, totalCount);
            return;
        }
        if (!parentElement) {
            log(`Không tìm thấy container cho celeb ID: ${currentId}. Bỏ qua.`, 'error');
            await processNextCeleb(celebIds, totalCount);
            return;
        }
        const profileDiv = parentElement.closest('.profile');
        const button = profileDiv ? profileDiv.querySelector('button.showMoreBtn') : null;
        const nameElement = profileDiv ? profileDiv.querySelector('.profile-name') : null;
        const celebName = nameElement ? nameElement.textContent.trim() : `ID: ${currentId}`;
        const processedCount = totalCount - celebIds.length;
        const countText = `(${processedCount}/${totalCount})`;
        if (!button || !button.textContent.includes('Thêm bạn bè')) {
            await processNextCeleb(celebIds, totalCount);
            return;
        }

        log(`${countText} Đang xử lý: ${celebName}`);

        showCelebPopup(celebName, countText);
        button.click(); // Click "Thêm bạn bè"
        await sleep(1000);

        // --- MỚI (Task 1): XÓA LỆNH startRealtimeLogObserver(currentId); ở đây ---

        const startButton = document.getElementById(currentId + '_startButton');
        if (startButton) {
            startButton.click(); // Đây là lúc log web bị reset
            await sleep(2000); // Chờ 2s để log bắt đầu chạy

            if (celebIds.length === 0) {
                // ===== ĐÂY LÀ CELEB CUỐI CÙNG =====
                log(`Đã xử lý celeb cuối cùng: ${celebName}.`, 'success');

                // *** MỚI (Task 1): Bắt đầu theo dõi log CHỈ KHI là celeb cuối ***
                log(`Bắt đầu theo dõi nhật ký của celeb cuối cùng (${celebName})...`, 'info');
                startRealtimeLogObserver(currentId); // <-- CHUYỂN XUỐNG ĐÂY

                sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ isRunning: true, celebIds: [], totalCount: totalCount, finished: true }));
                updateControlButtonState({ isRunning: true });

                // Xóa timeout 5s, để cho nó chạy mãi mãi (hoặc đến khi timer reset)
                return;
            } else {
                // ===== CHƯA PHẢI CELEB CUỐI =====
                const celebToolsLink = document.querySelector('a.nav-link[href="celebrity.html"]');
                if (celebToolsLink) {
                    celebToolsLink.click(); // Trang tải lại, interval tự mất
                } else {
                    log('LỖI: Không tìm thấy link "Celebrity Tools". Dừng script.', 'error');
                    stopProcess(false); // Dừng nếu không thể tải lại
                }
            }
        } else {
            log(`KHÔNG TÌM THẤY nút "Bắt đầu" cho ${celebName}. Bỏ qua.`, 'error');
            if (webLogObserver) clearInterval(webLogObserver); // Dừng theo dõi nếu lỗi
            await processNextCeleb(celebIds, totalCount);
        }
    }

    /**
     * *** ĐÃ SỬA (Task 2 & 14) ***
     * Thêm lệnh xóa log cũ và bộ đếm lỗi khi bắt đầu chạy mới
     */
    function startProcess() {
        // *** MỚI (Task 2): XÓA LOG CŨ KHI BẮT ĐẦU CHẠY MỚI ***
        sessionStorage.removeItem(CONFIG.LOG_STORAGE_KEY);
        sessionStorage.removeItem(CONFIG.CONNECTION_LOST_COUNTER_KEY); // <-- MỚI (Task 14)

        // Xóa cả nội dung textarea hiện tại
        const logTextarea = document.getElementById('auto-celeb-script-log');
        if (logTextarea) {
            logTextarea.value = ""; // Xóa sạch
        }
        // *** HẾT MỚI (Task 2) ***

        const profileCards = document.querySelectorAll('div.profile');
        if (profileCards.length === 0) {
            updateControlButtonState({ isRunning: false });
            return;
        }
        const celebIds = [];
        let errorCount = 0;
        profileCards.forEach(card => {
            const nameElement = card.querySelector('div.profile-name');
            const addButton = card.querySelector('button.showMoreBtn');
            const idElement = card.querySelector('[id$="_parentElement"]');
            if (nameElement && addButton && idElement) {
                const celebName = nameElement.textContent.trim();
                const buttonText = addButton.textContent.trim();
                if (buttonText.includes('Thêm bạn bè')) {
                    const celebId = idElement.id.replace('_parentElement', '');
                    celebIds.push(celebId);
                }
            } else {
                errorCount++;
            }
        });
        if (errorCount > 0) {
            log(`Đã bỏ qua ${errorCount} thẻ do lỗi cấu trúc (thiếu tên, nút hoặc ID).`, 'warn');
        }
        if (celebIds.length === 0) {
            log('Không tìm thấy celeb nào có thể thêm. Dừng lại.', 'info');
            updateControlButtonState({ isRunning: false });
            return;
        }
        const totalCount = celebIds.length;
        sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ isRunning: true, celebIds: [...celebIds], totalCount: totalCount }));
        updateControlButtonState({ isRunning: true });
        if (currentTimerConfig.enabled && currentTimerConfig.minutes > 0) {
            startReloadTimer(currentTimerConfig.minutes);
        }
        processNextCeleb(celebIds, totalCount);
    };

    /**
     * *** ĐÃ SỬA (Task 2 & 14) ***
     * Thêm lệnh xóa log và bộ đếm lỗi khi dừng
     */
    function stopProcess(shouldReload = true) {
        if (webLogObserver) clearInterval(webLogObserver); // <-- MỚI: Dừng theo dõi
        cancelReloadTimer();
        localStorage.removeItem(CONFIG.TIMER_RESTART_KEY);
        localStorage.removeItem(CONFIG.CELEB_RESTART_KEY); // <-- MỚI (Task 14)
        sessionStorage.removeItem(CONFIG.STORAGE_KEY);
        sessionStorage.removeItem(CONFIG.LOG_STORAGE_KEY); // *** MỚI (Task 2): XÓA LOG KHI DỪNG ***
        sessionStorage.removeItem(CONFIG.CONNECTION_LOST_COUNTER_KEY); // <-- MỚI (Task 14)

        log('Đã dừng quá trình tự động theo yêu cầu người dùng.', 'info');
        if (shouldReload) {
            log('Đang tải lại trang...');
            location.reload();
        } else {
            updateControlButtonState({ isRunning: false });
        }
    }

    // --- MỚI: CÁC HÀM LOGIC CHÍNH (FRIENDS) (ĐÃ SỬA LỖI) ---

    // *** BẮT ĐẦU: Code mới lấy từ tiện ích ***
    const SELECTORS = {
        searchInput: '#usernameSearchInput',
        searchButton: '#usernameSearchSubmit',
        profileResultContainer: '#usernameSearchStatus .profile',
        actionButton: '#usernameSearchStatus .profile button', // ID của nút là 'usernameAction'
    };

    /**
     * Hàm chờ đợi element (lấy từ tiện ích, mạnh mẽ hơn)
     * Chờ 1 element khớp với selector VÀ đang hiển thị
     */
    function waitForElement(selector, timeout = 3000) {
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                const element = document.querySelector(selector);
                // Kiểm tra element và xem nó có thực sự hiển thị không (offsetParent != null)
                if (element && element.offsetParent !== null) {
                    clearInterval(timeoutId);
                    clearInterval(interval);
                    resolve(element);
                }
            }, 100);
            let timeoutId = setTimeout(() => {
                clearInterval(interval);
                reject(new Error(`[Hàm chờ mới] Không tìm thấy element "${selector}" sau ${timeout}ms`));
            }, timeout);
        });
    }
    // *** KẾT THÚC: Code mới lấy từ tiện ích ***


    /**
     * MỚI: Cài đặt logic cho tool tìm bạn bè (SỬA LỖI)
     * *** ĐÃ SỬA: Dùng logic lặp và kiểm tra nút chính xác ***
     * *** ĐÃ SỬA (THEO YÊU CẦU MỚI): Thay đổi logic lặp/dừng ***
     */
    function setupFriendToolLogic() {
        const startButton = document.getElementById('auto-friend-start-button');
        // *** SỬA ĐỔI: Lấy <select> thay vì <input> ***
        const celebSelect = document.getElementById('friend-celeb-select');

        if (!startButton || !celebSelect) {
            console.error('[Auto Locket Celeb] Không tìm thấy UI tool bạn bè (nút hoặc select).');
            return;
        }

        const stopFriendSearchLoop = () => {
            if (friendSearchLoopId) {
                clearInterval(friendSearchLoopId);
                friendSearchLoopId = null;
            }
            isFriendSearchRunning = false;
            startButton.textContent = 'Bắt đầu Lặp';
            startButton.classList.remove('running');
            celebSelect.disabled = false; // Cho phép chọn lại
            log('Đã dừng lặp tìm kiếm.', 'info');
        };

        // *** LOGIC MỚI (THEO YÊU CẦU): LẶP/DỪNG CÓ ĐIỀU KIỆN ***
        const performSearch = async (uid) => {
            try {
                // 1. Kiểm tra UID hợp lệ (được truyền vào)
                if (!uid || uid === "") {
                    log('Lỗi: UID không hợp lệ. Bỏ qua vòng này và tiếp tục lặp.', 'error');
                    return; // Tiếp tục lặp
                }

                // 2. Tìm các phần tử của trang
                const pageInput = await waitForElement(SELECTORS.searchInput, 5000);
                const pageButton = await waitForElement(SELECTORS.searchButton, 5000);

                // 3. Xóa kết quả cũ (nếu có)
                const oldResult = document.querySelector(SELECTORS.profileResultContainer);
                if (oldResult) oldResult.remove();

                // 4. Nhập và nhấn "Tìm kiếm"
                // log(`Đang tìm kiếm: ${uid}`, 'info'); // Tắt log này cho đỡ spam
                pageInput.value = uid;
                pageInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                pageButton.click();

                // 5. Chờ kết quả xuất hiện
                await waitForElement(SELECTORS.profileResultContainer, 5000);
                const actionButton = document.querySelector(SELECTORS.actionButton);

                if (actionButton) {
                    const buttonText = actionButton.textContent.trim();
                    log(`Tìm thấy nút: "${buttonText}"`);

                    // *** LOGIC PHÂN LOẠI NÚT MỚI ***

                    // ===== 1. ĐIỀU KIỆN DỪNG (Đã là bạn / Chờ xác nhận) =====
                    if (buttonText.includes('Bạn bè') || buttonText.includes('Đã yêu cầu')) {
                        log('Phát hiện "Bạn bè" hoặc "Đã yêu cầu". DỪNG CÔNG CỤ.', 'success');
                        stopFriendSearchLoop(); // DỪNG LẶP
                        return;

                    // ===== 2. ĐIỀU KIỆN BỎ QUA (Hàng chờ / Hủy thông báo) =====
                    } else if (buttonText.includes('Thêm vào hàng chờ') || buttonText.includes('Hủy nhận thông báo')) {
                        log(`Bỏ qua nút "${buttonText}". Tiếp tục lặp...`, 'info');
                        return; // TIẾP TỤC LẶP (để interval chạy lại)

                    // ===== 3. ĐIỀU KIỆN HÀNH ĐỘNG (Thêm bạn bè) =====
                    } else if (buttonText.includes('Thêm bạn bè')) {
                        log(`Đang nhấn 'Thêm bạn bè', đang xác nhận...`, 'rocket');
                        actionButton.click();

                        // Vòng lặp xác nhận (Chờ tối đa 5 giây)
                        let isVerified = false;
                        for (let i = 0; i < 10; i++) { // Thử 10 lần x 0.5s = 5s
                            await new Promise(r => setTimeout(r, 500));
                            const updatedButton = document.querySelector(SELECTORS.actionButton);

                            if (!updatedButton) {
                                log('Nút đã biến mất sau khi click.', 'warn');
                                break;
                            }

                            const updatedText = updatedButton.textContent.trim();
                            if (updatedText.includes('Đã yêu cầu') || updatedText.includes('Bạn bè')) {
                                log(`Xác nhận thành công: "${updatedText}". DỪNG CÔNG CỤ.`, 'success');
                                isVerified = true;
                                break;
                            }
                        }

                        // Quyết định dừng hay tiếp tục sau khi click
                        if (isVerified) {
                            stopFriendSearchLoop(); // DỪNG LẶP
                        } else {
                            log('Không thể xác nhận nút đổi. Tiếp tục lặp để thử lại...', 'warn');
                            // Không dừng, để interval chạy lại
                        }
                        return;

                    // ===== 4. CÁC TRƯỜNG HỢP KHÁC (Full, nút lạ, v.v.) =====
                    } else {
                        log(`Không nhận diện được nút "${buttonText}". Tiếp tục lặp...`, 'warn');
                        return; // TIẾP TỤC LẶP
                    }

                } else {
                    // Không tìm thấy nút (user không tồn tại?)
                    log('Không tìm thấy nút hành động (user không tồn tại?). Tiếp tục lặp...', 'warn');
                    return; // TIẾP TỤC LẶP
                }

            } catch (e) {
                // 7. Xử lý lỗi (hết giờ chờ)
                log(`Lỗi khi tìm kiếm: ${e.message}. Tiếp tục lặp...`, 'error');
                return; // TIẾP TỤC LẶP
            }
        };
        // *** HẾT LOGIC MỚI ***

        const startFriendSearchLoop = (uid) => {
            if (isFriendSearchRunning) return; // Đang chạy

            isFriendSearchRunning = true;
            startButton.textContent = 'Dừng Lặp';
            startButton.classList.add('running');
            celebSelect.disabled = true; // Không cho đổi celeb khi đang chạy
            log(`Bắt đầu lặp tìm kiếm cho: ${uid}`, 'rocket');

            // *** LOGIC LẶP (Request 1) ***
            performSearch(uid); // Chạy 1 lần ngay lập tức
            friendSearchLoopId = setInterval(() => performSearch(uid), 3000); // Lặp lại mỗi 3 giây
        };

        // Listener cho nút "Bắt đầu Lặp"
        startButton.addEventListener('click', () => {
            if (isFriendSearchRunning) {
                stopFriendSearchLoop();
            } else {
                // *** SỬA ĐỔI: Lấy UID từ <select> ***
                const selectedUid = celebSelect.value;
                if (!selectedUid || selectedUid === "") {
                    // *** SỬA ĐỔI: Dùng log thay vì alert ***
                    log('Vui lòng chọn một Celeb từ danh sách.', 'warn');
                    return;
                }
                startFriendSearchLoop(selectedUid);
            }
        });

        // Không cần listener 'focus' cho select box nữa
    }

    // *** MỚI: Hàm nạp Celeb vào Dropdown ***
    function populateCelebDropdown() {
        const celebSelect = document.getElementById('friend-celeb-select');
        if (!celebSelect) return;

        CELEB_LIST.forEach(celeb => {
            const option = document.createElement('option');
            option.value = celeb.uid;
            option.textContent = celeb.name;
            celebSelect.appendChild(option);
        });
    }


    // --- Main Execution (ĐÃ CẬP NHẬT) ---
    (function main() {
        console.log('[Auto Locket Celeb] ➡️ Userscript đã được kích hoạt (v_fixed_left_imgur).');

        // MỚI: Luôn chạy trình kiểm tra popup (cũ và mới)
        setInterval(closeNotificationPopup, 1000); // Kiểm tra mỗi giây

        // 1. Luôn tạo UI (UI sẽ tự điều chỉnh theo trang)
        try {
            injectNewStyles();
            createMainControlUI();
            loadTimerConfig();
            setupMainUIControls();
            loadPersistentLog(); // *** MỚI (Task 2): GỌI HÀM TẢI LOG ***
        } catch (e) {
            console.error('[Auto Locket Celeb] Lỗi khi khởi tạo UI chính: ', e);
            return;
        }

        // --- MỚI: Kiểm tra Key (LOGIC ĐÃ SỬA) ---
        const storedKey = localStorage.getItem(CONFIG.KEY_STORAGE_KEY);
        const isKeyValidated = (storedKey === CONFIG.SECRET_KEY);

        const container = document.getElementById('auto-celeb-main-container');
        if (isKeyValidated) {
            container.classList.remove('locked');
        } else {
            container.classList.add('locked');
            // *** SỬA LỖI (LOGIC): Xóa key cũ nếu không khớp ***
            localStorage.removeItem(CONFIG.KEY_STORAGE_KEY);
        }
        // --- Hết: Kiểm tra Key ---


        // 2. Chỉ chạy logic chính (bắt đầu, dừng, chạy ngầm) tùy theo trang
        if (window.location.href === CONFIG.TARGET_PAGE) {

            const controlButton = document.getElementById('auto-celeb-control-button');
            if (isKeyValidated && !controlButton) {
                // Chỉ báo lỗi nếu key đã hợp lệ mà không tìm thấy nút
                console.error('[Auto Locket Celeb] ➡️ Đã kích hoạt nhưng không tìm thấy control button trên trang target.');
                return;
            }

            if(controlButton) {
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
            }

            // Chỉ chạy logic tự động nếu key đã được kích hoạt
            if (isKeyValidated) {
                runCelebLogic();
            }

        } else if (window.location.href === CONFIG.FRIENDS_PAGE) { // <-- MỚI
            console.log('[Auto Locket Celeb] ➡️ Đang ở trang Friends.');
            if (isKeyValidated) {
                // SỬA LẠI: Chờ DOM của trang friends tải xong
                // Đợi ô input gốc của trang xuất hiện (dùng logic mới)
                const checkPageReady = setInterval(async () => {
                    try {
                        // Dùng hàm chờ mới để kiểm tra
                        await waitForElement(SELECTORS.searchInput, 500);
                        await waitForElement(SELECTORS.searchButton, 500);

                        // Nếu cả 2 đều tồn tại, dừng interval và setup
                        clearInterval(checkPageReady);

                        // *** SỬA ĐỔI: Thêm 2 hàm này ***
                        populateCelebDropdown(); // Nạp Celeb vào <select>
                        setupFriendToolLogic(); // Kích hoạt listener cho tool mới
                    } catch (e) {
                        // Vẫn chờ...
                    }
                }, 500);
            }
        } else {
            // Ở các trang khác, không cần làm gì thêm
            console.log('[Auto Locket Celeb] ➡️ Đang ở trang phụ.');
        }


        /**
         * *** ĐÃ SỬA (Task 14): Thêm logic check 'needsCelebRestart' ***
         */
        async function runCelebLogic() {
            try {
                await waitForElementById('usernameSearch', 20000);
                scrollToCelebSection();

                let currentState = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}'); // <-- Sửa thành 'let'
                const needsTimerRestart = localStorage.getItem(CONFIG.TIMER_RESTART_KEY) === 'true';
                const needsCelebRestart = localStorage.getItem(CONFIG.CELEB_RESTART_KEY) === 'true'; // <-- MỚI

                updateControlButtonState(currentState);


                if (needsTimerRestart) {
                    log('PHÁT HIỆN CỜ RESTART (TIMER). Tự động bắt đầu sau 10 giây...', 'timer');
                    localStorage.removeItem(CONFIG.TIMER_RESTART_KEY);
                    localStorage.removeItem(CONFIG.CELEB_RESTART_KEY); // Xóa luôn cờ reset celeb nếu có

                    // Xóa log cũ khi restart đầy đủ (đã chuyển vào startProcess)
                    showPreRunCountdown(startProcess);

                } else if (needsCelebRestart) { // <-- MỚI (Task 14)
                    log('PHÁT HIỆN CỜ RESET CELEB. Đang chạy lại celeb cuối...', 'warn');
                    localStorage.removeItem(CONFIG.CELEB_RESTART_KEY);

                    const lastCelebId = findLastCelebId();

                    if (lastCelebId && currentState.isRunning) {
                        log(`Tìm thấy celeb cuối: ${lastCelebId}. Chuẩn bị chạy lại...`, 'info');
                        // Sửa lại state để chạy lại celeb cuối
                        currentState.finished = false;
                        currentState.celebIds = [lastCelebId];
                        // Ghi đè lại state
                        sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(currentState));
                    } else {
                        log('Không tìm thấy celeb cuối để reset, hoặc script đã dừng.', 'error');
                    }
                    // Sẽ tự động rơi vào block tiếp theo

                }

                // --- Logic chạy chính (sẽ bắt cả lần chạy thường và chạy reset celeb) ---

                if (currentState.isRunning && !currentState.finished && currentState.celebIds && currentState.celebIds.length > 0) {
                    // (Chạy bình thường / chạy lại celeb cuối)
                    log('Tiếp tục xử lý danh sách celeb...', 'info'); // <-- DÒNG NÀY SẼ BỊ LỌC
                    if (currentTimerConfig.enabled && currentTimerConfig.minutes > 0) {
                        startReloadTimer(currentTimerConfig.minutes);
                    }
                    processNextCeleb(currentState.celebIds, currentState.totalCount);

                } else if (currentState.isRunning && currentState.finished) {
                    // (Đã chạy xong, đang theo dõi log celeb cuối)
                    log('Đã hoàn thành. Đang ở chế độ theo dõi celeb cuối.', 'info');
                    if (currentTimerConfig.enabled && currentTimerConfig.minutes > 0) {
                        startReloadTimer(currentTimerConfig.minutes);
                    }

                    const state = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
                    if(state.finished && (!state.celebIds || state.celebIds.length === 0)) {
                        const lastCelebId = findLastCelebId(); // Dùng helper function
                        if (lastCelebId) {
                            if (!webLogObserver) {
                                log('Đang theo dõi nhật ký của celeb cuối cùng...', 'info');
                                startRealtimeLogObserver(lastCelebId);
                            }
                        }
                    }
                }

            } catch (error) {
                log('Kiểm tra 20s: HẾT GIỜ. Container (usernameSearch) không tải. Đang reload trang...', 'error');

                const celebToolsLink = document.querySelector('a.nav-link[href="celebrity.html"]');
                if (celebToolsLink) {
                    log('Đang click "Celebrity Tools" để tải lại.');
                    celebToolsLink.click();
                } else {
                    log('LỖI: Không tìm thấy "Celebrity Tools". Dùng location.reload().', 'error');
                    location.reload();
                }
            }
        }

    })();
})();
