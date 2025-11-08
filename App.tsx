import React, { useState, useEffect } from 'react';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { BrowserIcon } from './components/icons/BrowserIcon';
import { AppleIcon } from './components/icons/AppleIcon';
import { AndroidIcon } from './components/icons/AndroidIcon';
import { Logo } from './components/icons/Logo';
import { WebIcon } from './components/icons/WebIcon';
import { InfoIcon } from './components/icons/InfoIcon';

type Tab = 'web' | 'ios' | 'android';

interface ScriptInfo {
  name: string;
  version: string;
  displayVersion: string;
  description: string;
  installUrl: string;
}

const LocketCelebrityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('web');
  const [scriptInfo, setScriptInfo] = useState<ScriptInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const SCRIPT_URL = 'https://raw.githubusercontent.com/huyvu2512/locket-celebrity/main/tampermonkey.user.js';

  useEffect(() => {
    const fetchScriptInfo = async () => {
      try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const scriptText = await response.text();
        const nameMatch = scriptText.match(/@name\s+(.*)/);
        const versionMatch = scriptText.match(/@version\s+(.*)/);
        const descriptionMatch = scriptText.match(/@description\s+(.*)/);

        const name = nameMatch ? nameMatch[1].trim() : 'Không rõ';
        const version = versionMatch ? versionMatch[1].trim() : 'Không rõ';
        const description = descriptionMatch ? descriptionMatch[1].trim() : 'Không có mô tả.';

        const nameVersionMatch = name.match(/\(v(.*)\)/);
        const displayVersion = nameVersionMatch ? nameVersionMatch[1].trim() : version;

        setScriptInfo({
          name,
          version,
          displayVersion,
          description,
          installUrl: SCRIPT_URL,
        });
      } catch (e) {
        if (e instanceof Error) {
            setError(`Không thể tải thông tin script: ${e.message}`);
        } else {
            setError('Đã xảy ra lỗi không xác định.');
        }
      }
    };
    fetchScriptInfo();
  }, []);

  const renderInstallGuide = () => {
    switch (activeTab) {
      case 'web':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center text-red-violet-400">
              <BrowserIcon className="w-6 h-6 mr-3 text-red-violet-300" />
              Hướng dẫn cho Trình duyệt (Chrome, Firefox, Edge, ...)
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-red-violet-400/80 pl-2">
              <li>
                <strong>Cài đặt Tampermonkey:</strong> Truy cập cửa hàng tiện ích của trình duyệt và cài đặt
                <a href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline mx-1">Tampermonkey</a>.
                Đây là trình quản lý userscript phổ biến và an toàn.
              </li>
              <li>
                <strong>Cài đặt Script:</strong> Nhấn vào nút "Cài đặt Script" ở trên. Một tab mới của Tampermonkey sẽ mở ra.
              </li>
              <li>
                <strong>Xác nhận Cài đặt:</strong> Trong tab Tampermonkey, hãy xem lại thông tin và nhấn nút "Install" để hoàn tất.
              </li>
               <li>
                <strong>Sử dụng:</strong> Mở Web 
                <a href="https://locket.binhake.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline mx-1">Locketbinhake</a>
                trên web, script sẽ tự động được kích hoạt để bạn có thể sử dụng các tính năng mới.
              </li>
              <li>
                <strong>Key: </strong>
                <span className="sparkle-text">2025</span>
              </li>
            </ol>
            
            <div className="mt-6 p-4 rounded-lg bg-red-violet-100/40 border-l-4 border-red-violet-300 space-y-2">
              <h4 className="text-lg font-semibold text-red-violet-400 flex items-center">
                <InfoIcon className="w-5 h-5 mr-2.5 text-red-violet-300 flex-shrink-0" />
                Lưu ý: Nếu script không hiển thị
              </h4>
              <p className="text-red-violet-400/80 pl-1">
                Nếu bạn đã cài đặt cả Tampermonkey và script nhưng khi vào web vẫn không thấy bảng điều khiển, có thể là do bạn chưa cấp đủ quyền cho Tampermonkey.
              </p>
              <div className="pl-1">
                <p className="font-semibold text-red-violet-400/90">Cách khắc phục:</p>
                <ol className="list-decimal list-inside mt-2 space-y-2 text-red-violet-400/80 pl-2">
                  <li>Nhấp chuột phải vào biểu tượng Tampermonkey trên trình duyệt và chọn <strong>"Quản lý tiện ích"</strong> (Manage extensions).</li>
                  <li>Trong trang quản lý, tìm và bật các quyền: <strong>"Cho phép tập lệnh của người dùng"</strong> (Allow User Scripts) và <strong>"Cho phép ở chế độ ẩn danh"</strong> (Allow in incognito).</li>
                </ol>
              </div>
            </div>
          </div>
        );
      case 'ios':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center text-red-violet-400">
              <AppleIcon className="w-6 h-6 mr-3" active={false} />
              Hướng dẫn cho iOS (iPhone/iPad)
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-red-violet-400/80 pl-2">
              <li>
                <strong>Cài đặt Ứng dụng Quản lý Script:</strong> Tải một ứng dụng 
                <a href="https://apps.apple.com/vn/app/stay-for-safari/id1591620171?l=vi" target="_blank" rel="noopener noreferrer" className="text-red-violet-300 hover:underline mx-1">Stay</a>
                từ App Store để quản lý script trên Safari.
              </li>
              <li>
                <strong>Kích hoạt:</strong> Vào Cài đặt ⮕ Safari ⮕ Tiện ích mở rộng ⮕ Bật Stay (và cấp quyền).
              </li>
              <li>
                <strong>Thêm Script:</strong> Ấn vào nút "Sao Chép" ở trên. Mở app Stay ⮕ ấn dấu cộng (+) ⮕ chọn "Link" ⮕ Dán liên kết vừa chép vào ⮕ "Continue".
              </li>
               <li>
                <strong>Sử dụng:</strong> Mở Web 
                <a href="https://locket.binhake.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline mx-1">Locketbinhake</a>
                trên web, script sẽ tự động được kích hoạt để bạn có thể sử dụng các tính năng mới.
              </li>
              <li>
                <strong>Key: </strong>
                <span className="sparkle-text">2025</span>
              </li>
            </ol>
            <div className="mt-6 p-4 rounded-lg bg-red-violet-100/40 border-l-4 border-red-violet-300 space-y-2">
              <h4 className="text-lg font-semibold text-red-violet-400 flex items-center">
                <InfoIcon className="w-5 h-5 mr-2.5 text-red-violet-300 flex-shrink-0" />
                Lưu ý: Nếu script không hiển thị
              </h4>
              <p className="text-red-violet-400/80 pl-1">
                Nếu bạn đã cài đặt cả Stay và script nhưng khi vào web vẫn không thấy bảng điều khiển, có thể là do bạn chưa bật Stay trong Safari.
              </p>
              <div className="pl-1">
                <p className="font-semibold text-red-violet-400/90">Cách khắc phục:</p>
                <ol className="list-decimal list-inside mt-2 space-y-2 text-red-violet-400/80 pl-2">
                  <li>Bấm vào icon bên trái đường dẫn trong Safari</li>
                  <li>Bật cả Stay lẫn Script lên.</li>
                </ol>
              </div>
            </div>
          </div>
        );
      case 'android':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center text-red-violet-400">
              <AndroidIcon className="w-6 h-6 mr-3" />
              Hướng dẫn cho Android
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-red-violet-400/80 pl-2">
              <li>
                <strong>Sử dụng Trình duyệt Hỗ trợ Tiện ích:</strong> Cài đặt trình duyệt
              <a href="https://play.google.com/store/apps/details?id=org.mozilla.firefox&hl=vi" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline mx-1">Firefox</a>
                từ Google Play Store.
              </li>
              <li>
                <strong>Cài đặt Tampermonkey:</strong> Mở trình duyệt vừa cài, truy cập cửa hàng tiện ích và cài đặt tiện ích 
                <a href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline mx-1">Tampermonkey</a>
              </li>
              <li>
                <strong>Cài đặt Script:</strong> Nhấn vào nút "Cài đặt Script" ở trên. Một tab mới của Tampermonkey sẽ mở ra.
              </li>
              <li>
                <strong>Xác nhận cài đặt:</strong>  Trong tab Tampermonkey, hãy xem lại thông tin và nhấn nút "Install" để hoàn tất. 
              </li>
              <li>
                <strong>Sử dụng:</strong> Script sẽ hoạt động khi bạn truy cập 
                <a href="https://locket.binhake.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline mx-1">Locketbinhake</a>
                bằng trình duyệt đó.
              </li>
              <li>
                <strong>Key: </strong>
                <span className="sparkle-text">2025</span>
              </li>
            </ol>
             <div className="mt-6 p-4 rounded-lg bg-red-violet-100/40 border-l-4 border-red-violet-300 space-y-2">
              <h4 className="text-lg font-semibold text-red-violet-400 flex items-center">
                <InfoIcon className="w-5 h-5 mr-2.5 text-red-violet-300 flex-shrink-0" />
                Lưu ý
              </h4>
              <p className="text-red-violet-400/80 pl-1">
                Nếu bạn đã thực hiện hết các bước mà script không hiển thị thì hãy liên hệ mình ngay nhé. Do mình chưa test trên Android nên có thể bỏ xót bước nào đó!
              </p>
            </div>
          </div>
        );
    }
  };

  const getTabClass = (tab: Tab) => {
    return `px-4 py-2.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-violet-50 focus:ring-red-violet-300 ${
      activeTab === tab ? 'bg-red-violet-300 text-white' : 'bg-red-violet-100/50 text-red-violet-400 hover:bg-red-violet-100/80'
    }`;
  };

  return (
    <div className="bg-red-violet-50 text-red-violet-400 min-h-screen bg-transition">
      <header className="fixed top-0 left-0 right-0 z-10 bg-red-violet-50/80 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-bold text-red-violet-400">Locket Celebrity</h1>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-violet-200 to-red-violet-300 bg-clip-text text-transparent">
              Phiên Bản Script
            </h2>
          </div>

          <div className="bg-white border border-red-violet-100 rounded-xl shadow-lg p-6 md:p-8 mb-12 bg-transition">
            {error && <p className="text-center text-red-500">{error}</p>}
            {scriptInfo ? (
               <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-red-violet-400">{scriptInfo.name}</h2>
                  <p className="text-red-violet-300 mt-1">Version: {scriptInfo.displayVersion}</p>
                  <p className="text-red-violet-400/90 mt-3 max-w-xl">
                    {scriptInfo.description}
                  </p>
                </div>
                <a
                  href={scriptInfo.installUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 md:mt-0 flex-shrink-0 px-6 py-3 bg-red-violet-300 hover:bg-red-violet-200 text-white font-bold rounded-lg flex items-center space-x-2.5 transition-transform duration-300 hover:scale-105 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-red-violet-300"
                >
                  <DownloadIcon className="w-5 h-5" />
                  <span>Cài đặt Script</span>
                </a>
              </div>
            ) : (
              <p className="text-center">Đang tải thông tin script...</p>
            )}
          </div>

          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-red-violet-200 to-red-violet-300 bg-clip-text text-transparent">Hướng dẫn cài đặt</h2>
            <div className="flex justify-center space-x-2 md:space-x-4 mb-8">
              <button className={`${getTabClass('web')} inline-flex items-center gap-2`} onClick={() => setActiveTab('web')}>
                <WebIcon className="w-4 h-4" active={activeTab === 'web'} />
                <span>Web (Máy tính)</span>
              </button>
              <button className={`${getTabClass('ios')} inline-flex items-center gap-2`} onClick={() => setActiveTab('ios')}>
                 <AppleIcon className="w-4 h-4" active={activeTab === 'ios'} />
                 <span>iOS</span>
              </button>
              <button className={`${getTabClass('android')} inline-flex items-center gap-2`} onClick={() => setActiveTab('android')}>
                 <AndroidIcon className="w-4 h-4" active={activeTab === 'android'} />
                 <span>Android</span>
              </button>
            </div>
            <div className="bg-white border border-red-violet-100 rounded-xl p-6 md:p-8 min-h-[280px] bg-transition">
              {renderInstallGuide()}
            </div>
          </div>

          <div className="mb-12">
             <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-red-violet-200 to-red-violet-300 bg-clip-text text-transparent">Lịch sử cập nhật</h2>
             <div className="bg-white border border-red-violet-100 rounded-xl p-6 md:p-8 space-y-6 bg-transition">
                <div>
                  <div className="flex items-baseline space-x-3">
                    <h3 className="text-xl font-semibold text-red-violet-400">v1.2 Fix</h3>
                    <p className="text-sm text-red-violet-300/80">01/11/2025</p>
                  </div>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-red-violet-400/90 pl-2">
                    <li>Sửa lỗi và tối ưu hóa script.</li>
                    <li>Bổ sung chức năng "Tìm kiếm tự động" để tự động tìm và thêm Celeb bằng username.</li>
                  </ul>
                </div>
                <div className="border-t border-red-violet-100"></div>
                <div>
                  <div className="flex items-baseline space-x-3">
                    <h3 className="text-xl font-semibold text-red-violet-400">v1.2</h3>
                    <p className="text-sm text-red-violet-300/80">31/10/2025</p>
                  </div>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-red-violet-400/90 pl-2">
                    <li>Cải thiện, nâng cấp giao diện người dùng (UI) trực quan và thân thiện hơn.</li>
                    <li>Bổ sung tính năng yêu cầu Key kích hoạt để sử dụng script.</li>
                  </ul>
                </div>
                <div className="border-t border-red-violet-100"></div>
                 <div>
                  <div className="flex items-baseline space-x-3">
                    <h3 className="text-xl font-semibold text-red-violet-400">v1.1</h3>
                    <p className="text-sm text-red-violet-300/80">30/10/2025</p>
                  </div>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-red-violet-400/90 pl-2">
                    <li>Tối ưu hóa hiệu suất và độ ổn định của tính năng quét Celeb.</li>
                    <li>Thêm nút điều hướng ("Về trang Celebrity") để quay về trang công cụ chính từ bất kỳ trang nào khác.</li>
                  </ul>
                </div>
                <div className="border-t border-red-violet-100"></div>
                <div>
                  <div className="flex items-baseline space-x-3">
                    <h3 className="text-xl font-semibold text-red-violet-400">v1.0</h3>
                    <p className="text-sm text-red-violet-300/80">29/10/2025</p>
                  </div>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-red-violet-400/90 pl-2">
                    <li>Phát hành phiên bản đầu tiên.</li>
                    <li>Các tính năng cốt lõi: Tự động quét và chạy toàn bộ danh sách Celeb, hẹn giờ tự động khởi động lại chu trình.</li>
                  </ul>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocketCelebrityPage;