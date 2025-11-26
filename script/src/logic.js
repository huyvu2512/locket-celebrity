import { CONFIG } from './config';
import { log, sleep, waitForElementById, waitForElement } from './utils';
import { showCelebPopup, updateControlButtonState, updateTimerUI } from './ui';

export let activeTimerId = null;
export let currentTimerConfig = { enabled: false, minutes: 60 };
export let currentTimerTotalDuration = 0;
export let webLogObserver = null;
export let isFriendSearchRunning = false;
export let friendSearchLoopId = null;

export function loadTimerConfig() {
    const configStr = localStorage.getItem(CONFIG.TIMER_CONFIG_KEY);
    if (configStr) {
        const savedConfig = JSON.parse(configStr);
        currentTimerConfig.minutes = savedConfig.minutes || 60;
        currentTimerConfig.enabled = savedConfig.enabled || false;
    } else {
        currentTimerConfig.minutes = 60;
        currentTimerConfig.enabled = false;
    }
    if (currentTimerConfig.minutes < 1) { currentTimerConfig.minutes = 1; }
    else if (currentTimerConfig.minutes > 1 && currentTimerConfig.minutes < 5) { currentTimerConfig.minutes = 5; }

    if (document.getElementById('dashboard-timer-ui')) {
        const activeTimerEndTime = sessionStorage.getItem(CONFIG.TIMER_END_TIME_KEY);
        if (!activeTimerEndTime) { updateTimerUI(); }
    }
}

export function saveTimerConfig() {
    const configToSave = {
        minutes: currentTimerConfig.minutes,
        enabled: currentTimerConfig.enabled
    };
    localStorage.setItem(CONFIG.TIMER_CONFIG_KEY, JSON.stringify(configToSave));
}

export function startReloadTimer(minutes) {
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

export function cancelReloadTimer() {
    if (webLogObserver) clearInterval(webLogObserver);
    if (activeTimerId) {
        clearInterval(activeTimerId);
        activeTimerId = null;
        log('Đã hủy đồng hồ đếm ngược.', 'info');
        updateTimerUI(); // Cập nhật UI trong modal
    }
    sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
}

export function executeTimerReset() {
    if (webLogObserver) clearInterval(webLogObserver);
    log('Hẹn giờ kết thúc. ĐANG ĐẶT CỜ RESTART VÀ TẢI LẠI TRANG...', 'timer');
    localStorage.setItem(CONFIG.TIMER_RESTART_KEY, 'true');
    sessionStorage.removeItem(CONFIG.STORAGE_KEY);
    sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
    location.reload();
}

export function scanForCelebs() {
    const celebs = [];
    document.querySelectorAll('#celebrityList div.profile').forEach(card => {
        const addButton = card.querySelector('button.showMoreBtn');
        const idElement = card.querySelector('[id$="_parentElement"]');

        if (addButton && idElement && addButton.textContent.includes('Thêm bạn bè')) {
            const celebId = idElement.id.replace('_parentElement', '');

            const imgEl = card.querySelector('.profile-circle img');
            const nameEl = card.querySelector('.profile-info .profile-name');
            const progressEl = card.querySelector('.profile-info .x-progress');
            const progressTextEl = card.querySelector('.profile-info .x-progress__text');

            const data = {
                id: celebId,
                name: nameEl ? nameEl.textContent.trim() : 'Không rõ tên',
                imgSrc: imgEl ? imgEl.src : '',
                progressText: progressTextEl ? progressTextEl.textContent.trim() : '0 / 0',
                current: progressEl ? parseInt(progressEl.dataset.current, 10) : 0,
                max: progressEl ? parseInt(progressEl.dataset.max, 10) : 1,
            };

            data.percent = (data.current / data.max) * 100;
            if (data.percent > 100) data.percent = 100;
            if (isNaN(data.percent) || data.max === 0) data.percent = 0;

            data.progressColor = (data.current >= data.max) ? 'red' : '#46ce46';

            celebs.push(data);
        }
    });
    return celebs;
}

export function stopProcess(shouldReload = false) {
    if (webLogObserver) clearInterval(webLogObserver);
    cancelReloadTimer();
    localStorage.removeItem(CONFIG.TIMER_RESTART_KEY);
    localStorage.removeItem(CONFIG.CELEB_RESTART_KEY);
    sessionStorage.removeItem(CONFIG.STORAGE_KEY);
    sessionStorage.removeItem(CONFIG.CONNECTION_LOST_COUNTER_KEY);

    log('Đã dừng quá trình tự động theo yêu cầu người dùng.', 'info');
    if (shouldReload) {
        log('Đang tải lại trang...');
        location.reload();
    } else {
        updateControlButtonState({ isRunning: false });
    }
}

export function startProcessFromModal() {
    sessionStorage.removeItem(CONFIG.LOG_STORAGE_KEY);
    sessionStorage.removeItem(CONFIG.CONNECTION_LOST_COUNTER_KEY);
    log('Đang bắt đầu quá trình...', 'rocket');

    const selectedToggles = document.querySelectorAll('.celeb-item-toggle-input:checked');
    const celebIds = Array.from(selectedToggles).map(cb => cb.value);

    if (celebIds.length === 0) {
        log('Không có celeb nào được chọn. Vui lòng chọn ít nhất một celeb.', 'error');
        return;
    }

    const totalCount = celebIds.length;
    log(`Đã chọn ${totalCount} celeb để chạy...`, 'info');
    sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ isRunning: true, celebIds: [...celebIds], totalCount: totalCount }));
    updateControlButtonState({ isRunning: true });

    if (currentTimerConfig.enabled && currentTimerConfig.minutes > 0) {
        startReloadTimer(currentTimerConfig.minutes);
    }

    processNextCeleb(celebIds, totalCount);
}

