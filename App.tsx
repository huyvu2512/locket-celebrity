
import React, { useState, useEffect } from 'react';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { BrowserIcon } from './components/icons/BrowserIcon';
import { AppleIcon } from './components/icons/AppleIcon';
import { AndroidIcon } from './components/icons/AndroidIcon';
import { Logo } from './components/icons/Logo';
import { WebIcon } from './components/icons/WebIcon';
import { InfoIcon } from './components/icons/InfoIcon';
import { CopyIcon } from './components/icons/CopyIcon';
import { ThemeSwitch } from './components/ThemeSwitch';
import './components/ThemeSwitch.css';

type Tab = 'web' | 'ios' | 'android';

interface ScriptInfo {
  name: string;
  version: string;
  displayVersion: string;
  description: string;
  installUrl: string;
}

const LocketCelebrityPage: React.FC = () => {
  const SCRIPT_URL = 'https://raw.githubusercontent.com/huyvu2512/locket-celebrity/main/script/tampermonkey.user.js';

  const [activeTab, setActiveTab] = useState<Tab>('web');
  const [scriptInfo, setScriptInfo] = useState<ScriptInfo | null>({
    name: 'Auto Locket Celeb (v1.3)',
    version: '1.3',
    displayVersion: '1.3',
    description: 'Tự động kết bạn với tất cả Celeb, hẹn giờ tùy chỉnh để khởi động lại web.',
    installUrl: SCRIPT_URL,
  });
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Initialize theme, default to dark
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');


  // Effect to apply theme class to html
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleCopyLink = async () => {
    if (scriptInfo?.installUrl) {
      try {
        await navigator.clipboard.writeText(scriptInfo.installUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const renderInstallGuide = () => {
    switch (activeTab) {
      case 'web':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                    <BrowserIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    Hướng dẫn cho Trình duyệt
                    <span className="block text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">(Chrome, Firefox, Edge, ...)</span>
                </h3>
            </div>
            
            <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-pink-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-pink-900 text-pink-600 dark:text-pink-300 text-xs font-bold">1</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Cài đặt Tampermonkey:</strong> Truy cập cửa hàng tiện ích của trình duyệt và cài đặt
                  <a href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline mx-1">Tampermonkey</a>.
                  Đây là trình quản lý userscript phổ biến và an toàn.
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-pink-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-pink-900 text-pink-600 dark:text-pink-300 text-xs font-bold">2</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Cài đặt Script:</strong> Nhấn vào nút "Cài đặt Script" ở trên. Một tab mới của Tampermonkey sẽ mở ra.
                </p>
              </li>
              <li className="mb-2 ml-6">
                 <span className="absolute flex items-center justify-center w-6 h-6 bg-pink-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-pink-900 text-pink-600 dark:text-pink-300 text-xs font-bold">3</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Xác nhận Cài đặt:</strong> Trong tab Tampermonkey, hãy xem lại thông tin và nhấn nút "Install" để hoàn tất.
                </p>
              </li>
               <li className="mb-2 ml-6">
                 <span className="absolute flex items-center justify-center w-6 h-6 bg-pink-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-pink-900 text-pink-600 dark:text-pink-300 text-xs font-bold">4</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Sử dụng:</strong> Mở Web 
                  <a href="https://locket.binhake.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline mx-1">Locketbinhake</a>
                  , script sẽ tự động được kích hoạt để bạn có thể sử dụng các tính năng mới.
                </p>
              </li>
              <li className="ml-6">
                 <span className="absolute flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 text-xs font-bold">★</span>
                <div className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-100 dark:border-pink-800/30">
                  <strong className="text-slate-700 dark:text-slate-200">Key kích hoạt:</strong>
                  <span className="sparkle-text ml-2">2025</span>
                </div>
              </li>
            </ol>
            
            <div className="mt-8 p-5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50">
              <h4 className="text-lg font-bold text-orange-700 dark:text-orange-400 flex items-center mb-3">
                <InfoIcon className="w-5 h-5 mr-2" />
                Lưu ý: Nếu script không hiển thị
              </h4>
              <p className="text-slate-700 dark:text-slate-300 mb-3 text-sm">
                Nếu bạn đã cài đặt cả Tampermonkey và script nhưng khi vào web vẫn không thấy bảng điều khiển, có thể là do bạn chưa cấp đủ quyền cho Tampermonkey.
              </p>
              <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm mb-2">Cách khắc phục:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 text-sm">
                  <li>Nhấp chuột phải vào biểu tượng Tampermonkey trên trình duyệt và chọn <strong>"Quản lý tiện ích"</strong> (Manage extensions).</li>
                  <li>Trong trang quản lý, tìm và bật các quyền: <strong>"Cho phép tập lệnh của người dùng"</strong> (Allow User Scripts) và <strong>"Cho phép ở chế độ ẩn danh"</strong> (Allow in incognito).</li>
                </ol>
              </div>
            </div>
          </div>
        );
      case 'ios':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-slate-800 dark:text-white">
                    <AppleIcon className="w-6 h-6" active={theme === 'dark' ? true : false} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    Hướng dẫn cho iOS
                    <span className="block text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">(iPhone/iPad)</span>
                </h3>
            </div>

            <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-gray-700 text-slate-700 dark:text-slate-300 text-xs font-bold">1</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Cài đặt Ứng dụng Quản lý Script:</strong> Tải một ứng dụng 
                  <a href="https://apps.apple.com/vn/app/stay-for-safari/id1591620171?l=vi" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline mx-1">Stay</a>
                  từ App Store để quản lý script trên Safari.
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-gray-700 text-slate-700 dark:text-slate-300 text-xs font-bold">2</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Kích hoạt:</strong> Vào Cài đặt ⮕ Safari ⮕ Tiện ích mở rộng ⮕ Bật Stay (và cấp quyền).
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-gray-700 text-slate-700 dark:text-slate-300 text-xs font-bold">3</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Lấy liên kết Script:</strong> Ấn nút "Sao chép liên kết" để sao chép link script.
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-gray-700 text-slate-700 dark:text-slate-300 text-xs font-bold">4</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Thêm Script:</strong> Mở app Stay ⮕ ấn dấu cộng (+) ⮕ chọn "Link" ⮕ Dán liên kết vừa sao chép vào ⮕ "Continue".
                </p>
              </li>
               <li className="mb-2 ml-6">
                 <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-gray-700 text-slate-700 dark:text-slate-300 text-xs font-bold">5</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Sử dụng:</strong> Mở Web 
                  <a href="https://locket.binhake.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline mx-1">Locketbinhake</a>
                  , script sẽ tự động được kích hoạt để bạn có thể sử dụng các tính năng mới.
                </p>
              </li>
               <li className="ml-6">
                 <span className="absolute flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 text-xs font-bold">★</span>
                <div className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-100 dark:border-pink-800/30">
                  <strong className="text-slate-700 dark:text-slate-200">Key kích hoạt:</strong>
                  <span className="sparkle-text ml-2">2025</span>
                </div>
              </li>
            </ol>
            
            <div className="mt-8 p-5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50">
               <h4 className="text-lg font-bold text-orange-700 dark:text-orange-400 flex items-center mb-3">
                <InfoIcon className="w-5 h-5 mr-2" />
                Lưu ý: Nếu script không hiển thị
              </h4>
              <p className="text-slate-700 dark:text-slate-300 mb-3 text-sm">
                Nếu bạn đã cài đặt cả Stay và script nhưng khi vào web vẫn không thấy bảng điều khiển, có thể là do bạn chưa bật Stay trong Safari.
              </p>
              <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm mb-2">Cách khắc phục:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 text-sm">
                  <li>Bấm vào icon bên trái đường dẫn trong Safari</li>
                  <li>Bật cả Stay lẫn Script lên.</li>
                </ol>
              </div>
            </div>
          </div>
        );
      case 'android':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <AndroidIcon className="w-6 h-6" active={theme === 'dark' ? true : false} />
                </div>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    Hướng dẫn cho Android
                    <span className="block text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">Firefox + Tampermonkey</span>
                </h3>
            </div>
            
            <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs font-bold">1</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Sử dụng Trình duyệt Hỗ trợ Tiện ích:</strong> Cài đặt trình duyệt
                <a href="https://play.google.com/store/apps/details?id=org.mozilla.firefox&hl=vi" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline mx-1">Firefox</a>
                  từ Google Play Store.
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs font-bold">2</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Cài đặt Tampermonkey:</strong> Mở trình duyệt vừa cài, truy cập cửa hàng tiện ích và cài đặt tiện ích 
                  <a href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline mx-1">Tampermonkey</a>
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs font-bold">3</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Cài đặt Script:</strong> Nhấn vào nút "Cài đặt Script" ở trên. Một tab mới của Tampermonkey sẽ mở ra.
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs font-bold">4</span>
                 <p className="text-slate-700 dark:text-slate-300">
                  <strong>Xác nhận cài đặt:</strong>  Trong tab Tampermonkey, hãy xem lại thông tin và nhấn nút "Install" để hoàn tất. 
                </p>
              </li>
               <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs font-bold">5</span>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Sử dụng:</strong> Script sẽ hoạt động khi bạn truy cập Web
                  <a href="https://locket.binhake.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline mx-1">Locketbinhake</a>
                  bằng trình duyệt đó.
                </p>
              </li>
               <li className="ml-6">
                 <span className="absolute flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full -left-[13px] ring-4 ring-white dark:ring-slate-800 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 text-xs font-bold">★</span>
                <div className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-100 dark:border-pink-800/30">
                  <strong className="text-slate-700 dark:text-slate-200">Key kích hoạt:</strong>
                  <span className="sparkle-text ml-2">2025</span>
                </div>
              </li>
            </ol>
             <div className="mt-8 p-5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50">
               <h4 className="text-lg font-bold text-orange-700 dark:text-orange-400 flex items-center mb-3">
                <InfoIcon className="w-5 h-5 mr-2" />
                Lưu ý
              </h4>
              <p className="text-slate-700 dark:text-slate-300 text-sm">
                Nếu bạn đã thực hiện hết các bước mà script không hiển thị thì hãy liên hệ mình ngay nhé. Do mình chưa test trên Android nên có thể bỏ xót bước nào đó!
              </p>
            </div>
          </div>
        );
    }
  };

  const getTabClass = (tab: Tab) => {
    const isActive = activeTab === tab;
    return `relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 focus:outline-none z-10 ${
      isActive 
        ? 'text-white shadow-lg' 
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
    }`;
  };

  const getActiveTabBg = () => {
      switch(activeTab) {
          case 'web': return 'bg-gradient-to-r from-pink-500 to-purple-600';
          case 'ios': return 'bg-gradient-to-r from-slate-600 to-slate-800';
          case 'android': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-300/20 dark:bg-pink-900/20 rounded-full blur-[120px] animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-300/20 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-white/20 dark:border-slate-800/50">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-white dark:bg-slate-900 rounded-xl p-1">
                     <Logo />
                </div>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400 hidden sm:block tracking-tight">
                Locket Celebrity
            </h1>
          </div>
          <ThemeSwitch theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          
          {/* Hero Section */}
          <div className="text-center space-y-4">
             <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-200 dark:border-pink-900/50 backdrop-blur-sm">
                <span className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Phiên Bản Script {scriptInfo?.displayVersion || '...'}
                </span>
             </div>
             <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Tự động hóa trải nghiệm <br/>
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                    Locket Celebrity
                </span>
             </h2>
             <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Script hỗ trợ tối ưu hóa, tự động kết nối và tương tác. Đơn giản, an toàn và hiệu quả.
             </p>
          </div>

          {/* Main Info Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-2xl p-8 shadow-xl">
                {error && <p className="text-center text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900">{error}</p>}
                
                {scriptInfo ? (
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="space-y-4 flex-1">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{scriptInfo.name}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    UserScript
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-sm">Updated: 28/11/2025</span>
                            </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                            {scriptInfo.description}
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-3 md:self-center w-full md:w-auto flex-shrink-0">
                        <a
                            href={scriptInfo.installUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/btn relative overflow-hidden rounded-xl bg-slate-900 dark:bg-white px-8 py-4 text-white dark:text-slate-900 font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-center"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover/btn:opacity-10 dark:group-hover/btn:opacity-20 transition-opacity"></span>
                            <div className="flex items-center justify-center gap-3 relative z-10">
                                <DownloadIcon className="w-6 h-6" />
                                <span>Cài đặt Script</span>
                            </div>
                        </a>
                        
                        <button
                            onClick={handleCopyLink}
                            className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-8 py-3 text-slate-700 dark:text-slate-300 font-semibold shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full"
                        >
                             <div className="flex items-center justify-center gap-2">
                                {isCopied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <span className="text-green-600 dark:text-green-400">Đã sao chép</span>
                                    </>
                                ) : (
                                    <>
                                        <CopyIcon className="w-5 h-5" />
                                        <span>Sao chép liên kết</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Đang tải thông tin script...</p>
                </div>
                )}
            </div>
          </div>

          {/* Installation Guide Section */}
          <div className="space-y-8">
             <div className="text-center">
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Hướng dẫn cài đặt</h2>
                 <p className="text-slate-500 dark:text-slate-400 mt-2">Chọn nền tảng của bạn để xem hướng dẫn chi tiết</p>
             </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800 rounded-3xl p-2 md:p-3 shadow-sm">
                 {/* Tabs Switcher */}
                <div className="grid grid-cols-3 gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8 relative">
                    <div 
                        className={`absolute inset-y-1.5 transition-all duration-300 rounded-xl shadow-sm ${getActiveTabBg()}`}
                        style={{
                            left: activeTab === 'web' ? '0.375rem' : activeTab === 'ios' ? 'calc(33.333% + 0.25rem)' : 'calc(66.666% + 0.125rem)',
                            width: 'calc(33.333% - 0.5rem)'
                        }}
                    ></div>
                    
                    <button className={getTabClass('web')} onClick={() => setActiveTab('web')}>
                        <WebIcon className={`w-5 h-5 z-20 ${activeTab === 'web' ? '' : 'grayscale opacity-70'}`} active={activeTab === 'web'} />
                        <span className="hidden md:inline z-20">Web (Máy tính)</span>
                        <span className="md:hidden z-20">Web</span>
                    </button>
                    <button className={getTabClass('ios')} onClick={() => setActiveTab('ios')}>
                        <AppleIcon className={`w-5 h-5 z-20 ${activeTab === 'ios' ? '' : 'grayscale opacity-70'}`} active={activeTab === 'ios'} />
                        <span className="hidden md:inline z-20">iOS</span>
                         <span className="md:hidden z-20">iOS</span>
                    </button>
                    <button className={getTabClass('android')} onClick={() => setActiveTab('android')}>
                        <AndroidIcon className={`w-5 h-5 z-20 ${activeTab === 'android' ? '' : 'grayscale opacity-70'}`} active={activeTab === 'android'} />
                        <span className="hidden md:inline z-20">Android</span>
                         <span className="md:hidden z-20">Android</span>
                    </button>
                </div>

                {/* Guide Content */}
                <div className="px-4 pb-4 md:px-8 md:pb-8">
                    {renderInstallGuide()}
                </div>
            </div>
          </div>

          {/* Update History Timeline */}
          <div className="space-y-8">
             <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Lịch sử cập nhật</h2>
             
             <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 space-y-10 pb-8">
                
                {/* v1.3 */}
                <div className="relative pl-8 md:pl-12">
                   <span className="absolute -left-[9px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-slate-950 bg-gradient-to-r from-pink-500 to-purple-600"></span>
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">v1.3</h3>
                      <time className="text-sm font-medium text-slate-500 dark:text-slate-400">28/11/2025</time>
                   </div>
                   <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0"></span>
                            Sửa lỗi và tối ưu hóa chức năng "Tìm kiếm tự động".
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0"></span>
                            Cải thiện, nâng cấp giao diện người dùng.
                        </li>
                         <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0"></span>
                            Thêm các chức năng: "Tùy chỉnh Celeb", "Biểu đồ hoạt động", "Thống kê tài khoản".
                        </li>
                      </ul>
                   </div>
                </div>

                {/* v1.2 Fix */}
                <div className="relative pl-8 md:pl-12">
                   <span className="absolute -left-[9px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-slate-950 bg-slate-300 dark:bg-slate-700"></span>
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">v1.2 Fix</h3>
                      <time className="text-sm font-medium text-slate-400">01/11/2025</time>
                   </div>
                   <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                            Sửa lỗi và tối ưu hóa script.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                            Bổ sung chức năng "Tìm kiếm tự động" để tự động tìm và thêm Celeb bằng username.
                        </li>
                      </ul>
                   </div>
                </div>

                 {/* v1.2 */}
                <div className="relative pl-8 md:pl-12">
                   <span className="absolute -left-[9px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-slate-950 bg-slate-300 dark:bg-slate-700"></span>
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">v1.2</h3>
                      <time className="text-sm font-medium text-slate-400">31/10/2025</time>
                   </div>
                   <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                       <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                            Cải thiện, nâng cấp giao diện người dùng (UI) trực quan và thân thiện hơn.
                        </li>
                         <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                            Bổ sung tính năng yêu cầu Key kích hoạt để sử dụng script.
                        </li>
                      </ul>
                   </div>
                </div>

                {/* v1.1 */}
                <div className="relative pl-8 md:pl-12">
                   <span className="absolute -left-[9px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-slate-950 bg-slate-300 dark:bg-slate-700"></span>
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">v1.1</h3>
                      <time className="text-sm font-medium text-slate-400">30/10/2025</time>
                   </div>
                   <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                        <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                            Tối ưu hóa hiệu suất và độ ổn định của tính năng quét Celeb.
                        </li>
                         <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                            Thêm nút điều hướng ("Về trang Celebrity") để quay về trang công cụ chính từ bất kỳ trang nào khác.
                        </li>
                      </ul>
                   </div>
                </div>

                 {/* v1.0 */}
                 <div className="relative pl-8 md:pl-12">
                   <span className="absolute -left-[9px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-slate-950 bg-slate-300 dark:bg-slate-700"></span>
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">v1.0</h3>
                      <time className="text-sm font-medium text-slate-400">29/10/2025</time>
                   </div>
                   <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                         <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                            Phát hành phiên bản đầu tiên.
                        </li>
                         <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                            Các tính năng cốt lõi: Tự động quét và chạy toàn bộ danh sách Celeb, hẹn giờ tự động khởi động lại chu trình.
                        </li>
                      </ul>
                   </div>
                </div>

             </div>
          </div>
        </div>
      </main>

       <footer className="py-8 text-center text-slate-500 dark:text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Locket Celebrity. Made with ❤️</p>
      </footer>
    </div>
  );
};

export default LocketCelebrityPage;
    