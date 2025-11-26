import { CONFIG } from './config';
import { log, formatTimeWithHours } from './utils';
import { startProcessFromModal, stopProcess, scanForCelebs, loadTimerConfig, saveTimerConfig, currentTimerConfig, currentTimerTotalDuration } from './logic';

export function createMainControlUI() {
    const container = document.createElement('div');
    container.id = 'auto-celeb-main-container';

    // 1. Header
    container.innerHTML = `
        <div id="auto-celeb-popup-header">
            <span id="auto-celeb-popup-title">
                <img src="${CONFIG.LOGO_URL}" id="auto-celeb-title-icon">
                Locket Celebrity ${CONFIG.SCRIPT_VERSION}
            </span>
            <span id="auto-celeb-collapse-toggle">&#9660;</span>
        </div>
    `;

    const isCelebPage = window.location.href === CONFIG.TARGET_PAGE;
    const isFriendPage = window.location.href === CONFIG.FRIENDS_PAGE;

    // 2. Tabs
    const tabNav = document.createElement('div');
    tabNav.id = 'auto-celeb-tab-nav';
    // Đã đổi thứ tự tab
    tabNav.innerHTML = `
        <a id="tab-friend-tools" class="nav-tab ${isFriendPage ? 'active' : ''}" href="${CONFIG.FRIENDS_PAGE}">Friends</a>
        <a id="tab-celeb-tools" class="nav-tab ${isCelebPage ? 'active' : ''}" href="${CONFIG.TARGET_PAGE}">Celebrity Tools</a>
    `;
    container.appendChild(tabNav);

    // 3. Key Wall
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

    // 4. Nội dung tùy trang
    if (isCelebPage) {
        const openDashboardButton = document.createElement('button');
        openDashboardButton.id = 'auto-celeb-open-dashboard-btn';
        openDashboardButton.textContent = 'Mở Bảng Điều Khiển';
        container.appendChild(openDashboardButton);
    } else if (isFriendPage) {
        const friendTool = document.createElement('div');
        friendTool.id = 'auto-friend-tool-wrapper';
        friendTool.innerHTML = `
            <h3 id="friend-tool-title">TÌM KIẾM TỰ ĐỘNG</h3>
            <p id="friend-tool-note">Chỉ add được đối với tài khoản Locket Celeb!</p>
            <select id="friend-celeb-select">
                <option value="" selected disabled>-- Chọn Celeb để chạy --</option>
            </select>
            <button id="auto-friend-start-button">Bắt đầu Lặp</button>
        `;
        container.appendChild(friendTool);
    } else {
        const redirectButtons = document.createElement('div');
        redirectButtons.id = 'auto-celeb-redirect-buttons';
        redirectButtons.innerHTML = `
            <a href="${CONFIG.TARGET_PAGE}" class="auto-celeb-redirect-button">➡️ Về trang Celebrity</a>
            <a href="${CONFIG.FRIENDS_PAGE}" class="auto-celeb-redirect-button">➡️ Về trang Friends</a>
        `;
        container.appendChild(redirectButtons);
    }

    document.body.appendChild(container);

    // Thêm HTML cho Modals
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
        <div id="auto-celeb-modal-overlay" style="display: none;"></div>

        <div id="celeb-dashboard-modal" class="auto-celeb-modal" style="display: none;">
            <span class="auto-celeb-modal-close">&times;</span>

            <div id="modal-dashboard-layout">
                <div id="modal-celeb-list-wrapper">
                    <h3>Danh sách Locket Celeb</h3>
                    <div id="celeb-select-all-label"> <span id="celeb-select-all-text">Chọn tất cả</span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="celeb-select-all-input" class="toggle-switch-input sr-only" checked>
                            <label for="celeb-select-all-input" class="toggle-switch-label">
                                <span class="toggle-switch-handle"></span>
                            </label>
                        </div>
                    </div>

                    <div id="celeb-selection-list">
                        <p style="color: #aaa;">Đang quét danh sách celeb...</p>
                    </div>
                </div>

                <div id="modal-celeb-controls-wrapper">

                    <button id="dashboard-control-button">Bắt đầu Auto Celeb</button>

                    <div id="dashboard-timer-ui">
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
                        <div id="timer-toggle-switch" class="toggle-switch">
                            <input type="checkbox" id="timer-toggle-input" class="toggle-switch-input sr-only">
                            <label for="timer-toggle-input" class="toggle-switch-label">
                                <span class="toggle-switch-handle"></span>
                            </label>
                        </div>
                    </div>

                    <div id="dashboard-log-wrapper">
                        <label for="dashboard-script-log">Nhật ký hệ thống (Script)</label>
                        <textarea id="dashboard-script-log" rows="10" disabled=""></textarea>
                    </div>

                    <div id="dashboard-footer-buttons">
                        <button id="btn-update" class="footer-btn">Update</button>
                        <button id="btn-bug-report" class="footer-btn">Báo lỗi</button>
                        <button id="btn-donate" class="footer-btn">Donate</button>
                    </div>

                </div>
            </div>
        </div>

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
            <p class="update-text">Vui lòng cập nhật phiên bản mới.</p>
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

export function showCelebPopup(celebName, countText) {
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

export function openDashboardModal() {
    const modal = document.getElementById('celeb-dashboard-modal');
    const overlay = document.getElementById('auto-celeb-modal-overlay');
    const listContainer = document.getElementById('celeb-selection-list');
    const logTextarea = document.getElementById('dashboard-script-log');
    const selectAllInput = document.getElementById('celeb-select-all-input');

    if (!modal || !overlay || !listContainer || !logTextarea) {
        alert('Lỗi: Không thể tải Bảng điều khiển. Vui lòng tải lại trang.');
        return;
    }

    const celebs = scanForCelebs();
    listContainer.innerHTML = '';
    selectAllInput.checked = true;

    if (celebs.length === 0) {
        listContainer.innerHTML = '<p style="color: #aaa;">Không tìm thấy celeb nào để thêm.</p>';
    } else {
        celebs.forEach(celeb => {
            const item = document.createElement('div');
            item.className = 'celeb-list-item-new selected';
            item.dataset.celebId = celeb.id;
            const inputId = `celeb-toggle-${celeb.id}`;

            item.innerHTML = `
                <div class="celeb-list-profile-image">
                    <img src="${celeb.imgSrc}" alt="${celeb.name}">
                    <div class="celeb-list-icon">✦</div>
                </div>
                <div class="celeb-list-profile-info">
                    <div class="celeb-list-profile-name">${celeb.name}</div>
                    <div class="celeb-list-progress">
                        <div class="celeb-list-progress-bar" style="width: ${celeb.percent}%; background-color: ${celeb.progressColor};"></div>
                    </div>
                    <div class="celeb-list-progress-text">${celeb.progressText}</div>
                </div>
                <div class="celeb-item-toggle-wrapper toggle-switch">
                    <input type="checkbox" value="${celeb.id}" id="${inputId}" class="celeb-item-toggle-input toggle-switch-input sr-only" checked>
                    <label for="${inputId}" class="toggle-switch-label">
                        <span class="toggle-switch-handle"></span>
                    </label>
                </div>
            `;

            const toggleInput = item.querySelector('.celeb-item-toggle-input');
            const toggleSwitch = item.querySelector('.toggle-switch');

            item.addEventListener('click', () => {
                toggleInput.checked = !toggleInput.checked;
                toggleInput.dispatchEvent(new Event('change'));
            });

            toggleSwitch.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            toggleInput.addEventListener('change', () => {
                item.classList.toggle('selected', toggleInput.checked);
                syncSelectAllToggle();
            });

            listContainer.appendChild(item);
        });
    }

    loadTimerConfig();

    const state = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
    if (!state.isRunning) {
        logTextarea.value = '';
        log('Sẵn sàng chạy. Vui lòng chọn celeb và nhấn "Bắt đầu Auto Celeb".', 'info');
    } else {
        // Assume loadPersistentLog is imported or available
        // loadPersistentLog();
    }

    updateControlButtonState(state);

    overlay.style.display = 'block';
    modal.style.display = 'block';
}

export function updateControlButtonState(state) {
    const modalButton = document.getElementById('dashboard-control-button');
    if (!modalButton) return;

    if (state.isRunning) {
        modalButton.textContent = 'Dừng Auto Celeb';
        modalButton.classList.add('running');
    } else {
        modalButton.textContent = 'Bắt đầu Auto Celeb';
        modalButton.classList.remove('running');
    }
}

export function updateTimerUI(mode, value) {
    const timerUI = document.getElementById('dashboard-timer-ui');
    if (!timerUI) return;

    const display = timerUI.querySelector('#timer-display');
    const toggleInput = timerUI.querySelector('#timer-toggle-input');
    const ringFg = timerUI.querySelector('#timer-progress-ring .timer-ring-fg');

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

function syncSelectAllToggle() {
    const selectAllInput = document.getElementById('celeb-select-all-input');
    if (!selectAllInput) return;

    const allCelebToggles = document.querySelectorAll('.celeb-item-toggle-input');
    const total = allCelebToggles.length;

    if (total === 0) {
        selectAllInput.checked = false;
        return;
    }

    const checkedCount = Array.from(allCelebToggles).filter(toggle => toggle.checked).length;

    if (checkedCount === total) {
        selectAllInput.checked = true;
    } else {
        selectAllInput.checked = false;
    }
}

export function generateDonateQR() {
    const amountInput = document.getElementById('donate-amount-input');
    const rawValue = amountInput.value.replace(/,/g, '');
    const amount = parseInt(rawValue, 10);
    const qrResultDiv = document.getElementById('donate-qr-result');
    const qrImage = document.getElementById('donate-qr-image');
    const loadingText = document.getElementById('donate-loading-text');
    const errorText = document.getElementById('donate-error-message');
    if (isNaN(amount) || amount < 1000) {
        errorText.textContent = 'Đã có lỗi xảy ra. Vui lòng thử lại sau';
        errorText.style.display = 'block';
        return;
    }
    errorText.style.display = 'none';
    qrResultDiv.style.display = 'flex';
    qrImage.style.display = 'none';
    loadingText.style.display = 'block';
    const apiData = {
        bin: "970407", accountNo: "25127777777", accountName: "VU QUANG HUY",
        amount: String(amount), content: "Donate Locket Celebrity"
    };
    // Note: GM_xmlhttpRequest needs to be passed or handled appropriately in a module context if used directly
}

export function setupMainUIControls() {
    // --- Điều khiển chung (Header, Key Wall) ---
    const mainContainer = document.getElementById('auto-celeb-main-container');
    const collapseToggle = document.getElementById('auto-celeb-collapse-toggle');
    const popupTitle = document.getElementById('auto-celeb-popup-title');
    const toggleCollapse = (e) => { mainContainer.classList.toggle('collapsed'); };
    if (collapseToggle && mainContainer) { collapseToggle.addEventListener('click', toggleCollapse); }
    if (popupTitle && mainContainer) { popupTitle.addEventListener('click', toggleCollapse); }

    const btnSubmitKey = document.getElementById('btn-submit-key');
    const keyInput = document.getElementById('key-input-field');
    const keyError = document.getElementById('key-error-message');
    const validateKey = () => {
        const inputVal = keyInput.value.trim();
        if (inputVal === CONFIG.SECRET_KEY) {
            localStorage.setItem(CONFIG.KEY_STORAGE_KEY, inputVal);
            mainContainer.classList.remove('locked');
            alert('Kích hoạt thành công! Cảm ơn bạn đã sử dụng.');
            keyError.style.display = 'none';
            keyInput.classList.remove('shake');
        } else {
            keyError.style.display = 'block';
            keyInput.classList.add('shake');
            setTimeout(() => keyInput.classList.remove('shake'), 300);
        }
    };
    if(btnSubmitKey && keyInput && keyError) {
        btnSubmitKey.addEventListener('click', validateKey);
        keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { validateKey(); } });
    }

    // --- Gắn listener cho Bảng điều khiển (Dashboard) ---
    const dashboardModal = document.getElementById('celeb-dashboard-modal');
    if (!dashboardModal) return;

    // --- Điều khiển Timer (Bên trong Modal) ---
    const plusBtn = dashboardModal.querySelector('#timer-plus-btn');
    const minusBtn = dashboardModal.querySelector('#timer-minus-btn');
    const toggleInput = dashboardModal.querySelector('#timer-toggle-input');
    const timerUI = dashboardModal.querySelector('#dashboard-timer-ui');
    if (plusBtn && minusBtn && toggleInput && timerUI) {
        plusBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            // activeTimerId logic
            if (currentTimerConfig.minutes === 1) { currentTimerConfig.minutes = 5; }
            else { currentTimerConfig.minutes += 5; }
            log(`Tăng thời gian hẹn giờ lên: ${currentTimerConfig.minutes} phút.`, 'timer');
            saveTimerConfig(); updateTimerUI();
        });
        minusBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            // activeTimerId logic
            if (currentTimerConfig.minutes > 5) { currentTimerConfig.minutes -= 5; }
            else if (currentTimerConfig.minutes === 5) { currentTimerConfig.minutes = 1; }
            else { currentTimerConfig.minutes = 1; }
            log(`Giảm thời gian hẹn giờ xuống: ${currentTimerConfig.minutes} phút.`, 'timer');
            saveTimerConfig(); updateTimerUI();
        });
        toggleInput.addEventListener('change', (event) => {
             // activeTimerId logic
            currentTimerConfig.enabled = toggleInput.checked;
            log(`Hẹn giờ ${currentTimerConfig.enabled ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}.`, 'timer');
            saveTimerConfig(); updateTimerUI();
        });
    }

    // --- Điều khiển Nút Footer (Bên trong Modal) ---
    const btnUpdate = dashboardModal.querySelector('#btn-update');
    const btnBugReport = dashboardModal.querySelector('#btn-bug-report');
    const btnDonate = dashboardModal.querySelector('#btn-donate');
    const btnGenerateQR = document.getElementById('btn-generate-qr');

    const modalOverlay = document.getElementById('auto-celeb-modal-overlay');
    const modalBug = document.getElementById('modal-bug-report');
    const modalUpdate = document.getElementById('modal-update');
    const modalDonate = document.getElementById('modal-donate');

    const allModals = document.querySelectorAll('.auto-celeb-modal');
    const allCloseButtons = document.querySelectorAll('.auto-celeb-modal-close');

    const closeAllModals = () => {
        if (modalOverlay) modalOverlay.style.display = 'none';
        allModals.forEach(modal => { if (modal) modal.style.display = 'none'; });
    };

    if (btnUpdate && modalUpdate && modalOverlay) {
        btnUpdate.addEventListener('click', (e) => { e.preventDefault(); modalOverlay.style.display = 'block'; modalUpdate.style.display = 'block'; });
    }
    if (btnBugReport && modalBug && modalOverlay) {
        btnBugReport.addEventListener('click', (e) => { e.preventDefault(); modalOverlay.style.display = 'block'; modalBug.style.display = 'block'; });
    }
    if (btnDonate && modalDonate && modalOverlay) {
        btnDonate.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('donate-amount-input').value = '';
            document.getElementById('donate-qr-result').style.display = 'none';
            document.getElementById('donate-error-message').style.display = 'none';
            document.getElementById('donate-qr-image').src = '';
            const suffix = document.querySelector('.donate-suffix');
            if (suffix) suffix.style.display = 'none';
            modalOverlay.style.display = 'block'; modalDonate.style.display = 'block';
        });
    }
    if (btnGenerateQR) { btnGenerateQR.addEventListener('click', (e) => { e.preventDefault(); generateDonateQR(); }); }

    const btnCopyUpdateLink = document.getElementById('btn-copy-update-link');
    if (btnCopyUpdateLink) {
        btnCopyUpdateLink.addEventListener('click', (e) => {
            e.preventDefault(); if (btnCopyUpdateLink.classList.contains('copied')) return;
            navigator.clipboard.writeText(CONFIG.UPDATE_URL).then(() => {
                const originalText = btnCopyUpdateLink.textContent;
                btnCopyUpdateLink.textContent = 'Đã copy!';
                btnCopyUpdateLink.classList.add('copied');
                setTimeout(() => {
                    btnCopyUpdateLink.textContent = originalText;
                    btnCopyUpdateLink.classList.remove('copied');
                }, 2000);
            }).catch(err => { console.error('[Auto Locket Celeb] Lỗi khi copy link: ', err); alert('Lỗi khi copy. Vui lòng thử lại.'); });
        });
    }

    if (modalOverlay) modalOverlay.addEventListener('click', closeAllModals);
    allCloseButtons.forEach(btn => btn.addEventListener('click', closeAllModals));

    // --- Điều khiển Logic Bảng điều khiển (v1.9 SỬA LỖI CLICK) ---
    const modalStartButton = dashboardModal.querySelector('#dashboard-control-button');
    const selectAllContainer = dashboardModal.querySelector('#celeb-select-all-label'); // Đây là <div> wrapper
    const selectAllInput = dashboardModal.querySelector('#celeb-select-all-input');
    const selectAllToggle = selectAllContainer.querySelector('.toggle-switch'); // <div> của toggle

    if (modalStartButton) {
        modalStartButton.addEventListener('click', () => {
            const state = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
            if (state.isRunning) {
                stopProcess();
            } else {
                startProcessFromModal();
            }
        });
    }

    if (selectAllContainer && selectAllInput && selectAllToggle) {
        // Click vào bất cứ đâu trên hàng "Chọn tất cả"
        selectAllContainer.addEventListener('click', () => {
            selectAllInput.checked = !selectAllInput.checked;
            selectAllInput.dispatchEvent(new Event('change'));
        });
        // Click vào chính cái toggle
        selectAllToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn sự kiện click của selectAllContainer
        });

        // Khi toggle "Chọn tất cả" thay đổi
        selectAllInput.addEventListener('change', () => {
            const isChecked = selectAllInput.checked;
            const allCelebToggles = document.querySelectorAll('.celeb-item-toggle-input');
            allCelebToggles.forEach(toggle => {
                if (toggle.checked !== isChecked) {
                    toggle.checked = isChecked;
                    // Kích hoạt thay đổi class selected
                    const item = toggle.closest('.celeb-list-item-new');
                    if (item) item.classList.toggle('selected', isChecked);
                }
            });
        });
    }
}