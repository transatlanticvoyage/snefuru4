'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DriggsmanTable from './components/DriggsmanTable';
import dynamic from 'next/dynamic';


const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

export default function DriggsmanClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(() => {
    // Initialize from localStorage with default as false (hidden)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('driggsman-header-visible');
      return saved === null ? false : saved === 'true';
    }
    return false;
  });

  // Controls state for pagination and search
  const [paginationControls, setPaginationControls] = useState<{
    PaginationControls: () => JSX.Element;
    ColumnPaginationControls: () => JSX.Element;
  } | null>(null);

  // Button states moved from DriggsmanTable
  const [showVerificationColumn, setShowVerificationColumn] = useState(false);
  const [showCompetitorSites, setShowCompetitorSites] = useState(false);
  const [sitesCount, setSitesCount] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Save header visibility state to localStorage and update body class
  useEffect(() => {
    localStorage.setItem('driggsman-header-visible', isHeaderVisible.toString());
    
    // Add/remove class on body to hide main header
    if (isHeaderVisible) {
      document.body.classList.remove('driggsman-hide-main-header');
    } else {
      document.body.classList.add('driggsman-hide-main-header');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('driggsman-hide-main-header');
    };
  }, [isHeaderVisible]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hide/Show Header Button and Navigation */}
      <div className="px-6 py-1 bg-gray-50 flex items-center space-x-4">
        <button
          onClick={() => setIsHeaderVisible(!isHeaderVisible)}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          {isHeaderVisible ? 'Hide Page Header' : 'Show Page Header'}
        </button>
        
        {/* Drenjari Navigation Links */}
        <div>
          <DrenjariButtonBarDriggsmanLinks />
        </div>

        {/* Verification and Competitor Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVerificationColumn(!showVerificationColumn)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              showVerificationColumn ? 'bg-blue-200 hover:bg-blue-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            show verification column
          </button>
          <button
            onClick={() => setShowCompetitorSites(!showCompetitorSites)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              showCompetitorSites ? 'bg-blue-200 hover:bg-blue-300' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            show competitor sites
          </button>
        </div>
      </div>
      {/* Pagination and Search Controls */}
      {paginationControls && (
        <div className="px-6 py-1 bg-white border-b">
          <div className="flex items-center space-x-6">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              {sitesCount} sites loaded
            </span>
            <div className="flex items-center">
              {paginationControls.PaginationControls()}
            </div>
            <div className="flex items-center">
              {paginationControls.ColumnPaginationControls()}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Full Width DriggsmanTable */}
      <div className="flex-1 overflow-hidden">
        <DriggsmanTable 
          onControlsRender={setPaginationControls}
          showVerificationColumn={showVerificationColumn}
          showCompetitorSites={showCompetitorSites}
          onSitesCountChange={setSitesCount}
        />
      </div>
    </div>
  );
}