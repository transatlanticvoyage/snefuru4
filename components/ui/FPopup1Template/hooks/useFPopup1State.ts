import { useState, useEffect } from 'react';
import { FPopup1State, FPopup1TabId, FPopup1ColorConfig, UseFPopup1StateProps } from '../types';

export const useFPopup1State = ({ config, supabase }: UseFPopup1StateProps) => {
  const [state, setState] = useState<FPopup1State>({
    isOpen: false,
    activeTab: 'ptab1',
    headerColors: {},
    currentUrl: ''
  });

  // Initialize from URL parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.title = `${config.id} - Snefuru`;
    
    const urlParams = new URLSearchParams(window.location.search);
    const popupParam = urlParams.get(config.urlConfig.popupParam);
    
    // Auto-open popup if parameter is 'open'
    if (popupParam === 'open') {
      setState(prev => ({ ...prev, isOpen: true }));
      
      // Set active tab based on URL parameters
      const activeTabFromUrl = config.tabs.find(tab => 
        urlParams.get(tab.id) === 'active'
      );
      
      if (activeTabFromUrl) {
        setState(prev => ({ ...prev, activeTab: activeTabFromUrl.id }));
      } else {
        // Use last remembered tab from localStorage
        const lastTab = localStorage.getItem(config.urlConfig.storageKey) || 'ptab1';
        setState(prev => ({ ...prev, activeTab: lastTab as FPopup1TabId }));
      }
    }
    
    // Set initial URL
    setState(prev => ({ ...prev, currentUrl: window.location.href }));
  }, [config]);

  // Fetch custom colors for headers
  useEffect(() => {
    const fetchHeaderColors = async () => {
      if (!supabase) return;

      try {
        // Extract unique color schemes from header configs
        const colorSchemes = [...new Set(config.headers.map(h => h.colorScheme))];
        const colorNames = colorSchemes.flatMap(scheme => [
          `${scheme}_bgcolor1`,
          `${scheme}_textcolor1`
        ]);

        const { data, error } = await supabase
          .from('custom_colors')
          .select('color_name, color_value')
          .in('color_name', colorNames);

        if (!error && data && data.length > 0) {
          const colors: Record<string, FPopup1ColorConfig> = {};
          
          colorSchemes.forEach(scheme => {
            const bgItem = data.find(item => item.color_name === `${scheme}_bgcolor1`);
            const textItem = data.find(item => item.color_name === `${scheme}_textcolor1`);
            
            colors[scheme] = {
              bg: bgItem?.color_value || '#2563eb',
              text: textItem?.color_value || '#ffffff'
            };
          });
          
          setState(prev => ({ ...prev, headerColors: colors }));
        } else {
          // Set default colors for each scheme
          const defaultColors: Record<string, FPopup1ColorConfig> = {};
          colorSchemes.forEach(scheme => {
            defaultColors[scheme] = {
              bg: scheme === 'uelbar37' ? '#1e40af' : '#2563eb',
              text: '#ffffff'
            };
          });
          setState(prev => ({ ...prev, headerColors: defaultColors }));
        }
      } catch (err) {
        console.error('Error fetching header colors:', err);
      }
    };

    fetchHeaderColors();
  }, [config, supabase]);

  // Track URL changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUrlChange = () => {
      setState(prev => ({ ...prev, currentUrl: window.location.href }));
    };
    
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('urlchange', handleUrlChange);
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== state.currentUrl) {
        setState(prev => ({ ...prev, currentUrl: window.location.href }));
      }
    });
    
    observer.observe(document, { subtree: true, childList: true });
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleUrlChange);
      observer.disconnect();
    };
  }, [state.currentUrl]);

  const setIsOpen = (isOpen: boolean) => {
    setState(prev => ({ ...prev, isOpen }));
  };

  const setActiveTab = (activeTab: FPopup1TabId) => {
    setState(prev => ({ ...prev, activeTab }));
    localStorage.setItem(config.urlConfig.storageKey, activeTab);
  };

  return {
    ...state,
    setIsOpen,
    setActiveTab
  };
};