export async function processNextCeleb(celebIds, totalCount) {
    if (webLogObserver) { clearInterval(webLogObserver); webLogObserver = null; }
    const state = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY) || '{}');
    if (!state.isRunning) {
        log('Quá trình đã được dừng lại.', 'info');
        return;
    }
    if (celebIds.length === 0) {
        sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ ...state, finished: true }));
        updateControlButtonState({ isRunning: true });
        log('Đã xử lý xong tất cả celeb trong danh sách.', 'success');
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
        log(`${countText} Bỏ qua ${celebName} (Đã là bạn bè hoặc không tìm thấy nút).`);
        await processNextCeleb(celebIds, totalCount);
        return;
    }
    log(`${countText} Đang xử lý: ${celebName}`);
    showCelebPopup(celebName, countText);
    button.click();
    await sleep(1000);
    const startButton = document.getElementById(currentId + '_startButton');
    if (startButton) {
        startButton.click();
        await sleep(2000);
        if (celebIds.length === 0) {
            log(`Đã xử lý celeb cuối cùng: ${celebName}.`, 'success');
            log(`Bắt đầu theo dõi nhật ký của celeb cuối cùng (${celebName})...`, 'info');
            startRealtimeLogObserver(currentId);
            sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ isRunning: true, celebIds: [], totalCount: totalCount, finished: true }));
            updateControlButtonState({ isRunning: true });
            return;
        } else {
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
        if (webLogObserver) clearInterval(webLogObserver);
        await processNextCeleb(celebIds, totalCount);
    }
}

async function startRealtimeLogObserver(celebId) {
    if (webLogObserver) { clearInterval(webLogObserver); webLogObserver = null; }
    const webLogId = celebId + '_log';
    let webLogTextarea;
    try {
        webLogTextarea = await waitForElementById(webLogId, 10000, 250);
    } catch (e) {
        log(`Không tìm thấy nhật ký web (${webLogId}). Không thể đồng bộ real-time.`, 'warn');
        return;
    }

    const scriptLog = document.getElementById('dashboard-script-log');
    if (!scriptLog) return;

    const needsCelebRestart = localStorage.getItem(CONFIG.CELEB_RESTART_KEY) === 'true';
    if (!needsCelebRestart) { sessionStorage.setItem(CONFIG.CONNECTION_LOST_COUNTER_KEY, '0'); }

    log(`Bắt đầu theo dõi nhật ký của ${celebId}...`, 'info');
    let lastLogContent = "";

    webLogObserver = setInterval(() => {
        const currentScriptLog = document.getElementById('dashboard-script-log');
        const currentWebLog = document.getElementById(webLogId);
        if (!currentScriptLog || !currentWebLog) {
            clearInterval(webLogObserver); webLogObserver = null; return;
        }
        const newLogContent = currentWebLog.value;
        let addedText = "";
        if (newLogContent === lastLogContent) { return; }
        if (newLogContent.length > lastLogContent.length) {
            addedText = newLogContent.substring(lastLogContent.length);
        } else if (newLogContent.length < lastLogContent.length) {
            addedText = newLogContent;
        }

        currentScriptLog.value += addedText;

        let storedLog = sessionStorage.getItem(CONFIG.LOG_STORAGE_KEY) || "";
        storedLog += addedText;
        sessionStorage.setItem(CONFIG.LOG_STORAGE_KEY, storedLog);

        lastLogContent = newLogContent;
        currentScriptLog.scrollTop = currentScriptLog.scrollHeight;

        if (addedText.includes(CONFIG.CONNECTION_LOST_TRIGGER_STRING)) {
            let counter = parseInt(sessionStorage.getItem(CONFIG.CONNECTION_LOST_COUNTER_KEY) || '0', 10);
            counter++;
            sessionStorage.setItem(CONFIG.CONNECTION_LOST_COUNTER_KEY, String(counter));
            log(`Phát hiện mất kết nối lần ${counter}/${CONFIG.CONNECTION_LOST_MAX_RETRIES}.`, 'warn');
            if (counter > CONFIG.CONNECTION_LOST_MAX_RETRIES) {
                log('Mất kết nối quá 5 lần. ĐANG ĐẶT CỜ RESTART (LỖI) VÀ TẢI LẠI TRANG...', 'error');
                clearInterval(webLogObserver); webLogObserver = null;
                localStorage.setItem(CONFIG.TIMER_RESTART_KEY, 'true');
                localStorage.removeItem(CONFIG.CELEB_RESTART_KEY);
                sessionStorage.removeItem(CONFIG.STORAGE_KEY);
                sessionStorage.removeItem(CONFIG.CONNECTION_LOST_COUNTER_KEY);
                sessionStorage.removeItem(CONFIG.TIMER_END_TIME_KEY);
                location.reload();
            }
        }
    }, 500);
}