'use client';

import { useState, useEffect } from 'react';
import { SunRowsConfig, SunRowsHookResult, PageSunRowsConfig } from './sunRowsTypes';
import { DEFAULT_SUN_ROWS_CONFIG } from './SunRowsDefaultConfig';

/**
 * Hook to manage Sun Row Slots configuration
 * @param pageKey - Unique identifier for the page (e.g., 'torna3', 'admin_favaconfigman')
 * @param utg_id - User/template group ID for scoped settings
 * @returns Sun rows configuration and state
 */
export const useSunRows = (pageKey?: string, utg_id?: string | number): SunRowsHookResult => {
  const [config, setConfig] = useState<SunRowsConfig>(DEFAULT_SUN_ROWS_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadSunRowsConfig = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        // Start with default configuration
        let finalConfig: SunRowsConfig = { ...DEFAULT_SUN_ROWS_CONFIG };

        // If pageKey is provided, try to load page-specific configuration
        if (pageKey) {
          finalConfig.pageKey = pageKey;
          
          try {
            // Attempt to load page-specific config from sunrowpageconfigs folder
            const pageConfigModule = await import(`./sunrowpageconfigs/${pageKey}Config`);
            const pageConfig: PageSunRowsConfig = pageConfigModule.default || pageConfigModule[pageKey + 'Config'];
            
            if (pageConfig) {
              // Merge page-specific config with default
              finalConfig = {
                ...finalConfig,
                ...pageConfig,
                rows: pageConfig.rows || finalConfig.rows
              };
            }
          } catch (importError) {
            // Page-specific config doesn't exist, use default
            console.log(`☀️ No custom config found for page '${pageKey}', using default configuration`);
          }
        }

        // Check for user customizations in localStorage (scoped by utg_id)
        if (utg_id) {
          const storageKey = `fava_sun_rows_${pageKey || 'default'}_${utg_id}`;
          const storedCustomizations = localStorage.getItem(storageKey);
          
          if (storedCustomizations) {
            try {
              const customizations = JSON.parse(storedCustomizations);
              finalConfig = {
                ...finalConfig,
                ...customizations,
                rows: customizations.rows || finalConfig.rows
              };
              console.log(`☀️ Loaded user customizations for ${pageKey} (${utg_id})`);
            } catch (parseError) {
              console.error('☀️ Error parsing stored sun rows customizations:', parseError);
            }
          }
        }

        setConfig(finalConfig);
        console.log(`☀️ Sun rows config loaded for page '${pageKey}':`, finalConfig);
        
      } catch (loadError) {
        console.error('☀️ Error loading sun rows configuration:', loadError);
        setError('Failed to load sun rows configuration');
        setConfig(DEFAULT_SUN_ROWS_CONFIG);
      } finally {
        setIsLoading(false);
      }
    };

    loadSunRowsConfig();
  }, [pageKey, utg_id]);

  return {
    config,
    isLoading,
    error
  };
};

/**
 * Utility function to save user customizations to localStorage
 * @param config - Sun rows configuration to save
 * @param pageKey - Page identifier
 * @param utg_id - User/template group ID
 */
export const saveSunRowsCustomization = (
  config: Partial<SunRowsConfig>,
  pageKey: string,
  utg_id?: string | number
): void => {
  if (!utg_id) return;

  try {
    const storageKey = `fava_sun_rows_${pageKey}_${utg_id}`;
    localStorage.setItem(storageKey, JSON.stringify(config));
    console.log(`☀️ Saved sun rows customization for ${pageKey} (${utg_id})`);
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('sun-rows-changed', {
      detail: { pageKey, utg_id, config }
    }));
  } catch (error) {
    console.error('☀️ Error saving sun rows customization:', error);
  }
};