'use client';

import React, { useEffect, useState } from 'react';
import { useFavaTaniSafe } from './favaTaniConditionalProvider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FavaBiriDevInfoBox from '../favaBiriDevInfoBox';
import FavaTrelnoColumnsDefBox from '../favaTrelnoColumnsDefBox';
import PlutoShowHideInstrument from '../plutoShowHideInstrument';

interface FavaTaniModalProps {
  children?: React.ReactNode;
}

export default function FavaTaniModal({ children }: FavaTaniModalProps) {
  const tani = useFavaTaniSafe();
  const [uelBar37Colors, setUelBar37Colors] = useState<{bg: string, text: string}>({bg: '#1e40af', text: '#ffffff'});
  const [uelBar38Colors, setUelBar38Colors] = useState<{bg: string, text: string}>({bg: '#2563eb', text: '#ffffff'});
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const supabase = createClientComponentClient();

  // Track URL changes
  useEffect(() => {
    const updateUrl = () => setCurrentUrl(window.location.href);
    updateUrl();
    
    window.addEventListener('popstate', updateUrl);
    window.addEventListener('urlchange', updateUrl);
    
    return () => {
      window.removeEventListener('popstate', updateUrl);
      window.removeEventListener('urlchange', updateUrl);
    };
  }, []);

  // Fetch colors from database
  useEffect(() => {
    if (!tani || !tani.state.flags.components.colorFetching) return;

    const fetchColors = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_colors')
          .select('color_ref_code, hex_value')
          .in('color_ref_code', [
            'uelbar37_bgcolor1', 'uelbar37_textcolor1', 
            'uelbar38_bgcolor1', 'uelbar38_textcolor1'
          ]);

        if (!error && data && data.length > 0) {
          // uelbar37 colors
          const bg37 = data.find(item => item.color_ref_code === 'uelbar37_bgcolor1')?.hex_value || '#1e40af';
          const text37 = data.find(item => item.color_ref_code === 'uelbar37_textcolor1')?.hex_value || '#ffffff';
          setUelBar37Colors({bg: bg37, text: text37});

          // uelbar38 colors  
          const bg38 = data.find(item => item.color_ref_code === 'uelbar38_bgcolor1')?.hex_value || '#2563eb';
          const text38 = data.find(item => item.color_ref_code === 'uelbar38_textcolor1')?.hex_value || '#ffffff';
          setUelBar38Colors({bg: bg38, text: text38});
        }
      } catch (err) {
        console.error('Error fetching colors:', err);
      }
    };

    fetchColors();
  }, [supabase, tani]);

  // Render tab content with content slots support
  const renderTabContent = () => {
    const activeTab = tani?.state.activeTab;
    const contentSlots = config.contentSlots;
    
    // Default dummy content
    const defaultContent = (
      <div style={{ fontSize: '18px' }}>
        <div style={{ fontWeight: 'bold' }}>future content</div>
        <div>will be going here</div>
      </div>
    );
    
    // Default dev boxes for ptab1
    const defaultDevBoxes = (
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <FavaBiriDevInfoBox />
        <FavaTrelnoColumnsDefBox />
      </div>
    );
    
    switch (activeTab) {
      case 'tani1':
        return (
          <div>
            {/* Always show dev boxes in ptab1 */}
            {defaultDevBoxes}
            
            {/* Custom content for tani1 (if provided) or default content */}
            {contentSlots?.tani1 || defaultContent}
          </div>
        );
      case 'tani2':
        return (
          <div>
            {/* Pluto Show/Hide Instrument - always in ptab2 */}
            <PlutoShowHideInstrument utg_id={config.utg_id} />
            
            {/* Custom content for tani2 (if provided) or default content */}
            {contentSlots?.tani2 && (
              <div style={{ marginTop: '20px' }}>
                {contentSlots.tani2}
              </div>
            )}
          </div>
        );
      case 'tani3':
        return contentSlots?.tani3 || defaultContent;
      case 'tani4':
        return contentSlots?.tani4 || defaultContent;
      case 'tani5':
        return contentSlots?.tani5 || defaultContent;
      case 'tani6':
        return contentSlots?.tani6 || defaultContent;
      case 'tani7':
        return contentSlots?.tani7 || defaultContent;
      default:
        return defaultContent;
    }
  };

  // Early return after all hooks
  if (!tani || !tani.state.isOpen) {
    return null;
  }

  const { config, flags } = tani.state;
  const { closePopup, setActiveTab } = tani.actions;

  // Handle tab changes with URL updates
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    
    if (flags.components.localStorage && flags.features.tabMemory) {
      const storageKey = `${config.urlConfig?.storageKey || 'favaTani'}_lastTab`;
      localStorage.setItem(storageKey, tabId);
    }
  };

  // Copy URL functions
  const copyFullUrl = () => {
    navigator.clipboard.writeText(currentUrl);
  };

  const copySiteParameter = () => {
    try {
      const url = new URL(currentUrl);
      const sitebaseParam = url.searchParams.get('sitebase');
      if (sitebaseParam) {
        navigator.clipboard.writeText(sitebaseParam);
      }
    } catch (error) {
      console.error('Error copying site parameter:', error);
    }
  };

  const modalConfig = config.modalConfig || {};
  const visibleTabs = config.tabs.filter(tab => tab.visible !== false);

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && flags.features.outsideClickClose) {
          closePopup();
        }
      }}
    >
      <div
        className="bg-white w-full h-full rounded-lg shadow-xl relative overflow-hidden"
        style={{
          maxWidth: modalConfig.maxWidth || '95vw',
          maxHeight: modalConfig.maxHeight || '95vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* uelbar37 - Browser URL Header */}
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
                  const sitebaseText = `sitebase=${sitebaseParam}`;
                  const parts = currentUrl.split(sitebaseText);
                  
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

          {/* Copy buttons */}
          <button
            onClick={copyFullUrl}
            className="bg-gray-600 text-white font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
            style={{
              width: '80px',
              height: '50px',
              fontSize: '10px',
              flexDirection: 'column',
              gap: '2px'
            }}
            title="Copy Full URL"
          >
            <div>COPY URL</div>
          </button>
          <button
            onClick={copySiteParameter}
            className="bg-gray-600 text-white font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
            style={{
              width: '60px',
              height: '50px',
              fontSize: '10px',
              flexDirection: 'column',
              gap: '2px'
            }}
            title="Copy Site Domain"
          >
            <div>SITE</div>
          </button>
        </div>
        
        {/* uelbar38 - Pathname Actions Header */}
        <div 
          className="absolute left-0 right-0 flex items-center px-4"
          style={{ 
            top: '50px',
            height: '50px',
            backgroundColor: uelBar38Colors.bg,
            color: uelBar38Colors.text
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

          {/* Render header actions if provided */}
          {config.headers?.map((header, index) => {
            if (header.type === 'pathname-actions' && header.actions) {
              return (
                <div key={index} className="flex items-center ml-4">
                  {header.actions.map((action, actionIndex) => (
                    <React.Fragment key={action.id}>
                      {actionIndex > 0 && (
                        <div 
                          className="flex items-center font-bold mx-2"
                          style={{
                            color: uelBar38Colors.text,
                            padding: '8px',
                            border: '1px solid black',
                            fontSize: '16px'
                          }}
                        >
                          OR
                        </div>
                      )}
                      <div 
                        className="flex items-center cursor-pointer"
                        style={{
                          color: uelBar38Colors.text,
                          padding: '8px',
                          border: '1px solid black',
                          fontSize: '16px'
                        }}
                        onClick={() => action.onChange?.(true)}
                      >
                        <input
                          type="checkbox"
                          className="mr-2 pointer-events-none"
                          checked={action.checked || false}
                          readOnly
                          style={{
                            width: '18px',
                            height: '18px'
                          }}
                        />
                        {action.label}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              );
            }
            return null;
          })}
          
          {/* Close button spanning both header bars */}
          <button
            onClick={closePopup}
            className="absolute right-0 top-0 bg-gray-400 text-gray-800 font-bold flex items-center justify-center hover:bg-gray-500 transition-colors"
            style={{
              width: '260px',
              height: '100px',
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
        
        {/* Content area - starts below both headers */}
        <div className="h-full" style={{ paddingTop: '100px' }}>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={tab.disabled}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tani.state.activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-8 h-full overflow-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}