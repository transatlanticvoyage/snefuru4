'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface KPopup1Props {
  isOpen: boolean;
  onClose: () => void;
  sitebase?: string | null;
}

export default function KPopup1({ isOpen, onClose, sitebase }: KPopup1Props) {
  const [kz101Checked, setKz101Checked] = useState(false);
  const [kz103Checked, setKz103Checked] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState<'kptab1' | 'kptab2' | 'kptab3' | 'kptab4' | 'kptab5' | 'kptab6' | 'kptab7'>('kptab1');
  const [uelBarColors, setUelBarColors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const supabase = createClientComponentClient();

  // Fetch custom colors for uelbar37 and uelbar38
  useEffect(() => {
    const fetchUelBarColors = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_colors')
          .select('color_ref_code, hex_value')
          .in('color_ref_code', ['uelbar38_bgcolor1', 'uelbar38_textcolor1', 'uelbar37_bgcolor1', 'uelbar37_textcolor1']);

        if (!error && data && data.length > 0) {
          // uelbar38 colors
          const bgColor38Item = data.find(item => item.color_ref_code === 'uelbar38_bgcolor1');
          const textColor38Item = data.find(item => item.color_ref_code === 'uelbar38_textcolor1');
          
          const bgColor38 = bgColor38Item?.hex_value || '#2563eb';
          const textColor38 = textColor38Item?.hex_value || '#ffffff';
          
          setUelBarColors({bg: bgColor38, text: textColor38});

          // uelbar37 colors
          const bgColor37Item = data.find(item => item.color_ref_code === 'uelbar37_bgcolor1');
          const textColor37Item = data.find(item => item.color_ref_code === 'uelbar37_textcolor1');
          
          const bgColor37 = bgColor37Item?.hex_value || '#1e40af';
          const textColor37 = textColor37Item?.hex_value || '#ffffff';
          
          setUelBar37Colors({bg: bgColor37, text: textColor37});
        }
      } catch (err) {
        console.error('Error fetching uel bar colors:', err);
      }
    };

    fetchUelBarColors();
  }, [supabase]);

  // Track URL changes
  useEffect(() => {
    setCurrentUrl(window.location.href);
    
    const handleUrlChange = () => {
      setCurrentUrl(window.location.href);
    };
    
    window.addEventListener('popstate', handleUrlChange);
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        setCurrentUrl(window.location.href);
      }
    });
    
    observer.observe(document, { subtree: true, childList: true });
    
    const handleCustomUrlUpdate = () => {
      setCurrentUrl(window.location.href);
    };
    window.addEventListener('urlchange', handleCustomUrlUpdate);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleCustomUrlUpdate);
      observer.disconnect();
    };
  }, [currentUrl]);

  // Handle URL parameters for popup state
  useEffect(() => {
    if (isOpen) {
      const url = new URL(window.location.href);
      url.searchParams.set('kpop', 'open');
      url.searchParams.set('kptab1', 'active');
      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new Event('urlchange'));
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('kpop');
      ['kptab1', 'kptab2', 'kptab3', 'kptab4', 'kptab5', 'kptab6', 'kptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new Event('urlchange'));
    }
  }, [isOpen]);

  // Handle checkbox clicks with mutual exclusivity
  const handleKz101Click = () => {
    setKz101Checked(true);
    setKz103Checked(false);
  };

  const handleKz103Click = () => {
    setKz103Checked(true);
    setKz101Checked(false);
  };

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActivePopupTab(tab as any);
    localStorage.setItem('kpopup1_lastActiveTab', tab);
    
    const url = new URL(window.location.href);
    ['kptab1', 'kptab2', 'kptab3', 'kptab4', 'kptab5', 'kptab6', 'kptab7'].forEach(t => {
      url.searchParams.delete(t);
    });
    url.searchParams.set(tab, 'active');
    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new Event('urlchange'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-xl relative overflow-hidden">
        {/* uelbar37 header bar */}
        <div 
          className="absolute top-0 left-0 right-0 flex items-center px-4"
          style={{ 
            height: '50px',
            backgroundColor: uelBar37Colors.bg,
            color: uelBar37Colors.text
          }}
        >
          <span className="font-semibold">BROWSER URL</span>
          
          {/* Vertical separator */}
          <div 
            className="bg-gray-600"
            style={{
              width: '3px',
              height: '100%',
              marginLeft: '30px',
              marginRight: '30px'
            }}
          />
          
          <span className="font-mono text-sm overflow-hidden whitespace-nowrap text-ellipsis flex-1">
            {(() => {
              try {
                const url = new URL(currentUrl);
                const sitebaseParam = url.searchParams.get('sitebase');
                
                if (sitebaseParam) {
                  const fullUrl = currentUrl;
                  const sitebaseText = `sitebase=${sitebaseParam}`;
                  const parts = fullUrl.split(sitebaseText);
                  
                  if (parts.length === 2) {
                    return (
                      <>
                        {parts[0]}
                        <span style={{ fontWeight: 'bold', color: '#ff9e71' }}>
                          {sitebaseText}
                        </span>
                        {parts[1]}
                      </>
                    );
                  }
                }
                
                return currentUrl;
              } catch (error) {
                return currentUrl;
              }
            })()}
          </span>

          {/* Copy buttons in uelbar37 */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(currentUrl);
            }}
            className="bg-gray-600 text-white font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
            style={{
              width: '80px',
              height: '50px',
              marginRight: '0px',
              fontSize: '10px',
              flexDirection: 'column',
              gap: '2px'
            }}
            title="Copy Full URL"
          >
            <div>COPY URL</div>
          </button>
          <button
            onClick={() => {
              try {
                const url = new URL(currentUrl);
                const sitebaseParam = url.searchParams.get('sitebase');
                if (sitebaseParam) {
                  navigator.clipboard.writeText(sitebaseParam);
                }
              } catch (error) {
                console.error('Error copying site:', error);
              }
            }}
            className="bg-gray-600 text-white font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
            style={{
              width: '60px',
              height: '50px',
              marginRight: '0px',
              fontSize: '10px',
              flexDirection: 'column',
              gap: '2px'
            }}
            title="Copy Site Domain"
          >
            <div>SITE</div>
          </button>
        </div>
        
        {/* uelbar38 header bar */}
        <div 
          className="absolute left-0 right-0 flex items-center px-4"
          style={{ 
            top: '50px',
            height: '50px',
            backgroundColor: uelBarColors.bg,
            color: uelBarColors.text
          }}
        >
          <span className="font-semibold">uelbar38</span>
          
          {/* Vertical separator */}
          <div 
            className="bg-gray-600"
            style={{
              width: '3px',
              height: '100%',
              marginLeft: '30px',
              marginRight: '30px'
            }}
          />
          
          <span className="font-bold">{window.location.pathname}</span>
          <div 
            className="ml-4 flex items-center kz101 cursor-pointer"
            style={{
              color: uelBarColors.text,
              padding: '8px',
              border: '1px solid black',
              fontSize: '16px'
            }}
            onClick={handleKz101Click}
          >
            <input
              type="checkbox"
              className="mr-2 pointer-events-none"
              checked={kz101Checked}
              readOnly
              style={{
                width: '18px',
                height: '18px'
              }}
            />
            SOPTION1 - Use Your Current Selection From Table | (Dynamic Count)
          </div>
          <div 
            className="flex items-center kz102 font-bold"
            style={{
              color: uelBarColors.text,
              padding: '8px',
              border: '1px solid black',
              fontSize: '16px'
            }}
          >
            OR
          </div>
          <div 
            className="flex items-center kz103 cursor-pointer"
            style={{
              color: uelBarColors.text,
              padding: '8px',
              border: '1px solid black',
              fontSize: '16px'
            }}
            onClick={handleKz103Click}
          >
            <input
              type="checkbox"
              className="mr-2 pointer-events-none"
              checked={kz103Checked}
              readOnly
              style={{
                width: '18px',
                height: '18px'
              }}
            />
            SOPTION2 - Select All Items In Current Pagination | (DYNAMIC COUNT)
          </div>
          
          {/* Close button in header - spans both bars */}
          <button
            onClick={onClose}
            className="absolute right-0 top-0 bg-gray-400 text-gray-800 font-bold flex items-center justify-center hover:bg-gray-500 transition-colors"
            style={{
              width: '260px',
              height: '100px', // Spans both 50px bars
              border: '2px solid #4a4a4a',
              fontSize: '14px',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ fontSize: '20px' }}>×</div>
            <div style={{ fontSize: '12px', lineHeight: '12px', textAlign: 'center' }}>
              CLOSE<br/>POPUP
            </div>
          </button>
        </div>
        
        {/* Popup content - adjusted to start below both headers */}
        <div className="h-full" style={{ paddingTop: '100px' }}>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex">
              {['kptab1', 'kptab2', 'kptab3', 'kptab4', 'kptab5', 'kptab6', 'kptab7'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activePopupTab === tab
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-8 h-full overflow-auto">
            {activePopupTab === 'kptab1' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Content for kptab1</h3>
                <p className="text-gray-600">This is the content area for kptab1.</p>
                {sitebase && (
                  <p className="mt-4 text-sm text-gray-600">
                    Selected site: <span className="font-medium">{sitebase}</span>
                  </p>
                )}
              </div>
            )}
            {activePopupTab === 'kptab2' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Content for kptab2</h3>
                <p className="text-gray-600">This is the content area for kptab2.</p>
              </div>
            )}
            {activePopupTab === 'kptab3' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Content for kptab3</h3>
                <p className="text-gray-600">This is the content area for kptab3.</p>
              </div>
            )}
            {activePopupTab === 'kptab4' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Content for kptab4</h3>
                <p className="text-gray-600">This is the content area for kptab4.</p>
              </div>
            )}
            {activePopupTab === 'kptab5' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Content for kptab5</h3>
                <p className="text-gray-600">This is the content area for kptab5.</p>
              </div>
            )}
            {activePopupTab === 'kptab6' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Content for kptab6</h3>
                <p className="text-gray-600">This is the content area for kptab6.</p>
              </div>
            )}
            {activePopupTab === 'kptab7' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Content for kptab7</h3>
                <p className="text-gray-600">This is the content area for kptab7.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}