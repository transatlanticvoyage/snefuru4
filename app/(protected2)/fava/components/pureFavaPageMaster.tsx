'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import FavaNavToggle from './favaNavToggle';
import FavaHeader from './favaHeader';
import FavaSidebar from './favaSidebar';
import { FavaCTCMaster, FavaCTCButtonsClassic, FavaCTCButtonsEnhanced } from './ColumnTemplateControls';
import FavaCTCShendoActive from './ColumnTemplateControls/favaCTCShendoActive';
import FavaColVisMatPreviewBar from './favaColVisMatPreviewBar';
import FavaFilterControls from './favaFilterControls';
import FavaSearchBox from './favaSearchBox';
import FavaPaginationControls from './favaPaginationControls';
import FavaBiriDevInfoBox from './favaBiriDevInfoBox';
import FavaTrelnoColumnsDefBox from './favaTrelnoColumnsDefBox';
import FavaColVisMatMainBar, { useColumnVisibilityData } from './favaColVisMatMainBar';
import FavaMinimalTable from './favaMinimalTable';
import { FavaPaginationProvider } from './pagination/favaPaginationProvider';
import FavaPaginationControlsOriginal from './pagination/favaPaginationControlsOriginal';
import FavaMinimalTablePaginated from './pagination/favaMinimalTablePaginated';
import { FavaPaginationConfig } from './pagination/favaPaginationTypes';
import { usePlutoSettings, getChamberClasses } from '../hooks/usePlutoSettings';
import PlutoDebugMonitor from './plutoDebugMonitor';
import '../styles/fava-table-template.css';
import '../styles/fava-navigation.css';

interface PureFavaPageMasterProps {
  // Page configuration
  pageTitle?: string;
  pageDescription?: string | ReactNode;
  documentTitle?: string;
  
  // Component visibility
  showColumnTemplateControls?: boolean;
  showFilterControls?: boolean;
  showSearchBox?: boolean;
  showPaginationControls?: boolean;
  showBiriDevInfoBox?: boolean;
  showTrelnoColumnsDefBox?: boolean;
  showShendoBar?: boolean;
  showColumnVisibilityMatrix?: boolean;
  showTable?: boolean;
  
  // Table configuration
  tableProps?: any;
  
  // Pagination configuration
  paginationConfig?: FavaPaginationConfig;
  pageKey?: string; // For localStorage pagination preferences
  
  // Custom content slots
  children?: ReactNode;
  headerContent?: ReactNode;
  toolbarContent?: ReactNode;
  footerContent?: ReactNode;
  
  // Layout configuration
  contentPadding?: string;
  contentStyle?: React.CSSProperties;
  
  // Pluto settings
  utg_id?: string | number;
}

/**
 * PureFavaPageMaster - Original Fava template without any Tani popup enhancements
 * 
 * This component preserves the exact original functionality of FavaPageMaster
 * without any modifications or additions. It serves as the fallback component
 * when Tani popup system is disabled or when pure Fava functionality is needed.
 * 
 * This ensures that the base Fava system remains stable and unchanged.
 */
