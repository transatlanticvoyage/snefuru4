'use client';

import { useState, useEffect } from 'react';

// PlutoSettings interface to match the one in plutoShowHideInstrument
export interface PlutoSettings {
  ctc_buttons_ocean_classic: boolean;
  ctc_buttons_ocean_classic_2: boolean;
  ctc_buttons_ocean_enhanced: boolean;
  ctc_shendo_classic: boolean;
  ctc_shendo_enhanced: boolean;
  harpoon_preview: boolean;
  harpoon_active: boolean;
  rowfilters_chamber: boolean;
  searchbox: boolean;
  pagination_specificbar: boolean;
}

// Default settings - all chambers visible by default
export const DEFAULT_PLUTO_SETTINGS: PlutoSettings = {
  ctc_buttons_ocean_classic: true,
  ctc_buttons_ocean_classic_2: true,
  ctc_buttons_ocean_enhanced: true,
  ctc_shendo_classic: true,
  ctc_shendo_enhanced: true,
  harpoon_preview: true,
  harpoon_active: true,
  rowfilters_chamber: true,
  searchbox: true,
  pagination_specificbar: true
};

/**
 * Hook to read and monitor pluto settings from localStorage
 * @param utg_id - User/template group ID for scoped settings
 * @returns PlutoSettings object with current visibility settings
 */
export const usePlutoSettings = (utg_id?: string | number): PlutoSettings => {
  const [settings, setSettings] = useState<PlutoSettings>(DEFAULT_PLUTO_SETTINGS);

  useEffect(() => {
    // Generate storage key to match plutoShowHideInstrument pattern
    const storageKey = `fava_pluto_settings_${utg_id || 'default'}`;
    
    console.log('🔍 usePlutoSettings - Loading settings:', {
      utg_id,
      utg_id_type: typeof utg_id,
      storageKey,
      rawStorageValue: localStorage.getItem(storageKey)
    });
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        console.log('🔍 usePlutoSettings - Parsed settings:', parsedSettings);
        // Merge with defaults to ensure all properties exist
        const mergedSettings = { ...DEFAULT_PLUTO_SETTINGS, ...parsedSettings };
        console.log('🔍 usePlutoSettings - Final merged settings:', mergedSettings);
        setSettings(mergedSettings);
      } else {
        console.log('🔍 usePlutoSettings - No stored settings, using defaults:', DEFAULT_PLUTO_SETTINGS);
        setSettings(DEFAULT_PLUTO_SETTINGS);
      }
    } catch (error) {
      console.error('Error reading pluto settings:', error);
      setSettings(DEFAULT_PLUTO_SETTINGS);
    }

    // Listen for storage changes to update settings in real-time
    const handleStorageChange = (e: StorageEvent) => {
      console.log('🔍 usePlutoSettings - Storage change detected:', {
        key: e.key,
        expectedKey: storageKey,
        newValue: e.newValue,
        matches: e.key === storageKey
      });
      
      if (e.key === storageKey && e.newValue) {
        try {
          const parsedSettings = JSON.parse(e.newValue);
          console.log('🔍 usePlutoSettings - Storage change parsed:', parsedSettings);
          const mergedSettings = { ...DEFAULT_PLUTO_SETTINGS, ...parsedSettings };
          console.log('🔍 usePlutoSettings - Storage change merged:', mergedSettings);
          setSettings(mergedSettings);
        } catch (error) {
          console.error('Error parsing pluto settings from storage event:', error);
        }
      }
    };

    // Listen for custom pluto settings change events (same tab)
    const handleCustomEvent = (e: CustomEvent) => {
      console.log('🔍 usePlutoSettings - Custom event detected:', e.detail);
      if (String(e.detail.utg_id) === String(utg_id)) {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsedSettings = JSON.parse(stored);
            const mergedSettings = { ...DEFAULT_PLUTO_SETTINGS, ...parsedSettings };
            console.log('🔍 usePlutoSettings - Custom event merged settings:', mergedSettings);
            setSettings(mergedSettings);
          }
        } catch (error) {
          console.error('Error parsing pluto settings from custom event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pluto-settings-changed', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pluto-settings-changed', handleCustomEvent as EventListener);
    };
  }, [utg_id]);

  return settings;
};

