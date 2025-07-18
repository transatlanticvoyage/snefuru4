'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import FavaNavToggle from './favaNavToggle';
import FavaHeader from './favaHeader';
import FavaSidebar from './favaSidebar';
import { FavaCTCMaster, FavaCTCButtonsClassic } from './ColumnTemplateControls';
import FavaColumnTemplateControls from './favaColumnTemplateControls';
import FavaShendoBar from './favaShendoBar';
import FavaFilterControls from './favaFilterControls';
import FavaSearchBox from './favaSearchBox';
import FavaPaginationControls from './favaPaginationControls';
import FavaBiriDevInfoBox from './favaBiriDevInfoBox';
import FavaTrelnoColumnsDefBox from './favaTrelnoColumnsDefBox';
import FavaMinimalTable from './favaMinimalTable';
import PureFavaPageMaster from './pureFavaPageMaster';
import FavaTaniConditionalProvider from './favaTaniPopup/favaTaniConditionalProvider';
import { FavaTaniButtonConditional, FavaTaniPopupConditional } from './favaTaniPopup/favaTaniConditionalComponents';
import { FavaTaniFeatureFlags, FAVA_TANI_PRESETS } from '../config/favaTaniFeatureFlags';
import { FavaTaniConfig, FAVA_TANI_DEFAULT_CONFIG } from './favaTaniPopup/types';
import { FavaPaginationConfig } from './pagination/favaPaginationTypes';
import '../styles/fava-table-template.css';
import '../styles/fava-navigation.css';

interface FavaPageMasterProps {
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
  
  // FavaTani Configuration
  taniEnabled?: boolean;
  taniConfig?: Partial<FavaTaniConfig>;
  taniFlags?: Partial<FavaTaniFeatureFlags>;
  taniPreset?: keyof typeof FAVA_TANI_PRESETS;
  taniContent?: ReactNode; // Deprecated - use taniConfig.contentSlots instead
}

export default function FavaPageMaster({
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
  
  // FavaTani props
  taniEnabled = true,
  taniConfig = {},
  taniFlags = {},
  taniPreset = 'standard',
  taniContent
}: FavaPageMasterProps) {
  // Determine final Tani configuration
  const resolvedTaniFlags = taniPreset ? FAVA_TANI_PRESETS[taniPreset] : { ...FAVA_TANI_PRESETS.standard, ...taniFlags };
  const resolvedTaniConfig: FavaTaniConfig = {
    ...FAVA_TANI_DEFAULT_CONFIG,
    id: `fava-tani-${pageTitle?.toLowerCase().replace(/\s+/g, '-') || 'default'}`,
    title: pageTitle || 'Functions',
    ...taniConfig
  };
  
  // If Tani is disabled, use pure Fava component
  if (!taniEnabled || resolvedTaniFlags.enabled === false) {
    return (
      <PureFavaPageMaster
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        documentTitle={documentTitle}
        showColumnTemplateControls={showColumnTemplateControls}
        showFilterControls={showFilterControls}
        showSearchBox={showSearchBox}
        showPaginationControls={showPaginationControls}
        showBiriDevInfoBox={showBiriDevInfoBox}
        showTrelnoColumnsDefBox={showTrelnoColumnsDefBox}
        showShendoBar={showShendoBar}
        showColumnVisibilityMatrix={showColumnVisibilityMatrix}
        showTable={showTable}
        tableProps={tableProps}
        paginationConfig={paginationConfig}
        pageKey={pageKey}
        headerContent={headerContent}
        toolbarContent={toolbarContent}
        footerContent={footerContent}
        contentPadding={contentPadding}
        contentStyle={contentStyle}
      >
        {children}
      </PureFavaPageMaster>
    );
  }
  
  // Enhanced Fava with Tani integration
  return (
    <FavaTaniConditionalProvider
      config={resolvedTaniConfig}
      flags={resolvedTaniFlags}
    >
      <PureFavaPageMaster
        pageTitle={pageTitle}
        pageDescription={
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#666' }}>{pageDescription}</span>
            <FavaTaniButtonConditional />
          </div>
        }
        documentTitle={documentTitle}
        showColumnTemplateControls={showColumnTemplateControls}
        showFilterControls={showFilterControls}
        showSearchBox={showSearchBox}
        showPaginationControls={showPaginationControls}
        showBiriDevInfoBox={showBiriDevInfoBox}
        showTrelnoColumnsDefBox={showTrelnoColumnsDefBox}
        showShendoBar={showShendoBar}
        showColumnVisibilityMatrix={showColumnVisibilityMatrix}
        showTable={showTable}
        tableProps={tableProps}
        paginationConfig={paginationConfig}
        pageKey={pageKey}
        headerContent={headerContent}
        toolbarContent={toolbarContent}
        footerContent={footerContent}
        contentPadding={contentPadding}
        contentStyle={contentStyle}
      >
        {children}
      </PureFavaPageMaster>
      
      {/* Tani Popup System */}
      <FavaTaniPopupConditional>
        <div></div>
      </FavaTaniPopupConditional>
    </FavaTaniConditionalProvider>
  );
}

// Export individual components for cases where direct access is needed
export {
  FavaNavToggle,
  FavaHeader,
  FavaSidebar,
  FavaColumnTemplateControls,
  FavaShendoBar,
  FavaFilterControls,
  FavaSearchBox,
  FavaPaginationControls,
  FavaBiriDevInfoBox,
  FavaTrelnoColumnsDefBox,
  FavaMinimalTable,
  PureFavaPageMaster,
  FavaTaniConditionalProvider
};

// Export Tani types and configs for advanced usage
export type { FavaPageMasterProps, FavaTaniConfig, FavaTaniFeatureFlags };
export { FAVA_TANI_PRESETS, FAVA_TANI_DEFAULT_CONFIG };