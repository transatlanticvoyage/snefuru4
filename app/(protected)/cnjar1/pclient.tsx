'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

const Cnjar1Table = dynamic(
  () => import('./components/Cnjar1Table'),
  { ssr: false }
);

export default function Cnjar1Client() {
  const { user } = useAuth();
  const router = useRouter();
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cnjar1-header-visible');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });

  // Chamber visibility states
  const [mandibleChamberVisible, setMandibleChamberVisible] = useState(true);
  const [sinusChamberVisible, setSinusChamberVisible] = useState(true);
  const [protozoicChamberVisible, setProtozoicChamberVisible] = useState(true);
  const [mesozoicChamberVisible, setMesozoicChamberVisible] = useState(true);

  // Column pagination controls state
  const [columnPaginationControls, setColumnPaginationControls] = useState<{
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  } | null>(null);

  // Table controls state
  const [tableControls, setTableControls] = useState<{
    FilterControls: () => JSX.Element;
    TableActions: () => JSX.Element;
  } | null>(null);

  // Column pagination URL parameter states
  const [columnsPerPage, setColumnsPerPage] = useState(8);
  const [currentColumnPage, setCurrentColumnPage] = useState(1);

  // Handle column pagination changes from table component
  const handleColumnPaginationChange = (newColumnsPerPage: number, newCurrentPage: number) => {
    setColumnsPerPage(newColumnsPerPage);
    setCurrentColumnPage(newCurrentPage);
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Save header visibility state to localStorage and update body class
  useEffect(() => {
    localStorage.setItem('cnjar1-header-visible', isHeaderVisible.toString());
    
    // Add/remove class on body to hide main header
    if (isHeaderVisible) {
      document.body.classList.remove('cnjar1-hide-main-header');
    } else {
      document.body.classList.add('cnjar1-hide-main-header');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('cnjar1-hide-main-header');
    };
  }, [isHeaderVisible]);

  // Listen for chamber visibility changes from bezel
  useEffect(() => {
    const handleChamberToggle = (event: CustomEvent) => {
      const { chamber, visible } = event.detail;
      
      switch(chamber) {
        case 'mandible_chamber':
          setMandibleChamberVisible(visible);
          break;
        case 'sinus_chamber':
          setSinusChamberVisible(visible);
          break;
        case 'protozoic_chamber':
          setProtozoicChamberVisible(visible);
          break;
        case 'mesozoic_chamber':
          setMesozoicChamberVisible(visible);
          break;
      }
    };

    window.addEventListener('cnjar1-chamber-toggle' as any, handleChamberToggle as any);
    
    return () => {
      window.removeEventListener('cnjar1-chamber-toggle' as any, handleChamberToggle as any);
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mandible Chamber */}
      {mandibleChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            mandible_chamber
          </div>
          
          {/* Header content */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-800">
                  CNJar1 Manager
                </h1>
                {/* Hide/Show Header Button moved here */}
                <button
                  onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  {isHeaderVisible ? 'Hide Page Header' : 'Show Page Header'}
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <DrenjariButtonBarDriggsmanLinks />
                <div className="text-right">
                  <div className="text-sm text-gray-500">City-Industry Combinations</div>
                  <div className="text-xs text-gray-400">Manage cncglub table</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sinus Chamber */}
      {sinusChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            sinus_chamber
          </div>
          
          {/* Column Pagination Button Bars moved from protozoic */}
          {columnPaginationControls && (
            <div className="mt-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar1()}
                </div>
                <div className="flex items-center">
                  {columnPaginationControls.ColumnPaginationBar2()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Protozoic Chamber */}
      {protozoicChamberVisible && (
        <div className="border border-black border-b-0 p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            protozoic_chamber
          </div>
          
          {/* Drenjari Links moved from mesozoic */}
          <div className="mt-2">
            <DrenjariButtonBarDriggsmanLinks />
          </div>
        </div>
      )}

      {/* Mesozoic Chamber */}
      {mesozoicChamberVisible && (
        <div className="border border-black p-4" style={{ marginTop: '0px', marginLeft: '16px', marginRight: '16px', marginBottom: '0px' }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            mesozoic_chamber
          </div>
          
          {/* Table Controls */}
          {tableControls && (
            <div className="mt-2">
              {tableControls.FilterControls()}
              {tableControls.TableActions()}
            </div>
          )}
        </div>
      )}

      {/* All content moved into chambers above */}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Cnjar1Table
          onColumnPaginationRender={setColumnPaginationControls}
          onTableControlsRender={setTableControls}
          initialColumnsPerPage={columnsPerPage}
          initialColumnPage={currentColumnPage}
          onColumnPaginationChange={handleColumnPaginationChange}
        />
      </div>
    </div>
  );
}