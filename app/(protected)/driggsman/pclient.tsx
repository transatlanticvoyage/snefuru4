'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DriggsmanTable from './components/DriggsmanTable';
import dynamic from 'next/dynamic';



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
      {/* Pagination and Search Controls */}
      {paginationControls && (
        <div className="px-6 py-1 bg-white border-b">
          <div className="flex items-center space-x-6">
            {/* Andromeda Logo */}
            <div 
              className="text-white font-bold text-xl bg-black rounded flex items-center justify-center"
              style={{
                width: '200px',
                height: '50px',
                backgroundImage: `
                  radial-gradient(1px 1px at 25px 12px, #722F37, transparent),
                  radial-gradient(2px 2px at 65px 8px, #808080, transparent),
                  radial-gradient(1px 1px at 110px 18px, #FFD700, transparent),
                  radial-gradient(2px 2px at 35px 28px, #ADD8E6, transparent),
                  radial-gradient(1px 1px at 85px 35px, #722F37, transparent),
                  radial-gradient(3px 3px at 145px 15px, #808080, transparent),
                  radial-gradient(1px 1px at 55px 42px, #FFD700, transparent),
                  radial-gradient(2px 2px at 15px 38px, #ADD8E6, transparent),
                  radial-gradient(1px 1px at 125px 45px, #722F37, transparent),
                  radial-gradient(2px 2px at 75px 6px, #808080, transparent),
                  radial-gradient(4px 4px at 165px 25px, #FFD700, transparent),
                  radial-gradient(1px 1px at 45px 18px, #ADD8E6, transparent),
                  radial-gradient(2px 2px at 95px 48px, #722F37, transparent),
                  radial-gradient(1px 1px at 185px 35px, #808080, transparent),
                  radial-gradient(3px 3px at 155px 8px, #FFD700, transparent),
                  radial-gradient(1px 1px at 115px 28px, #ADD8E6, transparent),
                  radial-gradient(2px 2px at 175px 42px, #722F37, transparent),
                  radial-gradient(1px 1px at 5px 25px, #808080, transparent)
                `,
                backgroundSize: '200px 50px',
                fontSize: '20px',
                lineHeight: '1'
              }}
            >
              Andromeda
            </div>
            {/* Show Page Header Button - moved here as requested */}
            <button
              onClick={() => setIsHeaderVisible(!isHeaderVisible)}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              {isHeaderVisible ? 'Hide Page Header' : 'Show Page Header'}
            </button>
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
          onShowVerificationColumnChange={setShowVerificationColumn}
          onShowCompetitorSitesChange={setShowCompetitorSites}
        />
      </div>
    </div>
  );
}