import { CONFIG } from './config';

export function injectNewStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* ... (CSS Chung, Header, Tabs, Key Wall không đổi) ... */
        #auto-celeb-main-container {
            position: fixed; z-index: 9999; display: flex; flex-direction: column; gap: 12px;
            width: 350px; font-family: 'Inter', 'Poppins', 'Segoe UI', sans-serif;
            background: rgba(30,30,30,0.65); backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            border-radius: 16px; padding: 12px; top: 90px; left: 24px; right: auto; bottom: auto;
            max-height: 90vh; overflow: hidden;
            transition: max-height 0.3s ease, padding-top 0.3s ease, padding-bottom 0.3s ease;
        }
        #auto-celeb-popup-header {
            display: flex; justify-content: space-between; align-items: center;
            color: white; font-size: 18px; font-weight: 700;
            border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;
            margin-bottom: 4px; cursor: default;
        }
        #auto-celeb-popup-title {
            cursor: pointer; user-select: none; flex-grow: 1; display: flex;
            align-items: center; gap: 8px;
        }
        #auto-celeb-title-icon { width: 22px; height: 22px; border-radius: 5px; }
        #auto-celeb-collapse-toggle {
            font-size: 20px; font-weight: bold; cursor: pointer; padding: 0 5px;
            transition: transform 0.3s ease;
        }
        #auto-celeb-collapse-toggle:hover { opacity: 0.8; }
        #auto-celeb-main-container.collapsed {
            max-height: 48px; padding-top: 12px; padding-bottom: 12px; gap: 0;
        }
        #auto-celeb-main-container.collapsed #auto-celeb-popup-header {
            margin-bottom: 0; border-bottom: none; padding-bottom: 0;
        }
        #auto-celeb-main-container.collapsed #auto-celeb-collapse-toggle { transform: rotate(-90deg); }
        #auto-celeb-main-container.collapsed > *:not(#auto-celeb-popup-header) { display: none; }
        #auto-celeb-tab-nav {
            display: flex; justify-content: space-around; width: 100%;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 12px; margin-top: -8px;
        }
        .nav-tab {
            flex: 1; text-align: center; padding: 8px 0; color: #aaa;
            font-weight: 600; font-size: 15px; text-decoration: none; cursor: pointer;
            transition: color 0.2s ease; border-bottom: 3px solid transparent;
            position: relative; top: 1px;
        }
        .nav-tab:not(.active):hover {
            color: #aaa !important; text-decoration: none !important;
            border-bottom-color: transparent !important;
        }
        .nav-tab.active { color: #fff; border-bottom-color: #8b5cf6; }

        #auto-celeb-main-container.locked #auto-celeb-tab-nav,
        #auto-celeb-main-container.locked #auto-celeb-open-dashboard-btn,
        #auto-celeb-main-container.locked #auto-celeb-redirect-buttons,
        #auto-celeb-main-container.locked #auto-friend-tool-wrapper { display: none; }
        #auto-celeb-main-container:not(.locked) #auto-celeb-key-wall { display: none; }
        #auto-celeb-key-wall {
            display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 10px 0;
        }
        #key-wall-icon { width: 64px; height: 64px; opacity: 0.9; border-radius: 12px; }
        #key-wall-title { font-size: 22px; font-weight: 700; color: white; margin: 0; }
        #key-wall-message { font-size: 14px; color: #e0e0e0; text-align: center; line-height: 1.5; margin: 0; }
        #btn-get-key {
            display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px 14px;
            border-radius: 14px; border: none; color: white; font-weight: 600; font-size: 16px;
            cursor: pointer; background: linear-gradient(135deg, #00B2FF, #006AFF);
            box-shadow: 0 6px 20px rgba(0, 150, 255, 0.4); transition: all 0.25s ease;
            justify-content: center; text-decoration: none;
        }
        #btn-get-key:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 150, 255, 0.55); }
        #key-input-field {
            width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px; padding: 12px 15px; font-size: 16px; color: white;
            font-family: 'Inter', sans-serif; box-sizing: border-box;
        }
        #key-input-field::placeholder { color: #888; }
        #btn-submit-key {
            width: 100%; padding: 12px 14px; border-radius: 14px; border: none;
            color: white; font-weight: 600; font-size: 16px; cursor: pointer;
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); transition: all 0.25s ease;
        }
        #btn-submit-key:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139, 92, 246, 0.55); }
        #key-error-message {
            font-size: 14px; color: #ef4444; font-weight: 600; margin: -5px 0 0 0; display: none;
        }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .shake { animation: shake 0.3s ease; border-color: #ef4444 !important; }

        #auto-celeb-open-dashboard-btn {
            width: 100%; padding: 12px 14px; border-radius: 14px; border: none;
            color: white; font-weight: 600; font-size: 16px; cursor: pointer;
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
            transition: all 0.25s ease;
        }
        #auto-celeb-open-dashboard-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(139, 92, 246, 0.55);
        }

        #auto-celeb-redirect-buttons { display: flex; flex-direction: column; gap: 10px; padding: 10px 0; }
        .auto-celeb-redirect-button {
            width: 100%; padding: 12px 14px; border-radius: 14px; border: none;
            color: white; font-weight: 600; font-size: 16px; cursor: pointer;
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4); transition: all 0.25s ease;
            text-decoration: none; text-align: center; display: block; box-sizing: border-box;
        }
        .auto-celeb-redirect-button:hover {
            transform: translateY(-2px); box-shadow: 0 8px 25px rgba(14, 165, 233, 0.55); filter: brightness(1.1);
        }
        #auto-friend-tool-wrapper { display: flex; flex-direction: column; gap: 0; }
        #friend-tool-title { font-size: 28px; font-weight: 700; color: #ef4444; text-align: center; margin: 0; margin-bottom: 5px; }
        #friend-tool-note { font-size: 0.9em; color: #ccc; text-align: center; margin: 0; margin-bottom: 15px; font-weight: 500; }
        #friend-celeb-select {
            width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px; padding: 10px 12px; font-size: 15px; color: white;
            font-family: 'Inter', sans-serif; box-sizing: border-box; margin-bottom: 12px;
        }
        #friend-celeb-select option { background: #333; color: white; padding: 5px; }
        #friend-celeb-select:focus { outline: none; border-color: #0ea5e9; }
        #auto-friend-start-button {
            width: 100%; padding: 12px 14px; border-radius: 14px; border: none;
            color: white; font-weight: 600; font-size: 16px; cursor: pointer;
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4); transition: all 0.25s ease;
        }
        #auto-friend-start-button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(14, 165, 233, 0.55); }
        #auto-friend-start-button.running {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            box-shadow: 0 6px 20px rgba(239,68,68,0.4);
        }

        #auto-celeb-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 10001;
        }
        .auto-celeb-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #2c2c2e; color: white; border-radius: 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10002;
            width: 300px; padding: 20px; padding-top: 40px; text-align: center;
            border: 1px solid rgba(255,255,255,0.15);
        }
        .auto-celeb-modal h3 { margin-top: 0; margin-bottom: 15px; }
        .auto-celeb-modal p { text-align: center; margin-bottom: 15px; }
        .auto-celeb-modal-close {
            position: absolute; top: 10px; right: 15px; font-size: 28px;
            font-weight: bold; color: #aaa; cursor: pointer; line-height: 1;
        }
        .auto-celeb-modal-close:hover { color: white; }
        .modal-button {
            display: inline-block; background-color: #0a84ff; color: white;
            padding: 10px 20px; border-radius: 8px; text-decoration: none;
            font-weight: 600; margin-top: 10px; border: none;
            font-family: inherit; font-size: 1em; cursor: pointer;
        }
        .modal-button:hover { background-color: #38a0ff; }

        #modal-update p.update-text { font-size: 16px; line-height: 1.5; text-align: center; margin-bottom: 0; }
        #modal-update .modal-update-version-display {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            margin-bottom: 15px; padding: 10px 15px; background: rgba(0,0,0,0.25);
            border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
        }
        #modal-update .modal-update-logo { width: 24px; height: 24px; border-radius: 5px; flex-shrink: 0; }
        #modal-update .modal-update-title-text { font-size: 1.15em; font-weight: 700; color: #ef4444; }
        #modal-update .modal-button-group { display: flex; gap: 10px; margin-top: 20px; }
        #modal-update .modal-button-group .modal-button {
            flex: 1; margin-top: 0; text-decoration: none; padding: 10px;
            font-weight: 600; cursor: pointer; transition: all 0.2s ease;
        }
        #btn-go-to-update { background-color: #0a84ff; }
        #btn-go-to-update:hover { background-color: #38a0ff; }
        #btn-copy-update-link { background-color: #555; }
        #btn-copy-update-link:hover { background-color: #777; }
        #btn-copy-update-link.copied { background-color: #22c55e; cursor: default; }
        #modal-donate h3 { margin-bottom: 5px; }
        #modal-donate p.donate-lead { margin-bottom: 15px; }
        #modal-donate p.donate-thankyou { font-size: 0.9em; color: #ccc; margin-top: 0; margin-bottom: 20px; }
        .donate-input-wrapper { position: relative; margin-bottom: 15px; }
        #donate-amount-input {
            width: 100%; padding: 12px; padding-right: 45px; border-radius: 8px;
            border: 1px solid #777; background: #333; color: #3b82f6;
            font-weight: 600; font-size: 16px; box-sizing: border-box; margin-bottom: 0;
        }
        .donate-suffix {
            position: absolute; right: 15px; top: 50%; transform: translateY(-50%);
            color: #aaa; font-weight: 600; pointer-events: none; display: none;
        }
        .donate-input-wrapper input:not(:placeholder-shown) ~ .donate-suffix { display: block; }
        #donate-amount-input::-webkit-outer-spin-button,
        #donate-amount-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        #donate-amount-input { -moz-appearance: textfield; }
        #btn-generate-qr {
            background: linear-gradient(135deg, #22c55e, #16a34a); width: 100%;
            margin-top: 0; font-size: 16px; font-weight: 600; padding: 12px;
            transition: all 0.2s ease;
        }
        #btn-generate-qr:hover { filter: brightness(1.15); }
        #donate-qr-result {
            margin-top: 15px; min-height: 250px; display: none; align-items: center;
            justify-content: center; background: #fff; border-radius: 10px; padding: 10px;
        }
        #donate-qr-image { max-width: 100%; max-height: 250px; display: none; }
        #donate-loading-text { color: #000; font-size: 16px; font-weight: 600; display: none; }
        #donate-error-message { color: #ef4444; font-size: 14px; margin-top: 10px; font-weight: 600; display: none; }


        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
        .toggle-switch { position: relative; display: inline-block; width: 50px; height: 30px; flex-shrink: 0; }
        .toggle-switch-label { display: block; width: 100%; height: 100%; background-color: #8e8e93; border-radius: 15px; cursor: pointer; transition: background-color 0.2s ease; }
        .toggle-switch-handle { position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.2s ease; }
        .toggle-switch-input:checked + .toggle-switch-label { background-color: #34c759; }
        .toggle-switch-input:checked + .toggle-switch-label .toggle-switch-handle { transform: translateX(20px); }


        #celeb-dashboard-modal {
            width: 900px;
            max-width: 90vw;
            text-align: left;
            background: #232325;
        }

        #modal-dashboard-layout {
            display: flex;
            gap: 20px;
            margin-top: -15px;
        }

        #modal-celeb-list-wrapper {
            flex: 1.5;
            border-right: 1px solid #444;
            padding-right: 20px;
            min-height: 450px;
            max-height: 60vh;
            display: flex;
            flex-direction: column;
        }
        #modal-celeb-list-wrapper h3 {
            color: white;
            font-weight: 700;
            margin-bottom: 15px;
            flex-shrink: 0;
        }
        #celeb-select-all-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            margin-bottom: 10px;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.2s;
            flex-shrink: 0;
        }
        #celeb-select-all-label:hover { background: rgba(0,0,0,0.4); }
        #celeb-select-all-text {
            font-size: 1.1em;
            vertical-align: middle;
            font-weight: 600;
        }

        #celeb-selection-list {
            flex-grow: 1;
            overflow-y: auto;
            padding-right: 5px;
        }

        .celeb-list-item-new {
            display: flex;
            align-items: center;
            padding: 8px 5px;
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            border: 1px solid transparent;
            transition: background-color 0.2s;
        }
        .celeb-list-item-new:hover {
            background-color: rgba(255, 255, 255, 0.05);
        }
        .celeb-list-item-new.selected {
            background-color: rgba(139, 92, 246, 0.1);
            border-color: rgba(139, 92, 246, 0.3);
        }

        .celeb-item-toggle-wrapper {
            margin-left: 10px;
            padding: 0 5px;
            flex-shrink: 0;
        }

        .celeb-list-profile-image {
            position: relative;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .celeb-list-profile-image img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 3px solid #F0B90A;
        }
        .celeb-list-icon {
            position: absolute;
            bottom: 0;
            right: 0;
            background: #F0B90A;
            color: #333;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid #232325;
        }

        .celeb-list-profile-info {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }
        .celeb-list-profile-name {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .celeb-list-progress {
            width: 100%;
            height: 8px;
            background: #555;
            border-radius: 4px;
            overflow: hidden;
        }
        .celeb-list-progress-bar {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }

        .celeb-list-progress-text {
            font-size: 12px;
            color: #aaa;
            font-weight: 500;
        }

        #modal-celeb-controls-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-height: 450px;
        }

        #dashboard-control-button {
            width: 100%; padding: 12px 14px; border-radius: 14px; border: none;
            color: white; font-weight: 600; font-size: 16px; cursor: pointer;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            box-shadow: 0 6px 20px rgba(34,197,94,0.4);
            transition: all 0.25s ease;
        }
        #dashboard-control-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(34,197,94,0.55);
            filter: brightness(1.1);
        }
        #dashboard-control-button.running {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            box-shadow: 0 6px 20px rgba(239,68,68,0.4);
        }

        #dashboard-timer-ui {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 15px; border-radius: 14px; color: white; font-weight: 600;
            background: rgba(30,30,30,0.45);
            border: 1px solid rgba(255,255,255,0.15);
            user-select: none; transition: all 0.3s ease; height: 65px;
        }
        #dashboard-timer-ui #timer-display-group { display: flex; align-items: center; gap: 10px; }
        #dashboard-timer-ui #timer-display {
            font-family: 'JetBrains Mono', 'Inter', 'Segoe UI', sans-serif;
            font-size: 32px; font-weight: 500; letter-spacing: -1px; color: #e0e0e0;
            flex-shrink: 0; min-width: 80px; transition: all 0.2s ease; text-align: left;
        }
        #dashboard-timer-ui #timer-adjust-buttons { display: flex; flex-direction: column; gap: 2px; }
        #dashboard-timer-ui .timer-adjust-btn {
            background-color: rgba(255,255,255,0.1); color: #fff; font-size: 13px; font-weight: 700;
            padding: 2px 8px; border-radius: 8px; cursor: pointer;
            transition: background-color 0.2s ease, transform 0.1s ease;
            min-width: 38px; text-align: center;
        }
        #dashboard-timer-ui .timer-adjust-btn:hover { background-color: rgba(255,255,255,0.2); transform: scale(1.05); }
        #dashboard-timer-ui .timer-adjust-btn:active { transform: scale(0.95); }
        #dashboard-timer-ui #timer-progress-ring { width: 40px; height: 40px; transform: rotate(-90deg); flex-shrink: 0; }
        #dashboard-timer-ui .timer-ring-bg, #dashboard-timer-ui .timer-ring-fg { fill: transparent; stroke-width: 4; }
        #dashboard-timer-ui .timer-ring-bg { stroke: rgba(255, 255, 255, 0.15); }
        #dashboard-timer-ui .timer-ring-fg { stroke: #0ea5e9; stroke-linecap: round; transition: stroke-dashoffset 0.5s linear; }

        #dashboard-timer-ui #timer-toggle-switch {
            position: relative; display: inline-block; width: 50px; height: 30px; flex-shrink: 0;
        }

        #dashboard-timer-ui.timer-counting #timer-display-group { flex-grow: 1; justify-content: center; gap: 15px; }
        #dashboard-timer-ui.timer-counting #timer-display { color: #0ea5e9; font-weight: 700; font-size: 38px; text-align: left; flex-grow: 0; }
        #dashboard-timer-ui.timer-counting #timer-adjust-buttons,
        #dashboard-timer-ui.timer-counting #timer-toggle-switch { display: none; }
        #dashboard-timer-ui:not(.timer-counting) #timer-progress-ring { display: none; }
        #dashboard-timer-ui:not(.timer-counting) #timer-display { font-size: 32px; text-align: left; flex-grow: 0; min-width: 90px; }
        #dashboard-timer-ui:not(.timer-counting) #timer-adjust-buttons { display: flex; }
        #dashboard-timer-ui:not(.timer-counting) #timer-toggle-switch { display: inline-block; }

        #dashboard-log-wrapper { display: flex; flex-direction: column; flex-grow: 1; min-height: 150px; }
        #dashboard-log-wrapper label {
            color: white; font-weight: bold; margin-bottom: 5px; display: block; user-select: none;
        }
        #dashboard-script-log {
            width: 100%; resize: none; margin: 0;
            font-family: Consolas, 'Courier New', monospace;
            font-size: 12px; font-weight: bold;
            background-color: #111; color: #eee;
            border: 1px solid #444; border-radius: 8px;
            box-sizing: border-box; padding: 8px;
            flex-grow: 1;
        }

        #dashboard-footer-buttons { display: flex; justify-content: space-between; gap: 8px; flex-shrink: 0; }
        #dashboard-footer-buttons .footer-btn {
            flex-grow: 1; padding: 6px; border: none; border-radius: 5px; color: white;
            cursor: pointer; font-weight: bold; transition: all 0.2s ease; font-size: 13px;
        }
        #dashboard-footer-buttons .footer-btn:hover { opacity: 0.8; transform: translateY(-1px); }
        #dashboard-footer-buttons #btn-update { background-color: #0ea5e9; }
        #dashboard-footer-buttons #btn-bug-report { background-color: #f59e0b; }
        #dashboard-footer-buttons #btn-donate { background-color: #22c55e; }

        #auto-celeb-popup-container {
            position: fixed; top: 80px; right: 25px; z-index: 10000;
            display: flex; flex-direction: column; align-items: flex-end;
            gap: 12px; pointer-events: none;
        }
        .celeb-popup-item {
            background: rgba(30,30,30,0.65); backdrop-filter: blur(15px); color: #e5e7eb;
            padding: 12px 18px; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.15); font-size: 15px;
            animation: slideInFadeIn 0.5s forwards, fadeOut 0.5s 3.5s forwards;
            transform: translateX(100%); opacity: 0;
        }
        .celeb-popup-item .celeb-name { font-weight: 700; color: #ffffff; }
        .celeb-popup-item .celeb-count { font-size: 13px; opacity: 0.75; margin-right: 8px; }
        @keyframes slideInFadeIn { to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(50%); } }
        #auto-celeb-pre-run-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 20000;
            display: flex; justify-content: center; align-items: center;
        }
        #auto-celeb-pre-run-modal {
            background: #1e1e1e; border: 1px solid rgba(255,255,255,0.2);
            border-radius: 16px; padding: 24px 40px; text-align: center; color: white;
            font-family: 'Inter', sans-serif; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        #auto-celeb-pre-run-modal h2 { margin-top: 0; color: #f59e0b; }
        #auto-celeb-pre-run-modal p { font-size: 16px; margin-bottom: 10px; }
        #auto-celeb-pre-run-modal #auto-celeb-pre-run-timer {
            font-size: 64px; font-weight: 700; color: #22c55e;
            font-family: 'JetBrains Mono', monospace;
        }
    `;
    document.head.appendChild(style);
}