export default function PureFavaPageMaster({
  pageTitle,
  pageDescription,
  documentTitle,
  showColumnTemplateControls = true,
  showFilterControls = true,
  showSearchBox = true,
  showPaginationControls = true,
  showBiriDevInfoBox = true,
  showTrelnoColumnsDefBox = true,
  showShendoBar = true,
  showColumnVisibilityMatrix = true,
  showTable = true,
  tableProps,
  paginationConfig,
  pageKey = 'default',
  children,
  headerContent,
  toolbarContent,
  footerContent,
  contentPadding = '20px',
  contentStyle = {},
  utg_id
}: PureFavaPageMasterProps) {
  const [navVisible, setNavVisible] = useState(true);
  const plutoSettings = usePlutoSettings(utg_id);
  
  // Debug: Log the current pluto settings and utg_id
  console.log('🔍 [PureFavaPageMaster] Current state:', {
    utg_id,
    plutoSettings,
    oceanClassicSetting: plutoSettings.ctc_buttons_ocean_classic
  });
  
  // Debug logging for pluto settings
  console.log('🔍 PureFavaPageMaster - Debug Info:', {
    utg_id,
    plutoSettings,
    storageKey: `fava_pluto_settings_${utg_id || 'default'}`,
    oceanClassicSetting: plutoSettings.ctc_buttons_ocean_classic,
    generatedClasses: getChamberClasses(plutoSettings, 'ctc_buttons_ocean_classic', 'ocean-classic-chamber')
  });

  useEffect(() => {
    // Set document title if provided
    if (documentTitle) {
      document.title = documentTitle;
    }
    
    // Check navigation visibility from localStorage
    const savedVisibility = localStorage.getItem('fava-nav-visible');
    if (savedVisibility !== null) {
      setNavVisible(JSON.parse(savedVisibility));
    }
    
    // Listen for navigation visibility changes
    const handleVisibilityChange = () => {
      const visibility = localStorage.getItem('fava-nav-visible');
      if (visibility !== null) {
        setNavVisible(JSON.parse(visibility));
      }
    };
    
    // Listen for both storage changes (cross-tab) and custom events (same page)
    window.addEventListener('storage', handleVisibilityChange);
    window.addEventListener('fava-nav-toggle', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleVisibilityChange);
      window.removeEventListener('fava-nav-toggle', handleVisibilityChange);
    };
  }, [documentTitle]);

  return (
    <>
      <PlutoDebugMonitor utg_id={utg_id} />
      <FavaNavToggle />
      <FavaHeader />
      <FavaSidebar />
      
      <div 
        className="fava-page-content" 
        style={{ 
          paddingTop: navVisible ? '60px' : '20px', 
          paddingLeft: navVisible ? '250px' : '20px',
          paddingRight: contentPadding,
          paddingBottom: contentPadding,
          transition: 'all 0.3s ease',
          minHeight: '100vh',
          boxSizing: 'border-box',
          ...contentStyle
        }}
      >
        {/* Page Header Section */}
        {(pageTitle || pageDescription || headerContent) && (
          <div className="fava-page-header" style={{ marginBottom: '20px' }}>
            {pageTitle && (
              <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>{pageTitle}</h1>
            )}
            {pageDescription && (
              <div style={{ marginBottom: '20px' }}>
                {typeof pageDescription === 'string' ? (
                  <p style={{ color: '#666', margin: 0 }}>{pageDescription}</p>
                ) : (
                  pageDescription
                )}
              </div>
            )}
            {headerContent}
          </div>
        )}
        
        {/* Controls Section */}
        <div className="fava-controls-section" style={{ marginBottom: '20px' }}>
          {showColumnTemplateControls && (
            <FavaCTCMaster>
              {({ state, handlers }) => (
                <div>
                  <div 
                    className={getChamberClasses(plutoSettings, 'ctc_buttons_ocean_classic', 'ocean-classic-chamber')}
                    data-debug-utg-id={utg_id}
                    data-debug-visible={plutoSettings.ctc_buttons_ocean_classic}
                    data-debug-classes={getChamberClasses(plutoSettings, 'ctc_buttons_ocean_classic', 'ocean-classic-chamber')}
                    style={{
                      border: '2px dashed red',
                      padding: '5px',
                      margin: '5px 0'
                    }}
                  >
                    <div style={{ background: 'yellow', padding: '5px', marginBottom: '5px' }}>
                      DEBUG: Ocean Classic Chamber - Should be {plutoSettings.ctc_buttons_ocean_classic ? 'VISIBLE' : 'HIDDEN'}
                    </div>
                    <FavaCTCButtonsClassic
                      templates={state.templates}
                      activeTemplateId={state.activeTemplateId}
                      dropdownOpen={state.dropdownOpen}
                      onTemplateSelect={handlers.selectTemplate}
                      onShendoClick={handlers.handleShendoClick}
                      onOpenCJ={handlers.openCJ}
                      onToggleDropdown={handlers.toggleDropdown}
                      utg_id={handlers.currentUtgId}
                      createSlots={handlers.createSlots}
                      getOverflowItems={handlers.getOverflowItems}
                    />
                  </div>
                  <div 
                    className={getChamberClasses(plutoSettings, 'ctc_buttons_ocean_enhanced', 'ocean-enhanced-chamber')}
                    data-debug-utg-id={utg_id}
                    data-debug-visible={plutoSettings.ctc_buttons_ocean_enhanced}
                    style={{
                      border: '2px dashed blue',
                      padding: '5px',
                      margin: '5px 0'
                    }}
                  >
                    <div style={{ background: 'lightblue', padding: '5px', marginBottom: '5px' }}>
                      DEBUG: Ocean Enhanced Chamber - Should be {plutoSettings.ctc_buttons_ocean_enhanced ? 'VISIBLE' : 'HIDDEN'}
                    </div>
                    <FavaCTCButtonsEnhanced
                      templates={state.templates}
                      activeTemplateId={state.activeTemplateId}
                      dropdownOpen={state.dropdownOpen}
                      onTemplateSelect={handlers.selectTemplate}
                      onTemplatePreview={handlers.previewTemplate}
                      onShendoClick={handlers.handleShendoClick}
                      onOpenCJ={handlers.openCJ}
                      onToggleDropdown={handlers.toggleDropdown}
                      utg_id={handlers.currentUtgId}
                      createSlots={handlers.createSlots}
                      getOverflowItems={handlers.getOverflowItems}
                    />
                  </div>
                  {showShendoBar && (
                    <div 
                      className={getChamberClasses(plutoSettings, 'ctc_shendo_enhanced', 'shendo-enhanced-chamber')}
                      data-debug-utg-id={utg_id}
                      data-debug-visible={plutoSettings.ctc_shendo_enhanced}
                      style={{
                        border: '2px dashed green',
                        padding: '5px',
                        margin: '5px 0'
                      }}
                    >
                      <div style={{ background: 'lightgreen', padding: '5px', marginBottom: '5px' }}>
                        DEBUG: Shendo Enhanced Chamber - Should be {plutoSettings.ctc_shendo_enhanced ? 'VISIBLE' : 'HIDDEN'}
                      </div>
                      <FavaCTCShendoActive
                        category={state.shendoCategory || ''}
                        templates={state.templates}
                        activeTemplateId={state.activeTemplateId}
                        onTemplateSelect={handlers.selectTemplate}
                        utg_id={handlers.currentUtgId}
                      />
                    </div>
                  )}
                </div>
              )}
            </FavaCTCMaster>
          )}
          
          {showColumnVisibilityMatrix && (
            <>
              <div 
                className={getChamberClasses(plutoSettings, 'harpoon_preview', 'harpoon-preview-chamber')}
                data-debug-utg-id={utg_id}
                data-debug-visible={plutoSettings.harpoon_preview}
                style={{
                  border: '2px dashed purple',
                  padding: '5px',
                  margin: '5px 0'
                }}
              >
                <div style={{ background: 'lavender', padding: '5px', marginBottom: '5px' }}>
                  DEBUG: Harpoon Preview Chamber - Should be {plutoSettings.harpoon_preview ? 'VISIBLE' : 'HIDDEN'}
                </div>
                <FavaColVisMatPreviewBar />
              </div>
              <div 
                className={getChamberClasses(plutoSettings, 'harpoon_active', 'harpoon-active-chamber')}
                data-debug-utg-id={utg_id}
                data-debug-visible={plutoSettings.harpoon_active}
                style={{
                  border: '2px dashed orange',
                  padding: '5px',
                  margin: '5px 0'
                }}
              >
                <div style={{ background: 'peachpuff', padding: '5px', marginBottom: '5px' }}>
                  DEBUG: Harpoon Active Chamber - Should be {plutoSettings.harpoon_active ? 'VISIBLE' : 'HIDDEN'}
                </div>
                <FavaColVisMatMainBar />
              </div>
            </>
          )}
          {showFilterControls && (
            <div 
              className={getChamberClasses(plutoSettings, 'rowfilters_chamber', 'rowfilters-chamber')}
              data-debug-utg-id={utg_id}
              data-debug-visible={plutoSettings.rowfilters_chamber}
              style={{
                border: '2px dashed brown',
                padding: '5px',
                margin: '5px 0'
              }}
            >
              <div style={{ background: 'wheat', padding: '5px', marginBottom: '5px' }}>
                DEBUG: Row Filters Chamber - Should be {plutoSettings.rowfilters_chamber ? 'VISIBLE' : 'HIDDEN'}
              </div>
              <FavaFilterControls />
            </div>
          )}
          {showSearchBox && (
            <div 
              className={getChamberClasses(plutoSettings, 'searchbox', 'searchbox-chamber')}
              data-debug-utg-id={utg_id}
              data-debug-visible={plutoSettings.searchbox}
              style={{
                border: '2px dashed pink',
                padding: '5px',
                margin: '5px 0'
              }}
            >
              <div style={{ background: 'mistyrose', padding: '5px', marginBottom: '5px' }}>
                DEBUG: Search Box Chamber - Should be {plutoSettings.searchbox ? 'VISIBLE' : 'HIDDEN'}
              </div>
              <FavaSearchBox />
            </div>
          )}
          
          {/* Note: Pagination controls are now integrated with the table section */}
          
          {/* Custom toolbar content */}
          {toolbarContent}
        </div>
        
        {/* Table Section - with automatic working pagination */}
        {showTable && tableProps && (
          <div className="fava-table-section" style={{ marginBottom: '20px' }}>
            {/* Always wrap with pagination provider and show working controls */}
            <FavaPaginationProvider 
              data={tableProps.data || []}
              config={paginationConfig}
              pageKey={pageKey}
            >
              {/* Pagination controls above table */}
              {showPaginationControls && (
                <div 
                  className={getChamberClasses(plutoSettings, 'pagination_specificbar', 'pagination-specific-chamber')}
                  data-debug-utg-id={utg_id}
                  data-debug-visible={plutoSettings.pagination_specificbar}
                  style={{
                    border: '2px dashed teal',
                    padding: '5px',
                    marginBottom: '15px'
                  }}
                >
                  <div style={{ background: 'lightcyan', padding: '5px', marginBottom: '5px' }}>
                    DEBUG: Pagination Specific Chamber (Top) - Should be {plutoSettings.pagination_specificbar ? 'VISIBLE' : 'HIDDEN'}
                  </div>
                  <FavaPaginationControlsOriginal />
                </div>
              )}
              
              {/* Table */}
              <FavaMinimalTablePaginated {...tableProps} />
              
              {/* Pagination controls below table */}
              {showPaginationControls && (
                <div 
                  className={getChamberClasses(plutoSettings, 'pagination_qtybar', 'pagination-qty-chamber')}
                  data-debug-utg-id={utg_id}
                  data-debug-visible={plutoSettings.pagination_qtybar}
                  style={{
                    border: '2px dashed navy',
                    padding: '5px',
                    marginTop: '15px'
                  }}
                >
                  <div style={{ background: 'lightsteelblue', padding: '5px', marginBottom: '5px' }}>
                    DEBUG: Pagination Qty Chamber (Bottom) - Should be {plutoSettings.pagination_qtybar ? 'VISIBLE' : 'HIDDEN'}
                  </div>
                  <FavaPaginationControlsOriginal />
                </div>
              )}
            </FavaPaginationProvider>
          </div>
        )}
        
        {/* Main Content Section */}
        {children && (
          <div className="fava-content-section">
            {children}
          </div>
        )}
        
        {/* Footer Section */}
        {footerContent && (
          <div className="fava-footer-section" style={{ marginTop: '40px' }}>
            {footerContent}
          </div>
        )}
      </div>
    </>
  );
}