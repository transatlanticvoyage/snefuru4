'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import FavaNavToggle from './favaNavToggle';
import FavaHeader from './favaHeader';
import FavaSidebar from './favaSidebar';
import FavaColumnTemplateControls from './favaColumnTemplateControls';
import FavaFilterControls from './favaFilterControls';
import FavaSearchBox from './favaSearchBox';
import FavaPaginationControls from './favaPaginationControls';
import FavaBiriDevInfoBox from './favaBiriDevInfoBox';
import FavaTrelnoColumnsDefBox from './favaTrelnoColumnsDefBox';
import FavaShendoBar from './favaShendoBar';
import FavaColumnVisibilityMatrix, { useColumnVisibilityData } from './favaColumnVisibilityMatrix';
import FavaMinimalTable from './favaMinimalTable';
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
  
  // Custom content slots
  children?: ReactNode;
  headerContent?: ReactNode;
  toolbarContent?: ReactNode;
  footerContent?: ReactNode;
  
  // Layout configuration
  contentPadding?: string;
  contentStyle?: React.CSSProperties;
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
  children,
  headerContent,
  toolbarContent,
  footerContent,
  contentPadding = '20px',
  contentStyle = {}
}: PureFavaPageMasterProps) {
  const [navVisible, setNavVisible] = useState(true);

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
          {showColumnTemplateControls && <FavaColumnTemplateControls />}
          {showShendoBar && <FavaShendoBar />}
          {showColumnVisibilityMatrix && <FavaColumnVisibilityMatrix {...useColumnVisibilityData()} />}
          {showFilterControls && <FavaFilterControls />}
          {showSearchBox && <FavaSearchBox />}
          
          {/* Pagination Controls */}
          {showPaginationControls && (
            <div style={{ marginBottom: '20px' }}>
              <FavaPaginationControls />
            </div>
          )}
          
          {/* Custom toolbar content */}
          {toolbarContent}
        </div>
        
        {/* Table Section */}
        {showTable && tableProps && (
          <div className="fava-table-section" style={{ marginBottom: '20px' }}>
            <FavaMinimalTable {...tableProps} />
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