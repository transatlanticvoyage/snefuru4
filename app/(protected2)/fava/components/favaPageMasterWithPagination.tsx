'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FavaPageMaster from './favaPageMaster';
import { FavaPaginationProvider } from './pagination/favaPaginationProvider';
import FavaPaginationControlsOriginal from './pagination/favaPaginationControlsOriginal';
import FavaMinimalTablePaginated from './pagination/favaMinimalTablePaginated';
import { FavaPaginationConfig } from './pagination/favaPaginationTypes';
import { usePlutoSettings, getChamberClasses } from '../hooks/usePlutoSettings';

// Extend the existing FavaPageMaster props
interface FavaPageMasterWithPaginationProps {
  // All FavaPageMaster props
  pageTitle?: string;
  pageDescription?: string | React.ReactNode;
  documentTitle?: string;
  showColumnTemplateControls?: boolean;
  showFilterControls?: boolean;
  showSearchBox?: boolean;
  showPaginationControls?: boolean;
  showBiriDevInfoBox?: boolean;
  showTrelnoColumnsDefBox?: boolean;
  showShendoBar?: boolean;
  showColumnVisibilityMatrix?: boolean;
  showTable?: boolean;
  tableProps?: any;
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
  toolbarContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  contentPadding?: string;
  contentStyle?: React.CSSProperties;
  
  // FavaTani Configuration
  taniEnabled?: boolean;
  taniConfig?: any;
  taniFlags?: any;
  taniPreset?: any;
  
  // Additional pagination-specific props
  enableURLParams?: boolean;
  paginationPosition?: 'top' | 'bottom' | 'both';
  paginationConfig?: FavaPaginationConfig;
  pageKey?: string;
  
  // Pluto settings
  utg_id?: string | number;
}

export default function FavaPageMasterWithPagination({
  // Extract table and pagination props
  tableProps,
  showTable = true,
  showPaginationControls = true,
  enableURLParams = true,
  paginationPosition = 'bottom',
  paginationConfig,
  pageKey = 'default',
  
  // All other props to pass through
  ...favaProps
}: FavaPageMasterWithPaginationProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get pluto settings for chamber control
  const plutoSettings = usePlutoSettings(favaProps.utg_id);
  
  // Extract data from tableProps
  const tableData = tableProps?.data || [];
  
  // URL state management
  const urlPage = enableURLParams ? parseInt(searchParams.get('page') || '1') : 1;
  const urlItemsPerPage = enableURLParams ? parseInt(searchParams.get('itemsPerPage') || '10') : 10;

  // Handle URL updates
  const handleURLChange = (params: Record<string, any>) => {
    if (!enableURLParams) return;
    
    const urlParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      urlParams.set(key, value.toString());
    });
    router.replace(`${window.location.pathname}?${urlParams.toString()}`, { scroll: false });
  };

  // Enhanced pagination config with URL support
  const enhancedPaginationConfig: FavaPaginationConfig = {
    ...paginationConfig,
    defaultItemsPerPage: urlItemsPerPage,
  };

  // Render paginated table section
  const renderPaginatedTable = () => {
    if (!showTable || !tableProps) return null;

    return (
      <div className="fava-table-section" style={{ marginBottom: '20px' }}>
        <FavaPaginationProvider 
          data={tableData}
          config={enhancedPaginationConfig}
          pageKey={pageKey}
          initialPage={urlPage}
          onPageChange={(page) => handleURLChange({ page })}
          onItemsPerPageChange={(itemsPerPage) => handleURLChange({ itemsPerPage, page: 1 })}
        >
          {/* Pagination controls above table */}
          {showPaginationControls && (
            <div 
              className={getChamberClasses(plutoSettings, 'pagination_specificbar', 'pagination-specific-chamber')}
              data-debug-utg-id={favaProps.utg_id}
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
              data-debug-utg-id={favaProps.utg_id}
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
    );
  };

  return (
    <FavaPageMaster 
      {...favaProps}
      showTable={false}  // We handle table rendering ourselves
      showPaginationControls={false}  // We handle pagination ourselves
    >
      {/* Render table at top if requested */}
      {(paginationPosition === 'top' || paginationPosition === 'both') && renderPaginatedTable()}
      
      {/* Pass through children */}
      {favaProps.children}
      
      {/* Render table at bottom if requested (default) */}
      {(paginationPosition === 'bottom' || paginationPosition === 'both') && renderPaginatedTable()}
    </FavaPageMaster>
  );
}

// Export types for external use
export type { FavaPageMasterWithPaginationProps };