/**
 * Utility function to get a specific chamber's visibility status
 * @param settings - PlutoSettings object
 * @param chamberKey - Key of the chamber to check
 * @returns boolean indicating if the chamber should be visible
 */
export const isChamberVisible = (
  settings: PlutoSettings, 
  chamberKey: keyof PlutoSettings
): boolean => {
  return settings[chamberKey] ?? true; // Default to visible if undefined
};

/**
 * Utility function to generate CSS classes for a chamber
 * @param settings - PlutoSettings object
 * @param chamberKey - Key of the chamber
 * @param chamberClassName - CSS class name for the chamber
 * @returns string of CSS classes
 */
export const getChamberClasses = (
  settings: PlutoSettings,
  chamberKey: keyof PlutoSettings,
  chamberClassName: string
): string => {
  const isVisible = isChamberVisible(settings, chamberKey);
  const classes = `${chamberClassName} pluto-controlled ${isVisible ? 'pluto-visible' : 'pluto-hidden'}`;
  
  console.log('🔍 getChamberClasses - Generating classes:', {
    chamberKey,
    chamberClassName,
    settingValue: settings[chamberKey],
    isVisible,
    finalClasses: classes
  });
  
  return classes;
};

/**
 * Enhanced hook that provides both settings and control methods
 * @param utg_id - User/template group ID for scoped settings
 * @returns Object with settings and control methods
 */
export const usePlutoInstrumentControls = (utg_id?: string | number) => {
  const settings = usePlutoSettings(utg_id);
  
  // Generate storage key
  const getStorageKey = () => {
    return `fava_pluto_settings_${utg_id || 'default'}`;
  };

  // Save settings to localStorage
  const saveSettings = (newSettings: PlutoSettings) => {
    try {
      const storageKey = getStorageKey();
      console.log('🔍 usePlutoInstrumentControls - Saving to localStorage:', {
        storageKey,
        settings: newSettings,
        stringified: JSON.stringify(newSettings)
      });
      
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
      
      // Verify the save worked
      const verification = localStorage.getItem(storageKey);
      console.log('🔍 usePlutoInstrumentControls - Verification after save:', verification);
      
      // Dispatch a storage event for cross-component communication
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(newSettings),
        oldValue: null,
        storageArea: localStorage
      }));
      
      // Dispatch custom event for same-tab communication
      window.dispatchEvent(new CustomEvent('pluto-settings-changed', {
        detail: {
          utg_id: utg_id,
          settings: newSettings,
          storageKey: storageKey
        }
      }));
      
    } catch (error) {
      console.error('Error saving pluto settings to localStorage:', error);
    }
  };

  // Handle toggle change
  const handleToggleChange = (chamber: keyof PlutoSettings, value: boolean) => {
    console.log('🔍 usePlutoInstrumentControls - Toggle changed:', {
      chamber,
      oldValue: settings[chamber],
      newValue: value,
      utg_id,
      storageKey: getStorageKey()
    });
    
    const newSettings = { ...settings, [chamber]: value };
    console.log('🔍 usePlutoInstrumentControls - New settings to save:', newSettings);
    
    saveSettings(newSettings);
  };

  // Handle master toggle (show all / hide all)
  const handleMasterToggle = (showAll: boolean) => {
    console.log('🔍 usePlutoInstrumentControls - Master toggle:', showAll ? 'SHOW ALL' : 'HIDE ALL');
    
    const newSettings: PlutoSettings = {
      ctc_buttons_ocean_classic: showAll,
      ctc_buttons_ocean_classic_2: showAll,
      ctc_buttons_ocean_enhanced: showAll,
      ctc_shendo_classic: showAll,
      ctc_shendo_enhanced: showAll,
      harpoon_preview: showAll,
      harpoon_active: showAll,
      rowfilters_chamber: showAll,
      searchbox: showAll,
      pagination_specificbar: showAll
    };
    
    console.log('🔍 usePlutoInstrumentControls - Master toggle new settings:', newSettings);
    saveSettings(newSettings);
  };

  // Check if all chambers are currently visible
  const areAllVisible = Object.values(settings).every(value => value === true);
  
  // Check if all chambers are currently hidden
  const areAllHidden = Object.values(settings).every(value => value === false);

  return {
    settings,
    handleToggleChange,
    handleMasterToggle,
    areAllVisible,
    areAllHidden
  };
};